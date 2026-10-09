import React from 'react';
import { X, BookOpen, Shield, AlertTriangle, FileText, Sparkles } from 'lucide-react';

interface CanonDossierProps {
  onClose: () => void;
}

export const CanonDossier: React.FC<CanonDossierProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span>HELIOCIDE: Production & Canon Integrity Dossier</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Source anchors, DRAXIS tactical documentation, and dramatic adaptation rules for Year 170.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm leading-relaxed font-sans">
          {/* Premise Anchor */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200">
            <div className="font-mono font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5 text-purple-300">
              <Sparkles className="w-4 h-4" />
              Core Dramatic Premise
            </div>
            <p className="italic font-serif">
              "One word keeps a god alive. Other people pay for what he chooses to do with that life."
            </p>
          </div>

          {/* Section 1: Established Source Anchors */}
          <section className="space-y-3">
            <h3 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              1. Established Source Anchors Retained
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="font-bold text-slate-200 font-mono mb-1">Timeline & War Duration</div>
                <p className="text-slate-400">
                  The Blood Eclipse War lasted <strong>170 war-years</strong>. The decisive Aureal Gate events and Hal'Ven heliocide belong strictly to Year 170.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="font-bold text-slate-200 font-mono mb-1">Starsilk & The Lance</div>
                <p className="text-slate-400">
                  Drakken star braiding uncovered <strong>Starsilk</strong>, directing lances that dissolve transit geometry and can destroy the god-substrate itself.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="font-bold text-slate-200 font-mono mb-1">Marcel's Word Streaming</div>
                <p className="text-slate-400">
                  Marcel used forbidden word streaming (<strong>"NO"</strong>) to deflect the lance from Tiger. Tiger was grazed and acknowledged his own mortality.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="font-bold text-slate-200 font-mono mb-1">Tiger: Motive & Anatomy</div>
                <p className="text-slate-400">
                  Tiger is black obsidian with fine azure fissures, pupil-less eyes, digitigrade posture. His containment is driven by self-preservation and strategic control, not moral indignation.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="font-bold text-slate-200 font-mono mb-1">The Heliocide (~500,000 Stars)</div>
                <p className="text-slate-400">
                  Extraction of Starsilk causes instant stellar core collapse into black holes. The resulting Siege Wall is an invisible gravitational lattice—an expanding irregular dark absence.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="font-bold text-slate-200 font-mono mb-1">Mother & Drakken State</div>
                <p className="text-slate-400">
                  Mother is a fixed living homeworld and command ecology, not a humanoid monarch. Drakken structures and Blood Rings remain intact inside the sealed perimeter.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Codec's Character Arc */}
          <section className="space-y-3">
            <h3 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              2. Codec's Tactical Burden & Complicity
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Codec is not an innocent bystander or a pure moral hero. In his DRAXIS career, he mapped Blood Rings (conquered biospheres processed into orbital rings) and authorized the Nacreous VI Corpse-Burn Firewall that saved agriculture elsewhere by turning an inhabited world into a remnant.
            </p>
            <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs font-mono">
              "It's the reason I kept doing it. I became necessary. That is not the same thing as being innocent."
            </div>
          </section>

          {/* Section 3: Station HV-88 */}
          <section className="space-y-3">
            <h3 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-sky-400" />
              3. Station HV-88 & The Classroom Archive
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Station HV-88 in the Hal'Ven cluster receives news of its sun's collapse before the old light stops arriving. When hull integrity fails, the crew prioritizes the civilian data packet—preserving the children's question about how old sunlight is. Codec later uses a command override to keep this recording in the permanent historical record.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
