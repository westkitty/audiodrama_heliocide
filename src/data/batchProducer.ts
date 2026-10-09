import { SCREENPLAY_SCENES, Scene } from './screenplay';
import { stitchWavBuffers, triggerBlobDownload } from './wavStitcher';

export interface RenderedScene {
  sceneIndex: number;
  sceneNumber: string;
  heading: string;
  summary: string;
  act: string;
  actTitle: string;
  durationSec: number;
  sizeMb: number;
  blob: Blob;
  filename: string;
  audioUrl: string;
}

export interface ProductionProgressState {
  isProducing: boolean;
  isFinished: boolean;
  totalScenes: number;
  completedScenes: number;
  percent: number;
  currentSceneTitle: string;
  elapsedSec: number;
  masterBlob: Blob | null;
  masterDurationSec: number;
  masterFileSizeMb: number;
  masterAudioUrl: string | null;
  renderedScenes: RenderedScene[];
  autoDownload: boolean;
  errorMessage: string | null;
}

export class BatchProducer {
  private state: ProductionProgressState = {
    isProducing: false,
    isFinished: false,
    totalScenes: SCREENPLAY_SCENES.length,
    completedScenes: 0,
    percent: 0,
    currentSceneTitle: '',
    elapsedSec: 0,
    masterBlob: null,
    masterDurationSec: 0,
    masterFileSizeMb: 0,
    masterAudioUrl: null,
    renderedScenes: [],
    autoDownload: true,
    errorMessage: null,
  };

  private listeners: Set<() => void> = new Set();
  private abortController: AbortController | null = null;
  private timerId: any = null;

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getState(): ProductionProgressState {
    return { ...this.state };
  }

  public setAutoDownload(val: boolean) {
    this.state.autoDownload = val;
    this.notify();
  }

  /**
   * Renders the whole audio drama at once:
   * - Calls the studio audio renderer for each scene (Scene 00 through Scene 19)
   * - Stitches all scenes together in correct chronological order into a single master audio file
   * - Automatically downloads the stitched master audio file upon completion
   */
  public async renderAllAtOnce(forceAutoDownload = this.state.autoDownload) {
    if (this.state.isProducing) return;

    this.abortController = new AbortController();

    this.state = {
      isProducing: true,
      isFinished: false,
      totalScenes: SCREENPLAY_SCENES.length,
      completedScenes: 0,
      percent: 0,
      currentSceneTitle: SCREENPLAY_SCENES[0].heading,
      elapsedSec: 0,
      masterBlob: null,
      masterDurationSec: 0,
      masterFileSizeMb: 0,
      masterAudioUrl: null,
      renderedScenes: [],
      autoDownload: forceAutoDownload,
      errorMessage: null,
    };
    this.notify();

    // Elapsed timer
    this.timerId = setInterval(() => {
      this.state.elapsedSec++;
      this.notify();
    }, 1000);

    const sceneBuffersToStitch: { wavBuffer: ArrayBuffer; pauseAfterSec: number }[] = [];
    const renderedScenesList: RenderedScene[] = [];

    try {
      for (let sIdx = 0; sIdx < SCREENPLAY_SCENES.length; sIdx++) {
        if (this.abortController?.signal.aborted) break;

        const scene = SCREENPLAY_SCENES[sIdx];
        this.state.currentSceneTitle = `Scene ${scene.sceneNumber}: ${scene.heading.replace(/^(INT\.|EXT\.)\s*/, '')}`;
        this.notify();

        // Call server to render real studio audio for this scene (with automatic retry)
        let res: Response;
        try {
          res = await fetch('/api/render-scene', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sceneIndex: sIdx }),
            signal: this.abortController?.signal,
          });

          if (!res.ok) {
            // Retry once after 600ms
            await new Promise((r) => setTimeout(r, 600));
            res = await fetch('/api/render-scene', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sceneIndex: sIdx }),
              signal: this.abortController?.signal,
            });
          }
        } catch (fetchErr: any) {
          if (this.abortController?.signal.aborted) break;
          // Retry once after 800ms
          await new Promise((r) => setTimeout(r, 800));
          res = await fetch('/api/render-scene', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sceneIndex: sIdx }),
            signal: this.abortController?.signal,
          });
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to render scene ${scene.sceneNumber}`);
        }

        const data = await res.json();
        const binaryString = atob(data.audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let b = 0; b < binaryString.length; b++) {
          bytes[b] = binaryString.charCodeAt(b);
        }

        const sceneBlob = new Blob([bytes.buffer], { type: 'audio/wav' });
        const sceneAudioUrl = URL.createObjectURL(sceneBlob);
        const sceneDurationSec = data.durationSec || Math.round((bytes.length - 44) / 48000);
        const sceneSizeMb = parseFloat((bytes.length / (1024 * 1024)).toFixed(2));
        const cleanHeading = scene.heading
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .slice(0, 32);
        const sceneFilename = `heliocide_scene_${scene.sceneNumber}_${cleanHeading}.wav`;

        renderedScenesList.push({
          sceneIndex: sIdx,
          sceneNumber: scene.sceneNumber,
          heading: scene.heading,
          summary: scene.summary,
          act: scene.act,
          actTitle: scene.actTitle,
          durationSec: sceneDurationSec,
          sizeMb: sceneSizeMb,
          blob: sceneBlob,
          filename: sceneFilename,
          audioUrl: sceneAudioUrl,
        });

        // Add to master stitching queue with 1.2s pause between scenes
        sceneBuffersToStitch.push({
          wavBuffer: bytes.buffer,
          pauseAfterSec: sIdx === SCREENPLAY_SCENES.length - 1 ? 0.5 : 1.2,
        });

        this.state.completedScenes = sIdx + 1;
        this.state.renderedScenes = [...renderedScenesList];
        this.state.percent = Math.round(((sIdx + 1) / SCREENPLAY_SCENES.length) * 100);
        this.notify();
      }

      if (!this.abortController?.signal.aborted && sceneBuffersToStitch.length > 0) {
        // Stitch all scenes together in chronological order
        const masterBlob = stitchWavBuffers(sceneBuffersToStitch, 1.2, 24000);
        const masterDurationSec = Math.round((masterBlob.size - 44) / 48000);
        const masterFileSizeMb = parseFloat((masterBlob.size / (1024 * 1024)).toFixed(2));
        const masterAudioUrl = URL.createObjectURL(masterBlob);

        this.state.isFinished = true;
        this.state.isProducing = false;
        this.state.masterBlob = masterBlob;
        this.state.masterDurationSec = masterDurationSec;
        this.state.masterFileSizeMb = masterFileSizeMb;
        this.state.masterAudioUrl = masterAudioUrl;
        this.state.percent = 100;
        this.notify();

        // Download all scenes stitched together
        if (forceAutoDownload) {
          this.downloadMasterWav('heliocide_all_scenes_stitched_audio_drama.wav');
        }
      }
    } catch (err: any) {
      console.error('Batch rendering error:', err);
      this.state.errorMessage = err?.message || 'Rendering failed';
      this.state.isProducing = false;
      this.notify();
    } finally {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    }
  }

  public cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.state.isProducing = false;
    this.notify();
  }

  public downloadMasterWav(filename = 'heliocide_all_scenes_stitched_audio_drama.wav') {
    if (this.state.masterBlob) {
      triggerBlobDownload(this.state.masterBlob, filename);
    } else {
      // Fallback to server master stream if available
      const a = document.createElement('a');
      a.href = '/api/download-master';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
    }
  }

  public downloadSceneWav(sceneNumber: string) {
    const scene = this.state.renderedScenes.find((s) => s.sceneNumber === sceneNumber);
    if (scene) {
      triggerBlobDownload(scene.blob, scene.filename);
    }
  }

  public async downloadAllScenesSequentially() {
    for (const scene of this.state.renderedScenes) {
      triggerBlobDownload(scene.blob, scene.filename);
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}

export const batchProducer = new BatchProducer();
