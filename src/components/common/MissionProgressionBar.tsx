import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import type { MissionStage } from '../../types/mission.ts';

export type OverallMissionPhase =
  | 'brief'
  | 'design'
  | 'test'
  | 'launch'
  | 'cruise'
  | 'rendezvous'
  | 'science'
  | 'transmission'
  | 'debrief';

interface MissionProgressionBarProps {
  currentPhase: OverallMissionPhase;
  onPhaseSelect?: (phase: OverallMissionPhase) => void;
  allowNavToDesign?: boolean;
}

const PHASES: Array<{ id: OverallMissionPhase; label: string; stageKey?: MissionStage }> = [
  { id: 'brief', label: 'BRIEF' },
  { id: 'design', label: 'DESIGN' },
  { id: 'test', label: 'TEST' },
  { id: 'launch', label: 'LAUNCH', stageKey: 'launch' },
  { id: 'cruise', label: 'CRUISE', stageKey: 'cruise' },
  { id: 'rendezvous', label: 'RENDEZVOUS', stageKey: 'approach' },
  { id: 'science', label: 'SCIENCE', stageKey: 'science_operations' },
  { id: 'transmission', label: 'TRANSMISSION', stageKey: 'communication_pass' },
  { id: 'debrief', label: 'DEBRIEF', stageKey: 'mission_conclusion' },
];

export const MissionProgressionBar: React.FC<MissionProgressionBarProps> = ({
  currentPhase,
  onPhaseSelect,
  allowNavToDesign
}) => {
  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);

  return (
    <div className="w-full bg-[#0D111A] border-b border-[#293342] px-6 py-2 overflow-x-auto select-none">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between min-w-[760px]">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono uppercase text-[#6F7B8C] mr-2 tracking-wider">
            TIMELINE:
          </span>

          {PHASES.map((p, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;

            const isClickable =
              Boolean(onPhaseSelect) &&
              ((p.id === 'design' && allowNavToDesign && currentIndex > 1) ||
                (p.id === 'brief' && currentIndex <= 2));

            return (
              <React.Fragment key={p.id}>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onPhaseSelect?.(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                    isCurrent
                      ? 'bg-sky-500/15 border border-sky-400 text-sky-200 font-bold shadow-sm'
                      : isCompleted
                      ? 'text-[#AAB4C3] hover:text-white border border-transparent'
                      : 'text-[#6F7B8C] border border-transparent'
                  } ${isClickable ? 'cursor-pointer hover:bg-space-750' : 'cursor-default'}`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent
                        ? 'bg-sky-400 text-[#080B12] font-bold'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-space-800 text-[#6F7B8C] border border-[#293342]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                  </span>
                  <span className="tracking-wide text-[11px]">{p.label}</span>
                </button>

                {idx < PHASES.length - 1 && (
                  <div
                    className={`w-4 lg:w-6 h-[1px] mx-0.5 ${
                      idx < currentIndex ? 'bg-emerald-500/40' : 'bg-[#293342]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Phase State Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#6F7B8C] text-[11px]">ACTIVE DIRECTIVE:</span>
          <span className="text-white font-medium">
            {currentPhase === 'brief' && 'Review target ephemeris & launch constraints'}
            {currentPhase === 'design' && 'Configure payload, bus & propulsion'}
            {currentPhase === 'test' && 'Stress-test hardware against space hazards'}
            {currentPhase === 'launch' && 'Liftoff & translunar/escape trajectory'}
            {currentPhase === 'cruise' && 'Heliocentric cruise to Bennu rendezvous'}
            {currentPhase === 'rendezvous' && 'Proximity operations & orbit insertion'}
            {currentPhase === 'science' && 'Scientific survey & instrument scans'}
            {currentPhase === 'transmission' && 'DSN downlink pass & data recovery'}
            {currentPhase === 'debrief' && 'Mission post-flight review'}
          </span>
        </div>
      </div>
    </div>
  );
};
