import React, { useState, useMemo, useEffect } from 'react';
import {
  Rocket,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  Volume2,
  VolumeX,
  Clock,
  Compass
} from 'lucide-react';
import type { SpacecraftDesign, SpacecraftComponent, SubsystemCategory } from './types/subsystems.ts';
import type { LaunchVehicle } from './types/launcher.ts';
import type { InterfaceMode, MissionTelemetry } from './types/mission.ts';
import type { DebriefReport } from './types/scoring.ts';
import type { PlayerDesignHistory } from './types/events.ts';
import { SCENARIO_CATALOG } from './data/scenarios.ts';
import { LAUNCH_VEHICLE_CATALOG } from './data/launchers.ts';
import { calculateSubsystemTotals } from './engine/math/rocket.ts';
import { validateMissionDesign } from './engine/validator.ts';
import { calculateMissionReadiness } from './engine/readiness.ts';
import { runMissionStressTests } from './engine/stressTest.ts';
import { createInitialTelemetry } from './simulation/engine.ts';
import { calculateMissionDebrief } from './engine/scoring.ts';
import { SpacecraftVisualizer3D } from './components/designer/SpacecraftVisualizer3D.tsx';
import { ComponentSelector } from './components/designer/ComponentSelector.tsx';
import { LiveMissionStats } from './components/designer/LiveMissionStats.tsx';
import { MissionReadinessCard } from './components/designer/MissionReadinessCard.tsx';
import { BudgetTriangleView } from './components/designer/BudgetTriangleView.tsx';
import { StressTestModal } from './components/designer/StressTestModal.tsx';
import { LauncherSelector } from './components/designer/LauncherSelector.tsx';
import { ModeToggle } from './components/common/ModeToggle.tsx';
import { MissionSimulationView } from './components/simulation/MissionSimulationView.tsx';
import { DebriefView } from './components/debrief/DebriefView.tsx';
import { COMPONENT_CATALOG } from './data/components.ts';
import { toggleAudio, isAudioMuted, playTelemetryClick } from './utils/audio.ts';

export const App: React.FC = () => {
  // Primary Showcase Scenario: ASTERIA-1 ("The asteroid won't wait.")
  const scenario = SCENARIO_CATALOG[0];

  // Interface Mode: Commander vs Engineer
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>('commander');

  // Audio mute state
  const [muted, setMuted] = useState<boolean>(isAudioMuted());

  // Live NASA UTC Clock
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ')[4] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Launch Vehicle state (default Falcon 9)
  const [selectedLauncher, setSelectedLauncher] = useState<LaunchVehicle>(
    LAUNCH_VEHICLE_CATALOG[0]
  );

  // Spacecraft Design state initialized with flight-ready nominal components
  const [design, setDesign] = useState<SpacecraftDesign>(() => ({
    name: 'ASTERIA-1 Pathfinder',
    components: {
      power: [
        COMPONENT_CATALOG.find((c) => c.id === 'pwr_ultraflex_solar')!,
        COMPONENT_CATALOG.find((c) => c.id === 'pwr_lithium_sulfur_battery')!
      ],
      propulsion: [
        COMPONENT_CATALOG.find((c) => c.id === 'prop_bipropellant_mmh')!,
        COMPONENT_CATALOG.find((c) => c.id === 'prop_hydrazine_rcs')!
      ],
      communications: [
        COMPONENT_CATALOG.find((c) => c.id === 'comm_xband_hga_12m')!,
        COMPONENT_CATALOG.find((c) => c.id === 'comm_sband_lga_omni')!
      ],
      computing: [
        COMPONENT_CATALOG.find((c) => c.id === 'comp_rad750_hardened')!
      ],
      navigation: [
        COMPONENT_CATALOG.find((c) => c.id === 'nav_dual_star_trackers')!
      ],
      thermal: [
        COMPONENT_CATALOG.find((c) => c.id === 'therm_passive_mli_louvers')!,
        COMPONENT_CATALOG.find((c) => c.id === 'therm_active_heatpipes_rhu')!
      ],
      science: [
        COMPONENT_CATALOG.find((c) => c.id === 'sci_multispectral_imager')!,
        COMPONENT_CATALOG.find((c) => c.id === 'sci_lidar_altimeter')!
      ],
      structure: [
        COMPONENT_CATALOG.find((c) => c.id === 'struct_carbon_composite_bus')!,
        COMPONENT_CATALOG.find((c) => c.id === 'struct_whipple_debris_shield')!
      ]
    }
  }));

  // Screen Mode: 'design' | 'simulation' | 'debrief'
  const [screenMode, setScreenMode] = useState<'design' | 'simulation' | 'debrief'>('design');

  // Stress Test Modal state
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);

  // Player Design History tracking for event consequence resolution
  const [designHistory, setDesignHistory] = useState<PlayerDesignHistory>({
    testedStress: false,
    ignoredWeaknessWarning: false,
    unresolvedRisksCount: 0,
    initialLaunchVehicle: 'launch_falcon9',
    hasRedesignedAfterStress: false,
    primaryWeaknessTitle: ''
  });

  // Flight simulation & debrief states
  const [initialFlightTelemetry, setInitialFlightTelemetry] = useState<MissionTelemetry | null>(null);
  const [debriefReport, setDebriefReport] = useState<DebriefReport | null>(null);

  // Derived Calculations
  const totals = useMemo(() => calculateSubsystemTotals(design), [design]);
  const validation = useMemo(
    () => validateMissionDesign(design, selectedLauncher, scenario),
    [design, selectedLauncher, scenario]
  );
  const readiness = useMemo(
    () => calculateMissionReadiness(design, selectedLauncher, scenario),
    [design, selectedLauncher, scenario]
  );
  const [stressRunCount, setStressRunCount] = useState<number>(0);
  const stressTestResults = useMemo(
    () => runMissionStressTests(design, scenario),
    [design, scenario, stressRunCount]
  );

  const handleRerunStressTest = () => {
    playTelemetryClick();
    setStressRunCount((c) => c + 1);
  };

  // Component Mounting Handlers
  const handleAddComponent = (component: SpacecraftComponent) => {
    setDesign((prev) => {
      const category = component.category;
      const currentItems = prev.components[category] || [];
      // Prevent mounting identical component twice
      if (currentItems.some((c) => c.id === component.id)) return prev;

      if (designHistory.testedStress) {
        setDesignHistory((dh) => ({ ...dh, hasRedesignedAfterStress: true }));
      }

      return {
        ...prev,
        components: {
          ...prev.components,
          [category]: [...currentItems, component]
        }
      };
    });
  };

  const handleRemoveComponent = (category: SubsystemCategory, componentId: string) => {
    if (designHistory.testedStress) {
      setDesignHistory((dh) => ({ ...dh, hasRedesignedAfterStress: true }));
    }
    setDesign((prev) => ({
      ...prev,
      components: {
        ...prev.components,
        [category]: (prev.components[category] || []).filter((c) => c.id !== componentId)
      }
    }));
  };

  // Launch Mission Handlers
  const handleLaunchMission = () => {
    if (!validation.isLaunchAllowed) return;

    const criticalRisks = stressTestResults.filter((r) => r.status === 'CRITICAL_RISK');
    const hasIgnoredRisks = criticalRisks.length > 0 || readiness.overallScorePct < 65;

    const history: PlayerDesignHistory = {
      ...designHistory,
      ignoredWeaknessWarning: hasIgnoredRisks,
      unresolvedRisksCount: criticalRisks.length,
      initialLaunchVehicle: selectedLauncher.id,
      primaryWeaknessTitle: readiness.primaryWeakness.title
    };
    setDesignHistory(history);

    const initialTel = createInitialTelemetry(design, selectedLauncher, scenario);
    setInitialFlightTelemetry(initialTel);
    setIsStressTestOpen(false);
    setScreenMode('simulation');
  };

  const handleMissionComplete = (
    finalTelemetry: MissionTelemetry,
    eventResolutions: Array<{ eventId: string; causalHeadline: string; causalDetail: string; actionTaken: string }>
  ) => {
    const debrief = calculateMissionDebrief(
      design,
      selectedLauncher,
      scenario,
      finalTelemetry,
      eventResolutions,
      designHistory
    );
    setDebriefReport(debrief);
    setScreenMode('debrief');
  };

  const handleRestartDesign = () => {
    setScreenMode('design');
    setDebriefReport(null);
    setInitialFlightTelemetry(null);
  };

  // Presets
  const handleLoadBudgetPreset = () => {
    setDesign({
      name: 'ASTERIA-1 Budget Scout',
      components: {
        power: [COMPONENT_CATALOG.find((c) => c.id === 'pwr_rigid_silicon')!],
        propulsion: [COMPONENT_CATALOG.find((c) => c.id === 'prop_hydrazine_rcs')!],
        communications: [COMPONENT_CATALOG.find((c) => c.id === 'comm_sband_lga_omni')!],
        computing: [COMPONENT_CATALOG.find((c) => c.id === 'comp_cots_arm_dual')!],
        navigation: [COMPONENT_CATALOG.find((c) => c.id === 'nav_dual_star_trackers')!],
        thermal: [COMPONENT_CATALOG.find((c) => c.id === 'therm_passive_mli_louvers')!],
        science: [COMPONENT_CATALOG.find((c) => c.id === 'sci_regolith_xray_spectrometer')!],
        structure: [COMPONENT_CATALOG.find((c) => c.id === 'struct_carbon_composite_bus')!]
      }
    });
  };

  const handleResetNominal = () => {
    setDesign({
      name: 'ASTERIA-1 Pathfinder',
      components: {
        power: [
          COMPONENT_CATALOG.find((c) => c.id === 'pwr_ultraflex_solar')!,
          COMPONENT_CATALOG.find((c) => c.id === 'pwr_lithium_sulfur_battery')!
        ],
        propulsion: [
          COMPONENT_CATALOG.find((c) => c.id === 'prop_bipropellant_mmh')!,
          COMPONENT_CATALOG.find((c) => c.id === 'prop_hydrazine_rcs')!
        ],
        communications: [
          COMPONENT_CATALOG.find((c) => c.id === 'comm_xband_hga_12m')!,
          COMPONENT_CATALOG.find((c) => c.id === 'comm_sband_lga_omni')!
        ],
        computing: [COMPONENT_CATALOG.find((c) => c.id === 'comp_rad750_hardened')!],
        navigation: [COMPONENT_CATALOG.find((c) => c.id === 'nav_dual_star_trackers')!],
        thermal: [
          COMPONENT_CATALOG.find((c) => c.id === 'therm_passive_mli_louvers')!,
          COMPONENT_CATALOG.find((c) => c.id === 'therm_active_heatpipes_rhu')!
        ],
        science: [
          COMPONENT_CATALOG.find((c) => c.id === 'sci_multispectral_imager')!,
          COMPONENT_CATALOG.find((c) => c.id === 'sci_lidar_altimeter')!
        ],
        structure: [
          COMPONENT_CATALOG.find((c) => c.id === 'struct_carbon_composite_bus')!,
          COMPONENT_CATALOG.find((c) => c.id === 'struct_whipple_debris_shield')!
        ]
      }
    });
  };

  if (screenMode === 'simulation' && initialFlightTelemetry) {
    return (
      <MissionSimulationView
        design={design}
        launcher={selectedLauncher}
        scenario={scenario}
        initialTelemetry={initialFlightTelemetry}
        designHistory={designHistory}
        onMissionComplete={handleMissionComplete}
        onAbortToDesigner={() => setScreenMode('design')}
      />
    );
  }

  if (screenMode === 'debrief' && debriefReport) {
    return (
      <DebriefView
        report={debriefReport}
        design={design}
        launcher={selectedLauncher}
        scenario={scenario}
        onRestartDesign={handleRestartDesign}
      />
    );
  }

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col">
      {/* Top Mission Control Navigation Bar */}
      <header className="border-b border-cyan-500/25 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold font-mono shadow-md">
            LL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-heading font-bold text-white tracking-wider">
                MISSION: LAST LIGHT
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                NASA SPACE APPS 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Design. Stress-test. Adapt. Survive.
            </p>
          </div>
        </div>

        {/* Center Target & Live Clock Badges */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-xl">
            <span className="text-xs font-mono text-slate-400">MISSION:</span>
            <span className="text-xs font-heading font-semibold text-white">ASTERIA-1</span>
            <span className="text-[10px] text-cyan-400 font-mono italic">
              "{scenario.tagline}"
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-semibold">{utcTime || '00:00:00 UTC'}</span>
          </div>
        </div>

        {/* Right Controls: Audio, Mode Toggle, Presets, and Launch Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                handleResetNominal();
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Reset to balanced flight-ready configuration"
            >
              Nominal
            </button>
            <button
              type="button"
              onClick={() => {
                playTelemetryClick();
                handleLoadBudgetPreset();
              }}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Load budget-conscious configuration with engineering trade-offs"
            >
              Budget Scout
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              playTelemetryClick();
              setIsStressTestOpen(true);
              setDesignHistory((dh) => ({ ...dh, testedStress: true }));
            }}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950 text-cyan-200 hover:bg-cyan-900 transition-colors flex items-center gap-1 shadow"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Stress Test</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTelemetryClick();
              handleLaunchMission();
            }}
            disabled={!validation.isLaunchAllowed}
            className={`text-[11px] font-mono px-3.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md ${
              validation.isLaunchAllowed
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-950/50 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
            title={validation.isLaunchAllowed ? 'Commit spacecraft to launch pad and initiate simulation' : 'Fix hard violations before launching'}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Launch</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              const newMuted = toggleAudio();
              setMuted(newMuted);
              if (!newMuted) playTelemetryClick();
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              muted
                ? 'border-slate-800 bg-slate-900 text-slate-500'
                : 'border-cyan-500/40 bg-cyan-950/80 text-cyan-300'
            }`}
            title={muted ? 'Unmute mission audio' : 'Mute mission audio'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <ModeToggle mode={interfaceMode} onToggle={setInterfaceMode} />
        </div>
      </header>

      {/* Main Mission Design Workspace (3-Column Layout) */}
      <main className="flex-1 p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 max-w-[1920px] mx-auto w-full">
        {/* Left Column: Subsystem Component Selector (3 cols) */}
        <div className="xl:col-span-3 h-[calc(100vh-120px)]">
          <ComponentSelector
            design={design}
            onAddComponent={handleAddComponent}
            onRemoveComponent={handleRemoveComponent}
          />
        </div>

        {/* Center Column: 3D Visualizer & Launcher Selector (6 cols) */}
        <div className="xl:col-span-6 flex flex-col gap-4 h-[calc(100vh-120px)] overflow-y-auto pr-1">
          {/* Asteroid Mission Briefing Strip */}
          <div className="glass-panel rounded-xl p-3.5 flex items-center justify-between border-l-4 border-l-cyan-500">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  Target Destination: Near-Earth Asteroid
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  (JPL Horizons ID: {scenario.target.jplHorizonsId})
                </span>
              </div>
              <h2 className="text-sm font-heading font-bold text-white">
                {scenario.target.name}
              </h2>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                Distance: {scenario.target.distanceAuMin} - {scenario.target.distanceAuMax} AU | Required Δv: {scenario.target.deltaVRequirementMs.totalRequired} m/s | Budget Cap: ${scenario.budgetCapM}M
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                Launch Window C3
              </span>
              <span className="text-sm font-mono font-bold text-cyan-300">
                {scenario.target.requiredC3Km2S2} km²/s²
              </span>
            </div>
          </div>

          {/* Interactive 3D Spacecraft Canvas */}
          <div className="flex-1 min-h-[360px]">
            <SpacecraftVisualizer3D design={design} />
          </div>

          {/* Launch Vehicle Selector */}
          <LauncherSelector
            selectedLauncher={selectedLauncher}
            onSelectLauncher={setSelectedLauncher}
            spacecraftWetMassKg={totals.totalWetMassKg}
            scenario={scenario}
          />
        </div>

        {/* Right Column: Live Telemetry, Readiness & Strategy (3 cols) */}
        <div className="xl:col-span-3 flex flex-col gap-3 h-[calc(100vh-120px)] overflow-y-auto pr-1">
          {/* Mission Readiness Card */}
          <MissionReadinessCard
            report={readiness}
            onOpenStressTest={() => {
              setIsStressTestOpen(true);
              setDesignHistory((dh) => ({ ...dh, testedStress: true }));
            }}
          />

          {/* Budget Triangle View */}
          <BudgetTriangleView coordinates={readiness.triangle} />

          {/* Live Mission Telemetry Stats */}
          <div className="flex-1">
            <LiveMissionStats
              design={design}
              totals={totals}
              launcher={selectedLauncher}
              scenario={scenario}
              validation={validation}
              mode={interfaceMode}
            />
          </div>
        </div>
      </main>

      {/* Pre-Launch Stress Test Modal */}
      <StressTestModal
        isOpen={isStressTestOpen}
        onClose={() => setIsStressTestOpen(false)}
        results={stressTestResults}
        onRerun={handleRerunStressTest}
        onRedesign={() => setIsStressTestOpen(false)}
        onLaunchAnyway={handleLaunchMission}
        isLaunchAllowed={validation.isLaunchAllowed}
      />
    </div>
  );
};
