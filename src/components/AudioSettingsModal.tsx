import React, { useState } from 'react';
import { soundEngine } from '../data/soundEngine';
import { X, Sliders, Volume2, Sparkles, Activity, Play } from 'lucide-react';

interface AudioSettingsModalProps {
  onClose: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const AMBIENT_OPTIONS = [
  { id: 'shelter_coil', label: 'Refugee Shelter Coil (Thermal Drone + Click)' },
  { id: 'station_hum', label: 'Station HV-88 Main Deck (Air + 60Hz Hum)' },
  { id: 'tactical_ops', label: 'DRAXIS Intelligence Floor (Tactical Pulse)' },
  { id: 'gate_void', label: 'Aureal Gate (Deep Space Void Pad)' },
  { id: 'extraction_pulse', label: 'Stellar Extraction (Gravitational Tension)' },
  { id: 'cascade_darkness', label: 'The Cascade (Descending Dark Matter Drone)' },
  { id: 'terrace_night', label: 'Observation Terrace (Cosmic Silence)' },
];

const SFX_LIST = [
  { id: 'coil_click', name: 'Heating Coil Click' },
  { id: 'lance_strike', name: 'Starsilk Lance Strike' },
  { id: 'word_stream_shock', name: 'Word Streaming "NO" Shockwave' },
  { id: 'extraction_implosion', name: 'Stellar Core Implosion' },
  { id: 'alert_alarm', name: 'DRAXIS Routing Alarm' },
  { id: 'hull_breach', name: 'Station Hull Breach Groan' },
  { id: 'transfer_ping', name: 'Archive Complete Ping' },
];

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  onClose,
  playbackSpeed,
  onSpeedChange,
}) => {
  const [ambientVol, setAmbientVol] = useState(0.25);
  const [voiceVol, setVoiceVol] = useState(1.0);
  const [sfxVol, setSfxVol] = useState(0.7);

  const handleAmbientChange = (val: number) => {
    setAmbientVol(val);
    soundEngine.setVolumes(val, voiceVol, sfxVol);
  };

  const handleVoiceChange = (val: number) => {
    setVoiceVol(val);
    soundEngine.setVolumes(ambientVol, val, sfxVol);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    soundEngine.setVolumes(ambientVol, voiceVol, val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>Audio Drama Soundstage & Atmosphere</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control procedural soundscapes, acoustic filters, voice presence, and sound effects.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders & Controls */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Master Volume Sliders */}
          <div className="space-y-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Audio Staging Levels
            </h3>

            {/* Voice Volume */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5 text-slate-300">
                <span>Cast Voice Volume</span>
                <span className="text-cyan-400">{Math.round(voiceVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceVol}
                onChange={(e) => handleVoiceChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Ambient Volume */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5 text-slate-300">
                <span>Procedural Background Ambience</span>
                <span className="text-emerald-400">{Math.round(ambientVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVol}
                onChange={(e) => handleAmbientChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5 text-slate-300">
                <span>Sound FX Volume</span>
                <span className="text-amber-400">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Speed Selector */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
              Performance Pacing
            </div>
            <div className="flex gap-2">
              {[0.85, 1.0, 1.15].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onSpeedChange(speed)}
                  className={`flex-1 py-2 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed === 1.0 ? '1.0x (Standard)' : `${speed}x`}
                </button>
              ))}
            </div>
          </div>

          {/* Sound FX Audition Board */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Procedural Sound FX Audition Board</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SFX_LIST.map((sfx) => (
                <button
                  key={sfx.id}
                  onClick={() => soundEngine.playSoundFx(sfx.id)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-mono rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer text-left"
                >
                  <span>{sfx.name}</span>
                  <Play className="w-3 h-3 text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Ambience Track Audition */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              Audition Procedural Ambience
            </div>
            <div className="space-y-1.5">
              {AMBIENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => soundEngine.setAmbient(opt.id)}
                  className="w-full text-left px-3 py-2 text-xs font-mono rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{opt.label}</span>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
