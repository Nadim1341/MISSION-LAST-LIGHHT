import React from 'react';
import { ShieldAlert, Cpu } from 'lucide-react';
import type { InterfaceMode } from '../../types/mission.ts';

interface ModeToggleProps {
  mode: InterfaceMode;
  onToggle: (mode: InterfaceMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onToggle }) => {
  return (
    <div className="flex items-center gap-1 bg-slate-950/80 border border-cyan-500/30 rounded-lg p-1">
      <button
        type="button"
        onClick={() => onToggle('commander')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
          mode === 'commander'
            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Commander Mode: Intuitive percentage bars and simplified telemetry for beginners"
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>COMMANDER</span>
      </button>

      <button
        type="button"
        onClick={() => onToggle('engineer')}
        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
          mode === 'engineer'
            ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Engineer Mode: Exposes full mathematical equations, delta-V, C3, and link budgets"
      >
        <Cpu className="w-3.5 h-3.5" />
        <span>ENGINEER</span>
      </button>
    </div>
  );
};
