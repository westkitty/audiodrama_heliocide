import React from 'react';
import { Scene } from '../data/screenplay';
import { Users, BookOpen, Sliders, List, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentScene: Scene;
  sceneIndex: number;
  totalScenes: number;
  hasMasterAudio?: boolean;
  onDownloadMaster?: () => void;
  onOpenProduceAll: () => void;
  onOpenSceneNav: () => void;
  onOpenVoiceStudio: () => void;
  onOpenDossier: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScene,
  sceneIndex,
  totalScenes,
  hasMasterAudio = false,
  onDownloadMaster,
  onOpenProduceAll,
  onOpenSceneNav,
  onOpenVoiceStudio,
  onOpenDossier,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 text-slate-100 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-slate-900 to-amber-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-widest text-slate-100 font-mono">
                HELIOCIDE
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                Audio Drama
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Star Silk Screenplay • Blood Eclipse War, Year 170
            </p>
          </div>
        </div>

        {/* Center Scene metadata badge */}
        <button
          onClick={onOpenSceneNav}
          className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 group-hover:text-cyan-300 transition-colors">
              {currentScene.act} — {currentScene.actTitle}
            </div>
            <div className="text-xs font-semibold text-slate-200 line-clamp-1">
              Scene {currentScene.sceneNumber}: {currentScene.heading.replace(/^(INT\.|EXT\.)\s*/, '')}
            </div>
          </div>
          <span className="ml-1 text-[11px] font-mono text-slate-500 group-hover:text-slate-300">
            [{sceneIndex + 1}/{totalScenes}]
          </span>
        </button>

        {/* Right tools navigation */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {/* Direct Download Stitched Audio button if already rendered */}
          {hasMasterAudio && onDownloadMaster && (
            <button
              onClick={onDownloadMaster}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-black uppercase tracking-wider rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Download all scenes stitched together into one continuous audio drama (.WAV)"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Download Stitched Drama (.WAV)</span>
            </button>
          )}

          {/* Primary GO / Render Audio Drama button */}
          <button
            onClick={onOpenProduceAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-black uppercase tracking-wider rounded-lg bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 hover:to-teal-200 text-slate-950 shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-1 ring-cyan-300/60"
            title="Render the entire audio drama all at once: each scene and the master audio file, available to download"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>GO: Render Whole Drama</span>
          </button>

          <button
            onClick={onOpenSceneNav}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
            title="Browse all scenes"
          >
            <List className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Scenes</span>
          </button>

          <button
            onClick={onOpenVoiceStudio}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
            title="Inspect character voice assignments"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Voice Cast</span>
          </button>

          <button
            onClick={onOpenDossier}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
            title="Read Screenplay Notes & Canon Integrity"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Canon Notes</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
            title="Soundscape & Audio Levels"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Audio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
