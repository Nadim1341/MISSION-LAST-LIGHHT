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
  Sparkles
} from 'lucide-react';
import type { SpacecraftDesign } from '../../types/subsystems.ts';
import type { LaunchVehicle } from '../../types/launcher.ts';
import type { ScenarioDefinition, MissionTelemetry, MissionStage } from '../../types/mission.ts';
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
import { EventTriageModal } from './EventTriageModal.tsx';
import { playTelemetryClick, playWarningAlert, playSuccessChime } from '../../utils/audio.ts';

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

const STAGES: Array<{ id: MissionStage; label: string }> = [
  { id: 'pre_launch', label: 'Pre-Launch' },
  { id: 'launch', label: 'Liftoff' },
  { id: 'orbit_insertion', label: 'Insertion' },
  { id: 'cruise', label: 'Heliocentric Cruise' },
  { id: 'approach', label: 'Approach' },
  { id: 'science_operations', label: 'Science Ops' },
  { id: 'communication_pass', label: 'DSN Downlink' },
  { id: 'mission_conclusion', label: 'Conclusion' }
];

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
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 5x, 25x, 100x
  const [resolvedEventIds, setResolvedEventIds] = useState<string[]>([]);
  const [eventResolutions, setEventResolutions] = useState<
    Array<{ eventId: string; causalHeadline: string; causalDetail: string; actionTaken: string }>
  >([]);

  // Orbit Visualization Mode: 'heliocentric' vs 'proximity'
  const [orbitViewMode, setOrbitViewMode] = useState<'heliocentric' | 'proximity'>('heliocentric');

  // Active Anomaly Triage State
  const [activeEvent, setActiveEvent] = useState<ForeshadowedEvent | null>(null);
  const [activeResolution, setActiveResolution] = useState<EventConsequenceResolution | null>(null);

  // Trajectory Canvas Ref & Animation state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animWaveOffsetRef = useRef(0);
  const missionCompleteFiredRef = useRef(false);

  const triggerMissionCompletion = (finalTelemetry: MissionTelemetry) => {
    if (missionCompleteFiredRef.current) return;
    missionCompleteFiredRef.current = true;
    setIsPlaying(false);
    onMissionComplete(finalTelemetry, eventResolutions);
  };

  // Top-level completion watcher (catches conclusion even if simulation is paused)
  useEffect(() => {
    if (telemetry.currentStage === 'mission_conclusion' || telemetry.spacecraftHealth <= 0) {
      triggerMissionCompletion(telemetry);
    }
  }, [telemetry.currentStage, telemetry.spacecraftHealth]);

  // Check for triggerable events whenever telemetry changes
  useEffect(() => {
    if (activeEvent || activeResolution || missionCompleteFiredRef.current) return;

    const upcomingEvent = getUpcomingOrActiveEvent(telemetry, resolvedEventIds, FORESHADOWED_MISSION_EVENTS);
    if (upcomingEvent) {
      // Trigger event! Play warning klaxon and pause simulation
      playWarningAlert();
      setIsPlaying(false);
      setActiveEvent(upcomingEvent);
    }
  }, [telemetry.missionElapsedTimeDays, resolvedEventIds, activeEvent, activeResolution]);

  // Simulation Game Loop
  useEffect(() => {
    if (!isPlaying || activeEvent || activeResolution || missionCompleteFiredRef.current) return;

    if (telemetry.currentStage === 'mission_conclusion' || telemetry.spacecraftHealth <= 0) {
      triggerMissionCompletion(telemetry);
      return;
    }

    const intervalTimeMs = 80;
    // Map simSpeed to days progressed per tick
    const deltaDays = (0.25 * simSpeed * intervalTimeMs) / 1000;

    const timer = setInterval(() => {
      setTelemetry((prev) => {
        const next = advanceSimulationTick(prev, design, scenario, deltaDays);
        if (next.currentStage === 'mission_conclusion' || next.spacecraftHealth <= 0) {
          triggerMissionCompletion(next);
        }
        return next;
      });
    }, intervalTimeMs);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed, activeEvent, activeResolution, telemetry, design, scenario]);

  // Real-time Canvas Rendering Loop (Dual View: Heliocentric vs Bennu Proximity)
  useEffect(() => {
    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Deep space void with stars
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      animWaveOffsetRef.current = (animWaveOffsetRef.current + 0.05) % 1.0;

      if (orbitViewMode === 'heliocentric') {
        // ==================== HELIOCENTRIC ORBIT VIEW ====================
        const scale = Math.min(width, height) * 0.32; // Scale factor for 1 AU

        // AU Range Rings
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        [0.5, 1.0, 1.5].forEach((au) => {
          ctx.beginPath();
          ctx.arc(centerX, centerY, au * scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.font = '9px JetBrains Mono';
          ctx.fillText(`${au} AU`, centerX + au * scale + 4, centerY - 4);
        });

        // Glowing Sun at Center
        const sunRadius = 26;
        const sunGrad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, sunRadius * 1.8);
        sunGrad.addColorStop(0, '#fef08a');
        sunGrad.addColorStop(0.25, '#f59e0b');
        sunGrad.addColorStop(0.65, 'rgba(245, 158, 11, 0.25)');
        sunGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();

        // 1.0 AU Earth Orbit
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.arc(centerX, centerY, 1.0 * scale, 0, Math.PI * 2);
        ctx.stroke();

        // Earth & Moon
        const earthAngle = -Math.PI / 3;
        const earthX = centerX + Math.cos(earthAngle) * (1.0 * scale);
        const earthY = centerY + Math.sin(earthAngle) * (1.0 * scale);
        ctx.beginPath();
        ctx.fillStyle = '#38bdf8';
        ctx.arc(earthX, earthY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText('Earth (1.0 AU)', earthX + 9, earthY + 3);

        // Bennu Target Orbit Ellipse (~1.13 to 1.36 AU)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.ellipse(centerX, centerY, 1.32 * scale, 1.22 * scale, 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target Bennu Position
        const bennuAngle = Math.PI / 4;
        const bennuX = centerX + Math.cos(bennuAngle) * (1.30 * scale);
        const bennuY = centerY + Math.sin(bennuAngle) * (1.22 * scale);
        ctx.beginPath();
        ctx.fillStyle = '#fb7185';
        ctx.arc(bennuX, bennuY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fda4af';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('101955 Bennu (1.36 AU)', bennuX + 9, bennuY + 3);

        // Spacecraft Transfer Orbit Arc
        const missionFraction = Math.min(1.0, telemetry.missionElapsedTimeDays / scenario.baselineTimelineDays);
        const currentAngle = earthAngle + (bennuAngle - earthAngle) * missionFraction;
        const currentDist = (1.0 + (1.30 - 1.0) * missionFraction) * scale;
        const craftX = centerX + Math.cos(currentAngle) * currentDist;
        const craftY = centerY + Math.sin(currentAngle) * currentDist;

        // Transfer trajectory line
        ctx.beginPath();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.arc(centerX, centerY, currentDist, earthAngle, currentAngle, false);
        ctx.stroke();

        // DSN Line-of-Sight Wave Transmission
        ctx.beginPath();
        ctx.strokeStyle = telemetry.isInDsnWindow ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash(telemetry.isInDsnWindow ? [] : [4, 4]);
        ctx.moveTo(craftX, craftY);
        ctx.lineTo(earthX, earthY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Traveling DSN wave ripple
        if (telemetry.isInDsnWindow) {
          const waveT = animWaveOffsetRef.current;
          const waveX = craftX + (earthX - craftX) * waveT;
          const waveY = craftY + (earthY - craftY) * waveT;
          ctx.beginPath();
          ctx.arc(waveX, waveY, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
          ctx.fill();
        }

        // Spacecraft Marker
        ctx.beginPath();
        ctx.fillStyle = '#22d3ee';
        ctx.arc(craftX, craftY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.arc(craftX, craftY, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(`${design.name}`, craftX + 11, craftY - 6);
      } else {
        // ==================== BENNU PROXIMITY SURVEY VIEW ====================
        // Asteroid 101955 Bennu at Center (Detailed Irregular Shape)
        ctx.save();
        ctx.translate(centerX, centerY);

        // Asteroid Orbit Hill Sphere / Safe Corridor
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.arc(0, 0, 160, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Asteroid Shadow / Night Side Gradient
        ctx.beginPath();
        // Irregular diamond/octagonal asteroid contour
        const vertices = [
          { r: 78, a: 0 },
          { r: 85, a: Math.PI / 4 },
          { r: 72, a: Math.PI / 2 },
          { r: 90, a: (3 * Math.PI) / 4 },
          { r: 76, a: Math.PI },
          { r: 84, a: (5 * Math.PI) / 4 },
          { r: 70, a: (3 * Math.PI) / 2 },
          { r: 88, a: (7 * Math.PI) / 4 }
        ];

        ctx.moveTo(vertices[0].r * Math.cos(vertices[0].a), vertices[0].r * Math.sin(vertices[0].a));
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].r * Math.cos(vertices[i].a), vertices[i].r * Math.sin(vertices[i].a));
        }
        ctx.closePath();

        const asteroidGrad = ctx.createRadialGradient(-20, -20, 10, 0, 0, 95);
        asteroidGrad.addColorStop(0, '#475569'); // Sunlit regolith boulders
        asteroidGrad.addColorStop(0.6, '#1e293b');
        asteroidGrad.addColorStop(1, '#090d16'); // Dark terminator
        ctx.fillStyle = asteroidGrad;
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Surface craters / features
        ctx.fillStyle = '#0f172a';
        [
          { x: -25, y: -20, r: 12 },
          { x: 30, y: 15, r: 18 },
          { x: -10, y: 40, r: 14 },
          { x: 15, y: -45, r: 10 }
        ].forEach((crater) => {
          ctx.beginPath();
          ctx.arc(crater.x, crater.y, crater.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Spacecraft Survey Orbit (Radius ~135px)
        const surveyAngle = (telemetry.missionElapsedTimeDays * 1.5) % (Math.PI * 2);
        const craftOrbitR = 135;
        const craftX = Math.cos(surveyAngle) * craftOrbitR;
        const craftY = Math.sin(surveyAngle) * craftOrbitR;

        // Circular Survey Orbit line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.arc(0, 0, craftOrbitR, 0, Math.PI * 2);
        ctx.stroke();

        // Active LIDAR / Spectrometer Scan Beam (Cone from Craft to Bennu surface)
        if (telemetry.currentStage === 'science_operations') {
          ctx.beginPath();
          ctx.moveTo(craftX, craftY);
          const scanTargetX = Math.cos(surveyAngle) * 75;
          const scanTargetY = Math.sin(surveyAngle) * 75;
          ctx.lineTo(scanTargetX - 15, scanTargetY - 15);
          ctx.lineTo(scanTargetX + 15, scanTargetY + 15);
          ctx.closePath();
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // Emerald LIDAR fan
          ctx.fill();
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
          ctx.stroke();
        }

        // Animated Asteroid Volatile Plume Ejection (if active)
        const hasOutgassing = resolvedEventIds.includes('evt_asteroid_outgassing') || telemetry.currentStage === 'science_operations';
        if (hasOutgassing) {
          ctx.fillStyle = 'rgba(244, 114, 182, 0.7)';
          for (let p = 0; p < 18; p++) {
            const pAngle = -Math.PI / 4 + (Math.sin(p * 2 + animWaveOffsetRef.current * 10) * 0.4);
            const pDist = 80 + ((p * 7 + animWaveOffsetRef.current * 40) % 70);
            ctx.beginPath();
            ctx.arc(Math.cos(pAngle) * pDist, Math.sin(pAngle) * pDist, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Spacecraft Icon
        ctx.beginPath();
        ctx.fillStyle = '#22d3ee';
        ctx.arc(craftX, craftY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.arc(craftX, craftY, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`${design.name}`, craftX + 10, craftY - 4);

        ctx.restore();
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [orbitViewMode, telemetry, design.name, scenario.baselineTimelineDays, resolvedEventIds]);

  // Handle Event Action Selected by Player
  const handleSelectAction = (action: PlayerActionType) => {
    if (!activeEvent) return;
    playTelemetryClick();

    const resolution = resolveEventConsequence(activeEvent, action, design, telemetry, designHistory);
    const updatedTelemetry = applyEventConsequenceToTelemetry(telemetry, resolution, design);

    if (resolution.scienceGainedPoints > 0) {
      playSuccessChime();
    }

    setTelemetry(updatedTelemetry);
    setResolvedEventIds((prev) => [...prev, activeEvent.id]);
    setEventResolutions((prev) => [
      ...prev,
      {
        eventId: activeEvent.id,
        actionTaken: action,
        causalHeadline: resolution.causalHeadline,
        causalDetail: resolution.causalDetail
      }
    ]);

    setActiveResolution(resolution);
    setActiveEvent(null);
  };

  const handleDismissResolution = () => {
    playTelemetryClick();
    setActiveResolution(null);
    setIsPlaying(true);
  };

  const handleStepDay = (days: number) => {
    playTelemetryClick();
    setIsPlaying(false);
    setTelemetry((prev) => {
      const next = advanceSimulationTick(prev, design, scenario, days);
      if (next.currentStage === 'mission_conclusion' || next.spacecraftHealth <= 0) {
        triggerMissionCompletion(next);
      }
      return next;
    });
  };

  const currentStageIndex = STAGES.findIndex((s) => s.id === telemetry.currentStage);
  const advisories = getForeshadowedEventAdvisories(telemetry, resolvedEventIds, FORESHADOWED_MISSION_EVENTS);

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col">
      {/* Top Simulation Mission Header */}
      <header className="border-b border-cyan-500/25 bg-slate-950/95 backdrop-blur-md px-6 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold font-mono">
            SIM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-heading font-bold text-white tracking-wider">
                FLIGHT OPERATIONS: ASTERIA-1
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE TELEMETRY BUS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Target: 101955 Bennu | Vehicle: {launcher.name} | Autonomous FDIR: ACTIVE
            </p>
          </div>
        </div>

        {/* Orbit View Switch & Speed Controls */}
        <div className="flex items-center gap-3">
          {/* Dual View Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                setOrbitViewMode('heliocentric');
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                orbitViewMode === 'heliocentric'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              HELIOCENTRIC CRUISE
            </button>
            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                setOrbitViewMode('proximity');
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                orbitViewMode === 'proximity'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              BENNU PROXIMITY SURVEY
            </button>
          </div>

          {/* Speed Stepper */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                setIsPlaying(!isPlaying);
              }}
              className={`p-1.5 rounded text-xs font-mono font-semibold flex items-center gap-1 transition-colors ${
                isPlaying ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE' : 'RESUME'}</span>
            </button>

            {[1, 5, 25, 100].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => {
                  playTelemetryClick();
                  setSimSpeed(speed);
                  setIsPlaying(true);
                }}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  simSpeed === speed && isPlaying
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleStepDay(1)}
              className="px-2 py-1 rounded text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800"
              title="Advance 1 day"
            >
              +1d
            </button>
          </div>

          <button
            type="button"
            onClick={onAbortToDesigner}
            className="text-[11px] font-mono px-3 py-1.5 rounded border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Abort to Design</span>
          </button>
        </div>
      </header>

      {/* Stage Progression Stepper Bar */}
      <div className="bg-slate-950/85 border-b border-cyan-500/20 px-6 py-2">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          {STAGES.map((stg, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div key={stg.id} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/35'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-xs font-mono ${
                    isCurrent
                      ? 'text-cyan-300 font-bold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {stg.label}
                </span>
                {idx < STAGES.length - 1 && (
                  <div
                    className={`w-8 lg:w-16 h-0.5 mx-1 ${
                      isCompleted ? 'bg-emerald-500/60' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Foreshadowed Hazards Ticker */}
      {advisories.length > 0 && (
        <div className="bg-amber-950/50 border-b border-amber-500/30 px-6 py-1.5 text-xs font-mono text-amber-200 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span className="font-bold text-amber-400 uppercase tracking-wide">
            UPCOMING HAZARD FORESHADOWED:
          </span>
          <span>
            {advisories[0].title} — Projected intercept in ~
            {Math.max(1, Math.round(advisories[0].scheduledMetDay - telemetry.missionElapsedTimeDays))} days.
          </span>
        </div>
      )}

      {/* Main Simulation Workspace Grid */}
      <main className="flex-1 p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 max-w-[1920px] mx-auto w-full">
        {/* Left Column: Trajectory Canvas (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-3 h-[calc(100vh-160px)]">
          <div className="glass-panel hud-corner rounded-2xl p-3 flex-1 flex flex-col overflow-hidden relative shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-2">
              <span className="text-xs font-heading font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                {orbitViewMode === 'heliocentric' ? 'Heliocentric Interplanetary Trajectory' : '101955 Bennu Proximity Survey Corridor'}
              </span>
              <span className="text-[11px] font-mono text-cyan-300">
                MET: {telemetry.missionElapsedTimeDays.toFixed(1)} DAYS
              </span>
            </div>

            <canvas
              ref={canvasRef}
              width={820}
              height={520}
              className="w-full h-full rounded-xl bg-slate-950"
            />

            {/* Trajectory HUD Overlay Badges */}
            <div className="absolute bottom-5 left-5 bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl text-xs font-mono flex flex-col gap-1 backdrop-blur-md shadow-xl">
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Distance Sun:</span>
                <span className="text-white font-bold">{telemetry.distanceFromSunAu} AU</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Distance Earth:</span>
                <span className="text-white font-bold">{telemetry.distanceFromEarthAu} AU</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Distance Bennu:</span>
                <span className="text-cyan-300 font-bold">
                  {(telemetry.distanceToTargetKm / 1000000).toFixed(1)}M km
                </span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>One-Way Delay:</span>
                <span className="text-amber-300 font-bold">
                  {Math.round(telemetry.oneWayLightTimeSec)}s
                </span>
              </div>
            </div>

            {/* DSN Link Indicator */}
            <div className="absolute top-12 right-5 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-mono text-right backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-1.5 justify-end">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    telemetry.isInDsnWindow ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span className="text-white font-semibold">
                  {telemetry.isInDsnWindow ? `DSN LINK: ${telemetry.activeGroundStation}` : 'DSN BLACKOUT'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Downlink: {telemetry.currentDownlinkRateKbps} kbps
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Flight Telemetry & Subsystem Health (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-3 h-[calc(100vh-160px)] overflow-y-auto pr-1">
          {/* Spacecraft Health & Science Yield Header Card */}
          <div className="glass-panel hud-corner rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Overall Spacecraft Integrity
              </span>
              <h3 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                {telemetry.spacecraftHealth}%
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Scientific Yield Returned
              </span>
              <span className="text-2xl font-heading font-bold text-purple-300 text-glow-cyan">
                +{telemetry.rawScienceCollected.toFixed(0)} Pts
              </span>
            </div>
          </div>

          {/* Subsystem Telemetry Meters Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            {/* Power Bus */}
            <div className="bg-slate-950/75 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-white">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  Electrical Power
                </span>
                <span className="text-yellow-400">{telemetry.solarGenerationW}W gen</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${telemetry.batteryStateOfCharge * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Load: {telemetry.powerConsumptionW}W</span>
                <span>Batt: {Math.round(telemetry.batteryStateOfCharge * 100)}%</span>
              </div>
            </div>

            {/* Propulsion Bus */}
            <div className="bg-slate-950/75 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-white">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Propellant
                </span>
                <span className="text-amber-400">{telemetry.propellantRemainingKg} kg</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (telemetry.propellantRemainingKg / Math.max(1, telemetry.propellantTotalKg)) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Δv Rem: {telemetry.deltaVRemainingMs} m/s</span>
                <span>Burn Reserve</span>
              </div>
            </div>

            {/* Thermal Bus */}
            <div className="bg-slate-950/75 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-white">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  Thermal State
                </span>
                <span className={telemetry.isThermalAnomaly ? 'text-red-400 font-bold' : 'text-cyan-300 font-bold'}>
                  {telemetry.spacecraftTempK.toFixed(0)} K
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Margin: {telemetry.thermalMarginK > 0 ? `+${telemetry.thermalMarginK}` : telemetry.thermalMarginK} K</span>
                <span>Envelope: 235 - 335 K</span>
              </div>
            </div>

            {/* Solid-State Buffer */}
            <div className="bg-slate-950/75 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 font-semibold text-white">
                  <Radio className="w-3.5 h-3.5 text-blue-400" />
                  SSR Memory Buffer
                </span>
                <span className="text-blue-300">
                  {Math.round(telemetry.dataBufferUsedMb)} / {telemetry.dataBufferMaxMb} MB
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    telemetry.dataBufferUsedMb / telemetry.dataBufferMaxMb > 0.85
                      ? 'bg-red-500'
                      : 'bg-blue-400'
                  }`}
                  style={{
                    width: `${Math.min(100, (telemetry.dataBufferUsedMb / Math.max(1, telemetry.dataBufferMaxMb)) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Downlinked: {telemetry.scienceDataTransmitted.toFixed(0)} MB</span>
                <span>PDS Archive</span>
              </div>
            </div>
          </div>

          {/* 8-Subsystem Health Status Grid */}
          <div className="bg-slate-950/75 rounded-2xl p-4 border border-slate-800 flex flex-col gap-2 shadow-md">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
              Subsystem Health Telemetry (Bus Strings)
            </span>
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
              {Object.entries(telemetry.subsystemHealth).map(([subsystem, health]) => {
                const color =
                  health >= 80 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-red-400';

                return (
                  <div key={subsystem} className="bg-slate-900/85 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block capitalize truncate">
                      {subsystem}
                    </span>
                    <span className={`font-bold ${color}`}>{health}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anomaly / Event Log Feed */}
          <div className="bg-slate-950/75 rounded-2xl p-4 border border-slate-800 flex-1 overflow-y-auto shadow-md">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-2">
              Flight Controller Decision Log ({eventResolutions.length})
            </span>
            {eventResolutions.length === 0 ? (
              <p className="text-xs text-slate-400 font-mono italic">
                All systems nominal. No flight anomalies logged yet.
              </p>
            ) : (
              <div className="space-y-2">
                {eventResolutions.map((res, i) => (
                  <div
                    key={i}
                    className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-xs font-mono"
                  >
                    <div className="flex items-center justify-between text-cyan-300 font-semibold mb-1">
                      <span>{res.causalHeadline}</span>
                      <span className="text-[10px] text-slate-400">{res.actionTaken}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      {res.causalDetail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interactive Anomaly Triage Modal */}
      <EventTriageModal
        event={activeEvent}
        design={design}
        telemetry={telemetry}
        onSelectAction={handleSelectAction}
        activeResolution={activeResolution}
        onDismissResolution={handleDismissResolution}
      />
    </div>
  );
};
