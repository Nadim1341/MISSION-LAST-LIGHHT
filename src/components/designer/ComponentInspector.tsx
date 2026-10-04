import React from 'react';
import {
  Zap,
  Flame,
  Radio,
  Compass,
  Cpu,
  Thermometer,
  Microscope,
  Box,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import type { SpacecraftComponent, SpacecraftDesign, SubsystemCategory } from '../../types/subsystems.ts';
import { calculateSubsystemTotals } from '../../engine/math/rocket.ts';

interface ComponentInspectorProps {
  component: SpacecraftComponent | null;
  design: SpacecraftDesign;
  onMount: (comp: SpacecraftComponent) => void;
  onDismount: (category: SubsystemCategory, id: string) => void;
  onClose?: () => void;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  component,
  design,
  onMount,
  onDismount,
  onClose
}) => {
  if (!component) {
    return (
      <div className="mission-panel p-5 text-center flex flex-col items-center justify-center h-full min-h-[280px]">
        <div className="w-12 h-12 rounded-full bg-space-850 border border-[#293342] flex items-center justify-center text-txt-muted mb-3">
          <Box className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-heading font-semibold text-white mb-1">
          No Component Selected
        </h3>
        <p className="text-xs text-txt-muted max-w-[220px]">
          Select or hover over any hardware module in the catalog to inspect technical specs and mission consequences.
        </p>
      </div>
    );
  }

  const isMounted = (design.components[component.category] || []).some((c) => c.id === component.id);
  const currentTotals = calculateSubsystemTotals(design);

  // Calculate consequence delta (hypothetical design if toggled)
  const hypotheticalComponents = { ...design.components };
  if (isMounted) {
    hypotheticalComponents[component.category] = (hypotheticalComponents[component.category] || []).filter(
      (c) => c.id !== component.id
    );
  } else {
    hypotheticalComponents[component.category] = [
      ...(hypotheticalComponents[component.category] || []),
      component
    ];
  }
  const hypotheticalTotals = calculateSubsystemTotals({
    ...design,
    components: hypotheticalComponents
  });

  const deltaMass = hypotheticalTotals.totalWetMassKg - currentTotals.totalWetMassKg;
  const deltaPower = hypotheticalTotals.powerConsumptionW - currentTotals.powerConsumptionW;
  const deltaCost = hypotheticalTotals.totalCostM - currentTotals.totalCostM;
  const deltaDeltaV = hypotheticalTotals.totalDeltaVMs - currentTotals.totalDeltaVMs;
  const deltaScience = hypotheticalTotals.sciencePotential - currentTotals.sciencePotential;

  // Effects list
  const effects: Array<{ label: string; isPositive: boolean }> = [];
  if (component.category === 'power') {
    if (component.powerDrawW < 0) {
      effects.push({ label: `+${Math.abs(component.powerDrawW)}W Solar Generation`, isPositive: true });
    } else {
      effects.push({ label: `-${component.powerDrawW}W Continuous Bus Load`, isPositive: false });
    }
    if (component.storageCapacityMb) {
      effects.push({ label: `+${component.storageCapacityMb / 1024} GB Solid-State Memory`, isPositive: true });
    }
  } else if (component.category === 'propulsion') {
    if (component.ispSec) {
      effects.push({ label: `${component.ispSec}s Specific Impulse efficiency`, isPositive: true });
    }
    if (deltaDeltaV !== 0) {
      effects.push({
        label: `${deltaDeltaV > 0 ? '+' : ''}${Math.round(deltaDeltaV)} m/s Mission Δv`,
        isPositive: deltaDeltaV > 0
      });
    }
  } else if (component.category === 'communications') {
    if (component.dataRateKbps > 0) {
      effects.push({ label: `+${component.dataRateKbps} kbps Earth Downlink Rate`, isPositive: true });
    }
  } else if (component.category === 'science') {
    if (component.scienceYield > 0) {
      effects.push({ label: `+${component.scienceYield} Scientific Survey Points`, isPositive: true });
    }
  }

  // Common penalties
  effects.push({ label: `${isMounted ? '-' : '+'}${component.massKg} kg Spacecraft Wet Mass`, isPositive: isMounted });
  effects.push({ label: `${isMounted ? '-' : '+'}$${component.costM}M Discovery Budget`, isPositive: isMounted });

  return (
    <div className="mission-panel p-4 flex flex-col justify-between h-full animate-fadeIn border border-[#293342]">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-[#293342]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">
                {component.category} MODULE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-space-850 text-txt-secondary border border-[#293342]">
                {component.tier.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h3 className="text-base font-heading font-bold text-white">
              {component.name}
            </h3>
          </div>

          {isMounted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <Check className="w-3 h-3" />
              INSTALLED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-space-850 border border-[#293342] text-txt-muted">
              NOT INSTALLED
            </span>
          )}
        </div>

        {/* Technical Telemetry Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-xs font-mono">
          <div className="bg-space-850 p-2 rounded border border-[#232D3E]">
            <span className="text-[10px] text-txt-muted block">Mass</span>
            <span className="text-white font-semibold">{component.massKg} kg</span>
          </div>
          <div className="bg-space-850 p-2 rounded border border-[#232D3E]">
            <span className="text-[10px] text-txt-muted block">Power</span>
            <span className={component.powerDrawW < 0 ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
              {component.powerDrawW < 0 ? `+${Math.abs(component.powerDrawW)}W` : `${component.powerDrawW}W`}
            </span>
          </div>
          <div className="bg-space-850 p-2 rounded border border-[#232D3E]">
            <span className="text-[10px] text-txt-muted block">Cost</span>
            <span className="text-white font-semibold">${component.costM}M</span>
          </div>
          <div className="bg-space-850 p-2 rounded border border-[#232D3E]">
            <span className="text-[10px] text-txt-muted block">Reliability</span>
            <span className="text-sky-300 font-semibold">{Math.round(component.reliability * 100)}%</span>
          </div>
        </div>

        {/* Live Consequence Preview (Before vs After) */}
        <div className="mb-4 bg-space-850 p-3 rounded-lg border border-[#232D3E]">
          <span className="text-[10px] font-mono text-txt-muted uppercase tracking-wider block mb-2">
            CONSEQUENCE PREVIEW ({isMounted ? 'IF REMOVED' : 'IF INSTALLED'})
          </span>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-txt-muted block">Mass Delta</span>
              <span className={`font-semibold ${deltaMass > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {deltaMass > 0 ? `+${deltaMass}` : deltaMass} kg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-txt-muted block">Budget Delta</span>
              <span className={`font-semibold ${deltaCost > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {deltaCost > 0 ? `+$${deltaCost.toFixed(1)}M` : `-$${Math.abs(deltaCost).toFixed(1)}M`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-txt-muted block">Science Delta</span>
              <span className={`font-semibold ${deltaScience >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {deltaScience > 0 ? `+${deltaScience}` : deltaScience} pts
              </span>
            </div>
          </div>
        </div>

        {/* Explicit Effects */}
        <div className="mb-4">
          <span className="text-[10px] font-mono text-txt-muted uppercase tracking-wider block mb-1.5">
            SUBSYSTEM EFFECTS
          </span>
          <div className="space-y-1">
            {effects.map((ef, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs font-mono text-txt-secondary"
              >
                <span className={`font-bold ${ef.isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {ef.isPositive ? '+' : '-'}
                </span>
                <span>{ef.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NASA Reference */}
        <div className="flex items-center gap-1.5 text-[11px] text-txt-muted border-t border-[#293342] pt-2.5">
          <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">Flight Heritage: {component.nasaReference.missionUsed}</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-3 border-t border-[#293342] mt-2">
        {isMounted ? (
          <button
            type="button"
            onClick={() => onDismount(component.category, component.id)}
            className="w-full py-2.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>REMOVE FROM SPACECRAFT</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMount(component)}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-sky-950/50 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>INSTALL COMPONENT</span>
          </button>
        )}
      </div>
    </div>
  );
};
