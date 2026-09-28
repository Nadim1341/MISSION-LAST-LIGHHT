import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Rocket,
  Wrench,
  X
} from 'lucide-react';
import type { StressTestResult } from '../../types/readiness.ts';

interface StressTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: StressTestResult[];
  onRerun: () => void;
  onRedesign: () => void;
  onLaunchAnyway: () => void;
  isLaunchAllowed: boolean;
}

export const StressTestModal: React.FC<StressTestModalProps> = ({
  isOpen,
  onClose,
  results,
  onRerun,
  onRedesign,
  onLaunchAnyway,
  isLaunchAllowed
}) => {
  const [isRunningSim, setIsRunningSim] = useState(false);

  if (!isOpen) return null;

  const handleRerun = () => {
    setIsRunningSim(true);
    setTimeout(() => {
      onRerun();
      setIsRunningSim(false);
    }, 600);
  };

  const passCount = results.filter((r) => r.status === 'PASS').length;
  const warningCount = results.filter((r) => r.status === 'WARNING').length;
  const criticalCount = results.filter((r) => r.status === 'CRITICAL_RISK').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel glass-panel-glow max-w-4xl w-full rounded-2xl p-6 text-slate-100 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                Pre-Flight Hardware Stress Evaluation
              </span>
            </div>
            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
              Mission Stress Test
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Simulating 8 real-world spaceflight hazards against your actual spacecraft configuration.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Scorecard */}
        <div className="grid grid-cols-3 gap-3 mb-4 font-mono text-center">
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2.5">
            <span className="text-xs text-emerald-400 block font-semibold">PASSED</span>
            <span className="text-xl font-bold text-emerald-300">{passCount} / 8</span>
          </div>
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5">
            <span className="text-xs text-amber-400 block font-semibold">WARNINGS</span>
            <span className="text-xl font-bold text-amber-300">{warningCount} / 8</span>
          </div>
          <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-2.5">
            <span className="text-xs text-red-400 block font-semibold">CRITICAL RISKS</span>
            <span className="text-xl font-bold text-red-300">{criticalCount} / 8</span>
          </div>
        </div>

        {/* 8 Stress Test Scenario Cards */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
          {results.map((res, i) => {
            const isPass = res.status === 'PASS';
            const isWarn = res.status === 'WARNING';
            const isCrit = res.status === 'CRITICAL_RISK';

            const borderCol = isPass
              ? 'border-emerald-500/30 bg-emerald-950/15'
              : isWarn
                ? 'border-amber-500/30 bg-amber-950/15'
                : 'border-red-500/40 bg-red-950/25';

            return (
              <div key={res.scenarioId || i} className={`border rounded-xl p-3.5 ${borderCol} transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                    {isCrit && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    <h4 className="text-sm font-semibold text-white">
                      {i + 1}. {res.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${isPass
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : isWarn
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                  >
                    {res.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-2 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[10px]">YOUR SPACECRAFT:</span>
                    <span className="text-white font-medium">{res.spacecraftValue}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">HAZARD THRESHOLD:</span>
                    <span className="text-cyan-300 font-medium">{res.requiredValue}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 mb-1 leading-relaxed">
                  <span className="font-semibold text-slate-400">Simulation Outcome: </span>
                  {res.projectedConsequence}
                </p>

                <p className="text-[11px] text-cyan-300/90 font-mono">
                  <span className="text-slate-400">Engineering Recommendation: </span>
                  {res.recommendation}
                </p>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-cyan-500/20 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRedesign}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-600"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>[REDESIGN SPACECRAFT]</span>
            </button>

            <button
              type="button"
              onClick={handleRerun}
              disabled={isRunningSim}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isRunningSim ? 'animate-spin' : ''}`} />
              <span>[RUN STRESS TEST AGAIN]</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onLaunchAnyway}
            disabled={!isLaunchAllowed}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold transition-all shadow-lg ${isLaunchAllowed
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-950/60'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
          >
            <Rocket className="w-4 h-4" />
            <span>{isLaunchAllowed ? '[LAUNCH ANYWAY]' : '[FIX HARD VIOLATIONS FIRST]'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
