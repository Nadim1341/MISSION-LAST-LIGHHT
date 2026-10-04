import React from 'react';
import { Zap, Radio, Microscope, Thermometer, Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { MissionTelemetry } from '../../types/mission.ts';

export interface PowerAllocations {
  communications: number; // 0 - 100%
  science: number; // 0 - 100%
  thermal: number; // 0 - 100%
  computing: number; // 0 - 100%
}

interface PowerPanelProps {
  telemetry: MissionTelemetry;
  allocations: PowerAllocations;
  onChangeAllocation: (key: keyof PowerAllocations, value: number) => void;
  onBalanceNominal: () => void;
}

export const PowerManagementPanel: React.FC<PowerPanelProps> = ({
  telemetry,
  allocations,
  onChangeAllocation,
  onBalanceNominal
}) => {
  // Approximate active load calculation based on allocations
  const baseLoadW = 120; // Base bus avionics
  const commsLoadW = Math.round(180 * (allocations.communications / 100));
  const scienceLoadW = Math.round(220 * (allocations.science / 100));
  const thermalLoadW = Math.round(150 * (allocations.thermal / 100));
  const computingLoadW = Math.round(130 * (allocations.computing / 100));
  const totalSimulatedLoadW = baseLoadW + commsLoadW + scienceLoadW + thermalLoadW + computingLoadW;

  const netWatts = telemetry.solarGenerationW - totalSimulatedLoadW;
  const isNetDeficit = netWatts < 0;

  return (
    <div className="mission-panel p-4 flex flex-col justify-between h-full border border-[#293342] text-xs font-mono">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#293342]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading font-semibold text-white uppercase tracking-wider text-xs">
              Power Allocation Grid
            </h3>
          </div>
          <button
            type="button"
            onClick={onBalanceNominal}
            className="text-[10px] px-2 py-0.5 rounded bg-space-850 hover:bg-space-750 text-sky-300 border border-[#293342] transition-colors cursor-pointer"
          >
            RESET BALANCED
          </button>
        </div>

        {/* Live Power Bus Summary */}
        <div className="bg-[#0D111A] p-3 rounded-lg border border-[#232D3E] mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[#6F7B8C]">Solar Generation (at {telemetry.distanceFromSunAu} AU):</span>
            <span className="font-bold text-emerald-400">{telemetry.solarGenerationW} W</span>
          </div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[#6F7B8C]">Current Allocated Demand:</span>
            <span className="font-bold text-white">{totalSimulatedLoadW} W</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-[#293342]">
            <span className="text-[#6F7B8C]">Net Power Margin:</span>
            <span className={`font-bold ${isNetDeficit ? 'text-red-400' : 'text-emerald-400'}`}>
              {netWatts > 0 ? `+${netWatts}` : netWatts} W
            </span>
          </div>
        </div>

        {/* Sliders for each bus */}
        <div className="space-y-3.5 mb-4">
          {/* Communications Bus */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white flex items-center gap-1.5 font-medium">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                Communications Subsystem
              </span>
              <span className="text-sky-300 font-bold">{allocations.communications}% ({commsLoadW}W)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={allocations.communications}
              onChange={(e) => onChangeAllocation('communications', Number(e.target.value))}
              className="w-full h-1.5 bg-space-900 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <span className="text-[10px] text-[#6F7B8C] block mt-0.5">
              Affects DSN downlink carrier wattage and transmitter duty cycle
            </span>
          </div>

          {/* Science Instruments Bus */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white flex items-center gap-1.5 font-medium">
                <Microscope className="w-3.5 h-3.5 text-purple-400" />
                Science Payload
              </span>
              <span className="text-purple-300 font-bold">{allocations.science}% ({scienceLoadW}W)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={allocations.science}
              onChange={(e) => onChangeAllocation('science', Number(e.target.value))}
              className="w-full h-1.5 bg-space-900 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <span className="text-[10px] text-[#6F7B8C] block mt-0.5">
              Governs camera sensor integration rate & lidar pulse frequency
            </span>
          </div>

          {/* Thermal Heaters Bus */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white flex items-center gap-1.5 font-medium">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                Thermal Control (Louvers & Heaters)
              </span>
              <span className="text-amber-300 font-bold">{allocations.thermal}% ({thermalLoadW}W)</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={allocations.thermal}
              onChange={(e) => onChangeAllocation('thermal', Number(e.target.value))}
              className="w-full h-1.5 bg-space-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[10px] text-[#6F7B8C] block mt-0.5">
              Maintains avionics within 235 - 335 K nominal flight envelope
            </span>
          </div>

          {/* Flight Computer Bus */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Flight Computing & GNC
              </span>
              <span className="text-emerald-300 font-bold">{allocations.computing}% ({computingLoadW}W)</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={allocations.computing}
              onChange={(e) => onChangeAllocation('computing', Number(e.target.value))}
              className="w-full h-1.5 bg-space-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[10px] text-[#6F7B8C] block mt-0.5">
              Provides star-tracker pose estimation and autonomous fault detection
            </span>
          </div>
        </div>
      </div>

      {/* Advisory Note */}
      <div className={`p-2.5 rounded-lg border text-[11px] leading-tight flex items-center gap-2 ${
        isNetDeficit
          ? 'bg-red-950/40 border-red-500/40 text-red-300'
          : 'bg-space-850 border-[#232D3E] text-[#AAB4C3]'
      }`}>
        {isNetDeficit ? (
          <>
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Power deficit! Spacecraft battery is actively discharging.</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Solar generation is sufficient. Battery state remains steady at 100%.</span>
          </>
        )}
      </div>
    </div>
  );
};
