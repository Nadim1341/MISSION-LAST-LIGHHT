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
  Check,
  Search,
  ChevronRight,
  Shield,
  Info
} from 'lucide-react';
import type { SpacecraftDesign, SpacecraftComponent, SubsystemCategory } from '../../types/subsystems.ts';
import { COMPONENT_CATALOG } from '../../data/components.ts';
import { playTelemetryClick, playSuccessChime } from '../../utils/audio.ts';

interface ComponentSelectorProps {
  design: SpacecraftDesign;
  onAddComponent: (component: SpacecraftComponent) => void;
  onRemoveComponent: (category: SubsystemCategory, componentId: string) => void;
  selectedComponent: SpacecraftComponent | null;
  onSelectComponent: (component: SpacecraftComponent) => void;
  activeCategory: SubsystemCategory;
  onSelectCategory: (cat: SubsystemCategory) => void;
}

const CATEGORIES: Array<{
  id: SubsystemCategory;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'power', name: 'Power Bus', role: 'Solar Arrays & Batteries', icon: Zap },
  { id: 'propulsion', name: 'Propulsion', role: 'Chemical & Ion Thrusters', icon: Flame },
  { id: 'communications', name: 'Communications', role: 'High-Gain Dish & LGA', icon: Radio },
  { id: 'science', name: 'Science Payload', role: 'Spectrometers & LIDAR', icon: Microscope },
  { id: 'computing', name: 'Flight Computer', role: 'RAD-Hardened Avionics', icon: Cpu },
  { id: 'thermal', name: 'Thermal Control', role: 'MLI Blankets & Heaters', icon: Thermometer },
  { id: 'navigation', name: 'Attitude & GNC', role: 'Star Trackers & IMUs', icon: Compass },
  { id: 'structure', name: 'Bus Structure', role: 'Composite Frame & Whipple', icon: Box },
];

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  design,
  onAddComponent,
  onRemoveComponent,
  selectedComponent,
  onSelectComponent,
  activeCategory,
  onSelectCategory
}) => {
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

  const currentCategoryInfo = CATEGORIES.find((c) => c.id === activeCategory);
  const installedInCategory = design.components[activeCategory] || [];

  return (
    <div className="mission-panel p-3 sm:p-3.5 flex flex-col h-full overflow-y-auto border border-[#293342] text-xs font-mono">
      {/* Step Instruction Helper */}
      <div className="pb-2.5 mb-2.5 border-b border-[#293342]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
            STEP 1: SELECT SUBSYSTEM
          </span>
          <span className="text-[10px] text-[#6F7B8C]">
            Click category, then click [+ EQUIP]
          </span>
        </div>

        {/* 2-Column Category Grid with Full Names & Status Indicators */}
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {CATEGORIES.map((cat) => {
            const count = (design.components[cat.id] || []).length;
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  playTelemetryClick();
                  onSelectCategory(cat.id);
                  const first = COMPONENT_CATALOG.find((c) => c.category === cat.id);
                  if (first) onSelectComponent(first);
                }}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-[#1B2330] border-sky-400 text-white shadow-sm ring-1 ring-sky-500/30'
                    : 'bg-[#0D111A] border-[#293342] text-[#AAB4C3] hover:text-white hover:border-[#37465B] hover:bg-[#151B26]'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-[#6F7B8C]'}`} />
                  <div className="truncate">
                    <span className="font-semibold block truncate leading-tight">{cat.name}</span>
                    <span className="text-[9px] text-[#6F7B8C] block truncate">{cat.role}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                    count > 0
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-950/50 text-amber-400 border border-amber-500/30'
                  }`}
                  title={`${count} units installed`}
                >
                  {count > 0 ? `${count} ON` : 'NONE'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Currently Installed in Selected Category Strip */}
      <div className="bg-[#0D111A] p-2.5 rounded-lg border border-[#232D3E] mb-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#6F7B8C] uppercase font-bold">
            EQUIPPED IN {currentCategoryInfo?.name.toUpperCase()}:
          </span>
          <span className="text-emerald-400 text-[10px] font-bold">
            {installedInCategory.length} COMPONENT{installedInCategory.length !== 1 ? 'S' : ''}
          </span>
        </div>

        {installedInCategory.length === 0 ? (
          <div className="p-2 text-center text-amber-300 bg-amber-950/20 border border-amber-500/20 rounded text-[11px]">
            ⚠️ No component equipped for this subsystem! Click [+ EQUIP] below.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {installedInCategory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-[#151B26] px-2.5 py-1.5 rounded border border-[#293342] text-[11px]"
              >
                <div className="truncate pr-2">
                  <span className="text-white font-medium block truncate">{item.name}</span>
                  <span className="text-[10px] text-sky-300">
                    {item.massKg} kg | ${item.costM}M | {item.powerDrawW < 0 ? `+${Math.abs(item.powerDrawW)}W gen` : `${item.powerDrawW}W load`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTelemetryClick();
                    onRemoveComponent(activeCategory, item.id);
                  }}
                  className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                  title="Remove from spacecraft"
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-2">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-txt-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${currentCategoryInfo?.name || 'hardware'}...`}
          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-space-900 border border-[#293342] text-xs font-mono text-[#F3F6FA] placeholder-[#6F7B8C] focus:outline-none focus:border-sky-500/60 transition-colors"
        />
      </div>

      {/* Available Component Cards List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {availableComponents.map((comp) => {
          const isInstalled = (design.components[comp.category] || []).some((c) => c.id === comp.id);
          const isSelected = selectedComponent?.id === comp.id;

          return (
            <div
              key={comp.id}
              onClick={() => onSelectComponent(comp)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1B2330] border-sky-400 ring-1 ring-sky-500/40 shadow-md'
                  : isInstalled
                  ? 'bg-[#151B26] border-emerald-500/40'
                  : 'bg-[#0D111A] border-[#293342] hover:border-[#37465B] hover:bg-[#151B26]'
              }`}
            >
              {/* Title & Quick Status */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="text-xs font-heading font-semibold text-white leading-tight">
                    {comp.name}
                  </h4>
                  <span className="text-[10px] text-[#6F7B8C] block uppercase mt-0.5">
                    {comp.tier.replace('_', ' ')} • {comp.category}
                  </span>
                </div>

                {isInstalled ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playTelemetryClick();
                      onRemoveComponent(comp.category, comp.id);
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-red-950/80 border border-emerald-500/50 hover:border-red-500/50 text-emerald-300 hover:text-red-300 text-[10px] font-bold transition-all cursor-pointer shrink-0"
                    title="Click to remove"
                  >
                    ✓ EQUIPPED
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSuccessChime();
                      onAddComponent(comp);
                    }}
                    className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                    title="Click to install"
                  >
                    + EQUIP
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#AAB4C3] leading-relaxed mb-2">
                {comp.description}
              </p>

              {/* Spec Highlights Grid */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-txt-secondary bg-space-850 p-1.5 rounded border border-[#293342]">
                <div>
                  Mass: <span className="text-white font-semibold">{comp.massKg} kg</span>
                </div>
                <div>
                  Power:{' '}
                  <span className={comp.powerDrawW < 0 ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
                    {comp.powerDrawW < 0 ? `+${Math.abs(comp.powerDrawW)}W` : `${comp.powerDrawW}W`}
                  </span>
                </div>
                <div>
                  Cost: <span className="text-white font-semibold">${comp.costM}M</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
