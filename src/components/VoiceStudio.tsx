import React, { useState } from 'react';
import { CHARACTERS, CharacterConfig } from '../data/characters';
import { soundEngine } from '../data/soundEngine';
import { X, Play, Loader2, Sparkles, Radio, Mic, Volume2 } from 'lucide-react';

interface VoiceStudioProps {
  characterVoices: Record<string, 'Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr'>;
  onVoiceChange: (characterId: string, voiceName: 'Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr') => void;
  onClose: () => void;
}

const PREBUILT_VOICES: ('Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr')[] = [
  'Fenrir',
  'Charon',
  'Kore',
  'Puck',
  'Zephyr',
];

const SAMPLE_LINES: Record<string, string> = {
  NARRATOR: 'One word keeps a god alive. Other people pay for what he chooses to do with that life.',
  TIGER: 'The boundary will hold. It will also kill people who had nothing to do with the Drakken weapon. Both statements are true.',
  CODEC: "Count the people who survived, and don't stop counting when you reach the people who didn't.",
  MARCEL: "When I moved you out of that beam, I wasn't agreeing to this.",
  OBSERVER: "Because what we're looking at has already happened.",
  CONTROLLER: "Pilot, choose the shallowest departure you can still hold.",
  ENGINEER: "One of those three statements is probably even true.",
  YOUNG_REFUGEE: "Tiger saved us from the Drakken. Isn't that the same thing?",
  TEACHER: "We have one question before the next lesson: How old is the sunlight we're seeing right now?",
  ANALYST: "The emergency relays can't carry both surrender codes and evacuation routes.",
  STATION_SYSTEM: "Primary stellar output nominal. Civilian approaches within scheduled limits.",
  PILOT: "HV-88. Trajectory accepted. That second correction is beyond our fuel.",
  GATE_CONTROL: "Inbound. Not kinetic. Not ordinary macro discharge. No model available.",
  DEFENSE_OFFICER: "Can we intercept before the Aureal Gate collapses?",
  COMMAND_OFFICER: "They haven't been eliminated. Say: The Drakken advance has been halted.",
  PUBLICATION_OFFICER: "We can say 'unquantified sacrifices in affected sectors.'",
  BROADCAST: "By direct intervention of the Shard-God, surviving Administration space has been secured.",
};

export const VoiceStudio: React.FC<VoiceStudioProps> = ({
  characterVoices,
  onVoiceChange,
  onClose,
}) => {
  const [auditioningId, setAuditioningId] = useState<string | null>(null);

  const auditionVoice = async (charId: string) => {
    const char = CHARACTERS[charId];
    if (!char) return;
    const voiceName = characterVoices[charId] || char.defaultVoice;
    const sampleText = SAMPLE_LINES[charId] || 'Checking vocal link and transmission clarity.';

    setAuditioningId(charId);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voiceName,
          character: char.name,
          characterId: char.id,
          style: char.stylePrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          await soundEngine.playVoiceBuffer(
            bytes.buffer,
            char.isGod ? 'shard_god' : char.isRadio ? 'radio' : 'none',
            () => {
              setAuditioningId(null);
            }
          );
          return;
        }
      }
    } catch (err) {
      console.error('Audition error:', err);
    } finally {
      setAuditioningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
              <Mic className="w-5 h-5 text-amber-400" />
              <span>Voice Cast & Casting Studio</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure character vocal models powered by Gemini TTS prebuilt voices with custom acoustic filters.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Character List Grid */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(CHARACTERS).map((char) => {
              const currentVoice = characterVoices[char.id] || char.defaultVoice;
              const isAuditioning = auditioningId === char.id;

              return (
                <div
                  key={char.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700/80 transition-all flex flex-col justify-between gap-3"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: char.themeColor,
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: char.accentBg,
                            color: char.themeColor,
                          }}
                        >
                          {char.isGod ? (
                            <Sparkles className="w-4 h-4" />
                          ) : char.isRadio ? (
                            <Radio className="w-4 h-4" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div
                            className="text-sm font-bold font-mono tracking-wide uppercase"
                            style={{ color: char.themeColor }}
                          >
                            {char.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {char.title}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {char.faction}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300/90 leading-relaxed font-sans mb-2">
                      {char.description}
                    </p>

                    <div className="text-[10px] text-slate-500 font-mono italic">
                      Direction: "{char.stylePrompt}"
                    </div>
                  </div>

                  {/* Voice Selector & Audition Button */}
                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Voice:</span>
                      <select
                        value={currentVoice}
                        onChange={(e) =>
                          onVoiceChange(
                            char.id,
                            e.target.value as 'Fenrir' | 'Charon' | 'Kore' | 'Puck' | 'Zephyr'
                          )
                        }
                        className="text-xs font-mono bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        {PREBUILT_VOICES.map((v) => (
                          <option key={v} value={v}>
                            {v} {v === char.defaultVoice ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => auditionVoice(char.id)}
                      disabled={isAuditioning}
                      className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer"
                      title="Listen to sample dialogue line"
                    >
                      {isAuditioning ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          <span>Auditioning...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Audition</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
