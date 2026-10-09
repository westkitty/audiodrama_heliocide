import React, { useEffect, useRef } from 'react';
import { Scene, ScriptItem } from '../data/screenplay';
import { CHARACTERS } from '../data/characters';
import { Play, Volume2, Sparkles, Radio, Mic, ChevronRight } from 'lucide-react';
import { soundEngine } from '../data/soundEngine';

interface ScriptTeleprompterProps {
  scene: Scene;
  currentItemIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  characterVoices: Record<string, string>;
  onLineClick: (itemIndex: number) => void;
  onNextScene: () => void;
  onPrevScene: () => void;
  hasPrevScene: boolean;
  hasNextScene: boolean;
}

export const ScriptTeleprompter: React.FC<ScriptTeleprompterProps> = ({
  scene,
  currentItemIndex,
  isPlaying,
  isLoading,
  characterVoices,
  onLineClick,
  onNextScene,
  onPrevScene,
  hasPrevScene,
  hasNextScene,
}) => {
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to active line
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentItemIndex, scene.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      {/* Scene Heading Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              {scene.act}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {scene.actTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              Atmosphere: <strong className="text-slate-300 font-normal">{scene.ambientSound.replace('_', ' ')}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              {scene.timeSetting}
            </span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-slate-100 uppercase mb-2">
          {scene.sceneNumber}. {scene.heading}
        </h2>

        <p className="text-sm text-slate-400 leading-relaxed font-sans max-w-2xl">
          {scene.summary}
        </p>

        {/* Scene navigation quick buttons */}
        <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between">
          <button
            onClick={onPrevScene}
            disabled={!hasPrevScene}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              hasPrevScene
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                : 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border-slate-900'
            }`}
          >
            ← Previous Scene
          </button>

          <span className="text-xs font-mono text-slate-500">
            {scene.items.length} script elements
          </span>

          <button
            onClick={onNextScene}
            disabled={!hasNextScene}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
              hasNextScene
                ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                : 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border-slate-900'
            }`}
          >
            Next Scene →
          </button>
        </div>
      </div>

      {/* Script Lines Flow */}
      <div className="space-y-4">
        {scene.items.map((item, idx) => {
          const isActive = idx === currentItemIndex;
          const charConfig = CHARACTERS[item.characterId] || CHARACTERS.NARRATOR;
          const assignedVoice = characterVoices[item.characterId] || charConfig.defaultVoice;

          if (item.type === 'cue') {
            return (
              <div
                key={item.id}
                ref={isActive ? activeLineRef : null}
                onClick={() => onLineClick(idx)}
                className={`py-4 px-6 text-center font-mono font-bold tracking-widest text-xs uppercase cursor-pointer transition-all rounded-xl border ${
                  isActive
                    ? 'bg-purple-950/40 border-purple-500/80 text-purple-200 shadow-lg shadow-purple-950/50 scale-[1.01]'
                    : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-800/60 hover:bg-slate-900/30'
                }`}
              >
                {item.text}
              </div>
            );
          }

          if (item.type === 'direction') {
            return (
              <div
                key={item.id}
                ref={isActive ? activeLineRef : null}
                onClick={() => onLineClick(idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-slate-900/90 border-purple-500/70 shadow-lg shadow-purple-950/30'
                    : 'bg-transparent border-transparent hover:bg-slate-900/40 hover:border-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-full self-stretch rounded-full bg-purple-500/30 group-hover:bg-purple-500/60 transition-colors shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono tracking-wider text-purple-400 uppercase font-semibold">
                        Stage Direction
                      </span>
                      {item.soundFxCue && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playSoundFx(item.soundFxCue!);
                          }}
                          className="flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50 hover:bg-amber-900/80 transition-colors"
                          title="Click to audition sound effect"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>SFX: {item.soundFxCue.replace(/_/g, ' ')}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 font-serif leading-relaxed tracking-wide italic">
                      {item.text}
                    </p>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="p-1 rounded bg-slate-800 text-slate-400 hover:text-cyan-300">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Dialogue line
          return (
            <div
              key={item.id}
              ref={isActive ? activeLineRef : null}
              onClick={() => onLineClick(idx)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                isActive
                  ? 'scale-[1.01] shadow-2xl'
                  : 'hover:bg-slate-900/50 border-slate-800/40 hover:border-slate-700/80'
              }`}
              style={{
                backgroundColor: isActive ? `${charConfig.accentBg}` : undefined,
                borderColor: isActive ? charConfig.themeColor : undefined,
                boxShadow: isActive ? `0 0 24px ${charConfig.themeColor}33` : undefined,
              }}
            >
              <div className="flex items-start gap-3.5">
                {/* Character avatar badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: charConfig.accentBg,
                    borderColor: charConfig.themeColor,
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

                <div className="flex-1 min-w-0">
                  {/* Speaker Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className="text-xs font-mono font-black tracking-wider uppercase"
                      style={{ color: charConfig.themeColor }}
                    >
                      {item.speakerName || charConfig.name}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-950/80 border border-slate-800">
                      Voice: {assignedVoice}
                    </span>

                    {item.audioEffect && item.audioEffect !== 'none' && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-cyan-800/40">
                        {item.audioEffect === 'shard_god'
                          ? 'Azure Shard-God Resonance'
                          : item.audioEffect === 'radio'
                          ? 'Comms Radio Filter'
                          : item.audioEffect === 'word_streaming'
                          ? 'Word Streaming Shockwave'
                          : item.audioEffect}
                      </span>
                    )}

                    {item.soundFxCue && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playSoundFx(item.soundFxCue!);
                        }}
                        className="flex items-center gap-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50 hover:bg-amber-900/80 transition-colors"
                        title="Audition sound effect cue"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>SFX: {item.soundFxCue.replace(/_/g, ' ')}</span>
                      </button>
                    )}
                  </div>

                  {/* Parenthetical */}
                  {item.parenthetical && (
                    <div className="text-xs text-slate-400 italic mb-1 font-serif">
                      ({item.parenthetical})
                    </div>
                  )}

                  {/* Spoken Dialogue Text */}
                  <div
                    className={`text-base leading-relaxed tracking-wide font-sans ${
                      isActive ? 'text-slate-100 font-medium' : 'text-slate-300'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>

                {/* Right play indicator */}
                <div className="shrink-0 self-center">
                  {isActive && isPlaying ? (
                    <div className="flex items-center gap-1 text-cyan-400">
                      <span className="w-1.5 h-4 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="w-1.5 h-6 rounded-full bg-cyan-400 animate-pulse delay-75" />
                      <span className="w-1.5 h-3 rounded-full bg-cyan-400 animate-pulse delay-150" />
                    </div>
                  ) : isActive && isLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  ) : (
                    <button
                      className="p-2 rounded-lg bg-slate-900 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-all cursor-pointer"
                      title="Play from this line"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Scene footer jump */}
      {hasNextScene && (
        <div className="mt-12 text-center">
          <button
            onClick={onNextScene}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 font-semibold text-sm transition-all shadow-lg hover:shadow-cyan-950/40 cursor-pointer"
          >
            <span>Proceed to Next Scene</span>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      )}
    </div>
  );
};
