import { SCREENPLAY_SCENES, Scene, ScriptItem } from './screenplay';
import { CHARACTERS, CharacterConfig } from './characters';
import { soundEngine } from './soundEngine';

export type DramaPlayState = 'idle' | 'playing' | 'paused' | 'loading';
export type NarrationMode = 'full' | 'dialogue_only';

export interface PreloadProgress {
  sceneIndex: number;
  loaded: number;
  total: number;
  inProgress: boolean;
}

export class DramaManager {
  private currentSceneIdx = 0;
  private currentItemIdx = 0;
  private playState: DramaPlayState = 'idle';
  private narrationMode: NarrationMode = 'full';
  private autoAdvance = true;
  private playbackSpeed = 1.0;
  
  // Custom voice configuration map (characterId -> voiceName)
  private characterVoices: Record<string, 'Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr'> = {};

  // Audio buffer cache: key is lineId
  private audioCache = new Map<string, ArrayBuffer>();

  // Event listeners
  private listeners: Set<() => void> = new Set();

  private preloadStatus: PreloadProgress = {
    sceneIndex: 0,
    loaded: 0,
    total: 0,
    inProgress: false,
  };

  private isCancelling = false;

  constructor() {
    // Initialize default voices
    Object.keys(CHARACTERS).forEach((charId) => {
      this.characterVoices[charId] = CHARACTERS[charId].defaultVoice;
    });
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  // --- GETTERS ---
  public getState() {
    const scene = SCREENPLAY_SCENES[this.currentSceneIdx];
    const item = scene?.items[this.currentItemIdx];
    return {
      sceneIndex: this.currentSceneIdx,
      itemIndex: this.currentItemIdx,
      scene,
      item,
      playState: this.playState,
      narrationMode: this.narrationMode,
      autoAdvance: this.autoAdvance,
      playbackSpeed: this.playbackSpeed,
      characterVoices: this.characterVoices,
      preloadStatus: this.preloadStatus,
      totalScenes: SCREENPLAY_SCENES.length,
    };
  }

  public setCharacterVoice(characterId: string, voiceName: 'Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr') {
    this.characterVoices[characterId] = voiceName;
    // Invalidate cached audio for this character's lines so new voice is heard
    const currentScene = SCREENPLAY_SCENES[this.currentSceneIdx];
    currentScene.items.forEach((item) => {
      if (item.characterId === characterId) {
        this.audioCache.delete(item.id);
      }
    });
    this.notify();
  }

  public setNarrationMode(mode: NarrationMode) {
    this.narrationMode = mode;
    this.notify();
  }

  public setAutoAdvance(val: boolean) {
    this.autoAdvance = val;
    this.notify();
  }

  public setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
    this.notify();
  }

  // --- NAVIGATION ---
  public async jumpTo(sceneIndex: number, itemIndex = 0) {
    this.stopPlayback();
    this.currentSceneIdx = Math.max(0, Math.min(sceneIndex, SCREENPLAY_SCENES.length - 1));
    const scene = SCREENPLAY_SCENES[this.currentSceneIdx];
    this.currentItemIdx = Math.max(0, Math.min(itemIndex, scene.items.length - 1));
    
    // Switch ambient
    soundEngine.setAmbient(scene.ambientSound);
    this.notify();

    // Start playing this line
    await this.playCurrentLine();
  }

  public async play() {
    if (this.playState === 'playing') return;
    const scene = SCREENPLAY_SCENES[this.currentSceneIdx];
    soundEngine.setAmbient(scene.ambientSound);
    await this.playCurrentLine();
  }

  public pause() {
    this.stopPlayback();
    this.playState = 'paused';
    this.notify();
  }

  public stop() {
    this.stopPlayback();
    this.playState = 'idle';
    this.currentItemIdx = 0;
    soundEngine.stopAmbient();
    this.notify();
  }

  public async nextLine() {
    this.stopPlayback();
    this.advanceToNext(true);
  }

  public async prevLine() {
    this.stopPlayback();
    if (this.currentItemIdx > 0) {
      this.currentItemIdx--;
    } else if (this.currentSceneIdx > 0) {
      this.currentSceneIdx--;
      this.currentItemIdx = SCREENPLAY_SCENES[this.currentSceneIdx].items.length - 1;
      soundEngine.setAmbient(SCREENPLAY_SCENES[this.currentSceneIdx].ambientSound);
    }
    this.notify();
    await this.playCurrentLine();
  }

  private stopPlayback() {
    this.isCancelling = true;
    soundEngine.stopCurrentVoice();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isCancelling = false;
  }

  // --- CORE PLAYBACK LOOP ---
  private async playCurrentLine() {
    const scene = SCREENPLAY_SCENES[this.currentSceneIdx];
    if (!scene) return;
    const item = scene.items[this.currentItemIdx];
    if (!item) return;

    // Check dialogue only filter
    if (this.narrationMode === 'dialogue_only' && item.type !== 'dialogue') {
      this.advanceToNext(false);
      return;
    }

    this.playState = 'loading';
    this.notify();

    // Trigger sound FX cue if item has one
    if (item.soundFxCue) {
      soundEngine.playSoundFx(item.soundFxCue);
    }

    // Prefetch next 2 items in background
    this.prefetchUpcoming(this.currentSceneIdx, this.currentItemIdx + 1);

    try {
      const buffer = await this.getAudioBuffer(item);

      if (this.isCancelling) return;

      this.playState = 'playing';
      this.notify();

      await soundEngine.playVoiceBuffer(
        buffer,
        item.audioEffect || 'none',
        () => {
          // On ended
          if (this.playState === 'playing' && this.autoAdvance) {
            // Small dramatic pause between lines (400ms)
            setTimeout(() => {
              if (this.playState === 'playing') {
                this.advanceToNext(false);
              }
            }, 350);
          } else if (this.playState === 'playing') {
            this.playState = 'idle';
            this.notify();
          }
        }
      );
    } catch (err) {
      console.warn('TTS playback error, attempting speech synthesis fallback:', err);
      this.fallbackSpeechSynthesis(item);
    }
  }

  private advanceToNext(forcePlay = false) {
    const scene = SCREENPLAY_SCENES[this.currentSceneIdx];
    if (this.currentItemIdx < scene.items.length - 1) {
      this.currentItemIdx++;
      this.notify();
      this.playCurrentLine();
    } else if (this.currentSceneIdx < SCREENPLAY_SCENES.length - 1) {
      // Advance to next scene!
      this.currentSceneIdx++;
      this.currentItemIdx = 0;
      soundEngine.setAmbient(SCREENPLAY_SCENES[this.currentSceneIdx].ambientSound);
      this.notify();
      this.playCurrentLine();
    } else {
      // Reached end of screenplay!
      this.playState = 'idle';
      this.notify();
    }
  }

  // --- AUDIO FETCHING & CACHING ---
  private async getAudioBuffer(item: ScriptItem): Promise<ArrayBuffer> {
    if (this.audioCache.has(item.id)) {
      return this.audioCache.get(item.id)!;
    }

    const charConfig = CHARACTERS[item.characterId] || CHARACTERS.NARRATOR;
    const voiceName = this.characterVoices[item.characterId] || charConfig.defaultVoice;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text,
          voiceName,
          character: item.speakerName || charConfig.name,
          characterId: item.characterId,
          style: charConfig.stylePrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const binaryString = atob(data.audioBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const buffer = bytes.buffer;
          this.audioCache.set(item.id, buffer);
          return buffer;
        }
      }
    } catch (err) {
      console.warn('TTS request error, using speech synthesis fallback:', err);
    }

    throw new Error('TTS audio unavailable');
  }

  // Prefetch upcoming lines asynchronously
  private async prefetchUpcoming(sceneIdx: number, startItemIdx: number) {
    const scene = SCREENPLAY_SCENES[sceneIdx];
    if (!scene) return;

    for (let i = startItemIdx; i < Math.min(startItemIdx + 2, scene.items.length); i++) {
      const item = scene.items[i];
      if (item && !this.audioCache.has(item.id)) {
        this.getAudioBuffer(item).catch(() => {});
      }
    }
  }

  // Batch preload entire scene
  public async preloadScene(sceneIndex: number) {
    const scene = SCREENPLAY_SCENES[sceneIndex];
    if (!scene) return;

    this.preloadStatus = {
      sceneIndex,
      loaded: 0,
      total: scene.items.length,
      inProgress: true,
    };
    this.notify();

    for (const item of scene.items) {
      try {
        await this.getAudioBuffer(item);
      } catch (err) {
        console.error('Failed to preload line:', item.id, err);
      }
      this.preloadStatus.loaded++;
      this.notify();
    }

    this.preloadStatus.inProgress = false;
    this.notify();
  }

  // Fallback using Web Speech API if offline or API limit
  private fallbackSpeechSynthesis(item: ScriptItem) {
    if (!window.speechSynthesis) {
      this.playState = 'idle';
      this.notify();
      return;
    }

    this.playState = 'playing';
    this.notify();

    const charConfig = CHARACTERS[item.characterId] || CHARACTERS.NARRATOR;
    const utterance = new SpeechSynthesisUtterance(item.text);

    utterance.rate = charConfig.rateMultiplier * this.playbackSpeed;
    utterance.pitch = Math.max(0.5, Math.min(2.0, 1.0 + charConfig.pitchOffset));

    utterance.onend = () => {
      if (this.playState === 'playing' && this.autoAdvance) {
        setTimeout(() => {
          if (this.playState === 'playing') {
            this.advanceToNext(false);
          }
        }, 350);
      } else {
        this.playState = 'idle';
        this.notify();
      }
    };

    utterance.onerror = () => {
      this.playState = 'idle';
      this.notify();
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const dramaManager = new DramaManager();
