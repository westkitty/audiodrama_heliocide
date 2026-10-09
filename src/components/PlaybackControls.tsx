import React from 'react';
import { DramaPlayState, NarrationMode, PreloadProgress } from '../data/dramaManager';
import { ScriptItem } from '../data/screenplay';
import { CHARACTERS } from '../data/characters';
import { WaveformVisualizer } from './WaveformVisualizer';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Loader2,
  Volume2,
  VolumeX,
  Download,
  Mic,
  Radio,
  Sparkles,
} from 'lucide-react';

interface PlaybackControlsProps {
  playState: DramaPlayState;
  currentItem?: ScriptItem;
  itemIndex: number;
  totalItems: number;
  narrationMode: NarrationMode;
  autoAdvance: boolean;
  preloadStatus: PreloadProgress;
  isMuted: boolean;
  characterVoices: Record<string, string>;
  hasMasterAudio?: boolean;
  onDownloadMaster?: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleAutoAdvance: () => void;
  onToggleNarrationMode: () => void;
  onToggleMute: () => void;
  onPreloadScene: () => void;
  onOpenProduceAll: () => void;
  onOpenVoiceStudio: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playState,
  currentItem,
  itemIndex,
  totalItems,
  narrationMode,
  autoAdvance,
  preloadStatus,
  isMuted,
  characterVoices,
  hasMasterAudio = false,
  onDownloadMaster,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onToggleAutoAdvance,
  onToggleNarrationMode,
  onToggleMute,
  onPreloadScene,
  onOpenProduceAll,
  onOpenVoiceStudio,
}) => {
  const charConfig = currentItem ? CHARACTERS[currentItem.characterId] || CHARACTERS.NARRATOR : CHARACTERS.NARRATOR;
  const activeVoice = currentItem ? characterVoices[currentItem.characterId] || charConfig.defaultVoice : 'Charon';

  const isPlaying = playState === 'playing';
  const isLoading = playState === 'loading';

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 py-2.5 px-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Active speaker info */}
        <div className="flex items-center gap-3 w-full md:w-auto min-w-[260px]">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-md transition-all"
            style={{
              backgroundColor: charConfig.accentBg,
              borderColor: charConfig.themeColor,
              boxShadow: isPlaying ? `0 0 16px ${charConfig.themeColor}55` : undefined,
            }}
          >
            {charConfig.isGod ? (
              <Sparkles className="w-5 h-5 text-cyan-400" />
            ) : charConfig.isRadio ? (
              <Radio className="w-5 h-5 text-amber-400" />
            ) : (
              <Mic className="w-5 h-5 text-slate-200" />
            )}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold tracking-wider font-mono uppercase truncate"
                style={{ color: charConfig.themeColor }}
              >
                {currentItem?.speakerName || charConfig.name}
              </span>
              <button
                onClick={onOpenVoiceStudio}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors cursor-pointer"
                title="Change assigned voice"
              >
                {activeVoice}
              </button>
            </div>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
              <span>{charConfig.title}</span>
              {currentItem?.audioEffect && currentItem.audioEffect !== 'none' && (
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded border border-cyan-800/40">
                  {currentItem.audioEffect === 'shard_god' ? 'Resonant God' : currentItem.audioEffect}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Master transport controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onPrev}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
            title="Previous Line"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {isPlaying ? (
            <button
              onClick={onPause}
              className="p-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
              title="Pause Audio Drama"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          ) : isLoading ? (
            <button
              disabled
              className="p-3.5 rounded-full bg-slate-800 text-cyan-400 border border-cyan-500/30 cursor-wait shadow-lg"
              title="Generating voice..."
            >
              <Loader2 className="w-5 h-5 animate-spin" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="p-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
              title="Play Audio Drama"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={onNext}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
            title="Next Line"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onStop}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Stop Performance"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Waveform visualizer */}
          <div className="hidden sm:block">
            <WaveformVisualizer
              isPlaying={isPlaying}
              isLoading={isLoading}
              themeColor={charConfig.themeColor}
            />
          </div>
        </div>

        {/* Right Settings & Mode buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Line counter */}
          <div className="text-[11px] font-mono text-slate-400 px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
            Line {itemIndex + 1}/{totalItems}
          </div>

          {/* Auto advance toggle */}
          <button
            onClick={onToggleAutoAdvance}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
              autoAdvance
                ? 'bg-cyan-950/60 border-cyan-600/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Auto-play next line automatically like a radio drama"
          >
            {autoAdvance ? 'Auto-Play: ON' : 'Auto: OFF'}
          </button>

          {/* Narration mode toggle */}
          <button
            onClick={onToggleNarrationMode}
            className={`hidden lg:block text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
              narrationMode === 'full'
                ? 'bg-purple-950/60 border-purple-600/50 text-purple-300'
                : 'bg-amber-950/60 border-amber-600/50 text-amber-300'
            }`}
            title="Toggle Narrator Stage Directions vs. Dialogue Only"
          >
            {narrationMode === 'full' ? 'Full Cast + Stage' : 'Dialogue Only'}
          </button>

          {/* Preload Scene Button */}
          <button
            onClick={onPreloadScene}
            disabled={preloadStatus.inProgress}
            className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
              preloadStatus.inProgress
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 cursor-wait'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title="Preload all lines in current scene for seamless offline audio"
          >
            {preloadStatus.inProgress ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>
                  {preloadStatus.loaded}/{preloadStatus.total}
                </span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Preload Scene</span>
              </>
            )}
          </button>

          {/* Direct Download Stitched Audio button if already rendered */}
          {hasMasterAudio && onDownloadMaster && (
            <button
              onClick={onDownloadMaster}
              className="hidden lg:flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Download all scenes stitched together into one continuous audio drama (.WAV)"
            >
              <Download className="w-3.5 h-3.5 fill-current" />
              <span>Download Stitched (.WAV)</span>
            </button>
          )}

          {/* Master Render Whole Drama / Download WAV button */}
          <button
            onClick={onOpenProduceAll}
            className="flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 text-slate-950 font-black shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Render the entire audio drama all at once: each scene and the master audio file, available to download"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Render Whole Drama</span>
          </button>

          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title={isMuted ? 'Unmute' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </footer>
  );
};
