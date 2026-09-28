import React, { useState } from 'react';
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
  AlertTriangle,
  BookOpen,
  Search,
  Check
} from 'lucide-react';
import type { SpacecraftDesign, SpacecraftComponent, SubsystemCategory } from '../../types/subsystems.ts';
import { COMPONENT_CATALOG } from '../../data/components.ts';
import { playTelemetryClick, playSuccessChime } from '../../utils/audio.ts';

interface ComponentSelectorProps {
  design: SpacecraftDesign;
  onAddComponent: (component: SpacecraftComponent) => void;
  onRemoveComponent: (category: SubsystemCategory, componentId: string) => void;
}

const CATEGORIES: Array<{ id: SubsystemCategory; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'power', label: 'Power', icon: Zap },
  { id: 'propulsion', label: 'Propulsion', icon: Flame },
  { id: 'communications', label: 'Comms', icon: Radio },
  { id: 'navigation', label: 'Navigation', icon: Compass },
  { id: 'computing', label: 'Computing', icon: Cpu },
  { id: 'thermal', label: 'Thermal', icon: Thermometer },
  { id: 'science', label: 'Science', icon: Microscope },
  { id: 'structure', label: 'Structure', icon: Box },
];

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  design,
  onAddComponent,
  onRemoveComponent
}) => {
  const [activeCategory, setActiveCategory] = useState<SubsystemCategory>('power');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categoryComponents = COMPONENT_CATALOG.filter((c) => c.category === activeCategory);
  const availableComponents = searchQuery.trim()
    ? COMPONENT_CATALOG.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categoryComponents;

  const selectedComponents = design.components[activeCategory] || [];

  const handleMount = (comp: SpacecraftComponent) => {
    playSuccessChime();
    onAddComponent(comp);
  };

  const handleUnmount = (cat: SubsystemCategory, id: string) => {
    playTelemetryClick();
    onRemoveComponent(cat, id);
  };

  return (
    <div className="glass-panel hud-corner rounded-2xl p-4 flex flex-col h-full overflow-hidden shadow-2xl">
      {/* Header Strip */}
      <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2.5">
        <h2 className="text-sm font-heading font-semibold text-white tracking-wide uppercase flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          Subsystem Catalog
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
          8 CATEGORIES
        </span>
      </div>

      {/* Quick Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search components or specs..."
          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="grid grid-cols-4 gap-1.5 mb-3.5">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const count = (design.components[id] || []).length;
            const isActive = activeCategory === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  playTelemetryClick();
                  setActiveCategory(id);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-mono transition-all border ${
                  isActive
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="text-[11px]">{label}</span>
                </div>
                <span
                  className={`text-[9px] mt-0.5 px-1.5 py-0.2 rounded-full font-bold ${
                    count > 0 ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Mounted on Bus Banner */}
      {!searchQuery && selectedComponents.length > 0 && (
        <div className="mb-3.5 bg-slate-950/70 rounded-xl p-2.5 border border-cyan-500/25">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>Mounted on Bus:</span>
            <span className="text-cyan-300 font-bold">{selectedComponents.length} UNITS</span>
          </span>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {selectedComponents.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="text-white font-medium truncate">{item.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {item.massKg} kg | ${item.costM}M | {item.powerDrawW < 0 ? `+${Math.abs(item.powerDrawW)}W gen` : `${item.powerDrawW}W`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnmount(activeCategory, item.id)}
                  className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/50 transition-colors shrink-0"
                  title="Remove from bus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Component Catalog Cards */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
        {availableComponents.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-400">
            No components matched your search filter.
          </div>
        ) : (
          availableComponents.map((comp) => {
            const isSelected = (design.components[comp.category] || []).some((c) => c.id === comp.id);

            return (
              <div
                key={comp.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-500/50 ring-1 ring-cyan-500/30 shadow-md'
                    : 'bg-slate-950/75 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h3 className="text-xs font-semibold text-white leading-tight">
                      {comp.name}
                    </h3>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mt-0.5">
                      Tier: {comp.tier.replace('_', ' ')}
                    </span>
                  </div>

                  {isSelected ? (
                    <button
                      type="button"
                      onClick={() => handleUnmount(comp.category, comp.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-lg bg-emerald-950/80 hover:bg-red-950/80 border border-emerald-500/50 hover:border-red-500/50 text-emerald-300 hover:text-red-300 transition-all shrink-0 group"
                      title="Click to remove from spacecraft bus"
                    >
                      <Check className="w-3 h-3 text-emerald-400 group-hover:hidden" />
                      <Trash2 className="w-3 h-3 text-red-400 hidden group-hover:inline" />
                      <span className="group-hover:hidden">Mounted</span>
                      <span className="hidden group-hover:inline">Dismount</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMount(comp)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-950/50 active:scale-95 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Mount</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                  {comp.description}
                </p>

                {/* Trade-off Badges Grid */}
                <div className="grid grid-cols-3 gap-1 mb-2 font-mono text-[10px]">
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                    Mass: <span className="text-white font-semibold">{comp.massKg} kg</span>
                  </div>
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                    Cost: <span className="text-white font-semibold">${comp.costM}M</span>
                  </div>
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                    Power: <span className={comp.powerDrawW < 0 ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
                      {comp.powerDrawW < 0 ? `+${Math.abs(comp.powerDrawW)}W` : `${comp.powerDrawW}W`}
                    </span>
                  </div>
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                    Rel: <span className="text-cyan-300 font-semibold">{Math.round(comp.reliability * 100)}%</span>
                  </div>
                  {comp.scienceYield > 0 && (
                    <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                      Science: <span className="text-emerald-300 font-semibold">+{comp.scienceYield} pts</span>
                    </div>
                  )}
                  {comp.dataRateKbps > 0 && (
                    <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                      Data: <span className="text-blue-300 font-semibold">{comp.dataRateKbps} kbps</span>
                    </div>
                  )}
                  {comp.ispSec && (
                    <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                      Isp: <span className="text-amber-400 font-semibold">{comp.ispSec}s</span>
                    </div>
                  )}
                  {comp.storageCapacityMb && (
                    <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                      Storage: <span className="text-indigo-300 font-semibold">{comp.storageCapacityMb / 1024} GB</span>
                    </div>
                  )}
                  <div className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
                    Rad: <span className="text-purple-300 font-semibold">{comp.radiationToleranceKrad} krad</span>
                  </div>
                </div>

                {/* NASA Reference Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span className="flex items-center gap-1 text-slate-400 truncate max-w-[200px]" title={comp.nasaReference.citation}>
                    <BookOpen className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{comp.nasaReference.missionUsed}</span>
                  </span>
                  {comp.riskModifiers.singlePointOfFailure && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-mono text-[9px] bg-amber-950/40 px-1 rounded border border-amber-800/30">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>SPOF</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
