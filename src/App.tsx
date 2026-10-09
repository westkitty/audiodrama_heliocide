import React, { useState, useEffect } from 'react';
import { dramaManager } from './data/dramaManager';
import { batchProducer } from './data/batchProducer';
import { soundEngine } from './data/soundEngine';
import { SCREENPLAY_SCENES } from './data/screenplay';
import { Header } from './components/Header';
import { PlaybackControls } from './components/PlaybackControls';
import { ScriptTeleprompter } from './components/ScriptTeleprompter';
import { SceneNavigator } from './components/SceneNavigator';
import { VoiceStudio } from './components/VoiceStudio';
import { CanonDossier } from './components/CanonDossier';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { ProductionModal } from './components/ProductionModal';

export default function App() {
  const [dramaState, setDramaState] = useState(dramaManager.getState());
  const [batchState, setBatchState] = useState(batchProducer.getState());
  const [isMuted, setIsMuted] = useState(false);

  // Modals
  const [showSceneNav, setShowSceneNav] = useState(false);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);

  useEffect(() => {
    const unsubDrama = dramaManager.subscribe(() => {
      setDramaState(dramaManager.getState());
    });
    const unsubBatch = batchProducer.subscribe(() => {
      setBatchState(batchProducer.getState());
    });
    return () => {
      unsubDrama();
      unsubBatch();
    };
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  const currentScene = dramaState.scene;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Starfield & Ambience glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-2/3 w-80 h-80 bg-amber-600/5 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Main Header */}
      <Header
        currentScene={currentScene}
        sceneIndex={dramaState.sceneIndex}
        totalScenes={SCREENPLAY_SCENES.length}
        hasMasterAudio={!!batchState.masterBlob}
        onDownloadMaster={() =>
          batchProducer.downloadMasterWav('heliocide_all_scenes_stitched_audio_drama.wav')
        }
        onOpenProduceAll={() => setShowProductionModal(true)}
        onOpenSceneNav={() => setShowSceneNav(true)}
        onOpenVoiceStudio={() => setShowVoiceStudio(true)}
        onOpenDossier={() => setShowDossier(true)}
        onOpenSettings={() => setShowAudioSettings(true)}
      />

      {/* Interactive Script Teleprompter */}
      <main className="flex-1 relative z-10 overflow-y-auto">
        <ScriptTeleprompter
          scene={currentScene}
          currentItemIndex={dramaState.itemIndex}
          isPlaying={dramaState.playState === 'playing'}
          isLoading={dramaState.playState === 'loading'}
          characterVoices={dramaState.characterVoices}
          onLineClick={(itemIdx) => dramaManager.jumpTo(dramaState.sceneIndex, itemIdx)}
          onNextScene={() => {
            if (dramaState.sceneIndex < SCREENPLAY_SCENES.length - 1) {
              dramaManager.jumpTo(dramaState.sceneIndex + 1, 0);
            }
          }}
          onPrevScene={() => {
            if (dramaState.sceneIndex > 0) {
              dramaManager.jumpTo(dramaState.sceneIndex - 1, 0);
            }
          }}
          hasPrevScene={dramaState.sceneIndex > 0}
          hasNextScene={dramaState.sceneIndex < SCREENPLAY_SCENES.length - 1}
        />
      </main>

      {/* Master Playback Controls */}
      <PlaybackControls
        playState={dramaState.playState}
        currentItem={dramaState.item}
        itemIndex={dramaState.itemIndex}
        totalItems={currentScene.items.length}
        narrationMode={dramaState.narrationMode}
        autoAdvance={dramaState.autoAdvance}
        preloadStatus={dramaState.preloadStatus}
        isMuted={isMuted}
        characterVoices={dramaState.characterVoices}
        hasMasterAudio={!!batchState.masterBlob}
        onDownloadMaster={() =>
          batchProducer.downloadMasterWav('heliocide_all_scenes_stitched_audio_drama.wav')
        }
        onPlay={() => dramaManager.play()}
        onPause={() => dramaManager.pause()}
        onStop={() => dramaManager.stop()}
        onNext={() => dramaManager.nextLine()}
        onPrev={() => dramaManager.prevLine()}
        onToggleAutoAdvance={() => dramaManager.setAutoAdvance(!dramaState.autoAdvance)}
        onToggleNarrationMode={() =>
          dramaManager.setNarrationMode(
            dramaState.narrationMode === 'full' ? 'dialogue_only' : 'full'
          )
        }
        onToggleMute={handleToggleMute}
        onPreloadScene={() => dramaManager.preloadScene(dramaState.sceneIndex)}
        onOpenProduceAll={() => setShowProductionModal(true)}
        onOpenVoiceStudio={() => setShowVoiceStudio(true)}
      />

      {/* Modals */}
      {showProductionModal && (
        <ProductionModal
          onClose={() => setShowProductionModal(false)}
          onStartPlayback={(sceneIdx) => {
            setShowProductionModal(false);
            dramaManager.jumpTo(sceneIdx !== undefined ? sceneIdx : 0, 0);
          }}
        />
      )}

      {showSceneNav && (
        <SceneNavigator
          currentSceneIndex={dramaState.sceneIndex}
          onSelectScene={(idx) => dramaManager.jumpTo(idx, 0)}
          onClose={() => setShowSceneNav(false)}
        />
      )}

      {showVoiceStudio && (
        <VoiceStudio
          characterVoices={dramaState.characterVoices}
          onVoiceChange={(charId, voiceName) =>
            dramaManager.setCharacterVoice(charId, voiceName)
          }
          onClose={() => setShowVoiceStudio(false)}
        />
      )}

      {showDossier && <CanonDossier onClose={() => setShowDossier(false)} />}

      {showAudioSettings && (
        <AudioSettingsModal
          playbackSpeed={dramaState.playbackSpeed}
          onSpeedChange={(speed) => dramaManager.setPlaybackSpeed(speed)}
          onClose={() => setShowAudioSettings(false)}
        />
      )}
    </div>
  );
}
