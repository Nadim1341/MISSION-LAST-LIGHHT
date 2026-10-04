import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Rocket,
  Wrench,
  X,
  Play,
  Zap,
  Flame,
  Radio,
  Thermometer,
  Cpu,
  Compass,
  ChevronRight,
  Shield,
  Activity
} from 'lucide-react';
import type { StressTestResult } from '../../types/readiness.ts';
import type { SubsystemCategory } from '../../types/subsystems.ts';
import { playWarningAlert, playSuccessChime, playTelemetryClick } from '../../utils/audio.ts';

interface StressTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: StressTestResult[];
  onRerun: () => void;
  onRedesign: () => void;
  onLaunchAnyway: () => void;
  isLaunchAllowed: boolean;
  onSelectCategory?: (category: SubsystemCategory) => void;
}

export const StressTestModal: React.FC<StressTestModalProps> = ({
  isOpen,
  onClose,
  results,
  onRerun,
  onRedesign,
  onLaunchAnyway,
  isLaunchAllowed,
  onSelectCategory
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [isSimulatingBatch, setIsSimulatingBatch] = useState<boolean>(false);
  const [simulatedIndices, setSimulatedIndices] = useState<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);
  const [activeTestingIndex, setActiveTestingIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentResult = results[selectedScenarioIndex] || results[0];

  // Map scenario to fix category
  const getFixCategory = (scenarioId: string): SubsystemCategory => {
    switch (scenarioId) {
      case 'stress_solar_storm':
        return 'computing';
      case 'stress_comm_outage':
        return 'communications';
      case 'stress_propulsion_loss':
        return 'propulsion';
      case 'stress_power_eclipse':
        return 'power';
      case 'stress_thermal_shock':
        return 'thermal';
      case 'stress_debris_impact':
        return 'structure';
      case 'stress_navigation_loss':
        return 'navigation';
      case 'stress_mass_limit':
        return 'structure';
      default:
        return 'power';
    }
  };

  // Run full automated 8-hazard test suite
  const handleRunAllHazards = () => {
    setIsSimulatingBatch(true);
    setSimulatedIndices([]);
    let currentIndex = 0;
    playTelemetryClick();

    const interval = setInterval(() => {
      if (currentIndex >= results.length) {
        clearInterval(interval);
        setIsSimulatingBatch(false);
        setActiveTestingIndex(null);
        onRerun();
        playSuccessChime();
        return;
      }

      setActiveTestingIndex(currentIndex);
      setSelectedScenarioIndex(currentIndex);
      setSimulatedIndices((prev) => [...prev, currentIndex]);

      const res = results[currentIndex];
      if (res?.status === 'PASS') {
        playSuccessChime();
      } else {
        playWarningAlert();
      }

      currentIndex += 1;
    }, 450);
  };

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const warningCount = results.filter((r) => r.status === 'WARNING').length;
  const criticalCount = results.filter((r) => r.status === 'CRITICAL_RISK').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="mission-panel-elevated max-w-5xl w-full p-6 text-txt-primary flex flex-col max-h-[92vh] border border-[#293342]">
        {/* Top Header Strip */}
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-[#293342]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-telemetry-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                Pre-Flight Hardware Stress Workbench
              </span>
            </div>
            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-sky-400" />
              Mission Stress Test: "Let's find out what breaks."
            </h2>
            <p className="text-xs text-[#AAB4C3] mt-0.5 font-mono">
              Simulating deep space environmental hazards against your live bus configuration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Scorecard Badges */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold">
                {passCount} / 8 PASSED
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 font-bold">
                {warningCount} WARNINGS
              </span>
              <span className="px-2.5 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-400 font-bold">
                {criticalCount} CRITICAL
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-[#6F7B8C] hover:text-white p-1 rounded-lg hover:bg-space-750 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Column Stress Workbench */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden mb-4">
          {/* Left Column: 8 Hazards List (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-1.5 overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6F7B8C]">
                8 FLIGHT HAZARD SCENARIOS:
              </span>
              <button
                type="button"
                onClick={handleRunAllHazards}
                disabled={isSimulatingBatch}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Play className="w-3 h-3" />
                <span>{isSimulatingBatch ? 'TESTING ALL...' : 'RUN ALL 8'}</span>
              </button>
            </div>

            {results.map((res, idx) => {
              const isSelected = selectedScenarioIndex === idx;
              const isTestingNow = activeTestingIndex === idx;
              const isPass = res.status === 'PASS';
              const isWarn = res.status === 'WARNING';
              const isCrit = res.status === 'CRITICAL_RISK';

              return (
                <button
                  key={res.scenarioId || idx}
                  type="button"
                  onClick={() => {
                    playTelemetryClick();
                    setSelectedScenarioIndex(idx);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1B2330] border-sky-400 ring-1 ring-sky-500/30'
                      : 'bg-[#151B26] border-[#293342] hover:border-[#37465B] hover:bg-[#18202E]'
                  } ${isTestingNow ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                    {isCrit && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    <div className="truncate">
                      <span className="text-xs font-heading font-medium text-white block truncate">
                        {idx + 1}. {res.title}
                      </span>
                      <span className="text-[10px] font-mono text-[#6F7B8C] block truncate">
                        Subsystem: {res.componentTested}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      isPass
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : isWarn
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                        : 'bg-red-950/60 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {res.status.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Live Simulated Test Result Workbench (7 cols) */}
          <div className="md:col-span-7 bg-[#0D111A] rounded-xl border border-[#293342] p-4 flex flex-col justify-between overflow-y-auto">
            {currentResult && (
              <div>
                {/* Scenario Header Strip */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#293342]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-sky-400 tracking-wider block font-bold">
                      Hazard Test Analysis
                    </span>
                    <h3 className="text-base font-heading font-bold text-white">
                      {currentResult.title}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${
                    currentResult.status === 'PASS'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                      : currentResult.status === 'WARNING'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                      : 'bg-red-950/60 text-red-400 border-red-500/40'
                  }`}>
                    STATUS: {currentResult.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Hardware Spec Comparison Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs font-mono">
                  <div className="bg-[#151B26] p-3 rounded-lg border border-[#232D3E]">
                    <span className="text-[10px] text-[#6F7B8C] block uppercase mb-1">
                      Your Spacecraft Hardware:
                    </span>
                    <span className="text-white font-bold text-sm block">
                      {currentResult.spacecraftValue}
                    </span>
                    <span className="text-[10px] text-[#6F7B8C] block mt-0.5">
                      Subsystem: {currentResult.componentTested}
                    </span>
                  </div>

                  <div className="bg-[#151B26] p-3 rounded-lg border border-[#232D3E]">
                    <span className="text-[10px] text-[#6F7B8C] block uppercase mb-1">
                      Environmental Hazard Threshold:
                    </span>
                    <span className="text-sky-300 font-bold text-sm block">
                      {currentResult.requiredValue}
                    </span>
                    <span className="text-[10px] text-[#6F7B8C] block mt-0.5">
                      Safety standard for 101955 Bennu
                    </span>
                  </div>
                </div>

                {/* Simulated Outcome Banner */}
                <div className="bg-[#151B26] p-3.5 rounded-lg border border-[#232D3E] mb-3">
                  <span className="text-[10px] font-mono uppercase text-[#6F7B8C] block mb-1">
                    Simulation Consequence:
                  </span>
                  <p className="text-xs text-white leading-relaxed">
                    {currentResult.projectedConsequence}
                  </p>
                </div>

                {/* Recommendation Banner with DIRECT FIX ACTION */}
                <div className="bg-[#1B2330] p-3.5 rounded-lg border border-sky-500/20 mb-3 flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase text-sky-300 block font-bold">
                    Engineering Recommendation:
                  </span>
                  <p className="text-xs text-[#AAB4C3] leading-relaxed">
                    {currentResult.recommendation}
                  </p>

                  {/* Direct Fix Subsystem Shortcut Button */}
                  {onSelectCategory && (currentResult.status !== 'PASS') && (
                    <div className="pt-2 border-t border-[#293342] flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const cat = getFixCategory(currentResult.scenarioId);
                          onSelectCategory(cat);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>FIX VULNERABILITY IN {getFixCategory(currentResult.scenarioId).toUpperCase()}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#293342]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRedesign}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-[#151B26] hover:bg-space-750 text-[#F3F6FA] border border-[#293342] hover:border-[#37465B] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>RETURN TO DESIGNER</span>
            </button>

            <button
              type="button"
              onClick={handleRunAllHazards}
              disabled={isSimulatingBatch}
              className="px-4 py-2 rounded-lg text-xs font-mono bg-[#151B26] hover:bg-space-750 text-[#F3F6FA] border border-[#293342] hover:border-[#37465B] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSimulatingBatch ? 'animate-spin' : ''}`} />
              <span>RUN ALL 8 HAZARDS</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onLaunchAnyway}
            disabled={!isLaunchAllowed}
            className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
              isLaunchAllowed
                ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/60 active:scale-95'
                : 'bg-[#151B26] text-[#6F7B8C] border border-[#293342] cursor-not-allowed'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>{isLaunchAllowed ? 'PROCEED TO LAUNCH PAD' : 'RESOLVE HARD CONSTRAINTS FIRST'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
