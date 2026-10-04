import React, { useState } from 'react';
import { Microscope, Camera, Eye, Zap, Clock, Database, Sparkles, Check } from 'lucide-react';
import type { MissionTelemetry } from '../../types/mission.ts';
import type { SpacecraftDesign } from '../../types/subsystems.ts';
import { playTelemetryClick, playSuccessChime } from '../../utils/audio.ts';

interface ScienceOpsProps {
  telemetry: MissionTelemetry;
  design: SpacecraftDesign;
  onExecuteScan: (scanType: 'camera' | 'spectrometer' | 'radar') => void;
  isScanning: boolean;
}

export const ScienceOpsPanel: React.FC<ScienceOpsProps> = ({
  telemetry,
  design,
  onExecuteScan,
  isScanning
}) => {
  const instruments = [
    {
      id: 'camera' as const,
      name: 'Multispectral Framing Camera',
      actionLabel: 'IMAGE REGOLITH TARGET',
      powerCostW: 90,
      timeHours: 2,
      dataMb: 350,
      scienceGain: 6,
      icon: Camera,
      desc: 'Acquires color-filtered 2-meter resolution optical images for geological mapping.'
    },
    {
      id: 'spectrometer' as const,
      name: 'Infrared & X-Ray Spectrometer',
      actionLabel: 'SCAN SURFACE MINERALOGY',
      powerCostW: 140,
      timeHours: 4,
      dataMb: 600,
      scienceGain: 12,
      icon: Microscope,
      desc: 'Profiles absorption bands for hydrated phyllosilicates and carbonaceous compounds.'
    },
    {
      id: 'radar' as const,
      name: 'Pulsed Laser / LIDAR Altimeter',
      actionLabel: 'MAP 3D SURFACE TOPOGRAPHY',
      powerCostW: 180,
      timeHours: 6,
      dataMb: 850,
      scienceGain: 16,
      icon: Eye,
      desc: 'Generates centimeter-accuracy digital elevation models and boulder hazard surveys.'
    }
  ];

  return (
    <div className="mission-panel p-4 flex flex-col justify-between h-full border border-[#293342] text-xs font-mono">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#293342]">
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4 text-purple-400" />
            <h3 className="font-heading font-semibold text-white uppercase tracking-wider text-xs">
              Scientific Operations Bay
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 font-bold">
            SCIENCE YIELD: +{telemetry.rawScienceCollected.toFixed(0)} PTS
          </span>
        </div>

        {/* Instruments List */}
        <div className="space-y-3 mb-4">
          {instruments.map((inst) => {
            const Icon = inst.icon;
            const canAfford =
              telemetry.dataBufferUsedMb + inst.dataMb <= telemetry.dataBufferMaxMb &&
              !telemetry.safeModeEngaged;

            return (
              <div
                key={inst.id}
                className="bg-[#0D111A] p-3 rounded-lg border border-[#232D3E] hover:border-[#37465B] transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <span className="font-heading font-semibold text-white text-xs">
                      {inst.name}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-bold text-xs">
                    +{inst.scienceGain} pts
                  </span>
                </div>

                <p className="text-[11px] text-[#AAB4C3] leading-relaxed mb-2.5">
                  {inst.desc}
                </p>

                {/* Resource Cost Matrix */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-[#6F7B8C] mb-2.5 bg-space-850 p-1.5 rounded border border-[#293342]">
                  <div>
                    Draw: <span className="text-amber-300 font-semibold">{inst.powerCostW}W</span>
                  </div>
                  <div>
                    Duration: <span className="text-white font-semibold">{inst.timeHours}h</span>
                  </div>
                  <div>
                    Data: <span className="text-sky-300 font-semibold">{inst.dataMb} MB</span>
                  </div>
                </div>

                {/* Action Trigger */}
                <button
                  type="button"
                  onClick={() => onExecuteScan(inst.id)}
                  disabled={!canAfford || isScanning}
                  className={`w-full py-1.5 rounded font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    canAfford && !isScanning
                      ? 'bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 active:scale-95'
                      : 'bg-space-850 text-[#6F7B8C] border border-[#293342] cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>{isScanning ? 'EXECUTING SCAN RUN...' : inst.actionLabel}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advisory */}
      <div className="p-2.5 rounded-lg bg-[#0D111A] border border-[#232D3E] text-[10px] text-[#6F7B8C] leading-tight">
        Acquiring science generates raw data stored in the solid-state recorder buffer. Downlink passes through the DSN return scientific score to NASA archives.
      </div>
    </div>
  );
};
