import React, { useEffect } from 'react';
import {
  Trophy,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  BarChart3,
  ListOrdered,
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import type { DebriefReport } from '../../types/scoring.ts';
import type { SpacecraftDesign } from '../../types/subsystems.ts';
import type { LaunchVehicle } from '../../types/launcher.ts';
import type { ScenarioDefinition } from '../../types/mission.ts';
import { playSuccessChime, playWarningAlert, playTelemetryClick } from '../../utils/audio.ts';

interface DebriefViewProps {
  report: DebriefReport;
  design: SpacecraftDesign;
  launcher: LaunchVehicle;
  scenario: ScenarioDefinition;
  onRestartDesign: () => void;
}

export const DebriefView: React.FC<DebriefViewProps> = ({
  report,
  design,
  launcher,
  scenario,
  onRestartDesign
}) => {
  const isSuccess = report.outcome === 'FULL_SUCCESS';
  const isPartial = report.outcome === 'PARTIAL_SUCCESS';

  useEffect(() => {
    if (report.compositeScore >= 500) {
      playSuccessChime();
    } else {
      playWarningAlert();
    }
  }, [report.compositeScore]);

  const rankTier =
    report.compositeScore >= 850
      ? 'TIER S — EXEMPLARY DEEP SPACE MISSION'
      : report.compositeScore >= 700
      ? 'TIER A — MISSION SUCCESS'
      : report.compositeScore >= 500
      ? 'TIER B — QUALIFIED RETURN'
      : report.compositeScore >= 350
      ? 'TIER C — MARGINAL RECOVERY'
      : 'TIER F — MISSION LOSS';

  const rankColor =
    report.compositeScore >= 700
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : report.compositeScore >= 500
      ? 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
      : 'text-red-400 border-red-500/40 bg-red-950/40';

  const handleRestart = () => {
    playTelemetryClick();
    onRestartDesign();
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col p-6 max-w-6xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-cyan-500/25">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              POST-FLIGHT MISSION DEBRIEF
            </span>
            <span className="text-xs font-mono text-slate-400">
              NASA Planetary Science Division Evaluation
            </span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-wide">
            MISSION: LAST LIGHT — {scenario.title}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Spacecraft: {design.name} | Launch Vehicle: {launcher.name} | Target: {scenario.target.name}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>[REDESIGN & FLY AGAIN]</span>
        </button>
      </div>

      {/* Outcome Scorecard Banner */}
      <div className={`hud-corner rounded-2xl p-6 border mb-6 flex items-center justify-between shadow-2xl ${rankColor}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <Trophy className="w-6 h-6 text-emerald-400" />
            ) : isPartial ? (
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-400" />
            )}
            <h2 className="text-xl font-heading font-bold text-white">
              {report.outcomeTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-200 max-w-2xl leading-relaxed font-sans">
            {report.outcomeSummary}
          </p>
          <span className="inline-block text-xs font-mono font-bold tracking-wider pt-1">
            {rankTier}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Composite Mission Score
          </span>
          <span className="text-4xl font-heading font-extrabold text-white text-glow-cyan">
            {report.compositeScore}
          </span>
          <span className="text-xs font-mono text-slate-400 block">/ 1000 MAX PTS</span>
        </div>
      </div>

      {/* 8-Axis Evaluation Grid */}
      <div className="glass-panel hud-corner rounded-2xl p-5 mb-6 shadow-2xl">
        <h3 className="text-xs font-heading font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          8-Axis Mission Performance Breakdown
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(report.axisScores).map(([axis, score]) => {
            const axisNames: Record<string, string> = {
              scientificReturn: 'Scientific Return',
              engineeringEfficiency: 'Engineering Efficiency',
              budgetDiscipline: 'Budget Discipline',
              systemReliability: 'System Reliability',
              riskManagement: 'Risk Management',
              telecomPerformance: 'Telecom Performance',
              resourceDiscipline: 'Resource Discipline',
              thermalPowerStability: 'Thermal & Power Stability'
            };

            const barColor =
              score >= 75
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : score >= 50
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                : 'bg-red-500';

            return (
              <div key={axis} className="bg-slate-900/85 p-3 rounded-xl border border-slate-800 shadow-md">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300 font-medium truncate">
                    {axisNames[axis] || axis}
                  </span>
                  <span className="text-white font-bold">{score}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Root-Cause Causal Analysis */}
      <div className="glass-panel hud-corner rounded-2xl p-5 mb-6 shadow-2xl">
        <h3 className="text-xs font-heading font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Causal Root-Cause Analysis: Why Your Decisions Mattered
        </h3>
        <p className="text-xs text-slate-400 mb-4 font-mono">
          Every component choice, pre-launch stress test decision, and flight triage directive created direct consequences during the mission.
        </p>

        <div className="space-y-3">
          {report.causalFactors.map((factor, i) => {
            const badgeColor =
              factor.severity === 'BRILLIANT_DESIGN'
                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                : factor.severity === 'POSITIVE_MITIGATION'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : factor.severity === 'SUBOPTIMAL'
                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                : 'bg-red-950/80 text-red-300 border-red-800';

            return (
              <div
                key={i}
                className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col gap-2 font-mono text-xs shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${badgeColor}`}>
                      {factor.severity.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400">[{factor.subsystem}]</span>
                  </div>
                  <span className="text-white font-semibold">{factor.playerDecision}</span>
                </div>

                <p className="text-slate-200 leading-relaxed font-sans text-xs">
                  <span className="font-semibold text-cyan-300 font-mono">Flight Consequence: </span>
                  {factor.causalConsequence}
                </p>

                <p className="text-[11px] text-slate-400 font-sans italic border-t border-slate-800/80 pt-1.5">
                  <span className="text-slate-500 font-mono not-italic font-semibold">Scientific Context: </span>
                  {factor.scientificContext}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cinematic Mission Replay Timeline */}
      <div className="glass-panel hud-corner rounded-2xl p-5 mb-6 shadow-2xl">
        <h3 className="text-xs font-heading font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-cyan-400" />
          Cinematic Mission Replay Timeline
        </h3>

        <div className="relative pl-6 space-y-4 border-l border-cyan-500/35">
          {report.cinematicTimeline.map((node, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center text-[8px] shadow-sm">
                {node.icon}
              </div>

              <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-xs shadow-md">
                <div className="flex items-center justify-between mb-1 font-mono">
                  <span className="text-cyan-300 font-bold">{node.title}</span>
                  <span className="text-[10px] text-slate-400">MET DAY {node.metDay}</span>
                </div>
                <p className="text-slate-200 mb-1 leading-relaxed font-sans">
                  {node.whatHappened}
                </p>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <span>Decision: <span className="text-white">{node.decisionMade}</span></span>
                  <span>•</span>
                  <span>Impact: <span className="text-cyan-200">{node.missionConsequence}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aerospace Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="bg-cyan-950/35 rounded-2xl p-5 border border-cyan-500/25 mb-6 shadow-xl">
          <h3 className="text-xs font-heading font-semibold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            NASA Flight Dynamics Engineering Recommendations
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-mono">
            {report.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
