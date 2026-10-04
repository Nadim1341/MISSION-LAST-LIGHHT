import React from 'react';
import { Sparkles, Microscope, Radio, Check, X, ArrowRight, Eye } from 'lucide-react';

export interface MissionDiscovery {
  id: string;
  title: string;
  description: string;
  scienceValue: number;
  dataGeneratedMb: number;
  anomalyType: 'mineralogy' | 'volatiles' | 'structural' | 'gravitational';
}

interface DiscoveryModalProps {
  discovery: MissionDiscovery | null;
  onInvestigate: (discovery: MissionDiscovery) => void;
  onTransmit: (discovery: MissionDiscovery) => void;
  onIgnore: () => void;
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({
  discovery,
  onInvestigate,
  onTransmit,
  onIgnore
}) => {
  if (!discovery) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="mission-panel-elevated max-w-lg w-full p-6 text-txt-primary border border-sky-400 shadow-2xl relative">
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[#293342]">
          <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-400 flex items-center justify-center text-sky-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 block font-bold">
              Scientific Discovery Moment
            </span>
            <h3 className="text-base font-heading font-bold text-white">
              {discovery.title}
            </h3>
          </div>
        </div>

        <p className="text-xs text-[#AAB4C3] leading-relaxed mb-4">
          {discovery.description}
        </p>

        {/* Discovery Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5 font-mono text-xs">
          <div className="bg-[#151B26] p-3 rounded-lg border border-[#293342]">
            <span className="text-[10px] text-[#6F7B8C] block uppercase">
              Scientific Value Gained
            </span>
            <span className="text-emerald-400 font-bold text-base">
              +{discovery.scienceValue} pts
            </span>
          </div>

          <div className="bg-[#151B26] p-3 rounded-lg border border-[#293342]">
            <span className="text-[10px] text-[#6F7B8C] block uppercase">
              Data Generated to SSR
            </span>
            <span className="text-sky-300 font-bold text-base">
              +{discovery.dataGeneratedMb} MB
            </span>
          </div>
        </div>

        {/* Player Directives */}
        <span className="text-[10px] font-mono text-[#6F7B8C] uppercase tracking-wider block mb-2">
          Select Scientific Directive:
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onInvestigate(discovery)}
            className="p-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer text-center"
          >
            <Microscope className="w-4 h-4" />
            <span>INVESTIGATE</span>
            <span className="text-[9px] text-sky-200">+5 Bonus Pts</span>
          </button>

          <button
            type="button"
            onClick={() => onTransmit(discovery)}
            className="p-2.5 rounded-lg bg-[#151B26] hover:bg-space-750 text-[#F3F6FA] border border-sky-500/30 font-mono text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer text-center"
          >
            <Radio className="w-4 h-4 text-sky-400" />
            <span>TRANSMIT</span>
            <span className="text-[9px] text-sky-300">Priority DSN</span>
          </button>

          <button
            type="button"
            onClick={onIgnore}
            className="p-2.5 rounded-lg bg-[#0D111A] hover:bg-[#151B26] text-[#AAB4C3] border border-[#293342] font-mono text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer text-center"
          >
            <Check className="w-4 h-4 text-[#6F7B8C]" />
            <span>LOG & RESUME</span>
            <span className="text-[9px] text-[#6F7B8C]">Archive data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
