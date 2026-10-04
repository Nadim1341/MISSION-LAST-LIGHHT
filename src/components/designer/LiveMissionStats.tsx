import React from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Scale,
  Zap,
  Flame,
  Radio,
  Microscope,
  ShieldCheck,
  Thermometer,
  Cpu
} from 'lucide-react';
import type { SpacecraftDesign, SubsystemTotals } from '../../types/subsystems.ts';
import type { LaunchVehicle } from '../../types/launcher.ts';
import type { ScenarioDefinition, InterfaceMode } from '../../types/mission.ts';
import type { ConstraintValidationResult } from '../../engine/validator.ts';
import { EducationalTooltip } from '../common/EducationalTooltip.tsx';

interface LiveStatsProps {
  design: SpacecraftDesign;
  totals: SubsystemTotals;
  launcher: LaunchVehicle;
  scenario: ScenarioDefinition;
  validation: ConstraintValidationResult;
  mode: InterfaceMode;
}

export const LiveMissionStats: React.FC<LiveStatsProps> = ({
  totals,
  launcher,
  scenario,
  validation,
  mode
}) => {
  const isEngineer = mode === 'engineer';
  const totalCost = validation.metrics.totalCostM;
  const budgetCap = scenario.budgetCapM;
  const budgetRatio = Math.min(1.0, totalCost / budgetCap);

  const deltaVAvailable = totals.totalDeltaVMs;
  const deltaVRequired = scenario.target.deltaVRequirementMs.totalRequired;
  const deltaVRatio = deltaVRequired > 0 ? Math.min(1.5, deltaVAvailable / deltaVRequired) : 1.0;

  return (
    <div className="mission-panel p-4 flex flex-col h-full overflow-hidden border border-[#293342]">
      <div className="flex items-center justify-between mb-3 border-b border-[#293342] pb-2">
        <h2 className="text-xs font-heading font-semibold text-white tracking-wide uppercase flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          Live Mission Telemetry
        </h2>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isEngineer
            ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            : 'bg-space-850 border-[#293342] text-sky-300'
          }`}>
          {isEngineer ? 'ENGINEER VIEW' : 'COMMANDER VIEW'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
        {/* Hard Violations Alert Banner */}
        {validation.hardViolations.length > 0 && (
          <div className="bg-red-950/70 border border-red-500/40 rounded-lg p-3 text-xs text-red-200">
            <div className="flex items-center gap-1.5 font-semibold text-red-400 mb-1">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>LAUNCH BLOCKED ({validation.hardViolations.length} HARD CONSTRAINTS)</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-300/90 font-mono">
              {validation.hardViolations.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Soft Warnings Banner */}
        {validation.softWarnings.length > 0 && validation.hardViolations.length === 0 && (
          <div className="bg-amber-950/50 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>ENGINEERING RISK ADVISORIES</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-300/80 font-mono">
              {validation.softWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Budget Meter */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Mission Budget
            </span>
            <span className="font-mono text-white text-xs">
              ${totalCost.toFixed(1)}M / <span className="text-slate-400">${budgetCap}M</span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${totalCost > budgetCap ? 'bg-red-500' : budgetRatio > 0.85 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              style={{ width: `${Math.max(0, Math.min(100, budgetRatio * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>Spacecraft: ${totals.totalCostM}M</span>
            <span>Rocket: ${launcher.costM}M</span>
            <span className={validation.metrics.budgetRemainingM < 0 ? 'text-red-400' : 'text-emerald-400'}>
              Rem: ${validation.metrics.budgetRemainingM}M
            </span>
          </div>
        </div>

        {/* Mass & Launch Capacity */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              Mass vs. Launch Capacity
              {isEngineer && <EducationalTooltip termKey="c3" />}
            </span>
            <span className="font-mono text-white text-xs">
              {totals.totalWetMassKg} kg / <span className="text-slate-400">{validation.metrics.launcherCapacityKg} kg</span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${validation.metrics.massMarginKg < 0 ? 'bg-red-500' : 'bg-cyan-400'
                }`}
              style={{
                width: `${Math.max(0, Math.min(100, (totals.totalWetMassKg / Math.max(1, validation.metrics.launcherCapacityKg)) * 100))}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>Dry: {totals.dryMassKg} kg</span>
            <span>Fuel: {totals.propellantMassKg} kg</span>
            <span className={validation.metrics.massMarginKg < 0 ? 'text-red-400' : 'text-cyan-300'}>
              Margin: {validation.metrics.massMarginPct}%
            </span>
          </div>
        </div>

        {/* Propulsion & Delta-V */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Delta-V Trajectory Capacity
              {isEngineer && <EducationalTooltip termKey="deltaV" />}
            </span>
            <span className="font-mono text-white text-xs">
              {deltaVAvailable} m/s / <span className="text-slate-400">{deltaVRequired} m/s</span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${deltaVAvailable < deltaVRequired ? 'bg-red-500' : 'bg-amber-400'
                }`}
              style={{ width: `${Math.max(0, Math.min(100, (deltaVAvailable / Math.max(1, deltaVRequired)) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            {isEngineer && (
              <span>
                Isp: <span className="text-amber-300">{totals.effectiveIspSec}s</span>
                <EducationalTooltip termKey="isp" />
              </span>
            )}
            <span className={validation.metrics.deltaVMarginMs < 0 ? 'text-red-400' : 'text-emerald-400'}>
              Reserve: {validation.metrics.deltaVMarginMs > 0 ? `+${validation.metrics.deltaVMarginMs}` : validation.metrics.deltaVMarginMs} m/s
            </span>
            <span>{totals.hasRedundantPropulsion ? 'Dual RCS: ACTIVE' : 'Single Engine'}</span>
          </div>
        </div>

        {/* Electrical Power Bus */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Power Generation & Margin
              {isEngineer && <EducationalTooltip termKey="batteryDoD" />}
            </span>
            <span className="font-mono text-white text-xs">
              {totals.powerGenerationW}W / <span className="text-slate-400">{totals.powerConsumptionW}W</span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${totals.netPowerMarginW < 0 ? 'bg-red-500' : 'bg-yellow-400'
                }`}
              style={{
                width: `${Math.max(0, Math.min(100, (totals.powerGenerationW / Math.max(1, totals.powerConsumptionW * 1.5)) * 100))}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>Net at 1 AU: +{totals.netPowerMarginW}W</span>
            <span>At Bennu (1.36 AU): ~{Math.round(totals.powerGenerationW * 0.54)}W</span>
            <span>Batt: {(totals.batteryStorageJoules / 3600000).toFixed(1)} kWh</span>
          </div>
        </div>

        {/* Communications & Data Storage */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              Telecom Bandwidth & Buffer
              {isEngineer && <EducationalTooltip termKey="linkBudget" />}
            </span>
            <span className="font-mono text-white text-xs">
              {totals.storageCapacityMb / 1024} GB Buffer
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 mt-1">
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              Sensor Rate: <span className="text-cyan-300 font-semibold">{totals.dataGenerationRateKbps} kbps</span>
            </div>
            <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
              DSN Relay: <span className="text-blue-300 font-semibold">34m / 70m DSN</span>
            </div>
          </div>
        </div>

        {/* Science Potential & Objectives */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Microscope className="w-3.5 h-3.5 text-purple-400" />
              Scientific Discovery Yield
            </span>
            <span className="font-mono text-purple-300 text-xs font-semibold">
              +{totals.sciencePotential} Science Pts
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block">
            Target threshold for full mission success: 60 pts
          </span>
        </div>

        {/* Engineer Mode Extra Metrics */}
        {isEngineer && (
          <div className="bg-slate-950/80 rounded-lg p-3 border border-amber-500/20 flex flex-col gap-2 text-[11px] font-mono">
            <span className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold block">
              Advanced Engineering Parameters
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  Radiation Tolerance
                  <EducationalTooltip termKey="radHardening" />
                </span>
                <span className="text-white font-semibold">{totals.radiationToleranceKrad} krad TID</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MTBF Reliability</span>
                <span className="text-white font-semibold">{(totals.baseReliability * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Whipple Shield</span>
                <span className={totals.hasWhippleShielding ? 'text-emerald-400' : 'text-slate-400'}>
                  {totals.hasWhippleShielding ? 'INSTALLED' : 'NONE'}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Comms Redundancy</span>
                <span className={totals.hasRedundantComms ? 'text-emerald-400' : 'text-slate-400'}>
                  {totals.hasRedundantComms ? 'DUAL STRING' : 'SINGLE STRING'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
