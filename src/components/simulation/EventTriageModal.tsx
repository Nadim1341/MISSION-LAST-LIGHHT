import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  Zap,
  Radio,
  Cpu,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import type { ForeshadowedEvent, PlayerActionChoice, PlayerActionType, EventConsequenceResolution } from '../../types/events.ts';
import type { SpacecraftDesign } from '../../types/subsystems.ts';
import type { MissionTelemetry } from '../../types/mission.ts';

interface EventTriageModalProps {
  event: ForeshadowedEvent | null;
  design: SpacecraftDesign;
  telemetry: MissionTelemetry;
  onSelectAction: (action: PlayerActionType) => void;
  activeResolution: EventConsequenceResolution | null;
  onDismissResolution: () => void;
}

export const EventTriageModal: React.FC<EventTriageModalProps> = ({
  event,
  design,
  telemetry,
  onSelectAction,
  activeResolution,
  onDismissResolution
}) => {
  if (!event && !activeResolution) return null;

  // Resolution summary dialog after player choice
  if (activeResolution) {
    const isFatal = activeResolution.isFatal;
    const isCleanMitigation = activeResolution.damagePercent === 0 && activeResolution.scienceLostPoints === 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
        <div className="mission-panel-elevated max-w-2xl w-full p-6 text-txt-primary border border-[#293342] shadow-2xl">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#293342]">
            {isFatal ? (
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            ) : isCleanMitigation ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                Telemetry Anomaly Resolution
              </span>
              <h3 className="text-base font-heading font-bold text-white">
                {activeResolution.causalHeadline}
              </h3>
            </div>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed mb-4">
            {activeResolution.causalDetail}
          </p>

          {/* Consequence Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs mb-5">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Damage:</span>
              <span className={activeResolution.damagePercent > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {activeResolution.damagePercent > 0 ? `-${activeResolution.damagePercent}%` : '0% (Nominal)'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Science Delta:</span>
              <span className={activeResolution.scienceGainedPoints > 0 ? 'text-emerald-400 font-bold' : activeResolution.scienceLostPoints > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                {activeResolution.scienceGainedPoints > 0 ? `+${activeResolution.scienceGainedPoints} pts` : activeResolution.scienceLostPoints > 0 ? `-${activeResolution.scienceLostPoints} pts` : '0 pts'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Propellant Used:</span>
              <span className={activeResolution.propellantConsumedKg > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                {activeResolution.propellantConsumedKg > 0 ? `-${activeResolution.propellantConsumedKg} kg` : '0 kg'}
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Hardware Key:</span>
              <span className="text-cyan-300 text-[10px] truncate block" title={activeResolution.mitigatedByHardware || 'None'}>
                {activeResolution.mitigatedByHardware || 'Unmitigated'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismissResolution}
            className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950/50"
          >
            <span>RESUME MISSION OPERATIONS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const severityColor =
    event.fazeLevel === 'critical'
      ? 'border-red-500 bg-red-950/90 text-red-300'
      : event.fazeLevel === 'warning'
      ? 'border-amber-500 bg-amber-950/90 text-amber-300'
      : 'border-cyan-500 bg-cyan-950/90 text-cyan-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="mission-panel-elevated max-w-3xl w-full p-4 sm:p-6 text-txt-primary border border-sky-500/40 shadow-2xl flex flex-col max-h-[90vh] my-auto">
        {/* Header Strip */}
        <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#293342] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${severityColor}`}>
                {event.fazeLevel} IN-FLIGHT ANOMALY
              </span>
              <span className="text-xs font-mono text-slate-400">
                MET DAY {telemetry.missionElapsedTimeDays.toFixed(1)}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-heading font-bold text-white">
              {event.title}
            </h2>
            <p className="text-xs text-cyan-300 font-mono mt-0.5">
              Targeted Subsystem: <span className="uppercase text-white font-semibold">{event.targetedSubsystem}</span>
            </p>
          </div>
        </div>

        {/* Anomaly Description & Context */}
        <div className="bg-slate-950/70 rounded-xl p-3 sm:p-3.5 border border-slate-800 mb-3 shrink-0">
          <p className="text-xs text-white font-medium mb-1.5">
            {event.headline}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Decision Options */}
        <div className="flex-1 min-h-0 flex flex-col">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2 shrink-0">
            Select Flight Controller Directive:
          </span>
          <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
            {event.availableActions.map((action, i) => (
              <div
                key={i}
                className="bg-slate-900/90 hover:bg-slate-850 active:bg-slate-800 border border-slate-700/80 hover:border-cyan-400/80 rounded-xl p-3 sm:p-3.5 transition-all cursor-pointer flex flex-col gap-2"
                onClick={() => onSelectAction(action.type)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-heading font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold">
                      {i + 1}
                    </span>
                    {action.label}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAction(action.type);
                    }}
                    className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-[11px] font-mono font-bold tracking-wider transition-all cursor-pointer shadow-md hover:shadow-cyan-500/25"
                  >
                    EXECUTE
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {action.description}
                </p>

                {/* Resource Cost Badges */}
                <div className="flex items-center gap-2 font-mono text-[10px] pt-1 border-t border-slate-800/80">
                  {action.propellantCostKg !== undefined && (
                    <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      <Flame className="w-3 h-3" />
                      <span>-{action.propellantCostKg} kg Propellant</span>
                    </span>
                  )}
                  {action.powerDrawWatts !== undefined && (
                    <span className="flex items-center gap-1 text-yellow-300 bg-yellow-950/40 px-2 py-0.5 rounded border border-yellow-800/40">
                      <Zap className="w-3 h-3" />
                      <span>+{action.powerDrawWatts}W Draw</span>
                    </span>
                  )}
                  {action.scienceYieldModifier !== undefined && (
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
                      action.scienceYieldModifier >= 1.0
                        ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/40'
                        : 'text-amber-300 bg-amber-950/40 border-amber-800/40'
                    }`}>
                      <span>Science Yield: {Math.round((action.scienceYieldModifier - 1.0) * 100)}%</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
