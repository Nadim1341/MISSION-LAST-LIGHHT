import React from 'react';
import { ShieldCheck, AlertOctagon, HelpCircle, ArrowRight } from 'lucide-react';
import type { MissionReadinessReport } from '../../types/readiness.ts';

interface ReadinessProps {
  report: MissionReadinessReport;
  onOpenStressTest: () => void;
}

export const MissionReadinessCard: React.FC<ReadinessProps> = ({ report, onOpenStressTest }) => {
  const score = report.overallScorePct;
  const b = report.breakdown;

  const scoreColor =
    score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-cyan-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';

  const ringColor =
    score >= 80 ? '#10b981' : score >= 65 ? '#06b6d4' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
      {/* Top Header & Gauge */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
            Pre-Flight Assessment
          </span>
          <h2 className="text-base font-heading font-semibold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Mission Readiness
          </h2>
        </div>

        {/* Circular Gauge */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.2"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeDasharray={`${score}, 100`}
              strokeWidth="3.2"
              strokeLinecap="round"
              stroke={ringColor}
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className={`absolute text-sm font-heading font-bold ${scoreColor}`}>
            {score}%
          </span>
        </div>
      </div>

      {/* 8-Factor Progress Grid */}
      <div className="grid grid-cols-4 gap-2 text-[10px] font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <div>
          <span className="text-slate-400 block">Science</span>
          <span className="font-semibold text-white">{b.science}%</span>
        </div>
        <div>
          <span className="text-slate-400 block">Propulsion</span>
          <span className="font-semibold text-white">{b.propulsion}%</span>
        </div>
        <div>
          <span className="text-slate-400 block">Power</span>
          <span className="font-semibold text-white">{b.power}%</span>
        </div>
        <div>
          <span className="text-slate-400 block">Comms</span>
          <span className="font-semibold text-white">{b.communications}%</span>
        </div>
        <div>
          <span className="text-slate-400 block">Thermal</span>
          <span className="font-semibold text-white">{b.thermal}%</span>
        </div>
        <div>
          <span className="text-slate-400 block">Reliability</span>
          <span className="font-semibold text-white">{b.reliability}%</span>
        </div>
        <div>
          <span className="text-slate-400 block">Budget</span>
          <span className="font-semibold text-white">{b.budget}%</span>
        </div>
        <div>
          <span className="text-slate-400 block">Margin</span>
          <span className="font-semibold text-white">{b.resourceMargin}%</span>
        </div>
      </div>

      {/* Primary Weakness Diagnostic Banner */}
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-200">
        <div className="flex items-center gap-1.5 font-semibold text-amber-400 text-[11px] mb-1 uppercase tracking-wide">
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>PRIMARY WEAKNESS: {report.primaryWeakness.title}</span>
        </div>
        <p className="text-[11px] text-amber-100/90 leading-relaxed mb-1.5">
          "{report.primaryWeakness.explanation}"
        </p>
        <div className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
          <span className="text-slate-400">Action:</span>
          <span>{report.primaryWeakness.suggestedAction}</span>
        </div>
      </div>

      {/* Stress Test Launch Action Button */}
      <button
        type="button"
        onClick={onOpenStressTest}
        className="w-full py-2 px-3 rounded-lg font-mono text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all"
      >
        <span>RUN MISSION STRESS TEST</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
