import React from 'react';
import { Rocket, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import type { LaunchVehicle } from '../../types/launcher.ts';
import type { ScenarioDefinition } from '../../types/mission.ts';
import { LAUNCH_VEHICLE_CATALOG } from '../../data/launchers.ts';
import { calculateLauncherCapacityAtC3 } from '../../engine/math/orbital.ts';

interface LauncherSelectorProps {
  selectedLauncher: LaunchVehicle;
  onSelectLauncher: (launcher: LaunchVehicle) => void;
  spacecraftWetMassKg: number;
  scenario: ScenarioDefinition;
}

export const LauncherSelector: React.FC<LauncherSelectorProps> = ({
  selectedLauncher,
  onSelectLauncher,
  spacecraftWetMassKg,
  scenario
}) => {
  const targetC3 = scenario.target.requiredC3Km2S2;
  const allowedLaunchers = LAUNCH_VEHICLE_CATALOG.filter((l) =>
    scenario.allowedLaunchers.includes(l.id)
  );

  return (
    <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <h3 className="text-sm font-heading font-semibold text-white tracking-wide uppercase flex items-center gap-2">
          <Rocket className="w-4 h-4 text-cyan-400" />
          Launch Vehicle Selection
        </h3>
        <span className="text-[11px] font-mono text-cyan-300">
          TARGET C3: {targetC3} km²/s²
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {allowedLaunchers.map((launcher) => {
          const capacityKg = calculateLauncherCapacityAtC3(launcher, targetC3);
          const isSelected = selectedLauncher.id === launcher.id;
          const isOverCapacity = spacecraftWetMassKg > capacityKg;

          return (
            <div
              key={launcher.id}
              onClick={() => onSelectLauncher(launcher)}
              className={`cursor-pointer rounded-xl p-3 border transition-all relative ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              <h4 className="text-xs font-semibold text-white mb-0.5 pr-6">
                {launcher.name}
              </h4>
              <span className="text-[10px] font-mono text-slate-400 block mb-2">
                {launcher.provider}
              </span>

              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-slate-300">
                  <span>Launch Cost:</span>
                  <span className="font-semibold text-white">${launcher.costM}M</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Lift at C3={targetC3}:</span>
                  <span className={isOverCapacity ? 'text-red-400 font-bold' : 'text-cyan-300 font-semibold'}>
                    {capacityKg} kg
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Historical Rel:</span>
                  <span className="text-emerald-400">{(launcher.reliabilityRating * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[9px]">
                  <span>Fairing:</span>
                  <span>{launcher.fairingDiameterM}m × {launcher.fairingHeightM}m</span>
                </div>
              </div>

              {isOverCapacity && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-950/40 p-1 rounded border border-red-800/40">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Payload Exceeded (+{(spacecraftWetMassKg - capacityKg).toFixed(0)} kg)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
