import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Rocket, Wrench, HelpCircle } from 'lucide-react';
import type { SpacecraftDesign, SubsystemTotals } from '../../types/subsystems.ts';
import type { ConstraintValidationResult } from '../../engine/validator.ts';

interface DesignGuideProps {
  design: SpacecraftDesign;
  totals: SubsystemTotals;
  validation: ConstraintValidationResult;
  readinessScore: number;
  hasRunStressTest: boolean;
  onOpenStressTest: () => void;
  onLaunch: () => void;
  onOpenHowToPlay: () => void;
}

export const DesignGuideHeader: React.FC<DesignGuideProps> = ({
  design,
  totals,
  validation,
  readinessScore,
  hasRunStressTest,
  onOpenStressTest,
  onLaunch,
  onOpenHowToPlay
}) => {
  // Count configured subsystems (out of 8)
  const configuredCategories = Object.values(design.components).filter((c) => c && c.length > 0).length;
  const isComponentsReady = configuredCategories >= 6;
  const isConstraintsValid = validation.isLaunchAllowed;
  const isReadyToLaunch = isConstraintsValid;

  return (
    <div className="mission-panel p-3 border border-[#293342] bg-[#0D111A] flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
      {/* 4-Step Interactive Mission Workflow */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1">
          <span>MISSION STEPS:</span>
        </span>

        {/* Step 1: Subsystems */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
          isComponentsReady
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-space-850 border-amber-500/40 text-amber-300'
        }`}>
          {isComponentsReady ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">1</span>
          )}
          <span>1. Equip 8 Subsystems ({configuredCategories}/8)</span>
        </div>

        <ArrowRight className="w-3 h-3 text-[#6F7B8C] hidden sm:inline" />

        {/* Step 2: Constraints */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
          isConstraintsValid
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/40 border-red-500/40 text-red-300'
        }`}>
          {isConstraintsValid ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          )}
          <span>2. Mass & Budget Limits ({isConstraintsValid ? 'PASS' : 'BLOCKED'})</span>
        </div>

        <ArrowRight className="w-3 h-3 text-[#6F7B8C] hidden sm:inline" />

        {/* Step 3: Stress Test */}
        <button
          type="button"
          onClick={onOpenStressTest}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
            hasRunStressTest
              ? 'bg-sky-950/40 border-sky-400 text-sky-200'
              : 'bg-space-850 border-sky-500/40 text-sky-300 hover:bg-space-750 animate-pulse'
          }`}
          title="Run pre-flight simulations against space hazards"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>3. Stress Test ({hasRunStressTest ? 'Tested' : 'Click to Test'})</span>
        </button>

        <ArrowRight className="w-3 h-3 text-[#6F7B8C] hidden sm:inline" />

        {/* Step 4: Launch */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
          isReadyToLaunch
            ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 font-bold'
            : 'bg-space-850 border-[#293342] text-[#6F7B8C]'
        }`}>
          <Rocket className="w-3.5 h-3.5" />
          <span>4. Launch & Fly</span>
        </div>
      </div>

      {/* Quick Help & Direct Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenHowToPlay}
          className="text-[11px] text-sky-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-space-750 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span>Guide</span>
        </button>

        <button
          type="button"
          onClick={onLaunch}
          disabled={!isReadyToLaunch}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
            isReadyToLaunch
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/50 active:scale-95'
              : 'bg-[#151B26] text-[#6F7B8C] border border-[#293342] cursor-not-allowed'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>LAUNCH MISSION</span>
        </button>
      </div>
    </div>
  );
};
