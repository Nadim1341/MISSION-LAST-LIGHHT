import React, { useState } from 'react';
import { Radio, ArrowDown, Check, AlertTriangle, Send, Wifi, WifiOff } from 'lucide-react';
import type { MissionTelemetry } from '../../types/mission.ts';
import { playTelemetryClick, playSuccessChime } from '../../utils/audio.ts';

interface CommsPanelProps {
  telemetry: MissionTelemetry;
  onManualTransmit: () => void;
  isTransmittingActive: boolean;
}

export const CommsPanel: React.FC<CommsPanelProps> = ({
  telemetry,
  onManualTransmit,
  isTransmittingActive
}) => {
  const isAvailable = telemetry.isInDsnWindow && !telemetry.safeModeEngaged;
  const bufferUsedMb = telemetry.dataBufferUsedMb;
  const bufferMaxMb = telemetry.dataBufferMaxMb;
  const queueRatio = bufferMaxMb > 0 ? bufferUsedMb / bufferMaxMb : 0;

  return (
    <div className="mission-panel p-4 flex flex-col justify-between h-full border border-[#293342] text-xs font-mono">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#293342]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <h3 className="font-heading font-semibold text-white uppercase tracking-wider text-xs">
              Deep Space Communications Link
            </h3>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
            isAvailable
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
              : 'bg-red-950/60 border-red-500/40 text-red-400'
          }`}>
            {isAvailable ? `LINK: ${telemetry.activeGroundStation}` : 'DSN BLACKOUT'}
          </span>
        </div>

        {/* Link Architecture Visualizer */}
        <div className="bg-[#0D111A] p-3 rounded-lg border border-[#232D3E] mb-4 flex flex-col items-center text-center">
          {/* Top: Spacecraft */}
          <div className="w-full flex items-center justify-between px-2 text-[11px]">
            <span className="text-white font-semibold">ASTERIA-1 SPACECRAFT</span>
            <span className="text-sky-300">X-Band HGA (8.4 GHz)</span>
          </div>

          {/* Center: Beam with Downlink Status */}
          <div className="w-full my-2.5 py-1.5 px-3 bg-space-850 rounded border border-[#293342] flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-sky-300">
              {isAvailable ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-400" />
              )}
              <span>{isAvailable ? `${telemetry.currentDownlinkRateKbps} kbps carrier` : 'Carrier lost'}</span>
            </div>
            <span className="text-[#AAB4C3]">
              Delay: ~{Math.round(telemetry.oneWayLightTimeSec)}s (one-way)
            </span>
          </div>

          {/* Bottom: Ground Station */}
          <div className="w-full flex items-center justify-between px-2 text-[11px]">
            <span className="text-[#AAB4C3]">NASA DSN DISH</span>
            <span className="text-white font-semibold">{telemetry.activeGroundStation} 70-meter</span>
          </div>
        </div>

        {/* Telecommunications Metrics */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 text-[11px]">
          <div className="bg-[#151B26] p-2.5 rounded-lg border border-[#232D3E]">
            <span className="text-[10px] text-[#6F7B8C] block uppercase">
              One-Way Light Delay
            </span>
            <span className="text-white font-semibold">
              {telemetry.oneWayLightTimeSec.toFixed(1)} seconds
            </span>
          </div>

          <div className="bg-[#151B26] p-2.5 rounded-lg border border-[#232D3E]">
            <span className="text-[10px] text-[#6F7B8C] block uppercase">
              Total Data Downlinked
            </span>
            <span className="text-emerald-400 font-semibold">
              {(telemetry.scienceDataTransmitted / 1024).toFixed(2)} GB
            </span>
          </div>
        </div>

        {/* Solid-State Recorder Memory Queue */}
        <div className="bg-[#0D111A] p-3 rounded-lg border border-[#232D3E] mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-white font-medium">SSR Memory Buffer</span>
            <span className="text-sky-300 font-bold">
              {(bufferUsedMb / 1024).toFixed(2)} / {(bufferMaxMb / 1024).toFixed(2)} GB
            </span>
          </div>

          <div className="w-full h-2 bg-space-900 rounded-full overflow-hidden border border-[#293342] mb-1.5">
            <div
              className={`h-full transition-all duration-300 ${
                queueRatio > 0.85
                  ? 'bg-red-500'
                  : queueRatio > 0.65
                  ? 'bg-amber-400'
                  : 'bg-sky-400'
              }`}
              style={{ width: `${Math.min(100, queueRatio * 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-[#6F7B8C]">
            <span>Buffer Fill: {Math.round(queueRatio * 100)}%</span>
            <span>{bufferUsedMb > 0 ? 'Data pending transmission' : 'Buffer clear'}</span>
          </div>
        </div>
      </div>

      {/* Manual Transmission Action Bar */}
      <div>
        {!isAvailable && (
          <div className="mb-2 p-2 rounded bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Downlink blocked: Ground station below horizon or safe mode engaged.</span>
          </div>
        )}

        <button
          type="button"
          onClick={onManualTransmit}
          disabled={!isAvailable || bufferUsedMb <= 0 || isTransmittingActive}
          className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            isAvailable && bufferUsedMb > 0
              ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/50 active:scale-95'
              : 'bg-[#151B26] text-[#6F7B8C] border border-[#293342] cursor-not-allowed'
          }`}
        >
          <Send className={`w-3.5 h-3.5 ${isTransmittingActive ? 'animate-bounce text-sky-200' : ''}`} />
          <span>
            {isTransmittingActive
              ? 'DOWNLINKING PACKETS TO DSN...'
              : bufferUsedMb <= 0
              ? 'BUFFER EMPTY — NO DATA TO SEND'
              : 'TRANSMIT BUFFER DATA NOW'}
          </span>
        </button>
      </div>
    </div>
  );
};
