import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { SCREENPLAY_SCENES, Scene } from './src/data/screenplay';
import { CHARACTERS } from './src/data/characters';
import { extractPcmFromWav, createWavHeader, createSilencePcm } from './src/data/wavStitcher';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));

// Persistent audio cache directory
const cacheDir = path.resolve(__dirname, '.audio_cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const VALID_VOICES = new Set(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);

/**
 * High-speed offline speech synthesis using ffmpeg libflite
 */
function renderLineWithFlite(text: string, fliteVoice = 'kal16'): Buffer {
  const tmpId = Math.random().toString(36).substring(2, 9);
  const txtPath = path.join(os.tmpdir(), `flite_${tmpId}.txt`);
  const wavPath = path.join(os.tmpdir(), `flite_${tmpId}.wav`);
  try {
    // Clean text of characters that might break formatting
    const cleaned = text.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
    fs.writeFileSync(txtPath, cleaned, 'utf8');
    execSync(
      `ffmpeg -f lavfi -i "flite=textfile='${txtPath}':voice=${fliteVoice}" -ar 24000 -ac 1 -y "${wavPath}" 2>/dev/null`,
      { timeout: 8000 }
    );
    if (fs.existsSync(wavPath)) {
      const buf = fs.readFileSync(wavPath);
      return buf;
    }
  } catch (err: any) {
    console.warn(`Flite synthesis warning for "${text.slice(0, 30)}...":`, err?.message || err);
  } finally {
    if (fs.existsSync(txtPath)) try { fs.unlinkSync(txtPath); } catch {}
    if (fs.existsSync(wavPath)) try { fs.unlinkSync(wavPath); } catch {}
  }

  // Graceful fallback: 0.8s silent tone
  const silence = createSilencePcm(0.8, 24000);
  const header = createWavHeader(silence.length, 24000);
  return Buffer.concat([Buffer.from(header), Buffer.from(silence)]);
}

/**
 * Renders an entire screenplay scene with distinct assigned character voices
 */
function renderSceneWithFlite(scene: Scene): Buffer {
  const pcmList: Uint8Array[] = [];
  let totalPcm = 0;

  for (let i = 0; i < scene.items.length; i++) {
    const item = scene.items[i];
    const charConfig = CHARACTERS[item.characterId] || CHARACTERS.NARRATOR;
    const voice = charConfig.offlineVoice || 'kal16';

    const lineBuf = renderLineWithFlite(item.text, voice);
    const lineArrayBuf = lineBuf.buffer.slice(
      lineBuf.byteOffset,
      lineBuf.byteOffset + lineBuf.byteLength
    ) as ArrayBuffer;
    const { pcm } = extractPcmFromWav(lineArrayBuf);
    pcmList.push(pcm);
    totalPcm += pcm.length;

    // Natural 0.35s breathing pause between lines, 0.5s after cues
    if (i < scene.items.length - 1) {
      const pauseDuration = item.type === 'cue' ? 0.5 : 0.35;
      const silence = createSilencePcm(pauseDuration, 24000);
      pcmList.push(silence);
      totalPcm += silence.length;
    }
  }

  const header = createWavHeader(totalPcm, 24000);
  const fullFile = Buffer.alloc(44 + totalPcm);
  fullFile.set(header, 0);

  let offset = 44;
  for (const chunk of pcmList) {
    fullFile.set(chunk, offset);
    offset += chunk.length;
  }

  return fullFile;
}

/**
 * Format an entire screenplay scene into a dramatic audio drama prompt
 */
function formatScenePrompt(scene: Scene): string {
  let prompt = `Perform this screenplay scene as a cinematic audio drama with warm narration and distinct character voices:\n\n`;
  prompt += `SCENE ${scene.sceneNumber}: ${scene.act} - ${scene.heading}\n\n`;

  for (const item of scene.items) {
    if (item.type === 'cue') {
      prompt += `[Sound Effect: ${item.text}]\n\n`;
    } else if (item.type === 'direction') {
      prompt += `Narrator: ${item.text}\n\n`;
    } else if (item.type === 'dialogue') {
      const speaker = item.speakerName || item.characterId;
      prompt += `${speaker}: "${item.text}"\n\n`;
    }
  }

  return prompt;
}

// 1. RENDER AN ENTIRE SCENE (Studio Audio with Cloud AI & Offline Fallback)
app.post('/api/render-scene', async (req, res) => {
  const { sceneIndex } = req.body;
  if (sceneIndex === undefined || sceneIndex < 0 || sceneIndex >= SCREENPLAY_SCENES.length) {
    return res.status(400).json({ error: 'Valid sceneIndex is required (0 to 19)' });
  }

  const scene = SCREENPLAY_SCENES[sceneIndex];
  const cacheFile = path.join(cacheDir, `scene_${scene.sceneNumber}.wav`);

  // 1. Cache hit: instant return
  if (fs.existsSync(cacheFile)) {
    const fileBuf = fs.readFileSync(cacheFile);
    const audioBase64 = fileBuf.toString('base64');
    const durationSec = Math.round((fileBuf.length - 44) / 48000);
    return res.json({
      sceneNumber: scene.sceneNumber,
      heading: scene.heading,
      audioBase64,
      durationSec,
      sizeBytes: fileBuf.length,
      cached: true,
    });
  }

  // 2. Try Gemini Cloud TTS if available
  let cloudWavBuffer: Buffer | null = null;
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getAIClient();
      const prompt = formatScenePrompt(scene);

      // Attempt with gemini-3.8-flash-tts or gemini-2.5-flash-preview-tts
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Zephyr' },
              },
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Cloud TTS timeout')), 12000)
        ),
      ]);

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        cloudWavBuffer = Buffer.from(base64Audio, 'base64');
      }
    } catch (err: any) {
      console.warn(
        `Gemini TTS unavailable for scene ${scene.sceneNumber} (${err?.message?.slice(0, 80)}...). Using studio voice engine.`
      );
    }
  }

  // 3. Fallback to Multi-Character Offline Studio Voice Engine if Cloud TTS failed or hit quota
  const wavBuffer = cloudWavBuffer || renderSceneWithFlite(scene);
  fs.writeFileSync(cacheFile, wavBuffer);

  const durationSec = Math.round((wavBuffer.length - 44) / 48000);

  return res.json({
    sceneNumber: scene.sceneNumber,
    heading: scene.heading,
    audioBase64: wavBuffer.toString('base64'),
    durationSec,
    sizeBytes: wavBuffer.length,
    cached: false,
  });
});

// 2. SINGLE-LINE TTS (For teleprompter line-by-line playback & auditioning)
app.post('/api/tts', async (req, res) => {
  const { text, voiceName = 'Zephyr', style = '', character = '', characterId = '' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for TTS synthesis' });
  }

  const selectedVoice = VALID_VOICES.has(voiceName) ? voiceName : 'Zephyr';
  const cleanId = (characterId || character || 'voice').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const textHash = Buffer.from(text.trim()).toString('base64url').slice(0, 32);
  const cacheFile = path.join(cacheDir, `line_${cleanId}_${selectedVoice}_${textHash}.wav`);

  if (fs.existsSync(cacheFile)) {
    const fileBuf = fs.readFileSync(cacheFile);
    return res.json({
      audioBase64: fileBuf.toString('base64'),
      source: 'cache',
      voice: selectedVoice,
    });
  }

  let audioBuf: Buffer | null = null;

  // Try Gemini TTS first
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getAIClient();
      const prompt = character ? `${character}: "${text}"` : text;

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TTS timeout')), 6000)
        ),
      ]);

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        audioBuf = Buffer.from(base64Audio, 'base64');
      }
    } catch (err: any) {
      console.warn(`Cloud line TTS error (${err?.message?.slice(0, 60)}...). Using offline voice.`);
    }
  }

  // Fallback to Flite offline synthesis
  if (!audioBuf) {
    const charConfig = CHARACTERS[characterId] || CHARACTERS.NARRATOR;
    const offlineVoice = charConfig.offlineVoice || 'kal16';
    audioBuf = renderLineWithFlite(text, offlineVoice);
  }

  fs.writeFileSync(cacheFile, audioBuf);

  return res.json({
    audioBase64: audioBuf.toString('base64'),
    source: 'synthesizer',
    voice: selectedVoice,
  });
});

// 3. GET MASTER STITCHED AUDIO FILE (Downloads all 20 scenes stitched together)
app.get('/api/download-master', (req, res) => {
  const pcmChunks: Uint8Array[] = [];
  let totalPcmLength = 0;

  for (let sIdx = 0; sIdx < SCREENPLAY_SCENES.length; sIdx++) {
    const scene = SCREENPLAY_SCENES[sIdx];
    const cacheFile = path.join(cacheDir, `scene_${scene.sceneNumber}.wav`);

    let fileBuf: Buffer;
    if (fs.existsSync(cacheFile)) {
      fileBuf = fs.readFileSync(cacheFile);
    } else {
      // Automatically render missing scene
      fileBuf = renderSceneWithFlite(scene);
      fs.writeFileSync(cacheFile, fileBuf);
    }

    const fileArrayBuf = fileBuf.buffer.slice(
      fileBuf.byteOffset,
      fileBuf.byteOffset + fileBuf.byteLength
    ) as ArrayBuffer;
    const { pcm } = extractPcmFromWav(fileArrayBuf);
    pcmChunks.push(pcm);
    totalPcmLength += pcm.length;

    // 1.2s pause between scenes (except final scene)
    if (sIdx < SCREENPLAY_SCENES.length - 1) {
      const silence = createSilencePcm(1.2, 24000);
      pcmChunks.push(silence);
      totalPcmLength += silence.length;
    }
  }

  const header = createWavHeader(totalPcmLength, 24000);
  const fullFile = Buffer.alloc(44 + totalPcmLength);
  fullFile.set(header, 0);

  let writeOffset = 44;
  for (const chunk of pcmChunks) {
    fullFile.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="heliocide_all_scenes_stitched_audio_drama.wav"'
  );
  return res.send(fullFile);
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const cachedFiles = fs.readdirSync(cacheDir).filter((f) => f.endsWith('.wav'));
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    cachedFilesCount: cachedFiles.length,
  });
});

async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
