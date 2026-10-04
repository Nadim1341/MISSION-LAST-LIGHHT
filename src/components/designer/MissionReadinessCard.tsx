import React from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, Wrench, ChevronRight } from 'lucide-react';
import type { MissionReadinessReport } from '../../types/readiness.ts';
import type { SubsystemCategory } from '../../types/subsystems.ts';

interface ReadinessProps {
  report: MissionReadinessReport;
  onOpenStressTest: () => void;
  onSelectCategory?: (category: SubsystemCategory) => void;
}

export const MissionReadinessCard: React.FC<ReadinessProps> = ({
  report,
  onOpenStressTest,
  onSelectCategory
}) => {
  const score = report.overallScorePct;
  const b = report.breakdown;

  const scoreColor =
    score >= 80 ? 'text-emerald-400' : score >= 65 ? 'text-sky-300' : score >= 50 ? 'text-amber-400' : 'text-red-400';

  const barColor =
    score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-sky-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';

  // Map primary weakness to a subsystem category for direct fix action
  const weaknessToCategory = (title: string): SubsystemCategory => {
    const t = title.toLowerCase();
    if (t.includes('comm') || t.includes('downlink') || t.includes('antenna')) return 'communications';
    if (t.includes('power') || t.includes('battery') || t.includes('solar')) return 'power';
    if (t.includes('delta') || t.includes('propel') || t.includes('fuel')) return 'propulsion';
    if (t.includes('science') || t.includes('sensor')) return 'science';
    if (t.includes('therm') || t.includes('heat') || t.includes('cold')) return 'thermal';
    if (t.includes('comput') || t.includes('rad')) return 'computing';
    if (t.includes('nav') || t.includes('star')) return 'navigation';
    return 'structure';
  };

  const targetCategory = weaknessToCategory(report.primaryWeakness.title);

  return (
    <div className="mission-panel p-4 flex flex-col gap-3.5 border border-[#293342]">
      {/* Top Header & Gauge */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#6F7B8C]">
            Mission Readiness Assessment
          </span>
          <span className={`text-xl font-heading font-bold ${scoreColor}`}>
            {score}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-space-900 rounded-full overflow-hidden border border-[#293342]">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Subsystem Health Breakdown Strip */}
      <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono bg-space-900 p-2 rounded-lg border border-[#232D3E]">
        <div>
          <span className="text-[#6F7B8C] block truncate">Science</span>
          <span className="font-semibold text-white">{b.science}%</span>
        </div>
        <div>
          <span className="text-[#6F7B8C] block truncate">Propulsion</span>
          <span className="font-semibold text-white">{b.propulsion}%</span>
        </div>
        <div>
          <span className="text-[#6F7B8C] block truncate">Power</span>
          <span className="font-semibold text-white">{b.power}%</span>
        </div>
        <div>
          <span className="text-[#6F7B8C] block truncate">Comms</span>
          <span className="font-semibold text-white">{b.communications}%</span>
        </div>
      </div>

      {/* Actionable Primary Risk Card */}
      <div className="bg-[#1B2330] border border-amber-500/30 rounded-lg p-3 text-xs">
        <div className="flex items-center gap-1.5 font-heading font-semibold text-amber-400 mb-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>PRIMARY RISK: {report.primaryWeakness.title}</span>
        </div>

        <p className="text-[11px] text-[#AAB4C3] leading-relaxed mb-2.5">
          {report.primaryWeakness.explanation}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#293342] text-[11px] font-mono">
          <span className="text-[#6F7B8C]">Suggested Action:</span>
          {onSelectCategory ? (
            <button
              type="button"
              onClick={() => onSelectCategory(targetCategory)}
              className="text-sky-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>FIX {targetCategory.toUpperCase()}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-sky-300">{report.primaryWeakness.suggestedAction}</span>
          )}
        </div>
      </div>

      {/* Stress Test Launch Action */}
      <button
        type="button"
        onClick={onOpenStressTest}
        className="w-full py-2.5 px-3 rounded-lg font-mono text-xs font-bold bg-[#151B26] hover:bg-space-750 text-sky-200 border border-sky-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
      >
        <ShieldCheck className="w-4 h-4 text-sky-400" />
        <span>RUN MISSION STRESS TEST</span>
      </button>
    </div>
  );
};
