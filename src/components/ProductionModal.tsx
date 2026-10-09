import React, { useState, useEffect, useRef } from 'react';
import { batchProducer, RenderedScene } from '../data/batchProducer';
import {
  X,
  Sparkles,
  Download,
  Play,
  Pause,
  Loader2,
  CheckCircle,
  Clock,
  HardDrive,
  FolderDown,
  Layers,
  ChevronRight,
  RotateCcw,
  CheckSquare,
  Square,
  Music,
} from 'lucide-react';

interface ProductionModalProps {
  onClose: () => void;
  onStartPlayback: (sceneIndex?: number) => void;
}

export const ProductionModal: React.FC<ProductionModalProps> = ({
  onClose,
  onStartPlayback,
}) => {
  const [prodState, setProdState] = useState(batchProducer.getState());
  const [playingScene, setPlayingScene] = useState<string | null>(null);
  const [playingMaster, setPlayingMaster] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoDownload, setAutoDownload] = useState(prodState.autoDownload);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsub = batchProducer.subscribe(() => {
      setProdState(batchProducer.getState());
    });
    return unsub;
  }, []);

  // Automatically start rendering all scenes stitched together if not already done
  useEffect(() => {
    if (!prodState.isFinished && !prodState.isProducing) {
      batchProducer.renderAllAtOnce(autoDownload);
    }
  }, []);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handlePlaySceneAudio = (scene: RenderedScene) => {
    if (playingScene === scene.sceneNumber) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingScene(null);
    } else {
      if (audioPlayerRef.current && scene.audioUrl) {
        audioPlayerRef.current.src = scene.audioUrl;
        audioPlayerRef.current.play();
        setPlayingScene(scene.sceneNumber);
        setPlayingMaster(false);
      }
    }
  };

  const handlePlayMasterAudio = () => {
    if (playingMaster) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingMaster(false);
    } else {
      if (audioPlayerRef.current && prodState.masterAudioUrl) {
        audioPlayerRef.current.src = prodState.masterAudioUrl;
        audioPlayerRef.current.play();
        setPlayingMaster(true);
        setPlayingScene(null);
      }
    }
  };

  const handleSeekMaster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = targetTime;
    }
  };

  const handleToggleAutoDownload = () => {
    const nextVal = !autoDownload;
    setAutoDownload(nextVal);
    batchProducer.setAutoDownload(nextVal);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <audio
        ref={audioPlayerRef}
        onTimeUpdate={() => {
          if (audioPlayerRef.current) {
            setCurrentTime(audioPlayerRef.current.currentTime);
            setDuration(audioPlayerRef.current.duration || 0);
          }
        }}
        onEnded={() => {
          setPlayingScene(null);
          setPlayingMaster(false);
        }}
        className="hidden"
      />

      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black font-mono tracking-wider text-slate-100 uppercase">
                  Full Audio Drama Render & Download Station
                </h2>
                {prodState.isFinished && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    20 / 20 Scenes Stitched
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                All 20 scenes rendered and stitched together correctly into one master broadcast audio file.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 relative z-10 flex-1">
          {/* 0. IDLE OR READY TO START */}
          {!prodState.isProducing && !prodState.isFinished && (
            <div className="space-y-6 py-6 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-950/50">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black font-mono text-slate-100 uppercase tracking-wide">
                  Produce Entire Audio Drama
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hit the GO button to render the whole audio drama all at once. Every scene (all 20 scenes) will be pre-made with correctly assigned character voices and acoustic staging, stitched together in chronological order, and made available for instant download.
                </p>
              </div>

              {prodState.errorMessage && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono">
                  Notice: {prodState.errorMessage}. Click below to resume rendering.
                </div>
              )}

              <button
                onClick={() => batchProducer.renderAllAtOnce(autoDownload)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black font-mono text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>GO: Render Whole Drama All At Once</span>
              </button>

              <div
                onClick={handleToggleAutoDownload}
                className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer select-none"
              >
                {autoDownload ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Automatically download stitched .WAV file upon completion</span>
              </div>
            </div>
          )}

          {/* 1. RENDERING IN PROGRESS */}
          {prodState.isProducing && (
            <div className="space-y-6 py-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-950/50">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <h3 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
                  Rendering All Scenes Stitched Together...
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Rendering each scene from Scene 00 through Scene 19 with all assigned character voices, acoustic filters, and pacing.
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 max-w-xl mx-auto">
                <div className="flex justify-between items-center font-mono text-xs">
                  <span className="text-cyan-400 font-bold">
                    Rendering: {prodState.completedScenes} / {prodState.totalScenes} Scenes
                  </span>
                  <span className="text-slate-300 font-bold">
                    {prodState.percent}% Complete
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-purple-500 transition-all duration-300"
                    style={{ width: `${prodState.percent}%` }}
                  />
                </div>
              </div>

              {/* Live Scene box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 max-w-xl mx-auto text-left">
                <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                  {prodState.currentSceneTitle}
                </div>
                <p className="text-xs text-slate-300 font-serif italic line-clamp-2">
                  Rendering studio voice models, narration, and acoustic staging for this scene...
                </p>
              </div>
            </div>
          )}

          {/* 2. RENDER COMPLETE — DOWNLOAD ALL SCENES STITCHED TOGETHER */}
          {prodState.isFinished && (
            <div className="space-y-6">
              {/* PRIMARY DOWNLOAD CARD: ALL SCENES STITCHED TOGETHER */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/50 via-slate-900 to-cyan-950/50 border-2 border-emerald-500/60 shadow-2xl relative overflow-hidden ring-2 ring-emerald-500/20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                        Ready to Download
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-slate-100 uppercase">
                      HELIOCIDE: All Scenes Stitched Together (.WAV)
                    </h3>

                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Every single scene (Prologue, Act I, Act II, Act III, Act IV, and Central Archive) combined in perfect chronological order with full character voices, acoustic resonance, and chapter transitions into one continuous master track.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-slate-300">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        Total Duration: <strong className="text-cyan-300">{formatDuration(prodState.masterDurationSec)}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        Master File Size: <strong className="text-emerald-300">{prodState.masterFileSizeMb} MB</strong>
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <strong>All 20 Scenes Included</strong>
                      </span>
                    </div>
                  </div>

                  {/* MASTER DOWNLOAD BUTTON (PRIMARY ACTION) */}
                  <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
                    <button
                      onClick={() => batchProducer.downloadMasterWav('heliocide_all_scenes_stitched_audio_drama.wav')}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black font-mono text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                    >
                      <Download className="w-5 h-5 fill-current" />
                      <span>Download All Scenes (.WAV)</span>
                    </button>

                    <div
                      onClick={handleToggleAutoDownload}
                      className="flex items-center gap-2 text-[11px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer justify-center md:justify-start select-none pt-1"
                    >
                      {autoDownload ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Auto-download upon render</span>
                    </div>
                  </div>
                </div>

                {/* Stitched Master Audio Scrubber / In-Modal Player */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Music className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Master Audio Player:</span>
                    </div>
                    <div className="text-slate-400">
                      {formatDuration(currentTime)} / {formatDuration(prodState.masterDurationSec)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayMasterAudio}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer shrink-0"
                      title={playingMaster ? 'Pause Master Track' : 'Play Stitched Master Track'}
                    >
                      {playingMaster ? (
                        <Pause className="w-4 h-4 fill-current text-cyan-400" />
                      ) : (
                        <Play className="w-4 h-4 fill-current text-cyan-400 ml-0.5" />
                      )}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={prodState.masterDurationSec || 1}
                      step={0.5}
                      value={currentTime}
                      onChange={handleSeekMaster}
                      className="flex-1 accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onStartPlayback(0);
                      }}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Perform In Script Teleprompter (Synchronized Text Highlighting)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => batchProducer.downloadAllScenesSequentially()}
                      className="text-xs font-mono text-slate-300 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Download each of the 20 scenes as separate files"
                    >
                      <FolderDown className="w-4 h-4 text-amber-400" />
                      <span>Download All 20 Scenes As Separate Files</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* INDIVIDUAL SCENES LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Each Scene In Sequence (All 20 Rendered)</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Audition or download individual scenes
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[38vh] overflow-y-auto pr-1">
                  {prodState.renderedScenes.map((scene) => {
                    const isPlayingThisScene = playingScene === scene.sceneNumber;

                    return (
                      <div
                        key={scene.sceneNumber}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                          isPlayingThisScene
                            ? 'bg-cyan-950/40 border-cyan-500 text-slate-100 shadow-lg shadow-cyan-950/40'
                            : 'bg-slate-950/60 hover:bg-slate-850/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[11px] font-mono font-bold text-cyan-400">
                              Scene {scene.sceneNumber} • {scene.act}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                              <span>{formatDuration(scene.durationSec)}</span>
                              <span>•</span>
                              <span>{scene.sizeMb} MB</span>
                            </span>
                          </div>

                          <div className="text-xs font-bold font-mono uppercase tracking-wide text-slate-200 line-clamp-1 mb-1">
                            {scene.heading.replace(/^(INT\.|EXT\.)\s*/, '')}
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {scene.summary}
                          </p>
                        </div>

                        {/* Controls for this scene */}
                        <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handlePlaySceneAudio(scene)}
                            className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
                          >
                            {isPlayingThisScene ? (
                              <>
                                <Pause className="w-3.5 h-3.5 fill-current text-cyan-400" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                                <span>Audition</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => batchProducer.downloadSceneWav(scene.sceneNumber)}
                            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-800 text-cyan-300 hover:text-cyan-100 transition-colors cursor-pointer"
                            title={`Download Scene ${scene.sceneNumber} WAV`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download .WAV</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Re-render button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => batchProducer.renderAllAtOnce(false)}
                  className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-render all scenes from scratch</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
