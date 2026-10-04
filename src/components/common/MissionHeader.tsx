import React from 'react';
import {
  Rocket,
  ShieldCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HelpCircle
} from 'lucide-react';
import type { InterfaceMode } from '../../types/mission.ts';
import { ModeToggle } from './ModeToggle.tsx';

interface MissionHeaderProps {
  missionName: string;
  phaseLabel: string;
  statusText: 'NOMINAL' | 'STABLE' | 'DEGRADED' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  metText?: string;
  utcTime: string;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  interfaceMode: InterfaceMode;
  onToggleMode: (mode: InterfaceMode) => void;
  onResetNominal?: () => void;
  onLoadBudgetPreset?: () => void;
  onOpenStressTest?: () => void;
  onLaunch?: () => void;
  isLaunchAllowed?: boolean;
  onOpenHowToPlay?: () => void;
}

export const MissionHeader: React.FC<MissionHeaderProps> = ({
  missionName,
  phaseLabel,
  statusText,
  metText,
  utcTime,
  isAudioMuted,
  onToggleAudio,
  interfaceMode,
  onToggleMode,
  onResetNominal,
  onLoadBudgetPreset,
  onOpenStressTest,
  onLaunch,
  isLaunchAllowed = true,
  onOpenHowToPlay
}) => {
  const getStatusColor = () => {
    switch (statusText) {
      case 'NOMINAL':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'STABLE':
        return 'text-sky-300 bg-sky-950/60 border-sky-500/40';
      case 'WARNING':
      case 'DEGRADED':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      case 'CRITICAL':
        return 'text-red-400 bg-red-950/60 border-red-500/40';
      default:
        return 'text-[#6F7B8C] bg-space-850 border-[#293342]';
    }
  };

  return (
    <header className="bg-[#080B12] border-b border-[#293342] px-6 py-2.5 sticky top-0 z-40">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Mission Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#151B26] border border-sky-500/30 flex items-center justify-center text-sky-400 font-mono font-bold text-xs shadow-sm">
            LL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-heading font-bold text-white tracking-wider">
                {missionName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151B26] text-sky-300 border border-[#293342]">
                101955 BENNU
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#AAB4C3]">
              <span>{phaseLabel}</span>
              <span className="text-[#6F7B8C]">•</span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[10px] font-bold ${getStatusColor()}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {statusText}
              </span>
              {metText && (
                <>
                  <span className="text-[#6F7B8C]">•</span>
                  <span className="text-white font-medium">{metText}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Live UTC Clock & Telemetry Heartbeat */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0D111A] border border-[#293342] text-xs font-mono text-[#AAB4C3]">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-white font-semibold">{utcTime}</span>
          </div>
        </div>

        {/* Right: Quick Actions & Settings */}
        <div className="flex items-center gap-2">
          {/* Preset Buttons (when in design mode) */}
          {onResetNominal && onLoadBudgetPreset && (
            <div className="hidden lg:flex items-center gap-1.5 bg-[#0D111A] p-0.5 rounded-lg border border-[#293342]">
              <button
                type="button"
                onClick={onResetNominal}
                className="px-2.5 py-1 text-[11px] font-mono rounded text-[#AAB4C3] hover:text-white hover:bg-space-750 transition-colors"
                title="Reset to balanced flight-ready configuration"
              >
                Nominal
              </button>
              <button
                type="button"
                onClick={onLoadBudgetPreset}
                className="px-2.5 py-1 text-[11px] font-mono rounded text-[#AAB4C3] hover:text-white hover:bg-space-750 transition-colors"
                title="Load budget-conscious configuration with engineering trade-offs"
              >
                Budget Scout
              </button>
            </div>
          )}

          {/* Stress Test Action */}
          {onOpenStressTest && (
            <button
              type="button"
              onClick={onOpenStressTest}
              className="px-3 py-1.5 rounded-lg text-xs font-mono border border-sky-500/30 bg-[#151B26] hover:bg-space-750 text-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Run pre-flight simulations against 8 authentic space hazards"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Stress Test</span>
            </button>
          )}

          {/* Launch Mission Primary Action */}
          {onLaunch && (
            <button
              type="button"
              onClick={onLaunch}
              disabled={!isLaunchAllowed}
              className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isLaunchAllowed
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/50 active:scale-95'
                  : 'bg-[#151B26] text-[#6F7B8C] border border-[#293342] cursor-not-allowed'
              }`}
              title={isLaunchAllowed ? 'Commit spacecraft to launch pad' : 'Fix hard engineering violations before launch'}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>LAUNCH</span>
            </button>
          )}

          {/* Help Button */}
          {onOpenHowToPlay && (
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="p-1.5 rounded-lg border border-[#293342] bg-[#0D111A] text-[#AAB4C3] hover:text-white hover:bg-space-750 transition-colors cursor-pointer"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleAudio}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isAudioMuted
                ? 'border-[#293342] bg-[#0D111A] text-[#6F7B8C]'
                : 'border-sky-500/40 bg-sky-950/40 text-sky-300'
            }`}
            title={isAudioMuted ? 'Unmute mission audio' : 'Mute mission audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Mode Toggle */}
          <ModeToggle mode={interfaceMode} onToggle={onToggleMode} />
        </div>
      </div>
    </header>
  );
};
