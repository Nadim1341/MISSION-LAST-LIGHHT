import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Shield,
  Radio,
  Zap,
  Flame,
  Thermometer,
  Microscope,
  Compass,
  Cpu,
  Box,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Activity,
  Layers,
  Sparkles,
  Send,
  Sliders,
  FileText
} from 'lucide-react';
import type { SpacecraftDesign, SubsystemCategory } from '../../types/subsystems.ts';
import type { LaunchVehicle } from '../../types/launcher.ts';
import type { ScenarioDefinition, MissionTelemetry, MissionStage, InterfaceMode } from '../../types/mission.ts';
import type { ForeshadowedEvent, PlayerActionType, EventConsequenceResolution, PlayerDesignHistory } from '../../types/events.ts';
import {
  advanceSimulationTick,
  applyEventConsequenceToTelemetry,
  getUpcomingOrActiveEvent,
  getForeshadowedEventAdvisories
} from '../../simulation/engine.ts';
import {
  FORESHADOWED_MISSION_EVENTS,
  resolveEventConsequence
} from '../../simulation/events.ts';
import { MissionHeader } from '../common/MissionHeader.tsx';
import { MissionProgressionBar, OverallMissionPhase } from '../common/MissionProgressionBar.tsx';
import { CompactTelemetryPanel } from './CompactTelemetryPanel.tsx';
import { InteractiveSpaceCanvas } from './InteractiveSpaceCanvas.tsx';
import { PowerManagementPanel, PowerAllocations } from './PowerManagementPanel.tsx';
import { CommsPanel } from './CommsPanel.tsx';
import { ScienceOpsPanel } from './ScienceOpsPanel.tsx';
import { EventTriageModal } from './EventTriageModal.tsx';
import { DiscoveryModal, MissionDiscovery } from './DiscoveryModal.tsx';
import { playTelemetryClick, playWarningAlert, playSuccessChime, toggleAudio, isAudioMuted } from '../../utils/audio.ts';

interface SimulationViewProps {
  design: SpacecraftDesign;
  launcher: LaunchVehicle;
  scenario: ScenarioDefinition;
  initialTelemetry: MissionTelemetry;
  designHistory: PlayerDesignHistory;
  onMissionComplete: (
    finalTelemetry: MissionTelemetry,
    eventResolutions: Array<{ eventId: string; causalHeadline: string; causalDetail: string; actionTaken: string }>
  ) => void;
  onAbortToDesigner: () => void;
}

type RightPanelTab = 'events' | 'power' | 'comms' | 'science';

export const MissionSimulationView: React.FC<SimulationViewProps> = ({
  design,
  launcher,
  scenario,
  initialTelemetry,
  designHistory,
  onMissionComplete,
  onAbortToDesigner
}) => {
  const [telemetry, setTelemetry] = useState<MissionTelemetry>(initialTelemetry);
  const [prevTelemetry, setPrevTelemetry] = useState<MissionTelemetry | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 5x, 20x, 100x
  const [resolvedEventIds, setResolvedEventIds] = useState<string[]>([]);
  const [eventResolutions, setEventResolutions] = useState<
    Array<{ eventId: string; causalHeadline: string; causalDetail: string; actionTaken: string }>
  >([]);

  // Right Console Active Tab
  const [activeTab, setActiveTab] = useState<RightPanelTab>('events');

  // Orbit Visualization Mode: 'heliocentric' vs 'proximity'
  const [orbitViewMode, setOrbitViewMode] = useState<'heliocentric' | 'proximity'>('heliocentric');

  // Interactive Power Allocations
  const [powerAllocations, setPowerAllocations] = useState<PowerAllocations>({
    communications: 80,
    science: 60,
    thermal: 90,
    computing: 70
  });

  // Active Transmit / Scan Animation State
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Active Discovery State
  const [activeDiscovery, setActiveDiscovery] = useState<MissionDiscovery | null>(null);

  // Active Anomaly Triage State
  const [activeEvent, setActiveEvent] = useState<ForeshadowedEvent | null>(null);
  const [activeResolution, setActiveResolution] = useState<EventConsequenceResolution | null>(null);

  // Audio & Interface Mode state
  const [muted, setMuted] = useState<boolean>(isAudioMuted());
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('commander');
  const [utcTime, setUtcTime] = useState<string>('');

  const missionCompleteFiredRef = useRef(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ')[4] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerMissionCompletion = (finalTelemetry: MissionTelemetry) => {
    if (missionCompleteFiredRef.current) return;
    missionCompleteFiredRef.current = true;
    setIsPlaying(false);
    onMissionComplete(finalTelemetry, eventResolutions);
  };

  // Top-level completion watcher
  useEffect(() => {
    if (telemetry.currentStage === 'mission_conclusion' || telemetry.spacecraftHealth <= 0) {
      triggerMissionCompletion(telemetry);
    }
  }, [telemetry.currentStage, telemetry.spacecraftHealth]);

  // Check for triggerable events & auto-slowdown
  useEffect(() => {
    if (activeEvent || activeResolution || missionCompleteFiredRef.current) return;

    const upcomingEvent = getUpcomingOrActiveEvent(telemetry, resolvedEventIds, FORESHADOWED_MISSION_EVENTS);
    if (upcomingEvent) {
      // Auto pause simulation and trigger alert
      playWarningAlert();
      setIsPlaying(false);
      setActiveEvent(upcomingEvent);
      setActiveTab('events');
    }
  }, [telemetry.missionElapsedTimeDays, resolvedEventIds, activeEvent, activeResolution]);

  // Simulation Tick Loop
  useEffect(() => {
    if (!isPlaying || activeEvent || activeResolution || missionCompleteFiredRef.current) return;

    if (telemetry.currentStage === 'mission_conclusion' || telemetry.spacecraftHealth <= 0) {
      triggerMissionCompletion(telemetry);
      return;
    }

    const intervalTimeMs = 80;
    // Map simSpeed to days progressed per tick
    const deltaDays = (0.22 * simSpeed * intervalTimeMs) / 1000;

    const timer = setInterval(() => {
      setTelemetry((prev) => {
        setPrevTelemetry(prev);
        const next = advanceSimulationTick(prev, design, scenario, deltaDays);
        if (next.currentStage === 'mission_conclusion' || next.spacecraftHealth <= 0) {
          triggerMissionCompletion(next);
        }
        return next;
      });
    }, intervalTimeMs);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed, activeEvent, activeResolution, telemetry, design, scenario]);

  // Action: Maneuver Burn
  const handleManeuverBurn = () => {
    if (telemetry.propellantRemainingKg <= 5) return;
    playTelemetryClick();
    setTelemetry((prev) => ({
      ...prev,
      propellantRemainingKg: Math.max(0, prev.propellantRemainingKg - 15),
      deltaVRemainingMs: Math.max(0, prev.deltaVRemainingMs - 45)
    }));
  };

  // Action: Toggle Safe Mode
  const handleToggleSafeMode = () => {
    playTelemetryClick();
    setTelemetry((prev) => ({
      ...prev,
      safeModeEngaged: !prev.safeModeEngaged
    }));
  };

  // Action: Manual Transmit Downlink
  const handleManualTransmit = () => {
    if (!telemetry.isInDsnWindow || telemetry.dataBufferUsedMb <= 0 || isTransmitting) return;
    playSuccessChime();
    setIsTransmitting(true);

    setTimeout(() => {
      setTelemetry((prev) => {
        const transmitted = Math.min(prev.dataBufferUsedMb, 1200);
        return {
          ...prev,
          dataBufferUsedMb: Math.max(0, prev.dataBufferUsedMb - transmitted),
          scienceDataTransmitted: prev.scienceDataTransmitted + transmitted
        };
      });
      setIsTransmitting(false);
    }, 1500);
  };

  // Action: Execute Scientific Scan
  const handleExecuteScan = (scanType: 'camera' | 'spectrometer' | 'radar') => {
    if (telemetry.safeModeEngaged || isScanning) return;
    playTelemetryClick();
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      playSuccessChime();

      let scienceGain = 8;
      let dataMb = 450;
      if (scanType === 'spectrometer') {
        scienceGain = 14;
        dataMb = 700;
      } else if (scanType === 'radar') {
        scienceGain = 18;
        dataMb = 950;
      }

      setTelemetry((prev) => ({
        ...prev,
        rawScienceCollected: prev.rawScienceCollected + scienceGain,
        dataBufferUsedMb: Math.min(prev.dataBufferMaxMb, prev.dataBufferUsedMb + dataMb)
      }));

      // 40% probability of triggering discovery moment
      if (Math.random() > 0.6) {
        setActiveDiscovery({
          id: `disc_${Date.now()}`,
          title: scanType === 'spectrometer'
            ? 'Hydrated Clay Spectral Absorption Feature'
            : scanType === 'camera'
            ? 'Regolith Boulder Breccia Anomaly'
            : 'Sub-surface Density Radar Inversion',
          description: 'Autonomous instrument telemetry detected an unexpected geological variation matching primordial organic-rich chondritic matter.',
          scienceValue: 15,
          dataGeneratedMb: 350,
          anomalyType: 'mineralogy'
        });
      }
    }, 1200);
  };

  // Discovery Actions
  const handleInvestigateDiscovery = (disc: MissionDiscovery) => {
    playSuccessChime();
    setTelemetry((prev) => ({
      ...prev,
      rawScienceCollected: prev.rawScienceCollected + disc.scienceValue + 5,
      dataBufferUsedMb: Math.min(prev.dataBufferMaxMb, prev.dataBufferUsedMb + disc.dataGeneratedMb)
    }));
    setActiveDiscovery(null);
  };

  const handleTransmitDiscovery = (disc: MissionDiscovery) => {
    playSuccessChime();
    setTelemetry((prev) => ({
      ...prev,
      rawScienceCollected: prev.rawScienceCollected + disc.scienceValue,
      scienceDataTransmitted: prev.scienceDataTransmitted + disc.dataGeneratedMb
    }));
    setActiveDiscovery(null);
  };

  // Event Resolution Handler
  const handleSelectAction = (actionType: PlayerActionType) => {
    if (!activeEvent) return;

    const resolution = resolveEventConsequence(
      activeEvent,
      actionType,
      design,
      telemetry,
      designHistory
    );

    setActiveResolution(resolution);

    const updatedTelemetry = applyEventConsequenceToTelemetry(telemetry, resolution, design);
    setTelemetry(updatedTelemetry);

    setResolvedEventIds((prev) => [...prev, activeEvent.id]);
    setEventResolutions((prev) => [
      ...prev,
      {
        eventId: activeEvent.id,
        causalHeadline: resolution.causalHeadline,
        causalDetail: resolution.causalDetail,
        actionTaken: actionType
      }
    ]);

    setActiveEvent(null);
  };

  const handleDismissResolution = () => {
    setActiveResolution(null);
    setIsPlaying(true);
  };

  // Map stage to progression phase
  const getOverallPhase = (): OverallMissionPhase => {
    switch (telemetry.currentStage) {
      case 'pre_launch':
        return 'brief';
      case 'launch':
        return 'launch';
      case 'orbit_insertion':
      case 'cruise':
        return 'cruise';
      case 'approach':
        return 'rendezvous';
      case 'science_operations':
        return 'science';
      case 'communication_pass':
        return 'transmission';
      case 'mission_conclusion':
        return 'debrief';
      default:
        return 'cruise';
    }
  };

  const currentPhase = getOverallPhase();

  // Standard status string
  const getMissionStatusString = (): 'NOMINAL' | 'STABLE' | 'DEGRADED' | 'WARNING' | 'CRITICAL' | 'OFFLINE' => {
    if (telemetry.spacecraftHealth <= 0) return 'OFFLINE';
    if (telemetry.spacecraftHealth < 30) return 'CRITICAL';
    if (telemetry.safeModeEngaged || telemetry.spacecraftHealth < 60) return 'WARNING';
    if (telemetry.spacecraftHealth < 80) return 'DEGRADED';
    if (telemetry.isThermalAnomaly) return 'WARNING';
    return 'NOMINAL';
  };

  const advisories = getForeshadowedEventAdvisories(
    telemetry,
    resolvedEventIds,
    FORESHADOWED_MISSION_EVENTS
  );

  return (
    <div className="min-h-screen bg-[#080B12] text-[#F3F6FA] flex flex-col select-none pb-8">
      {/* Top Persistent Mission Control Bar */}
      <MissionHeader
        missionName="ASTERIA-1"
        phaseLabel={telemetry.currentStage.replace('_', ' ').toUpperCase()}
        statusText={getMissionStatusString()}
        metText={`DAY ${telemetry.missionElapsedTimeDays.toFixed(1)} / ${scenario.baselineTimelineDays}`}
        utcTime={utcTime}
        isAudioMuted={muted}
        onToggleAudio={() => {
          const m = toggleAudio();
          setMuted(m);
        }}
        interfaceMode={interfaceMode}
        onToggleMode={setInterfaceMode}
      />

      {/* Horizontal Mission Progression Timeline */}
      <MissionProgressionBar
        currentPhase={currentPhase}
        allowNavToDesign={true}
        onPhaseSelect={(phase) => {
          if (phase === 'design') {
            setIsPlaying(false);
            onAbortToDesigner();
          }
        }}
      />

      {/* Contextual Foreshadowed Alert Bar (Non-blocking) */}
      {advisories.length > 0 && (
        <div className="bg-[#1B2330] border-b border-amber-500/40 px-6 py-2 text-xs font-mono text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span className="font-bold text-amber-400 uppercase tracking-wide">
              HAZARD APPROACHING:
            </span>
            <span>
              {advisories[0].title} — Projected intercept in ~
              {Math.max(1, Math.round(advisories[0].scheduledMetDay - telemetry.missionElapsedTimeDays))} days.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('events');
            }}
            className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold hover:bg-amber-900 transition-colors cursor-pointer text-[11px]"
          >
            REVIEW ADVISORY
          </button>
        </div>
      )}

      {/* Main 3-Zone Control Room Workspace */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 max-w-[1920px] mx-auto w-full">
        {/* Left Column: Compact Subsystem Status & Telemetry (3 cols) */}
        <div className="xl:col-span-3 xl:h-[calc(100vh-210px)] xl:min-h-[580px]">
          <CompactTelemetryPanel
            telemetry={telemetry}
            prevTelemetry={prevTelemetry}
          />
        </div>

        {/* Center Column: Dominant Interactive Space Canvas (5 cols) */}
        <div className="xl:col-span-5 xl:h-[calc(100vh-210px)] xl:min-h-[580px] flex flex-col">
          <InteractiveSpaceCanvas
            telemetry={telemetry}
            design={design}
            scenario={scenario}
            viewMode={orbitViewMode}
            onToggleViewMode={setOrbitViewMode}
            onInspectEntity={(entity) => {
              playTelemetryClick();
            }}
          />
        </div>

        {/* Right Column: Multi-Panel Operations Console (4 cols) */}
        <div className="xl:col-span-4 xl:h-[calc(100vh-210px)] xl:min-h-[580px] flex flex-col">
          {/* Tabs Bar */}
          <div className="flex items-center gap-1 mb-2 bg-[#0D111A] p-1 rounded-lg border border-[#293342]">
            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                setActiveTab('events');
              }}
              className={`flex-1 py-1.5 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-space-800 text-sky-300 border border-sky-400/40 shadow-sm'
                  : 'text-[#AAB4C3] hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>LOG ({eventResolutions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                setActiveTab('power');
              }}
              className={`flex-1 py-1.5 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'power'
                  ? 'bg-space-800 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-[#AAB4C3] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>POWER</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                setActiveTab('comms');
              }}
              className={`flex-1 py-1.5 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'comms'
                  ? 'bg-space-800 text-blue-300 border border-blue-400/40 shadow-sm'
                  : 'text-[#AAB4C3] hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>COMMS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                setActiveTab('science');
              }}
              className={`flex-1 py-1.5 rounded text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'science'
                  ? 'bg-space-800 text-purple-300 border border-purple-400/40 shadow-sm'
                  : 'text-[#AAB4C3] hover:text-white'
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>SCIENCE</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'events' && (
              <div className="mission-panel p-4 flex flex-col justify-between h-full border border-[#293342] text-xs font-mono">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#293342]">
                    <span className="text-[10px] text-[#6F7B8C] uppercase tracking-wider">
                      Flight Controller Decision Log
                    </span>
                    <span className="text-[10px] text-sky-400">
                      {eventResolutions.length} RECORDED
                    </span>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-340px)] pr-1">
                    {eventResolutions.length === 0 ? (
                      <div className="p-6 text-center text-[#6F7B8C]">
                        No flight anomalies logged. All subsystems operate within nominal cruise envelopes.
                      </div>
                    ) : (
                      eventResolutions.map((res, i) => (
                        <div
                          key={i}
                          className="bg-[#0D111A] border border-[#232D3E] p-3 rounded-lg flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between text-white font-semibold">
                            <span>{res.causalHeadline}</span>
                            <span className="text-[10px] text-sky-400 uppercase font-bold">
                              {res.actionTaken}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#AAB4C3] leading-relaxed">
                            {res.causalDetail}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#293342] text-[10px] text-[#6F7B8C]">
                  Every flight directive recorded here determines final mission debrief evaluation.
                </div>
              </div>
            )}

            {activeTab === 'power' && (
              <PowerManagementPanel
                telemetry={telemetry}
                allocations={powerAllocations}
                onChangeAllocation={(k, v) => setPowerAllocations((prev) => ({ ...prev, [k]: v }))}
                onBalanceNominal={() => setPowerAllocations({ communications: 80, science: 60, thermal: 90, computing: 70 })}
              />
            )}

            {activeTab === 'comms' && (
              <CommsPanel
                telemetry={telemetry}
                onManualTransmit={handleManualTransmit}
                isTransmittingActive={isTransmitting}
              />
            )}

            {activeTab === 'science' && (
              <ScienceOpsPanel
                telemetry={telemetry}
                design={design}
                onExecuteScan={handleExecuteScan}
                isScanning={isScanning}
              />
            )}
          </div>
        </div>
      </main>

      {/* Bottom Action Control Bar & Simulation Time Controls */}
      <footer className="bg-[#080B12] border-t border-[#293342] px-6 py-2.5 z-40">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Action Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManeuverBurn}
              disabled={telemetry.propellantRemainingKg <= 5}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                telemetry.propellantRemainingKg > 5
                  ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300 hover:bg-amber-900/80 active:scale-95'
                  : 'bg-space-850 text-[#6F7B8C] border border-[#293342] cursor-not-allowed'
              }`}
              title="Execute station-keeping delta-v maneuver burn"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>MANEUVER</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('science');
                handleExecuteScan('camera');
              }}
              disabled={telemetry.safeModeEngaged || isScanning}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-purple-950/70 border border-purple-500/40 text-purple-300 hover:bg-purple-900/80 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Acquire science observation of target"
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>OBSERVE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('comms');
                handleManualTransmit();
              }}
              disabled={!telemetry.isInDsnWindow || telemetry.dataBufferUsedMb <= 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                telemetry.isInDsnWindow && telemetry.dataBufferUsedMb > 0
                  ? 'bg-sky-950/70 border border-sky-500/40 text-sky-300 hover:bg-sky-900/80 active:scale-95'
                  : 'bg-space-850 text-[#6F7B8C] border border-[#293342] cursor-not-allowed'
              }`}
              title="Transmit collected data buffer to DSN"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>TRANSMIT</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSafeMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                telemetry.safeModeEngaged
                  ? 'bg-red-950 border border-red-500 text-red-300 animate-pulse'
                  : 'bg-space-850 border border-[#293342] text-[#AAB4C3] hover:text-white'
              }`}
              title="Toggle emergency low-power safe mode"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{telemetry.safeModeEngaged ? 'EXIT SAFE MODE' : 'SAFE MODE'}</span>
            </button>
          </div>

          {/* Right: Simulation Time Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-[#0D111A] p-1 rounded-lg border border-[#293342]">
              <button
                type="button"
                onClick={() => {
                  playTelemetryClick();
                  setIsPlaying(!isPlaying);
                }}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  isPlaying
                    ? 'bg-sky-600 text-white'
                    : 'bg-space-800 text-[#AAB4C3] hover:text-white'
                }`}
                title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <div className="w-[1px] h-4 bg-[#293342] mx-1" />

              {[1, 5, 20, 100].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => {
                    playTelemetryClick();
                    setSimSpeed(spd);
                  }}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                    simSpeed === spd
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400 font-bold'
                      : 'text-[#6F7B8C] hover:text-white'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onAbortToDesigner();
              }}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-[#293342] bg-[#151B26] hover:bg-space-750 text-[#AAB4C3] hover:text-white transition-colors cursor-pointer"
            >
              ABORT TO DESIGNER
            </button>
          </div>
        </div>
      </footer>

      {/* Playable Hazard Decision Triage Modal */}
      <EventTriageModal
        event={activeEvent}
        design={design}
        telemetry={telemetry}
        onSelectAction={handleSelectAction}
        activeResolution={activeResolution}
        onDismissResolution={handleDismissResolution}
      />

      {/* Discovery Moment Dialog */}
      <DiscoveryModal
        discovery={activeDiscovery}
        onInvestigate={handleInvestigateDiscovery}
        onTransmit={handleTransmitDiscovery}
        onIgnore={() => setActiveDiscovery(null)}
      />
    </div>
  );
};
