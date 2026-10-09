/**
 * WAV Stitcher: Combines multiple 24kHz 16-bit mono WAV buffers into a single
 * master broadcast-quality WAV file with configurable pauses between lines and scenes.
 */

export interface StitchProgress {
  current: number;
  total: number;
  percent: number;
}

/**
 * Extracts raw PCM bytes from a standard RIFF WAV buffer.
 */
export function extractPcmFromWav(wavBuffer: ArrayBuffer): { pcm: Uint8Array; sampleRate: number } {
  const bytes = new Uint8Array(wavBuffer);
  const view = new DataView(wavBuffer);

  let sampleRate = 24000;

  // Search for the 'data' chunk header
  let offset = 12;
  while (offset < bytes.length - 8) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      sampleRate = view.getUint32(offset + 12, true);
    } else if (chunkId === 'data') {
      const pcmStart = offset + 8;
      const pcmEnd = Math.min(bytes.length, pcmStart + chunkSize);
      return {
        pcm: bytes.subarray(pcmStart, pcmEnd),
        sampleRate,
      };
    }

    offset += 8 + chunkSize;
  }

  // Fallback: Skip standard 44-byte header
  return {
    pcm: bytes.subarray(Math.min(44, bytes.length)),
    sampleRate: 24000,
  };
}

/**
 * Creates a silent PCM byte slice for a given duration in seconds.
 */
export function createSilencePcm(durationSec: number, sampleRate = 24000, bitsPerSample = 16, numChannels = 1): Uint8Array {
  const numSamples = Math.floor(sampleRate * durationSec);
  const numBytes = numSamples * (bitsPerSample / 8) * numChannels;
  return new Uint8Array(numBytes);
}

/**
 * Creates a 44-byte RIFF WAV header for raw PCM data.
 */
export function createWavHeader(
  dataLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // "RIFF"
  header.set([0x52, 0x49, 0x46, 0x46], 0);
  // Total size - 8
  view.setUint32(4, 36 + dataLength, true);
  // "WAVE"
  header.set([0x57, 0x41, 0x56, 0x45], 8);
  // "fmt "
  header.set([0x66, 0x6d, 0x74, 0x20], 12);
  // Subchunk1Size (16 for PCM)
  view.setUint32(16, 16, true);
  // AudioFormat (1 for PCM)
  view.setUint16(20, 1, true);
  // NumChannels
  view.setUint16(22, numChannels, true);
  // SampleRate
  view.setUint32(24, sampleRate, true);
  // ByteRate = SampleRate * NumChannels * BitsPerSample / 8
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  // BlockAlign = NumChannels * BitsPerSample / 8
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  // BitsPerSample
  view.setUint16(34, bitsPerSample, true);
  // "data"
  header.set([0x64, 0x61, 0x74, 0x61], 36);
  // Subchunk2Size (dataLength)
  view.setUint32(40, dataLength, true);

  return header;
}

/**
 * Stitches an array of WAV array buffers into a single master WAV Blob.
 */
export function stitchWavBuffers(
  items: { wavBuffer: ArrayBuffer; pauseAfterSec?: number }[],
  defaultPauseSec = 0.35,
  sampleRate = 24000
): Blob {
  const pcmChunks: Uint8Array[] = [];
  let totalPcmLength = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { pcm } = extractPcmFromWav(item.wavBuffer);
    pcmChunks.push(pcm);
    totalPcmLength += pcm.length;

    // Add pause after line unless it's the very last line
    const pauseSec = item.pauseAfterSec !== undefined ? item.pauseAfterSec : defaultPauseSec;
    if (pauseSec > 0 && i < items.length - 1) {
      const silence = createSilencePcm(pauseSec, sampleRate);
      pcmChunks.push(silence);
      totalPcmLength += silence.length;
    }
  }

  // Create standard header
  const header = createWavHeader(totalPcmLength, sampleRate);

  // Assemble into one contiguous byte buffer
  const fullFile = new Uint8Array(44 + totalPcmLength);
  fullFile.set(header, 0);

  let writeOffset = 44;
  for (const chunk of pcmChunks) {
    fullFile.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  // Return final Blob
  return new Blob([fullFile.buffer as ArrayBuffer], { type: 'audio/wav' });
}

/**
 * Triggers a browser download for a given Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
