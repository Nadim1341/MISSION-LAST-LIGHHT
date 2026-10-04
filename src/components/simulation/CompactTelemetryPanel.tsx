import React from 'react';
import {
  Shield,
  Zap,
  Flame,
  Thermometer,
  Radio,
  Cpu,
  Compass,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import type { MissionTelemetry } from '../../types/mission.ts';

interface TelemetryPanelProps {
  telemetry: MissionTelemetry;
  prevTelemetry?: MissionTelemetry | null;
}

export const CompactTelemetryPanel: React.FC<TelemetryPanelProps> = ({
  telemetry,
  prevTelemetry
}) => {
  // Compute trends
  const deltaPower = prevTelemetry
    ? telemetry.solarGenerationW - prevTelemetry.solarGenerationW
    : 0;
  const deltaFuel = prevTelemetry
    ? telemetry.propellantRemainingKg - prevTelemetry.propellantRemainingKg
    : 0;
  const deltaTemp = prevTelemetry
    ? telemetry.spacecraftTempK - prevTelemetry.spacecraftTempK
    : 0;

  const getHealthStatus = (health: number) => {
    if (health >= 80) return { label: 'NOMINAL', color: 'text-emerald-400' };
    if (health >= 60) return { label: 'STABLE', color: 'text-sky-300' };
    if (health >= 40) return { label: 'DEGRADED', color: 'text-amber-400' };
    if (health > 0) return { label: 'WARNING', color: 'text-orange-400' };
    return { label: 'CRITICAL', color: 'text-red-400' };
  };

  const healthStatus = getHealthStatus(telemetry.spacecraftHealth);

  const getThermalStatus = () => {
    if (telemetry.isThermalAnomaly) return { label: 'CRITICAL', color: 'text-red-400' };
    if (Math.abs(telemetry.thermalMarginK) > 30) return { label: 'WARNING', color: 'text-amber-400' };
    return { label: 'STABLE', color: 'text-sky-300' };
  };

  const thermalStatus = getThermalStatus();

  return (
    <div className="mission-panel p-3.5 flex flex-col gap-3 h-full overflow-y-auto border border-[#293342] text-xs font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#293342]">
        <span className="text-[10px] uppercase tracking-wider text-[#6F7B8C]">
          System Status & Telemetry
        </span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-space-850 text-sky-400 border border-[#293342]">
          BUS 28V
        </span>
      </div>

      {/* Primary Health Meter */}
      <div className="bg-[#0D111A] p-3 rounded-lg border border-[#232D3E]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-white font-medium">Spacecraft Health</span>
          </div>
          <span className={`font-bold text-xs ${healthStatus.color}`}>
            {healthStatus.label} ({telemetry.spacecraftHealth}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-space-900 rounded-full overflow-hidden border border-[#293342]">
          <div
            className={`h-full transition-all duration-300 ${
              telemetry.spacecraftHealth >= 75
                ? 'bg-emerald-400'
                : telemetry.spacecraftHealth >= 45
                ? 'bg-amber-400'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, telemetry.spacecraftHealth))}%` }}
          />
        </div>
      </div>

      {/* 5 Compact Telemetry Metric Blocks */}
      <div className="space-y-2">
        {/* 1. Power Bus */}
        <div className="bg-[#0D111A] p-2.5 rounded-lg border border-[#232D3E]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white flex items-center gap-1 font-medium text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Power Bus
            </span>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="font-semibold text-white">
                {(telemetry.solarGenerationW / 1000).toFixed(2)} kW
              </span>
              <span className="text-[10px] text-[#6F7B8C]">
                ({Math.round(telemetry.batteryStateOfCharge * 100)}%)
              </span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-[#6F7B8C]">
            <span className={telemetry.batteryStateOfCharge > 0.5 ? 'text-emerald-400' : 'text-amber-400'}>
              {telemetry.batteryStateOfCharge > 0.5 ? 'NOMINAL' : 'DEGRADED'}
            </span>
            <span className="flex items-center gap-0.5">
              {deltaPower > 0.5 ? (
                <span className="text-emerald-400 flex items-center">↑ +{deltaPower.toFixed(0)}W</span>
              ) : deltaPower < -0.5 ? (
                <span className="text-red-400 flex items-center">↓ {deltaPower.toFixed(0)}W</span>
              ) : (
                <span className="text-[#6F7B8C]">STABLE</span>
              )}
            </span>
          </div>
        </div>

        {/* 2. Fuel / Propulsion */}
        <div className="bg-[#0D111A] p-2.5 rounded-lg border border-[#232D3E]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white flex items-center gap-1 font-medium text-xs">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Propellant & Δv
            </span>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="font-semibold text-white">
                {Math.round(telemetry.propellantRemainingKg)} kg
              </span>
              <span className="text-[10px] text-[#6F7B8C]">
                ({Math.round(telemetry.deltaVRemainingMs)} m/s)
              </span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-[#6F7B8C]">
            <span className={telemetry.propellantRemainingKg > 50 ? 'text-emerald-400' : 'text-red-400'}>
              {telemetry.propellantRemainingKg > 50 ? 'NOMINAL' : 'WARNING'}
            </span>
            <span className="text-[#6F7B8C]">
              {deltaFuel < -0.1 ? `↓ ${deltaFuel.toFixed(1)} kg` : 'STABLE'}
            </span>
          </div>
        </div>

        {/* 3. Thermal State */}
        <div className="bg-[#0D111A] p-2.5 rounded-lg border border-[#232D3E]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white flex items-center gap-1 font-medium text-xs">
              <Thermometer className="w-3.5 h-3.5 text-sky-400" />
              Thermal Equilibrium
            </span>
            <span className="font-semibold text-white text-[11px]">
              {Math.round(telemetry.spacecraftTempK)} K
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-[#6F7B8C]">
            <span className={thermalStatus.color}>{thermalStatus.label}</span>
            <span>
              Margin: {telemetry.thermalMarginK > 0 ? `+${telemetry.thermalMarginK.toFixed(0)}` : telemetry.thermalMarginK.toFixed(0)} K
            </span>
          </div>
        </div>

        {/* 4. Deep Space Network Comms */}
        <div className="bg-[#0D111A] p-2.5 rounded-lg border border-[#232D3E]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white flex items-center gap-1 font-medium text-xs">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              DSN Downlink
            </span>
            <span className="font-semibold text-white text-[11px]">
              {telemetry.currentDownlinkRateKbps} kbps
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-[#6F7B8C]">
            <span className={telemetry.isInDsnWindow ? 'text-emerald-400' : 'text-amber-400'}>
              {telemetry.isInDsnWindow ? `LINK: ${telemetry.activeGroundStation}` : 'DSN BLACKOUT'}
            </span>
            <span>Delay: {Math.round(telemetry.oneWayLightTimeSec)}s</span>
          </div>
        </div>

        {/* 5. Subsystem Bus Breakdown */}
        <div className="bg-[#0D111A] p-2.5 rounded-lg border border-[#232D3E]">
          <span className="text-[10px] text-[#6F7B8C] block uppercase mb-1.5">
            8-Subsystem Bus Status
          </span>
          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
            {Object.entries(telemetry.subsystemHealth).map(([sub, val]) => (
              <div key={sub} className="bg-space-850 p-1 rounded border border-[#293342]">
                <span className="text-[#6F7B8C] block truncate text-[9px] capitalize">{sub.slice(0, 4)}</span>
                <span className={`font-bold ${val >= 80 ? 'text-emerald-400' : val >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {val}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
