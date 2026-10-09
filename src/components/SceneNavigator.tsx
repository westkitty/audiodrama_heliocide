import React from 'react';
import { SCREENPLAY_SCENES, Scene } from '../data/screenplay';
import { X, Play, Clock, Sparkles } from 'lucide-react';

interface SceneNavigatorProps {
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
  onClose: () => void;
}

export const SceneNavigator: React.FC<SceneNavigatorProps> = ({
  currentSceneIndex,
  onSelectScene,
  onClose,
}) => {
  // Group scenes by act
  const acts: { act: string; actTitle: string; scenes: { scene: Scene; index: number }[] }[] = [];
  
  SCREENPLAY_SCENES.forEach((scene, index) => {
    let actGroup = acts.find((a) => a.act === scene.act);
    if (!actGroup) {
      actGroup = { act: scene.act, actTitle: scene.actTitle, scenes: [] };
      acts.push(actGroup);
    }
    actGroup.scenes.push({ scene, index });
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Scene Navigation & Index (20 Scenes)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Jump to any scene in the HELIOCIDE screenplay to hear the full-cast audio performance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Acts & Scenes List */}
        <div className="p-5 overflow-y-auto space-y-6">
          {acts.map((actGroup) => (
            <div key={actGroup.act}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50">
                  {actGroup.act}
                </span>
                <span className="text-sm font-semibold text-slate-300">
                  {actGroup.actTitle}
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {actGroup.scenes.map(({ scene, index }) => {
                  const isCurrent = index === currentSceneIndex;

                  return (
                    <button
                      key={scene.id}
                      onClick={() => {
                        onSelectScene(index);
                        onClose();
                      }}
                      className={`text-left p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-cyan-950/40 border-cyan-500 text-slate-100 shadow-lg shadow-cyan-950/30'
                          : 'bg-slate-950/50 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            Scene {scene.sceneNumber}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {scene.items.length} lines
                          </span>
                        </div>

                        <div className="text-xs font-bold font-mono uppercase tracking-wide text-slate-200 line-clamp-1 mb-1.5 group-hover:text-cyan-300 transition-colors">
                          {scene.heading.replace(/^(INT\.|EXT\.)\s*/, '')}
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {scene.summary}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Atmosphere: {scene.ambientSound.replace('_', ' ')}</span>
                        {isCurrent ? (
                          <span className="text-cyan-400 font-semibold flex items-center gap-1">
                            <Play className="w-3 h-3 fill-current" />
                            Current
                          </span>
                        ) : (
                          <span className="group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Jump
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
