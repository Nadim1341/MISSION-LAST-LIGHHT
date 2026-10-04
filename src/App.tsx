import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  playTelemetryClick,
  playSuccessChime,
  playWarningAlert,
  playThrusterPulse,
  isAudioMuted,
  toggleAudio,
} from './utils/audio.ts';

// ============================================================================
// SCIENTIFIC & ENGINEERING SUBSYSTEM CATALOG
// ============================================================================
export interface ComponentOption {
  id: string;
  name: string;
  mass: number;        // kg delta
  power: number;       // W delta (positive = draw, negative = generation)
  cost: number;        // $M cost
  dv: number;          // m/s delta-V contribution
  rel: number;         // Reliability % delta
  radTol: number;      // krad tolerance
  desc: string;
  spec: string;
}

export interface SubsystemCategory {
  id: string;
  name: string;
  icon: string;
  options: ComponentOption[];
}

export const SUBSYSTEMS: SubsystemCategory[] = [
  {
    id: 'structure',
    name: 'Structure',
    icon: '🏗️',
    options: [
      {
        id: 'struct_al_frame',
        name: 'Al-6061 Semi-Monocoque',
        mass: 0,
        power: 0,
        cost: 0,
        dv: 0,
        rel: 0,
        radTol: 30,
        desc: 'Standard aerospace aluminium truss bus. Rugged baseline.',
        spec: 'Density 2.7g/cm³ · Modulus 69 GPa'
      },
      {
        id: 'struct_carbon_truss',
        name: 'Carbon-Composite Truss',
        mass: -65,
        power: 0,
        cost: 4.5,
        dv: 35,
        rel: 2,
        radTol: 45,
        desc: 'Ultra-light carbon fiber honeycomb bus. Cuts dry mass.',
        spec: 'Mass -65kg · High thermal stability'
      },
      {
        id: 'struct_whipple_shield',
        name: 'Whipple Debris Bumper',
        mass: 42,
        power: 0,
        cost: 3.2,
        dv: -15,
        rel: 6,
        radTol: 60,
        desc: 'Multi-layer hypervelocity shield. Absorbs micrometeoroid hits.',
        spec: 'Deflects particles up to 12 km/s'
      }
    ]
  },
  {
    id: 'propulsion',
    name: 'Propulsion',
    icon: '🚀',
    options: [
      {
        id: 'prop_ion_standard',
        name: 'NSTAR Ion Thruster',
        mass: 0,
        power: 0,
        cost: 0,
        dv: 0,
        rel: 0,
        radTol: 50,
        desc: 'Electrostatic xenon ion engine. High specific impulse.',
        spec: 'Isp 3100s · Thrust 92 mN · Pwr 2.1 kW'
      },
      {
        id: 'prop_hall_xl',
        name: 'Hall Effect Thruster XL',
        mass: 48,
        power: 14,
        cost: 6.2,
        dv: 140,
        rel: 1,
        radTol: 60,
        desc: 'High-thrust magnetic plasma accelerator for rapid trajectory burns.',
        spec: 'Isp 2200s · Thrust 240 mN · Fast burns'
      },
      {
        id: 'prop_biprop_mmh',
        name: 'MMH/NTO Bipropellant',
        mass: 85,
        power: -4,
        cost: 2.8,
        dv: 80,
        rel: -2,
        radTol: 40,
        desc: 'Chemical bipropellant. Instantaneous impulse, high propellant mass.',
        spec: 'Isp 320s · Thrust 450 N · Chemical'
      }
    ]
  },
  {
    id: 'power',
    name: 'Power',
    icon: '⚡',
    options: [
      {
        id: 'pwr_array_a',
        name: 'Rigid Silicon Panels (1.8 kW)',
        mass: 0,
        power: 0,
        cost: 0,
        dv: 0,
        rel: 0,
        radTol: 35,
        desc: 'Dual body-hinged silicon solar arrays. Nominal 1 AU baseline.',
        spec: '1.8 kW @ 1 AU · Efficiency 22%'
      },
      {
        id: 'pwr_array_b',
        name: 'UltraFlex Circular GaAs (2.4 kW)',
        mass: 38,
        power: -8,
        cost: 4.8,
        dv: -5,
        rel: 3,
        radTol: 65,
        desc: 'Expanded gallium arsenide solar wings. Sustains power at 1.4 AU.',
        spec: '2.4 kW @ 1 AU · Efficiency 34%'
      },
      {
        id: 'pwr_mmrtg',
        name: 'Multi-Mission RTG (Pu-238)',
        mass: 45,
        power: -12,
        cost: 16.5,
        dv: -15,
        rel: 7,
        radTol: 250,
        desc: 'Radioisotope thermoelectric generator. Constant power anywhere.',
        spec: '110W constant · 0% solar dependence'
      }
    ]
  },
  {
    id: 'comms',
    name: 'Communications',
    icon: '📡',
    options: [
      {
        id: 'comm_xband_hga',
        name: 'X-Band Parabolic HGA (1.2m)',
        mass: 0,
        power: 0,
        cost: 0,
        dv: 0,
        rel: 0,
        radTol: 45,
        desc: 'Standard deep space transponder for Deep Space Network.',
        spec: '2.4 Mbps @ 1.2 AU · 8.4 GHz'
      },
      {
        id: 'comm_kaband_xl',
        name: 'Ka-Band Deep Space Dish (2.2m)',
        mass: 36,
        power: 6,
        cost: 5.2,
        dv: 0,
        rel: 5,
        radTol: 55,
        desc: 'High-frequency Ka-band dish. Doubles scientific downlink throughput.',
        spec: '4.8 Mbps @ 1.2 AU · 32 GHz · +6dB margin'
      },
      {
        id: 'comm_optical_laser',
        name: 'Deep Space Optical Comms (DSOC)',
        mass: 28,
        power: 12,
        cost: 9.8,
        dv: -8,
        rel: 3,
        radTol: 70,
        desc: 'Pulsed laser downlink. Extremely high bandwidth to Palomar telescope.',
        spec: '25.0 Mbps @ 1.2 AU · Near-IR laser'
      }
    ]
  },
  {
    id: 'science',
    name: 'Science Payload',
    icon: '⚗️',
    options: [
      {
        id: 'sci_camera_spec',
        name: 'PolyCam & IR Spectrometer',
        mass: 0,
        power: 0,
        cost: 0,
        dv: 0,
        rel: 0,
        radTol: 40,
        desc: 'High-resolution telescopic framing imager and infrared spectrometer.',
        spec: '1024×1024 CCD · Spectral 0.4–4.0 μm'
      },
      {
        id: 'sci_radar_sounder',
        name: '+Subsurface Radar Sounder',
        mass: 55,
        power: 14,
        cost: 7.2,
        dv: -20,
        rel: 2,
        radTol: 50,
        desc: 'Ground-penetrating radar. Maps internal density and porosity voids.',
        spec: 'VHF 15–25 MHz · Depth 250m'
      },
      {
        id: 'sci_lidar_thermal',
        name: '+3D LIDAR Altimeter & OTES',
        mass: 42,
        power: 10,
        cost: 6.4,
        dv: -12,
        rel: 3,
        radTol: 55,
        desc: 'Centimeter-grade scanning laser altimeter for boulder field topography.',
        spec: '1064 nm Laser · 10 kHz pulse'
      }
    ]
  },
  {
    id: 'thermal',
    name: 'Thermal Control',
    icon: '🌡️',
    options: [
      {
        id: 'therm_passive_mli',
        name: 'Passive MLI Blankets & Louvers',
        mass: 0,
        power: 0,
        cost: 0,
        dv: 0,
        rel: 0,
        radTol: 35,
        desc: 'Multi-layer Kapton/Mylar insulation with bimetallic louvers.',
        spec: 'Effective emissivity ε* 0.02 · Passive'
      },
      {
        id: 'therm_active_loop',
        name: 'Pumped Fluid Heatpipe Loop',
        mass: 32,
        power: 5,
        cost: 3.4,
        dv: 0,
        rel: 6,
        radTol: 60,
        desc: 'Mechanically pumped ammonia cooling loop. Withstands solar storm peaks.',
        spec: 'Heat rejection 850W · Active PID control'
      },
      {
        id: 'therm_aerogel_rhu',
        name: 'Aerogel & Radioisotope Heaters',
        mass: 22,
        power: -2,
        cost: 5.6,
        dv: 0,
        rel: 8,
        radTol: 90,
        desc: 'Solid silica aerogel insulation with Pu-238 heat pellets.',
        spec: 'Maintains > -20°C in eclipse shadow'
      }
    ]
  },
  {
    id: 'navigation',
    name: 'Guidance & Nav',
    icon: '🧭',
    options: [
      {
        id: 'nav_star_tracker',
        name: 'Dual Autonomous Star Trackers',
        mass: 0,
        power: 0,
        cost: 0,
        dv: 0,
        rel: 0,
        radTol: 45,
        desc: 'Inertial stellar reference attitude control with gyroscopes.',
        spec: 'Arcsecond pointing precision · 10 Hz'
      },
      {
        id: 'nav_opnav_terrain',
        name: 'Optical Nav & Hazard Detection',
        mass: 14,
        power: 3,
        cost: 2.6,
        dv: 0,
        rel: 4,
        radTol: 55,
        desc: 'Autonomous vision algorithm for asteroid limb detection and approach.',
        spec: 'Autonomous miss-distance correction'
      },
      {
        id: 'nav_atomic_clock',
        name: 'Deep Space Atomic Clock (DSAC)',
        mass: 18,
        power: 6,
        cost: 5.8,
        dv: 10,
        rel: 5,
        radTol: 80,
        desc: 'Mercury-ion atomic clock for onboard autonomous 1-way navigation.',
        spec: 'Stability < 10⁻¹⁵ · Real-time orbit fix'
      }
    ]
  },
  {
    id: 'computing',
    name: 'Flight Computing',
    icon: '💻',
    options: [
      {
        id: 'comp_flight_cpu',
        name: 'Dual Redundant COTS Flight CPU',
        mass: 0,
        power: 0,
        cost: 0,
        dv: 0,
        rel: 0,
        radTol: 30,
        desc: 'Commercial ARM processor with software voting. Cost-effective.',
        spec: '800 MHz · Single Event Upset risk in CME'
      },
      {
        id: 'comp_rad_hard',
        name: 'RAD750 Radiation-Hardened CPU',
        mass: 12,
        power: 4,
        cost: 4.2,
        dv: 0,
        rel: 5,
        radTol: 120,
        desc: 'NASA standard silicon-on-insulator rad-hard processor. Storm immune.',
        spec: '133 MHz · Immune to Single Event Latchup'
      },
      {
        id: 'comp_tri_redundant',
        name: 'Triple-Modular Redundant LEON4',
        mass: 20,
        power: 7,
        cost: 7.5,
        dv: 0,
        rel: 8,
        radTol: 180,
        desc: 'Fault-tolerant quad-core SPARC with hardware majority voting.',
        spec: 'Full autonomous anomaly self-healing'
      }
    ]
  }
];

// Helper to compute spacecraft totals
export interface CraftTotals {
  massKg: number;
  powerW: number;
  costM: number;
  dvMs: number;
  reliabilityPct: number;
  radTolKrad: number;
  budgetRemainingM: number;
  isMassValid: boolean;
  isBudgetValid: boolean;
  isPowerValid: boolean;
  isDvValid: boolean;
  isFlightReady: boolean;
}

export function computeCraftTotals(selection: Record<number, number>): CraftTotals {
  let massKg = 2430;
  let powerW = 62;
  let costSpentM = 36.5;
  let dvMs = 1450;
  let reliabilityPct = 84;
  let radTolKrad = 45;

  SUBSYSTEMS.forEach((sub, i) => {
    const optIndex = selection[i] || 0;
    const opt = sub.options[optIndex] || sub.options[0];
    massKg += opt.mass;
    powerW += opt.power;
    costSpentM += opt.cost;
    dvMs += opt.dv;
    reliabilityPct += opt.rel;
    radTolKrad = Math.max(radTolKrad, opt.radTol);
  });

  const budgetTotalM = 50.0;
  const budgetRemainingM = Math.max(0, +(budgetTotalM - costSpentM).toFixed(1));

  // Engineering Penalties
  if (massKg > 2500) reliabilityPct -= 8;
  if (costSpentM > 50) reliabilityPct -= 12;
  if (powerW > 100) reliabilityPct -= 10;
  if (dvMs < 1200) reliabilityPct -= 10;

  reliabilityPct = Math.max(25, Math.min(99, reliabilityPct));

  const isMassValid = massKg <= 2500;
  const isBudgetValid = costSpentM <= 50;
  const isPowerValid = powerW <= 100;
  const isDvValid = dvMs >= 1200;
  const isFlightReady = isMassValid && isBudgetValid && isPowerValid && isDvValid;

  return {
    massKg,
    powerW,
    costM: +costSpentM.toFixed(1),
    dvMs,
    reliabilityPct,
    radTolKrad,
    budgetRemainingM,
    isMassValid,
    isBudgetValid,
    isPowerValid,
    isDvValid,
    isFlightReady,
  };
}

// ============================================================================
// GAME STATE DEFINITIONS
// ============================================================================
export type ScreenId =
  | 'landing'
  | 'how'
  | 'brief'
  | 'priorities'
  | 'design'
  | 'ready'
  | 'stress'
  | 'launch'
  | 'flight'
  | 'rock'
  | 'debrief'
  | 'board'
  | 'nasa';

export type FlightDockTab = 'maneuver' | 'power' | 'comms' | 'science' | null;

export interface InFlightCrisis {
  id: string;
  day: number;
  title: string;
  headline: string;
  desc: string;
  options: {
    label: string;
    action: 'safe' | 'counter' | 'push';
    desc: string;
  }[];
}

export interface GameState {
  screen: ScreenId;
  selection: Record<number, number>; // Subsystem index -> Component option index
  mode: 'COMMANDER' | 'ENGINEER';
  priorities: { science: number; survivability: number; affordability: number };

  // Flight Simulation State
  day: number;
  timeSpeed: number; // 0 (paused), 1, 5, 20, 100
  fuelKg: number;
  fuelMaxKg: number;
  healthPct: number;
  dataBufferGb: number;
  dataBufferMaxGb: number;
  dataReturnedGb: number;
  sciencePoints: number;
  missDistanceKm: number;
  powerAlloc: { science: number; comms: number; computing: number; thermal: number };
  safeMode: boolean;
  busTempC: number;
  batteryPct: number;

  // Maneuvers executed
  maneuversDone: { tcm1: boolean; tcm2: boolean; rdvz: boolean };

  // Hazard event resolutions
  resolvedEvents: { id: string; choice: string; impact: string }[];
  activeCrisis: InFlightCrisis | null;

  // Active UI Sheet / Overlays
  activeDockTab: FlightDockTab;
  compareSubsystemIndex: number | null;
  compareOptionIndex: number | null;
  toastMessage: string | null;
  flashBadge: Record<string, number> | null;
  surveysDone: number;
  downlinksDone: number;
}

export const INITIAL_GAME_STATE: GameState = {
  screen: 'landing',
  selection: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
  mode: 'COMMANDER',
  priorities: { science: 1, survivability: 1, affordability: 1 },

  day: 1,
  timeSpeed: 1,
  fuelKg: 1250,
  fuelMaxKg: 1250,
  healthPct: 100,
  dataBufferGb: 4.2,
  dataBufferMaxGb: 32.0,
  dataReturnedGb: 0,
  sciencePoints: 0,
  missDistanceKm: 42000,
  powerAlloc: { science: 30, comms: 25, computing: 25, thermal: 20 },
  safeMode: false,
  busTempC: 18.5,
  batteryPct: 100,

  maneuversDone: { tcm1: false, tcm2: false, rdvz: false },
  resolvedEvents: [],
  activeCrisis: null,

  activeDockTab: null,
  compareSubsystemIndex: null,
  compareOptionIndex: null,
  toastMessage: null,
  flashBadge: null,
  surveysDone: 0,
  downlinksDone: 0,
};

// ============================================================================
// STRESS TEST SCENARIOS
// ============================================================================
export const STRESS_HAZARDS = [
  { name: 'Coronal Mass Ejection', sub: 'computing', penalty: 32, label: 'Solar Storm' },
  { name: 'Hypervelocity Micrometeoroid', sub: 'structure', penalty: 28, label: 'Micrometeoroid' },
  { name: 'Deep Space Thermal Soak', sub: 'thermal', penalty: 24, label: 'Thermal Soak' },
  { name: 'DSN Carrier Frequency Desync', sub: 'comms', penalty: 20, label: 'Comms Blackout' },
  { name: 'Van Allen Radiation Belt', sub: 'computing', penalty: 22, label: 'Radiation Belt' },
  { name: 'Solar Array Voltage Dip', sub: 'power', penalty: 18, label: 'Power Grid Dip' },
  { name: 'Asteroid Dust Cloud Abrasion', sub: 'structure', penalty: 16, label: 'Dust Cloud' },
  { name: 'Planetary Eclipse Shadow', sub: 'power', penalty: 14, label: 'Eclipse Shadow' },
];

// ============================================================================
// IN-FLIGHT CRISIS EVENTS
// ============================================================================
export const MISSION_CRISES: InFlightCrisis[] = [
  {
    id: 'evt_micrometeoroid',
    day: 42,
    title: 'MICROMETEOROID SHOWER DETECTED',
    headline: 'High-density dust debris stream intersecting spacecraft flight path.',
    desc: 'Optical sensors report high-velocity micrometeoroid impacts along the forward bus.',
    options: [
      {
        label: 'Slew Behind Engine Block',
        action: 'counter',
        desc: 'Burn 35 kg propellant to turn main engine bell into forward shield.'
      },
      {
        label: 'Enter Autonomous Safe Mode',
        action: 'safe',
        desc: 'Fold solar arrays edge-on and minimize cross-sectional area.'
      },
      {
        label: 'Rely on Bus Hull Integrity',
        action: 'push',
        desc: 'Maintain flight attitude. Unshielded buses will take impact damage.'
      }
    ]
  },
  {
    id: 'evt_solar_storm',
    day: 88,
    title: 'HIGH ALERT: SEVERE CORONAL MASS EJECTION',
    headline: 'Major X-Class solar flare detected. High-energy proton flux rising rapidly.',
    desc: 'Intense proton radiation wave incoming. Can latch up flight computers and fry uncooled electronics.',
    options: [
      {
        label: 'Reboot to Rad-Safe Kernel',
        action: 'safe',
        desc: 'Protect avionics in safe mode. Science paused for 48 hours.'
      },
      {
        label: 'Route Peak Power to Thermal Loop',
        action: 'counter',
        desc: 'Overdrive pumped coolant to dissipate thermal radiative spikes.'
      },
      {
        label: 'Continue Science Observations',
        action: 'push',
        desc: 'Capture unprecedented CME solar science, risking major hardware damage.'
      }
    ]
  },
  {
    id: 'evt_reaction_wheel',
    day: 116,
    title: 'ATTITUDE CONTROL REACTION WHEEL JITTER',
    headline: 'Flywheel 3 exhibiting high bearing friction and angular telemetry drift.',
    desc: 'Uncompensated vibration will blur high-resolution asteroid reconnaissance images.',
    options: [
      {
        label: 'Switch to RCS Thruster Guidance',
        action: 'counter',
        desc: 'Expend 20 kg propellant to stabilize spacecraft using hydrazine thrusters.'
      },
      {
        label: 'Desaturate via Magnetic Torquers',
        action: 'safe',
        desc: 'Throttle survey imaging rate to allow slow flywheel desaturation.'
      },
      {
        label: 'Ignore & Push Target Scans',
        action: 'push',
        desc: 'Take images immediately despite optical blurring.'
      }
    ]
  }
];

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================
export const App: React.FC = () => {
  const [g, setG] = useState<GameState>(INITIAL_GAME_STATE);
  const updateG = (updater: Partial<GameState> | ((prev: GameState) => GameState)) => {
    setG((prev) => ({ ...prev, ...(typeof updater === 'function' ? updater(prev) : updater) }));
  };

  const totals = useMemo(() => computeCraftTotals(g.selection), [g.selection]);

  // Viewport & Audio state
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [muted, setMuted] = useState(isAudioMuted());

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 600;
      setIsMobileDevice(isMobile);
      if (isMobile) {
        setIsPhoneFrame(false);
        setScaleFactor(1);
      } else {
        const sc = Math.min(1, (window.innerHeight - 60) / 852, (window.innerWidth - 40) / 393);
        setScaleFactor(sc);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toast message auto-dismiss
  useEffect(() => {
    if (g.toastMessage) {
      const t = setTimeout(() => updateG({ toastMessage: null }), 2800);
      return () => clearTimeout(t);
    }
  }, [g.toastMessage]);

  // Flash badge auto-dismiss
  useEffect(() => {
    if (g.flashBadge) {
      const t = setTimeout(() => updateG({ flashBadge: null }), 1600);
      return () => clearTimeout(t);
    }
  }, [g.flashBadge]);

  // ==========================================================================
  // CORE FLIGHT SIMULATION LOOP
  // ==========================================================================
  useEffect(() => {
    if (g.screen !== 'flight' || g.timeSpeed === 0 || g.activeCrisis) return;

    const intervalTime = Math.max(50, 600 / g.timeSpeed);
    const interval = setInterval(() => {
      setG((prev) => {
        if (prev.screen !== 'flight' || prev.timeSpeed === 0 || prev.activeCrisis) return prev;

        const nextDay = prev.day + 1;

        // Check for crisis events
        const crisis = MISSION_CRISES.find(
          (c) => c.day === nextDay && !prev.resolvedEvents.some((r) => r.id === c.id)
        );
        if (crisis) {
          playWarningAlert();
          return {
            ...prev,
            day: nextDay,
            activeCrisis: crisis,
            toastMessage: `CRISIS ALERT: ${crisis.title}`,
          };
        }

        // Check for Mission Conclusion (Day 146)
        if (nextDay >= 146 || prev.healthPct <= 0) {
          playSuccessChime();
          // Save record to local storage
          try {
            const history = JSON.parse(localStorage.getItem('last_light_records') || '[]');
            history.unshift({
              score: prev.sciencePoints * 10 + Math.round(prev.dataReturnedGb * 20),
              sci: prev.sciencePoints,
              data: prev.dataReturnedGb,
              health: Math.round(prev.healthPct),
              cost: totals.costM,
              success: prev.healthPct >= 35 && prev.sciencePoints >= 50,
              date: new Date().toLocaleDateString(),
            });
            localStorage.setItem('last_light_records', JSON.stringify(history.slice(0, 20)));
          } catch {
            // Ignore storage errors
          }

          return {
            ...prev,
            day: 146,
            screen: 'debrief',
            toastMessage: 'MISSION COMPLETED: Entering debrief analysis.',
          };
        }

        // Distance to Sun (AU) scaling from 1.0 to 1.25 AU
        const sunDist = 1.0 + (nextDay / 146) * 0.25;
        const solarIntensity = 1 / (sunDist * sunDist);
        const solarGenW = (100 - totals.powerW * 0.4) * solarIntensity;

        // Net power balance
        const activePowerDrawW =
          (prev.powerAlloc.science * 0.4 +
            prev.powerAlloc.comms * 0.35 +
            prev.powerAlloc.computing * 0.25 +
            prev.powerAlloc.thermal * 0.3) *
          (prev.safeMode ? 0.35 : 1.0);

        const netW = solarGenW - activePowerDrawW;
        let newBattery = prev.batteryPct;
        if (netW < 0) {
          newBattery = Math.max(0, prev.batteryPct - 0.4);
        } else {
          newBattery = Math.min(100, prev.batteryPct + 0.6);
        }

        // Thermal calculations
        let newTemp = prev.busTempC;
        if (prev.powerAlloc.thermal < 15) {
          newTemp = Math.max(-45, prev.busTempC - 0.5); // Freezing
        } else if (prev.powerAlloc.thermal > 45) {
          newTemp = Math.min(75, prev.busTempC + 0.6);  // Overheating
        } else {
          newTemp = prev.busTempC + (20 - prev.busTempC) * 0.08; // Normalizing
        }

        // Passive science collection
        let newBuffer = prev.dataBufferGb;
        let newSci = prev.sciencePoints;
        let newHealth = prev.healthPct;

        if (!prev.safeMode && prev.powerAlloc.science >= 20 && newBattery > 10) {
          newBuffer = Math.min(prev.dataBufferMaxGb, prev.dataBufferGb + 0.08);
          newSci += 0.15;
        }

        // Battery brownout damage
        if (newBattery <= 0) {
          newHealth = Math.max(0, newHealth - 0.5);
        }

        // Thermal extreme damage
        if (newTemp < -30 || newTemp > 60) {
          newHealth = Math.max(0, newHealth - 0.3);
        }

        return {
          ...prev,
          day: nextDay,
          batteryPct: newBattery,
          busTempC: +newTemp.toFixed(1),
          dataBufferGb: +newBuffer.toFixed(2),
          sciencePoints: +newSci.toFixed(1),
          healthPct: +newHealth.toFixed(1),
        };
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [g.screen, g.timeSpeed, g.activeCrisis, totals]);

  // ==========================================================================
  // GAMEPLAY ACTION HANDLERS
  // ==========================================================================
  const triggerToast = (msg: string) => updateG({ toastMessage: msg });

  const handleSelectComponent = (subIndex: number, optIndex: number) => {
    playSuccessChime();
    const oldOpt = SUBSYSTEMS[subIndex].options[g.selection[subIndex] || 0];
    const newOpt = SUBSYSTEMS[subIndex].options[optIndex];

    updateG((prev) => ({
      selection: { ...prev.selection, [subIndex]: optIndex },
      compareSubsystemIndex: null,
      compareOptionIndex: null,
      flashBadge: {
        Mass: newOpt.mass - oldOpt.mass,
        Power: newOpt.power - oldOpt.power,
        Cost: newOpt.cost - oldOpt.cost,
        'Δv': newOpt.dv - oldOpt.dv,
      },
    }));
  };

  const handleExecuteManeuver = (type: 'tcm1' | 'tcm2' | 'rdvz') => {
    if (g.fuelKg < 60) {
      triggerToast('INSUFFICIENT PROPELLANT FOR BURN');
      return;
    }

    playThrusterPulse();
    const fuelBurn = type === 'tcm1' ? 75 : type === 'tcm2' ? 95 : 140;
    const missReduction = type === 'tcm1' ? 24000 : type === 'tcm2' ? 12000 : 5700;

    updateG((prev) => ({
      fuelKg: Math.max(0, prev.fuelKg - fuelBurn),
      missDistanceKm: Math.max(80, prev.missDistanceKm - missReduction),
      maneuversDone: { ...prev.maneuversDone, [type]: true },
      toastMessage: `BURN COMPLETE: Miss distance reduced by ${missReduction.toLocaleString()} km!`,
    }));
  };

  const handleExecuteScan = (instrument: string, costW: number, gainSci: number, gainGb: number) => {
    if (g.safeMode) {
      triggerToast('SAFE MODE ACTIVE: Instruments offline');
      return;
    }
    if (g.dataBufferGb + gainGb > g.dataBufferMaxGb) {
      triggerToast('DATA BUFFER FULL: Downlink to Earth first');
      return;
    }
    if (g.batteryPct < 15) {
      triggerToast('LOW BATTERY: Insufficient power for scan');
      return;
    }

    playTelemetryClick();
    setTimeout(playSuccessChime, 600);

    updateG((prev) => ({
      sciencePoints: +(prev.sciencePoints + gainSci).toFixed(1),
      dataBufferGb: +(prev.dataBufferGb + gainGb).toFixed(2),
      batteryPct: Math.max(0, prev.batteryPct - costW * 0.4),
      toastMessage: `SCAN SUCCESS (${instrument}): +${gainSci} Science, +${gainGb} GB`,
    }));
  };

  const handleDownlinkData = () => {
    const isDsnWindow = g.day % 30 < 22; // Open 22 out of 30 days
    if (!isDsnWindow) {
      triggerToast('NO DSN TRACKING WINDOW: Station out of line-of-sight');
      return;
    }
    if (g.dataBufferGb <= 0.1) {
      triggerToast('DATA BUFFER EMPTY: Nothing to downlink');
      return;
    }

    playTelemetryClick();
    const amt = g.dataBufferGb;

    // Simulate animated transmission
    setTimeout(() => {
      playSuccessChime();
      updateG((prev) => ({
        dataReturnedGb: +(prev.dataReturnedGb + amt).toFixed(2),
        dataBufferGb: 0,
        downlinksDone: prev.downlinksDone + 1,
        toastMessage: `DOWNLINK SUCCESS: +${amt.toFixed(1)} GB streamed to Deep Space Network!`,
      }));
    }, 800);
  };

  const handleResolveCrisis = (crisisId: string, choice: 'safe' | 'counter' | 'push') => {
    playTelemetryClick();
    let healthImpact = 0;
    let fuelImpact = 0;
    let sciImpact = 0;
    let summary = '';

    if (crisisId === 'evt_solar_storm') {
      const isRadHard = (g.selection[7] || 0) > 0; // Rad-Hard CPU installed
      const hasActiveThermal = (g.selection[5] || 0) > 0;

      if (choice === 'safe') {
        summary = 'Autonomous Safe Mode engaged. Bus fully protected, science paused.';
        healthImpact = isRadHard ? -2 : -6;
      } else if (choice === 'counter') {
        summary = 'Overdrove thermal pumped coolant to dump solar radiative spike.';
        healthImpact = hasActiveThermal ? -4 : -16;
      } else {
        summary = 'Pushed science instruments through CME flux. Gathered exotic solar data!';
        healthImpact = isRadHard ? -14 : -38;
        sciImpact = 24;
      }
    } else if (crisisId === 'evt_micrometeoroid') {
      const hasWhipple = (g.selection[0] || 0) === 2;
      if (choice === 'counter') {
        summary = 'Slewed spacecraft bus behind rocket engine bell.';
        fuelImpact = 35;
      } else if (choice === 'safe') {
        summary = 'Folded solar panels edge-on.';
        healthImpact = hasWhipple ? -3 : -12;
      } else {
        summary = 'Maintained standard orientation in debris field.';
        healthImpact = hasWhipple ? -5 : -28;
      }
    } else {
      // Reaction wheel
      if (choice === 'counter') {
        summary = 'Hydrazine thrusters compensated flywheel jitter.';
        fuelImpact = 20;
      } else if (choice === 'safe') {
        summary = 'Desaturated flywheels gradually. Avoided thruster propellant burn.';
        sciImpact = -5;
      } else {
        summary = 'Target imaging blurry due to flywheel jitter.';
        sciImpact = 8;
        healthImpact = -8;
      }
    }

    if (healthImpact < -15) {
      playWarningAlert();
    } else {
      playSuccessChime();
    }

    updateG((prev) => ({
      healthPct: Math.max(0, +(prev.healthPct + healthImpact).toFixed(1)),
      fuelKg: Math.max(0, prev.fuelKg - fuelImpact),
      sciencePoints: Math.max(0, +(prev.sciencePoints + sciImpact).toFixed(1)),
      resolvedEvents: [
        ...prev.resolvedEvents,
        { id: crisisId, choice, impact: summary },
      ],
      activeCrisis: null,
      toastMessage: summary,
    }));
  };

  // ==========================================================================
  // RENDER APP SHELL & SCREENS
  // ==========================================================================
  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] bg-[#05070c] text-[#F3F6FA] select-none overflow-hidden">
      {/* Desktop App Control Bar */}
      {!isMobileDevice && (
        <header className="mb-2 flex items-center gap-3 z-50 text-xs mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151B26] border border-[#293342]">
            <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
            <span className="font-bold text-[#00E5FF]">MISSION: LAST LIGHT</span>
          </div>

          <button
            type="button"
            className="px-3 py-1 rounded-full bg-[#151B26] border border-[#293342] text-[#AAB4C3] hover:text-white cursor-pointer transition-colors"
            onClick={() => {
              const nextMuted = toggleAudio();
              setMuted(nextMuted);
            }}
          >
            {muted ? '🔇 MUTED' : '🔊 AUDIO ON'}
          </button>

          <button
            type="button"
            className="px-3 py-1 rounded-full bg-[#151B26] border border-[#293342] text-[#AAB4C3] hover:text-white cursor-pointer transition-colors"
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          >
            {isPhoneFrame ? '📱 PHONE FRAME' : '🖥️ FULLSCREEN'}
          </button>
        </header>
      )}

      {/* Mobile Device Frame Container */}
      <main
        style={
          isPhoneFrame
            ? { width: 393 * scaleFactor, height: 852 * scaleFactor }
            : { width: '100%', height: '100dvh', maxWidth: '480px' }
        }
        className="transition-all duration-300"
      >
        <div
          className={`relative overflow-hidden w-full h-full flex flex-col ${
            isPhoneFrame
              ? 'rounded-[38px] border border-[#293342] shadow-[0_0_80px_#00e5ff22]'
              : ''
          }`}
          style={
            isPhoneFrame
              ? {
                  width: 393,
                  height: 852,
                  background: 'linear-gradient(#080B12, #0D111A)',
                  transform: `scale(${scaleFactor})`,
                  transformOrigin: 'top center',
                }
              : { background: 'linear-gradient(#080B12, #0D111A)' }
          }
        >
          {/* Top Mobile Status Header (Safe Area) */}
          <div className="flex-none pt-3 px-5 flex justify-between items-center text-[10px] mono text-[#AAB4C3] z-30">
            <span className="font-semibold text-white">NASA 12:00</span>
            {isPhoneFrame && (
              <div className="h-4 w-24 bg-[#05070C] rounded-full mx-auto" />
            )}
            <div className="flex items-center gap-1.5 text-[#00E5FF]">
              <span>5G</span>
              <span className="font-bold">■■■</span>
            </div>
          </div>

          {/* Active Screen View */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            {g.screen === 'landing' && (
              <ScreenLanding
                onStart={() => updateG({ screen: 'brief' })}
                onHow={() => updateG({ screen: 'how' })}
                onNasa={() => updateG({ screen: 'nasa' })}
                onRecords={() => updateG({ screen: 'board' })}
              />
            )}

            {g.screen === 'how' && (
              <ScreenHowToPlay
                onStart={() => updateG({ screen: 'brief' })}
                onBack={() => updateG({ screen: 'landing' })}
              />
            )}

            {g.screen === 'brief' && (
              <ScreenBriefing
                onAccept={() => updateG({ screen: 'priorities' })}
                onBack={() => updateG({ screen: 'landing' })}
              />
            )}

            {g.screen === 'priorities' && (
              <ScreenPriorities
                priorities={g.priorities}
                onUpdate={(p) => updateG({ priorities: p })}
                onNext={() => updateG({ screen: 'design' })}
                onBack={() => updateG({ screen: 'brief' })}
              />
            )}

            {g.screen === 'design' && (
              <ScreenDesignStudio
                selection={g.selection}
                totals={totals}
                onSelectComponent={handleSelectComponent}
                onNext={() => updateG({ screen: 'ready' })}
                onBack={() => updateG({ screen: 'priorities' })}
                onOpenCompare={(subIdx, optIdx) =>
                  updateG({ compareSubsystemIndex: subIdx, compareOptionIndex: optIdx })
                }
              />
            )}

            {g.screen === 'ready' && (
              <ScreenReadiness
                mode={g.mode}
                totals={totals}
                onToggleMode={() =>
                  updateG({ mode: g.mode === 'COMMANDER' ? 'ENGINEER' : 'COMMANDER' })
                }
                onNext={() => updateG({ screen: 'stress' })}
                onBack={() => updateG({ screen: 'design' })}
              />
            )}

            {g.screen === 'stress' && (
              <ScreenStressTest
                totals={totals}
                selection={g.selection}
                onLaunch={() => updateG({ screen: 'launch' })}
                onRedesign={() => updateG({ screen: 'design' })}
              />
            )}

            {g.screen === 'launch' && (
              <ScreenLaunchCountdown
                totals={totals}
                onIgnitionComplete={() =>
                  updateG({ screen: 'flight', day: 1, timeSpeed: 1 })
                }
              />
            )}

            {g.screen === 'flight' && (
              <ScreenFlightSim
                g={g}
                totals={totals}
                updateG={updateG}
                onExecuteManeuver={handleExecuteManeuver}
                onExecuteScan={handleExecuteScan}
                onDownlink={handleDownlinkData}
                onOpenRock={() => updateG({ screen: 'rock' })}
              />
            )}

            {g.screen === 'rock' && (
              <ScreenAsteroidSurvey
                g={g}
                updateG={updateG}
                onBack={() => updateG({ screen: 'flight' })}
              />
            )}

            {g.screen === 'debrief' && (
              <ScreenDebrief
                g={g}
                totals={totals}
                onRetry={() => updateG({ ...INITIAL_GAME_STATE, screen: 'design' })}
                onHome={() => updateG({ ...INITIAL_GAME_STATE, screen: 'landing' })}
                onLeaderboard={() => updateG({ screen: 'board' })}
              />
            )}

            {g.screen === 'board' && (
              <ScreenLeaderboard onBack={() => updateG({ screen: 'landing' })} />
            )}

            {g.screen === 'nasa' && (
              <ScreenNasaDossier onBack={() => updateG({ screen: 'landing' })} />
            )}
          </div>

          {/* Compare Sheet Overlay */}
          {g.compareSubsystemIndex !== null && g.compareOptionIndex !== null && (
            <ComponentCompareSheet
              subIndex={g.compareSubsystemIndex}
              candidateIndex={g.compareOptionIndex}
              installedIndex={g.selection[g.compareSubsystemIndex] || 0}
              onInstall={() =>
                handleSelectComponent(g.compareSubsystemIndex!, g.compareOptionIndex!)
              }
              onClose={() =>
                updateG({ compareSubsystemIndex: null, compareOptionIndex: null })
              }
            />
          )}

          {/* Active Flight Crisis Modal */}
          {g.activeCrisis && (
            <CrisisTriageModal
              crisis={g.activeCrisis}
              onResolve={(choice) => handleResolveCrisis(g.activeCrisis!.id, choice)}
            />
          )}

          {/* Safe Mode Active Caution Banner */}
          {g.safeMode && (
            <div
              className="pointer-events-none absolute inset-0 z-40"
              style={{
                background:
                  'repeating-linear-gradient(0deg, #ffab0020 0 2px, transparent 2px 6px), #ffab0012',
                boxShadow: 'inset 0 0 60px #FFAB0066',
              }}
            >
              <div className="mono absolute top-8 w-full text-center text-[10px] font-bold text-[#FFAB00] tracking-widest animate-pulse">
                ⚠ AUTONOMOUS SAFE MODE ACTIVE
              </div>
            </div>
          )}

          {/* Toast Notification Banner */}
          {g.toastMessage && (
            <div className="mono absolute left-4 right-4 top-10 z-50 rounded-xl border border-[#00E5FF] bg-[#0D111Aee] backdrop-blur-md p-3 text-center text-xs text-[#F3F6FA] shadow-[0_0_25px_#00e5ff55] animate-bounce">
              {g.toastMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// 1. SCREEN: LANDING
// ============================================================================
const ScreenLanding: React.FC<{
  onStart: () => void;
  onHow: () => void;
  onNasa: () => void;
  onRecords: () => void;
}> = ({ onStart, onHow, onNasa, onRecords }) => (
  <div className="flex h-full flex-col items-center justify-between p-6 pt-10 pb-8">
    <div className="fl h-48 w-64 flex items-center justify-center">
      <SpacecraftSvg s={1.1} />
    </div>

    <div className="text-center my-auto">
      <div className="text-[28px] font-extrabold tracking-tight text-[#F3F6FA] leading-tight">
        MISSION: LAST LIGHT
      </div>
      <div className="mono mt-2 text-xs tracking-widest text-[#00E5FF] font-semibold">
        DESIGN · STRESS-TEST · ADAPT · SURVIVE
      </div>
      <p className="mt-3 text-xs text-[#AAB4C3] max-w-xs mx-auto leading-relaxed">
        Deep-space asteroid engineering simulator. Balance mass, power, and budget to conquer the hazards of the solar system.
      </p>
    </div>

    <div className="w-full space-y-2.5 pb-2">
      <button
        type="button"
        className="btn p cursor-pointer"
        onClick={() => {
          playSuccessChime();
          onStart();
        }}
      >
        START MISSION
      </button>

      <button
        type="button"
        className="btn cursor-pointer"
        onClick={() => {
          playTelemetryClick();
          onHow();
        }}
      >
        HOW TO PLAY
      </button>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn flex-1 text-xs cursor-pointer"
          onClick={() => {
            playTelemetryClick();
            onNasa();
          }}
        >
          NASA SCIENCE
        </button>
        <button
          type="button"
          className="btn flex-1 text-xs cursor-pointer"
          onClick={() => {
            playTelemetryClick();
            onRecords();
          }}
        >
          RECORDS
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// 2. SCREEN: HOW TO PLAY
// ============================================================================
const ScreenHowToPlay: React.FC<{ onStart: () => void; onBack: () => void }> = ({
  onStart,
  onBack,
}) => {
  const [step, setStep] = useState(0);
  const slides = [
    {
      title: 'Design Spacecraft',
      desc: 'Pick components across 8 subsystems: Structure, Propulsion, Power, Comms, Science, Thermal, Nav, and Computing.',
      icon: '🛠️',
    },
    {
      title: 'Balance Trade-Offs',
      desc: 'Mass, power, budget, and delta-V are constantly in tension. High-performance components add mass and drain dollars.',
      icon: '⚖️',
    },
    {
      title: 'Stress-Test Hazards',
      desc: 'Subject your build to 8 pre-flight hazards: solar flares, micrometeoroids, and deep-space thermal soak.',
      icon: '⚡',
    },
    {
      title: 'Command Real Flight',
      desc: 'Pilot a 146-day transit to ASTERIA-1: time your burns, balance your power grid, and stream data to the Deep Space Network.',
      icon: '🛸',
    },
    {
      title: 'Asteroid Proximity',
      desc: 'Brake into proximity orbit, survey craters in 3D, resolve emergency crises, and safely return high-value science to Earth.',
      icon: '🪐',
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between p-6 pt-6 pb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="mono text-xs text-[#00E5FF] font-bold">MANUAL {step + 1}/5</span>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#AAB4C3] hover:text-white cursor-pointer"
        >
          SKIP
        </button>
      </div>

      <div className="card my-auto h-72 flex flex-col items-center justify-center text-center p-6 border-[#00E5FF]/40">
        <div className="text-4xl mb-4">{slides[step].icon}</div>
        <div className="text-xl font-bold text-white mb-2">{slides[step].title}</div>
        <p className="text-xs text-[#AAB4C3] leading-relaxed max-w-xs">{slides[step].desc}</p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className="h-2 rounded-full transition-all cursor-pointer"
            style={{
              width: i === step ? '24px' : '8px',
              background: i === step ? '#00E5FF' : '#293342',
            }}
            onClick={() => setStep(i)}
          />
        ))}
      </div>

      <div className="space-y-2">
        {step < 4 ? (
          <button
            type="button"
            className="btn p cursor-pointer"
            onClick={() => {
              playTelemetryClick();
              setStep(step + 1);
            }}
          >
            NEXT
          </button>
        ) : (
          <button
            type="button"
            className="btn p cursor-pointer"
            onClick={() => {
              playSuccessChime();
              onStart();
            }}
          >
            START MISSION
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. SCREEN: MISSION BRIEFING
// ============================================================================
const ScreenBriefing: React.FC<{ onAccept: () => void; onBack: () => void }> = ({
  onAccept,
  onBack,
}) => {
  const [showConstraints, setShowConstraints] = useState(true);

  return (
    <div className="flex h-full flex-col justify-between p-5 pt-4 pb-8 overflow-y-auto no-scrollbar">
      <div>
        <div className="flex justify-center mb-2">
          <svg viewBox="-60 -60 120 120" width="110" height="110">
            <g className="sp">
              <circle r="46" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
              <ellipse rx="46" ry="16" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.6" />
              <ellipse rx="16" ry="46" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.6" />
            </g>
            <circle cx="0" cy="0" r="8" fill="#FFAB00" />
          </svg>
        </div>

        <div className="mono text-center text-xs text-[#00E5FF] font-bold mb-1">
          TARGET: ASTERIA-1 (101955 BENNU CLASS)
        </div>
        <div className="text-center text-[11px] text-[#AAB4C3] mb-4">
          Ø 1.2 km Rubble-pile · 1.2 AU Heliocentric Orbit · 146 Days Transit
        </div>

        <div className="card mb-3">
          <div className="text-xs font-bold text-white mb-2 tracking-wide">
            MISSION DIRECTIVES
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#00E5FF] font-bold">✓</span>
              <span>
                <b className="text-[#00E5FF]">Primary:</b> Rendezvous miss distance &lt; 500 km
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#00E5FF] font-bold">✓</span>
              <span>
                <b className="text-[#00E5FF]">Primary:</b> Acquire ≥ 60 scientific survey points
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#AAB4C3] font-bold">✓</span>
              <span>
                <b className="text-[#AAB4C3]">Secondary:</b> Return ≥ 15 GB data via DSN
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#AAB4C3] font-bold">✓</span>
              <span>
                <b className="text-[#AAB4C3]">Secondary:</b> Spacecraft bus integrity &gt; 40%
              </span>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div
            className="flex justify-between items-center text-xs font-bold text-white cursor-pointer"
            onClick={() => setShowConstraints(!showConstraints)}
          >
            <span>ENGINEERING FLIGHT CONSTRAINTS</span>
            <span className="mono text-[#00E5FF]">{showConstraints ? '−' : '+'}</span>
          </div>
          {showConstraints && (
            <div className="mono text-xs text-[#AAB4C3] space-y-1.5 pt-2 border-t border-[#293342]/60 mt-1">
              <div className="flex justify-between">
                <span>Maximum Dry Mass:</span>
                <b className="text-white">≤ 2,500 kg</b>
              </div>
              <div className="flex justify-between">
                <span>Discovery Budget Cap:</span>
                <b className="text-white">≤ $50.0M</b>
              </div>
              <div className="flex justify-between">
                <span>Power Bus Envelope:</span>
                <b className="text-white">≤ 100 W</b>
              </div>
              <div className="flex justify-between">
                <span>Required Interplanetary Δv:</span>
                <b className="text-white">≥ 1,200 m/s</b>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <button
          type="button"
          className="btn p cursor-pointer"
          onClick={() => {
            playSuccessChime();
            onAccept();
          }}
        >
          ACCEPT MISSION
        </button>
        <button
          type="button"
          className="btn text-xs cursor-pointer"
          onClick={onBack}
        >
          BACK
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 4. SCREEN: MISSION PRIORITIES
// ============================================================================
const ScreenPriorities: React.FC<{
  priorities: { science: number; survivability: number; affordability: number };
  onUpdate: (p: { science: number; survivability: number; affordability: number }) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ priorities, onUpdate, onNext, onBack }) => {
  const levels = ['CONSERVATIVE', 'BALANCED', 'MAXIMUM'];

  return (
    <div className="flex h-full flex-col justify-between p-5 pt-6 pb-8">
      <div>
        <div className="text-xl font-bold text-white mb-1">Flight Doctrine</div>
        <p className="text-xs text-[#AAB4C3] mb-6">
          Set your engineering priorities. High science demands heavy payloads, while survivability requires reinforced shielding.
        </p>

        <div className="space-y-4">
          {[
            { key: 'science', label: 'SCIENCE PAYLOAD EMPHASIS' },
            { key: 'survivability', label: 'HAZARD SURVIVABILITY MARGIN' },
            { key: 'affordability', label: 'FISCAL DISCIPLINE (BUDGET)' },
          ].map(({ key, label }) => (
            <div key={key} className="card">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-white">{label}</span>
                <b className="mono text-xs text-[#00E5FF]">
                  {levels[(priorities as any)[key]]}
                </b>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                value={(priorities as any)[key]}
                onChange={(e) =>
                  onUpdate({ ...priorities, [key]: parseInt(e.target.value, 10) })
                }
              />
              <div className="mono flex justify-between text-[10px] text-[#6F7B8C]">
                <span>LOW</span>
                <span>MED</span>
                <span>HIGH</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <button
          type="button"
          className="btn p cursor-pointer"
          onClick={() => {
            playTelemetryClick();
            onNext();
          }}
        >
          CONTINUE TO DESIGN
        </button>
        <button
          type="button"
          className="btn text-xs cursor-pointer"
          onClick={onBack}
        >
          BACK
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 5. SCREEN: SPACECRAFT DESIGN STUDIO
// ============================================================================
const ScreenDesignStudio: React.FC<{
  selection: Record<number, number>;
  totals: CraftTotals;
  onSelectComponent: (subIndex: number, optIndex: number) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenCompare: (subIndex: number, optIndex: number) => void;
}> = ({ selection, totals, onSelectComponent, onNext, onBack, onOpenCompare }) => {
  const [activeTab, setActiveTab] = useState(0);
  const activeSub = SUBSYSTEMS[activeTab];
  const installedIdx = selection[activeTab] || 0;

  return (
    <div className="flex h-full flex-col relative select-none">
      {/* Top Telemetry Badges */}
      <div className="flex-none p-3 pb-1" style={{ height: '36%' }}>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          <div className="pill mono text-[10px] flex-col p-1">
            <span className="text-[#AAB4C3]">Mass</span>
            <b className={totals.isMassValid ? 'text-white' : 'up'}>
              {totals.massKg}kg
            </b>
          </div>
          <div className="pill mono text-[10px] flex-col p-1">
            <span className="text-[#AAB4C3]">Power</span>
            <b className={totals.isPowerValid ? 'text-white' : 'up'}>
              {totals.powerW}W
            </b>
          </div>
          <div className="pill mono text-[10px] flex-col p-1">
            <span className="text-[#AAB4C3]">Budget</span>
            <b className={totals.isBudgetValid ? 'text-white' : 'up'}>
              ${totals.costM}M
            </b>
          </div>
          <div className="pill mono text-[10px] flex-col p-1">
            <span className="text-[#AAB4C3]">Δv</span>
            <b className={totals.isDvValid ? 'dn' : 'up'}>
              {totals.dvMs}m/s
            </b>
          </div>
        </div>

        {/* Spacecraft Visual with clickable hotspot pins */}
        <div className="h-[75%] flex items-center justify-center">
          <SpacecraftSvg onPin={(idx) => setActiveTab(idx)} activeTab={activeTab} />
        </div>
      </div>

      {/* Horizontal Subsystem Tabs */}
      <div className="flex flex-none gap-2 overflow-x-auto px-3 pb-2 no-scrollbar">
        {SUBSYSTEMS.map((sub, i) => (
          <button
            key={sub.id}
            type="button"
            onClick={() => {
              playTelemetryClick();
              setActiveTab(i);
            }}
            className="pill min-h-[36px] px-3 whitespace-nowrap text-xs font-semibold cursor-pointer transition-colors"
            style={{
              borderColor: i === activeTab ? '#00E5FF' : '#293342',
              color: i === activeTab ? '#00E5FF' : '#AAB4C3',
              background: i === activeTab ? '#00E5FF1a' : '#0D111Acc',
            }}
          >
            <span className="mr-1">{sub.icon}</span> {sub.name}
          </button>
        ))}
      </div>

      {/* Component Options List */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-24 no-scrollbar">
        {activeSub.options.map((opt, i) => (
          <div
            key={opt.id}
            className="card transition-all"
            style={{ borderColor: i === installedIdx ? '#00E5FF' : '#293342' }}
          >
            <div className="flex justify-between items-center mb-1">
              <b className="text-white text-xs font-bold">{opt.name}</b>
              <span className="mono text-[10px] text-[#AAB4C3]">
                {opt.mass >= 0 ? `+${opt.mass}` : opt.mass}kg · {opt.cost > 0 ? `+$${opt.cost}M` : '$0M'}
              </span>
            </div>
            <p className="text-[11px] text-[#AAB4C3] mb-1">{opt.desc}</p>
            <div className="mono text-[9px] text-[#6F7B8C] mb-2">{opt.spec}</div>

            <div className="flex gap-2">
              <button
                type="button"
                className={`btn flex-1 text-xs min-h-[38px] cursor-pointer ${
                  i === installedIdx ? 'off' : 'p'
                }`}
                onClick={() => onSelectComponent(activeTab, i)}
              >
                {i === installedIdx ? '✓ INSTALLED' : 'INSTALL'}
              </button>

              <button
                type="button"
                className="btn flex-1 text-xs min-h-[38px] cursor-pointer"
                onClick={() => {
                  playTelemetryClick();
                  onOpenCompare(activeTab, i);
                }}
              >
                COMPARE
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sticky Action */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <button
          type="button"
          className="btn p cursor-pointer"
          onClick={() => {
            playTelemetryClick();
            onNext();
          }}
        >
          MISSION READINESS REVIEW
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 6. SCREEN: FLIGHT READINESS
// ============================================================================
const ScreenReadiness: React.FC<{
  mode: 'COMMANDER' | 'ENGINEER';
  totals: CraftTotals;
  onToggleMode: () => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ mode, totals, onToggleMode, onNext, onBack }) => {
  const r = totals.reliabilityPct;
  const col = r >= 80 ? '#00E676' : r >= 60 ? '#FFAB00' : '#FF1744';

  return (
    <div className="flex h-full flex-col justify-between p-4 pb-8 overflow-y-auto no-scrollbar">
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-bold text-white">Flight Readiness</div>
          <button
            type="button"
            className="pill text-xs font-semibold border-[#00E5FF] text-[#00E5FF] cursor-pointer"
            onClick={onToggleMode}
          >
            MODE: {mode}
          </button>
        </div>

        {/* Circular Gauge */}
        <div className="my-3 flex justify-center">
          <svg viewBox="0 0 120 120" width="150" height="150">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#293342" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={col}
              strokeWidth="10"
              strokeDasharray={`${(r * 3.14).toFixed(1)} 314`}
              transform="rotate(-90 60 60)"
              strokeLinecap="round"
              style={{ transition: 'all .6s ease-out' }}
            />
            <text
              x="60"
              y="68"
              textAnchor="middle"
              fill="#F3F6FA"
              fontSize="24"
              className="mono font-bold"
            >
              {r}%
            </text>
          </svg>
        </div>

        {!totals.isFlightReady && (
          <div className="card mb-3 bl border-[#FF1744] text-[#FF1744] text-xs font-bold text-center">
            ⚠ HARD CONSTRAINT VIOLATION: Review Mass, Power, or Budget!
          </div>
        )}

        <ProgressBar label="Power Bus Envelope" value={100 - totals.powerW + 20} color="#00E676" />
        <ProgressBar label="Structural Payload Margin" value={(2500 - totals.massKg) / 5} />
        <ProgressBar label="Propulsion Margin (Δv)" value={(totals.dvMs / 1600) * 100} />
        <ProgressBar label="Hardware Reliability" value={totals.reliabilityPct} color={col} />
        <ProgressBar label="Fiscal Contingency Reserve" value={totals.budgetRemainingM * 4} color="#FFAB00" />

        {mode === 'ENGINEER' && (
          <div className="card mono text-[11px] text-[#AAB4C3] mt-3 space-y-1">
            <div>Interplanetary Δv: {totals.dvMs} m/s (Target 1,200 m/s)</div>
            <div>Dry Mass: {totals.massKg} kg · Bus Load: {totals.powerW} W</div>
            <div>Radiation Tolerance: {totals.radTolKrad} krad (Si equivalent)</div>
            <div>Remaining Reserve: ${totals.budgetRemainingM}M out of $50M</div>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-4">
        <button
          type="button"
          className="btn p cursor-pointer"
          onClick={() => {
            playTelemetryClick();
            onNext();
          }}
        >
          CONTINUE TO STRESS TEST
        </button>
        <button
          type="button"
          className="btn text-xs cursor-pointer"
          onClick={onBack}
        >
          BACK TO DESIGN
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 7. SCREEN: STRESS TEST
// ============================================================================
const ScreenStressTest: React.FC<{
  totals: CraftTotals;
  selection: Record<number, number>;
  onLaunch: () => void;
  onRedesign: () => void;
}> = ({ totals, selection, onLaunch, onRedesign }) => {
  const [selectedHazard, setSelectedHazard] = useState(0);
  const [testState, setTestState] = useState<{ active?: boolean; damage?: number; outcome?: string }>({});

  const hazard = STRESS_HAZARDS[selectedHazard];

  const runTest = () => {
    playWarningAlert();
    setTestState({ active: true });

    setTimeout(() => {
      // Dynamic damage calculation based on installed components
      let penalty = hazard.penalty;
      if (hazard.sub === 'computing' && (selection[7] || 0) > 0) penalty -= 18;
      if (hazard.sub === 'structure' && (selection[0] || 0) === 2) penalty -= 20;
      if (hazard.sub === 'thermal' && (selection[5] || 0) > 0) penalty -= 16;
      if (hazard.sub === 'power' && (selection[2] || 0) > 0) penalty -= 14;

      const dmg = Math.max(4, Math.round(penalty * 0.9));
      const score = Math.max(30, totals.reliabilityPct - dmg);
      const outcome =
        score >= 70
          ? 'SURVIVES NOMINAL'
          : score >= 48
          ? 'SURVIVES WITH DEGRADATION'
          : 'CRITICAL FAILURE';

      if (score >= 70) {
        playSuccessChime();
      } else {
        playWarningAlert();
      }

      setTestState({ active: false, damage: dmg, outcome });
    }, 1200);
  };

  return (
    <div className="flex h-full flex-col justify-between p-4 pb-8 overflow-y-auto no-scrollbar">
      <div>
        <div className="relative mb-3 h-36 overflow-hidden rounded-xl bg-[#0D111A] flex items-center justify-center border border-[#293342]">
          <SpacecraftSvg s={0.75} />
          {testState.active && (
            <div
              className="absolute inset-0 bl pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, #FF174488, transparent)',
              }}
            />
          )}
        </div>

        <ProgressBar
          label="POWER SURVIVAL"
          value={testState.damage ? 100 - testState.damage : 100}
          color="#FFAB00"
        />
        <ProgressBar
          label="HULL INTEGRITY"
          value={testState.damage ? 100 - testState.damage * 1.4 : 100}
          color="#00E676"
        />

        <div className="my-3 grid grid-cols-2 gap-2">
          {STRESS_HAZARDS.map((h, i) => (
            <button
              key={h.name}
              type="button"
              className="card min-h-[48px] text-[11px] font-semibold cursor-pointer text-left transition-colors"
              style={{
                borderColor: i === selectedHazard ? '#00E5FF' : '#293342',
                color: i === selectedHazard ? '#00E5FF' : '#F3F6FA',
              }}
              onClick={() => {
                playTelemetryClick();
                setSelectedHazard(i);
                setTestState({});
              }}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {testState.outcome && (
        <div className="card my-2 border-[#00E5FF]">
          <div className="mono text-xs text-[#00E5FF] font-bold">
            TEST OUTCOME: {testState.outcome}
          </div>
          <div className="text-xs text-[#AAB4C3] mt-1">
            Estimated damage: {testState.damage}%. Hardened systems reduce degradation.
          </div>
        </div>
      )}

      <div className="space-y-2 mt-2">
        <button
          type="button"
          className="btn p cursor-pointer"
          onClick={runTest}
          disabled={testState.active}
        >
          {testState.active ? 'SIMULATING HAZARD...' : 'RUN STRESS TEST'}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn flex-1 text-xs cursor-pointer"
            onClick={onRedesign}
          >
            REDESIGN
          </button>
          <button
            type="button"
            className="btn flex-1 text-xs cursor-pointer"
            onClick={onLaunch}
          >
            PROCEED TO LAUNCH
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 8. SCREEN: LAUNCH COUNTDOWN
// ============================================================================
const ScreenLaunchCountdown: React.FC<{
  totals: CraftTotals;
  onIgnitionComplete: () => void;
}> = ({ totals, onIgnitionComplete }) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown < 0) {
      playSuccessChime();
      const t = setTimeout(onIgnitionComplete, 1200);
      return () => clearTimeout(t);
    }

    if (countdown === 0) {
      playThrusterPulse();
    } else {
      playTelemetryClick();
    }

    const t = setTimeout(() => setCountdown(countdown - 1), countdown === 0 ? 1600 : 800);
    return () => clearTimeout(t);
  }, [countdown, onIgnitionComplete]);

  if (countdown !== null) {
    return (
      <div className="flex h-full items-center justify-center bg-black relative overflow-hidden select-none">
        {countdown > 0 ? (
          <div key={countdown} className="pg mono text-[130px] font-bold text-[#00E5FF]">
            {countdown}
          </div>
        ) : countdown === 0 ? (
          <div className="flex flex-col items-center">
            <div className="mono text-center text-4xl text-[#FFAB00] font-extrabold tracking-wider animate-bounce">
              IGNITION
            </div>
            {Array.from({ length: 16 }, (_, i) => (
              <span
                key={i}
                className="absolute h-10 w-1 rounded bg-[#FFAB00]"
                style={{
                  left: 140 + i * 8,
                  top: 0,
                  animation: `rk ${0.9 + (i % 4) * 0.15}s linear infinite`,
                  animationDelay: `${i * 0.04}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mono text-2xl font-bold text-[#00E676] animate-pulse">
            ORBIT INSERTION CONFIRMED
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between p-5 pt-12 pb-8">
      <div className="text-center">
        <div className="text-2xl font-bold text-white mb-2">LAUNCH AUTHORIZATION</div>
        <p className="text-xs text-[#AAB4C3]">
          All range tracking stations ready. Confirm flight parameters before liftoff.
        </p>
      </div>

      <div className="space-y-3 my-auto">
        <div className="card flex justify-between items-center text-xs">
          <span>Readiness Score</span>
          <b className="mono text-[#00E5FF] text-sm">{totals.reliabilityPct}%</b>
        </div>
        <div className="card flex justify-between items-center text-xs">
          <span>Available Interplanetary Δv</span>
          <b className="mono text-[#00E676] text-sm">+{totals.dvMs} m/s</b>
        </div>
        <div className="card flex justify-between items-center text-xs">
          <span>Total Vehicle Mass</span>
          <b className="mono text-white text-sm">{totals.massKg} kg</b>
        </div>
        <div className="card flex justify-between items-center text-xs">
          <span>Target Destination</span>
          <b className="mono text-[#FFAB00] text-sm">ASTERIA-1 (146 Days)</b>
        </div>
      </div>

      <button
        type="button"
        className="btn p cursor-pointer"
        onClick={() => setCountdown(10)}
      >
        CONFIRM & INITIATE COUNTDOWN
      </button>
    </div>
  );
};

// ============================================================================
// 9. SCREEN: FLIGHT SIMULATION (THE CORE GAME!)
// ============================================================================
const ScreenFlightSim: React.FC<{
  g: GameState;
  totals: CraftTotals;
  updateG: (updater: Partial<GameState> | ((prev: GameState) => GameState)) => void;
  onExecuteManeuver: (type: 'tcm1' | 'tcm2' | 'rdvz') => void;
  onExecuteScan: (inst: string, costW: number, sci: number, gb: number) => void;
  onDownlink: () => void;
  onOpenRock: () => void;
}> = ({ g, totals, updateG, onExecuteManeuver, onExecuteScan, onDownlink, onOpenRock }) => {
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(1);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);

  const transitPct = g.day / 146;
  const sunDistAu = +(1.0 + transitPct * 0.25).toFixed(2);
  const earthDistAu = +(transitPct * 0.85 + 0.05).toFixed(2);
  const lightLatencyMin = +(earthDistAu * 8.3).toFixed(1);

  // Bezier curve calculations for orbit map
  const bz = (a: number, b: number, c: number, t: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

  const cpX = g.maneuversDone.tcm1 ? 240 : 200;
  const cpY = g.maneuversDone.tcm2 ? 140 : 380;
  const craftX = bz(80, cpX * 0.8, 310, transitPct);
  const craftY = bz(300, cpY, 200, transitPct);

  const phaseName =
    g.day < 5
      ? 'LAUNCH / TLI'
      : g.day < 60
      ? 'CRUISE (TCM-1)'
      : g.day < 110
      ? 'APPROACH (TCM-2)'
      : g.day < 130
      ? 'RENDEZVOUS'
      : 'SCIENCE SURVEY';

  return (
    <div className="relative h-full overflow-hidden select-none flex flex-col">
      {/* Top Status & Speed Controls */}
      <div className="flex-none p-3 pt-1 flex items-center justify-between text-xs z-20 bg-gradient-to-b from-[#080B12] to-transparent">
        <div className="flex items-center gap-1.5">
          <span className="pill mono text-[10px] text-[#00E5FF] font-bold">
            {phaseName}
          </span>
          <span className="pill mono text-[10px]">Day {g.day}/146</span>
        </div>

        {/* Speed Multipliers */}
        <div className="flex items-center gap-1">
          {[
            { s: 0, l: '⏸' },
            { s: 1, l: '1X' },
            { s: 5, l: '5X' },
            { s: 20, l: '20X' },
            { s: 100, l: '100X' },
          ].map(({ s, l }) => (
            <button
              key={s}
              type="button"
              className="pill px-2 py-0.5 text-[9.5px] mono cursor-pointer"
              style={{
                color: g.timeSpeed === s ? '#00E5FF' : '#AAB4C3',
                borderColor: g.timeSpeed === s ? '#00E5FF' : '#293342',
                background: g.timeSpeed === s ? '#00E5FF22' : '#0D111Acc',
              }}
              onClick={() => {
                playTelemetryClick();
                updateG({ timeSpeed: s });
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Orbit Trajectory Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          viewBox="0 0 393 540"
          className="absolute inset-0 w-full h-full touch-none"
          onPointerDown={(e) => setDragStart([e.clientX, e.clientY])}
          onPointerMove={(e) => {
            if (dragStart) {
              setPan([pan[0] + e.clientX - dragStart[0], pan[1] + e.clientY - dragStart[1]]);
              setDragStart([e.clientX, e.clientY]);
            }
          }}
          onPointerUp={() => setDragStart(null)}
          onPointerLeave={() => setDragStart(null)}
        >
          <g transform={`translate(${pan[0]} ${pan[1]}) scale(${zoom})`}>
            {/* Background stars */}
            {Array.from({ length: 30 }, (_, i) => (
              <circle
                key={i}
                cx={(i * 97) % 393}
                cy={(i * 61) % 540}
                r={i % 3 ? 0.9 : 1.4}
                fill="#fff"
                opacity="0.45"
              />
            ))}

            {/* Orbit Trajectory Arc */}
            <path
              d={`M80 300 Q ${cpX * 0.8} ${cpY} 310 200`}
              fill="none"
              stroke="#00E676"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.75"
            />

            {/* Earth Body */}
            <circle cx="80" cy="300" r="32" fill="#12467a" stroke="#00E5FF" strokeWidth="1.5" />
            <text x="80" y="346" fill="#AAB4C3" fontSize="10" textAnchor="middle" className="mono">
              EARTH
            </text>

            {/* Target Asteroid ASTERIA-1 */}
            <g
              className="cursor-pointer"
              onClick={() => {
                playTelemetryClick();
                onOpenRock();
              }}
            >
              <circle cx="310" cy="200" r="16" fill="#3a3f4b" stroke="#AAB4C3" strokeWidth="1.5" />
              <circle cx="310" cy="200" r="22" fill="none" stroke="#00E5FF" strokeWidth="1" strokeDasharray="3 3">
                <animate attributeName="r" values="20;26;20" dur="3s" repeatCount="indefinite" />
              </circle>
              <text x="310" y="234" fill="#AAB4C3" fontSize="10" textAnchor="middle" className="mono">
                ASTERIA-1
              </text>
            </g>

            {/* Spacecraft Marker */}
            <g transform={`translate(${craftX} ${craftY})`}>
              <circle r="8" fill="#00E5FF">
                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
              </circle>
              <rect x="-4" y="-4" width="8" height="8" fill="#F3F6FA" rx="1" />
            </g>
          </g>
        </svg>

        {/* Zoom Buttons */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            className="pill min-h-[36px] min-w-[36px] text-sm font-bold text-white cursor-pointer"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
          >
            ＋
          </button>
          <button
            type="button"
            className="pill min-h-[36px] min-w-[36px] text-sm font-bold text-white cursor-pointer"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
          >
            －
          </button>
        </div>

        {/* Left Telemetry HUD */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 text-[10px] mono">
          <div className="pill py-1 px-2.5">
            <span className="text-[#AAB4C3] mr-1">Health:</span>
            <b className={g.healthPct > 50 ? 'text-[#00E676]' : 'up'}>
              {Math.round(g.healthPct)}%
            </b>
          </div>
          <div className="pill py-1 px-2.5">
            <span className="text-[#AAB4C3] mr-1">Fuel:</span>
            <b className="text-[#00E5FF]">{Math.round(g.fuelKg)} kg</b>
          </div>
          <div className="pill py-1 px-2.5">
            <span className="text-[#AAB4C3] mr-1">Battery:</span>
            <b className={g.batteryPct > 20 ? 'text-[#00E5FF]' : 'up'}>
              {Math.round(g.batteryPct)}%
            </b>
          </div>
          <div className="pill py-1 px-2.5">
            <span className="text-[#AAB4C3] mr-1">Buffer:</span>
            <b className="text-[#00E5FF]">{g.dataBufferGb.toFixed(1)} GB</b>
          </div>
          <div className="pill py-1 px-2.5">
            <span className="text-[#AAB4C3] mr-1">Miss Dist:</span>
            <b className={g.missDistanceKm < 500 ? 'text-[#00E676]' : 'text-[#FFAB00]'}>
              {g.missDistanceKm.toLocaleString()} km
            </b>
          </div>
          <div className="pill py-1 px-2.5">
            <span className="text-[#AAB4C3] mr-1">Temp:</span>
            <b className="text-[#00E5FF]">{g.busTempC}°C</b>
          </div>
        </div>
      </div>

      {/* Bottom 6-icon Dock Bar */}
      <div className="flex-none grid grid-cols-6 gap-1 border-t border-[#293342] bg-[#0D111Aee] backdrop-blur-md p-2 pb-4 z-20">
        {[
          { id: 'maneuver', icon: '⌖', label: 'MANEUVER' },
          { id: 'observe', icon: '◉', label: 'SURFACE' },
          { id: 'power', icon: '⚡', label: 'POWER' },
          { id: 'comms', icon: '📡', label: 'COMMS' },
          { id: 'science', icon: '⚗', label: 'SCIENCE' },
          { id: 'safe', icon: '⛨', label: 'SAFE' },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            className="min-h-[50px] rounded-lg text-center cursor-pointer active:scale-95 transition-transform"
            style={{
              color:
                id === 'safe' && g.safeMode
                  ? '#FFAB00'
                  : g.activeDockTab === id
                  ? '#00E5FF'
                  : '#F3F6FA',
            }}
            onClick={() => {
              playTelemetryClick();
              if (id === 'safe') {
                updateG({ safeMode: !g.safeMode });
              } else if (id === 'observe') {
                onOpenRock();
              } else {
                updateG({ activeDockTab: g.activeDockTab === id ? null : (id as FlightDockTab) });
              }
            }}
          >
            <div className="text-lg leading-tight">{icon}</div>
            <div className="text-[7.5px] tracking-tight font-semibold mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* MANEUVER BOTTOM SHEET */}
      {g.activeDockTab === 'maneuver' && (
        <Sheet onClose={() => updateG({ activeDockTab: null })}>
          <div className="text-sm font-bold text-white mb-2">TRAJECTORY CORRECTION BURNS</div>
          <p className="text-xs text-[#AAB4C3] mb-3">
            Execute burns to reduce asteroid miss distance. Insufficient delta-V will cause a flyby.
          </p>

          <div className="space-y-2 mb-4 text-xs">
            <div className="card">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">TCM-1: Midcourse Correction</span>
                <b className={g.maneuversDone.tcm1 ? 'dn' : 'text-[#AAB4C3]'}>
                  {g.maneuversDone.tcm1 ? '✓ EXECUTED' : 'READY'}
                </b>
              </div>
              <div className="mono text-[11px] text-[#AAB4C3] mb-2">
                Burn: 75 kg Propellant · Reduces miss by 24,000 km
              </div>
              {!g.maneuversDone.tcm1 && (
                <button
                  type="button"
                  className="btn p min-h-[36px] text-xs cursor-pointer"
                  onClick={() => onExecuteManeuver('tcm1')}
                >
                  EXECUTE TCM-1 BURN
                </button>
              )}
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">TCM-2: Approach Guidance</span>
                <b className={g.maneuversDone.tcm2 ? 'dn' : 'text-[#AAB4C3]'}>
                  {g.maneuversDone.tcm2 ? '✓ EXECUTED' : 'READY'}
                </b>
              </div>
              <div className="mono text-[11px] text-[#AAB4C3] mb-2">
                Burn: 95 kg Propellant · Reduces miss by 12,000 km
              </div>
              {!g.maneuversDone.tcm2 && (
                <button
                  type="button"
                  className="btn p min-h-[36px] text-xs cursor-pointer"
                  onClick={() => onExecuteManeuver('tcm2')}
                >
                  EXECUTE TCM-2 BURN
                </button>
              )}
            </div>

            <div className="card">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">Rendezvous Insertion Burn</span>
                <b className={g.maneuversDone.rdvz ? 'dn' : 'text-[#AAB4C3]'}>
                  {g.maneuversDone.rdvz ? '✓ EXECUTED' : 'READY'}
                </b>
              </div>
              <div className="mono text-[11px] text-[#AAB4C3] mb-2">
                Burn: 140 kg Propellant · Enters proximity orbit (&lt; 100 km)
              </div>
              {!g.maneuversDone.rdvz && (
                <button
                  type="button"
                  className="btn p min-h-[36px] text-xs cursor-pointer"
                  onClick={() => onExecuteManeuver('rdvz')}
                >
                  EXECUTE INSERTION BURN
                </button>
              )}
            </div>
          </div>
        </Sheet>
      )}

      {/* POWER MANAGEMENT SHEET */}
      {g.activeDockTab === 'power' && (
        <Sheet onClose={() => updateG({ activeDockTab: null })}>
          <div className="text-sm font-bold text-white mb-1">ELECTRICAL POWER GRID</div>
          <div className="mono text-xs text-[#00E5FF] mb-3">
            Solar Irradiance: {sunDistAu} AU ({Math.round(100 / (sunDistAu * sunDistAu))}% generation)
          </div>

          {(['science', 'comms', 'computing', 'thermal'] as const).map((k) => (
            <div key={k} className="mb-2">
              <div className="mono flex justify-between text-xs text-[#AAB4C3] mb-0.5">
                <span>{k.toUpperCase()}</span>
                <b className="text-[#00E5FF]">{g.powerAlloc[k]}%</b>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={g.powerAlloc[k]}
                onChange={(e) =>
                  updateG({
                    powerAlloc: { ...g.powerAlloc, [k]: parseInt(e.target.value, 10) },
                  })
                }
              />
            </div>
          ))}

          <button
            type="button"
            className="btn p mt-2 min-h-[40px] text-xs cursor-pointer"
            onClick={() => {
              playSuccessChime();
              updateG({ activeDockTab: null, toastMessage: 'Power grid rebalanced.' });
            }}
          >
            APPLY CONFIGURATION
          </button>
        </Sheet>
      )}

      {/* COMMS DOWNLINK SHEET */}
      {g.activeDockTab === 'comms' && (
        <Sheet onClose={() => updateG({ activeDockTab: null })}>
          <div className="text-sm font-bold text-white mb-1">DEEP SPACE NETWORK LINK</div>
          <div className="mono text-xs text-[#AAB4C3] mb-2">
            Distance: {earthDistAu} AU · 1-Way Latency: {lightLatencyMin} min
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mono mb-3">
            <div className="card p-2">
              Signal:{' '}
              <b className={g.day % 30 < 22 ? 'text-[#00E676]' : 'up'}>
                {g.day % 30 < 22 ? 'LOCKED (GOLDSTONE)' : 'NO VISIBILITY'}
              </b>
            </div>
            <div className="card p-2">
              Data Rate: <b className="text-[#00E5FF]">2.4 Mbps</b>
            </div>
            <div className="card p-2">
              Downlinked: <b className="text-[#00E5FF]">{g.dataReturnedGb} GB</b>
            </div>
            <div className="card p-2">
              Contacts:{' '}
              <b className="text-[#00E5FF]">{g.downlinksDone} passes</b>
            </div>
          </div>

          <ProgressBar
            label={`Recorder Buffer (${g.dataBufferGb} / ${g.dataBufferMaxGb} GB)`}
            value={(g.dataBufferGb / g.dataBufferMaxGb) * 100}
          />

          <button
            type="button"
            className="btn p mt-2 min-h-[40px] text-xs cursor-pointer"
            onClick={onDownlink}
          >
            DOWNLINK TO EARTH NOW
          </button>
        </Sheet>
      )}

      {/* SCIENCE OPERATIONS SHEET */}
      {g.activeDockTab === 'science' && (
        <Sheet onClose={() => updateG({ activeDockTab: null })}>
          <div className="text-sm font-bold text-white mb-1">INSTRUMENT SCIENTIFIC OBSERVATIONS</div>
          <div className="mono text-xs text-[#00E5FF] mb-3">
            Cumulative Science Yield: {g.sciencePoints} pts
          </div>

          <div className="space-y-2 mb-3">
            {[
              { id: 'Camera', label: 'PolyCam Framing Imager', cost: 12, sci: 8, gb: 1.8 },
              { id: 'IR Spec', label: 'OVIRS Infrared Spectrometer', cost: 18, sci: 12, gb: 2.4 },
              { id: 'Radar', label: 'Subsurface Sounder', cost: 26, sci: 16, gb: 3.5 },
              { id: 'LIDAR', label: '3D Laser Altimeter', cost: 22, sci: 14, gb: 2.8 },
            ].map(({ id, label, cost, sci, gb }) => (
              <div key={id} className="card flex justify-between items-center p-2 text-xs">
                <div>
                  <b className="text-white block">{label}</b>
                  <span className="mono text-[10px] text-[#6F7B8C]">
                    +{sci} Pts · +{gb} GB Data
                  </span>
                </div>
                <button
                  type="button"
                  className="btn p min-h-[34px] w-28 text-xs cursor-pointer"
                  onClick={() => onExecuteScan(id, cost, sci, gb)}
                >
                  EXECUTE
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn min-h-[40px] text-xs cursor-pointer"
            onClick={onOpenRock}
          >
            SURFACE PROXIMITY SURVEY (3D)
          </button>
        </Sheet>
      )}
    </div>
  );
};

// ============================================================================
// 10. SCREEN: ASTEROID SURFACE SURVEY (3D / 2.5D ROTATION)
// ============================================================================
const ScreenAsteroidSurvey: React.FC<{
  g: GameState;
  updateG: (updater: Partial<GameState> | ((prev: GameState) => GameState)) => void;
  onBack: () => void;
}> = ({ g, updateG, onBack }) => {
  const [rot, setRot] = useState(0);
  const [dragX, setDragX] = useState<number | null>(null);
  const [inspectedPin, setInspectedPin] = useState<string | null>(null);

  const targets = [
    { id: 'Alpha', name: 'Nightingale Crater', desc: 'Fine-grained black organic regolith. High scientific value.', sci: 20, gb: 2.5 },
    { id: 'Beta', name: 'Osprey Basin', desc: 'B-type carbonaceous asteroid boulder field with hydrated minerals.', sci: 16, gb: 2.0 },
    { id: 'Gamma', name: 'Equatorial Ridge', desc: 'Rotational diamond bulge. Rich in ancient volatile ice deposits.', sci: 24, gb: 3.2 },
  ];

  return (
    <div className="flex h-full flex-col justify-between p-4 pt-4 pb-8 select-none">
      <div className="text-center">
        <div className="mono text-xs text-[#00E5FF] font-bold">
          ASTERIA-1 · PROXIMITY RECONNAISSANCE
        </div>
        <div className="text-[11px] text-[#AAB4C3]">
          Drag to rotate asteroid sphere · Tap markers to survey
        </div>
      </div>

      <div
        className="touch-none cursor-grab flex items-center justify-center my-auto"
        onPointerDown={(e) => setDragX(e.clientX)}
        onPointerMove={(e) => {
          if (dragX !== null) {
            setRot((r) => r + (e.clientX - dragX) / 50);
            setDragX(e.clientX);
          }
        }}
        onPointerUp={() => setDragX(null)}
        onPointerLeave={() => setDragX(null)}
        style={{ position: 'relative', width: 280, height: 280 }}
      >
        <AsteroidSvg rot={rot} size={135} />

        {targets.map((t, i) => {
          const a = i * 2.1 + rot;
          if (Math.cos(a) <= 0) return null;
          return (
            <button
              key={t.id}
              type="button"
              className="pill absolute min-h-[38px] min-w-[38px] text-xs font-bold border-[#00E5FF] text-[#00E5FF] cursor-pointer shadow-lg active:scale-95"
              style={{
                left: 140 + Math.sin(a) * 90 - 19,
                top: 120 + (i - 1) * 36 - 19,
                background: '#0D111Aee',
              }}
              onClick={() => {
                playTelemetryClick();
                setInspectedPin(t.id);
              }}
            >
              {t.id[0]}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn cursor-pointer"
        onClick={onBack}
      >
        RETURN TO FLIGHT NAVIGATION
      </button>

      {/* Surface Feature Sheet */}
      {inspectedPin && (
        <Sheet onClose={() => setInspectedPin(null)}>
          {(() => {
            const tgt = targets.find((t) => t.id === inspectedPin)!;
            return (
              <div>
                <div className="text-sm font-bold text-white mb-1">{tgt.name}</div>
                <p className="text-xs text-[#AAB4C3] mb-3">{tgt.desc}</p>
                <div className="mono text-xs text-[#00E5FF] mb-3">
                  Yield: +{tgt.sci} Science Points · +{tgt.gb} GB Data
                </div>

                <button
                  type="button"
                  className="btn p min-h-[40px] text-xs cursor-pointer"
                  onClick={() => {
                    playSuccessChime();
                    updateG({
                      sciencePoints: +(g.sciencePoints + tgt.sci).toFixed(1),
                      dataBufferGb: Math.min(g.dataBufferMaxGb, +(g.dataBufferGb + tgt.gb).toFixed(2)),
                      surveysDone: g.surveysDone + 1,
                      toastMessage: `SURFACE SURVEY: +${tgt.sci} Science, +${tgt.gb} GB captured!`,
                    });
                    setInspectedPin(null);
                  }}
                >
                  ACQUIRE TARGET DATA
                </button>
              </div>
            );
          })()}
        </Sheet>
      )}
    </div>
  );
};

// ============================================================================
// 11. SCREEN: MISSION DEBRIEF & SCORING
// ============================================================================
const ScreenDebrief: React.FC<{
  g: GameState;
  totals: CraftTotals;
  onRetry: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
}> = ({ g, totals, onRetry, onHome, onLeaderboard }) => {
  const isSuccess = g.healthPct >= 35 && g.sciencePoints >= 50;

  // Composite aerospace score
  const scienceScore = Math.min(300, Math.round(g.sciencePoints * 3.5));
  const dataScore = Math.min(250, Math.round(g.dataReturnedGb * 15));
  const survivalScore = Math.round(g.healthPct * 2);
  const trajectoryScore = g.missDistanceKm < 500 ? 150 : g.missDistanceKm < 5000 ? 75 : 0;
  const compositeScore = scienceScore + dataScore + survivalScore + trajectoryScore;

  const medal =
    compositeScore >= 750
      ? '🥇 LEGENDARY FLIGHT DIRECTOR (GOLD)'
      : compositeScore >= 550
      ? '🥈 MISSION COMMANDER (SILVER)'
      : '🥉 FLIGHT SPECIALIST (BRONZE)';

  return (
    <div className="flex h-full flex-col justify-between p-4 pb-8 overflow-y-auto no-scrollbar">
      <div>
        <div
          className="mx-auto mb-3 mt-4 w-fit rounded-full px-5 py-1.5 font-bold text-xs tracking-wider"
          style={{
            background: isSuccess ? '#00E67622' : '#FFAB0022',
            color: isSuccess ? '#00E676' : '#FFAB00',
            border: '1px solid',
            borderColor: isSuccess ? '#00E676' : '#FFAB00',
          }}
        >
          {isSuccess ? 'MISSION NOMINAL · SUCCESS' : 'MISSION TERMINATED · FAILED'}
        </div>

        <div className="text-center font-bold text-sm text-[#00E5FF] mb-3">
          {medal}
        </div>

        <div className="space-y-1.5 text-xs mono mb-4">
          <div className="card flex justify-between p-2">
            <span className="text-[#AAB4C3]">Composite Score</span>
            <b className="text-white text-sm">{compositeScore} / 1000 PTS</b>
          </div>
          <div className="card flex justify-between p-2">
            <span className="text-[#AAB4C3]">Science Gathered</span>
            <b className="text-[#00E5FF]">{g.sciencePoints.toFixed(1)} PTS</b>
          </div>
          <div className="card flex justify-between p-2">
            <span className="text-[#AAB4C3]">Data Streamed via DSN</span>
            <b className="text-[#00E5FF]">{g.dataReturnedGb.toFixed(1)} GB</b>
          </div>
          <div className="card flex justify-between p-2">
            <span className="text-[#AAB4C3]">Final Spacecraft Health</span>
            <b className={g.healthPct > 40 ? 'text-[#00E676]' : 'up'}>
              {Math.round(g.healthPct)}%
            </b>
          </div>
          <div className="card flex justify-between p-2">
            <span className="text-[#AAB4C3]">Final Asteroid Miss Distance</span>
            <b className="text-white">{g.missDistanceKm.toLocaleString()} km</b>
          </div>
          <div className="card flex justify-between p-2">
            <span className="text-[#AAB4C3]">Total Mission Cost</span>
            <b className="text-white">${totals.costM}M</b>
          </div>
        </div>

        {/* Resolved event consequences */}
        {g.resolvedEvents.length > 0 && (
          <div className="card mb-4">
            <div className="text-xs font-bold text-white mb-2">CRISIS DECISIONS LOG</div>
            <div className="space-y-1.5 text-[11px] text-[#AAB4C3]">
              {g.resolvedEvents.map((r) => (
                <div key={r.id} className="border-b border-[#293342]/40 pb-1 last:border-none">
                  <span className="text-[#00E5FF] font-semibold">[{r.choice.toUpperCase()}]: </span>
                  {r.impact}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-auto">
        <button
          type="button"
          className="btn p cursor-pointer"
          onClick={onRetry}
        >
          RETRY MISSION (NEW DESIGN)
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn flex-1 text-xs cursor-pointer"
            onClick={onLeaderboard}
          >
            VIEW RECORDS
          </button>
          <button
            type="button"
            className="btn flex-1 text-xs cursor-pointer"
            onClick={onHome}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 12. SCREEN: LEADERBOARD & RECORDS
// ============================================================================
const ScreenLeaderboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  let records: any[] = [];
  try {
    records = JSON.parse(localStorage.getItem('last_light_records') || '[]');
  } catch {
    records = [];
  }

  return (
    <div className="flex h-full flex-col justify-between p-5 pt-6 pb-8">
      <div>
        <div className="text-xl font-bold text-white mb-1">Flight Records</div>
        <p className="text-xs text-[#AAB4C3] mb-4">
          Historical spaceflight mission logs persisted in local storage.
        </p>

        <div className="space-y-2 overflow-y-auto max-h-96 no-scrollbar">
          {records.length > 0 ? (
            records.map((r, i) => (
              <div key={i} className="card mono text-xs flex justify-between items-center p-2.5">
                <div>
                  <b className="text-white">#{i + 1} · {r.date}</b>
                  <div className="text-[10px] text-[#6F7B8C]">
                    Sci: {r.sci} · Data: {r.data}GB · HP: {r.health}%
                  </div>
                </div>
                <b className="text-[#00E5FF] text-sm">{r.score} PTS</b>
              </div>
            ))
          ) : (
            <div className="card text-center text-xs text-[#6F7B8C] py-8">
              No saved flight records yet. Complete a flight to log your mission!
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        className="btn cursor-pointer mt-4"
        onClick={onBack}
      >
        BACK TO MAIN MENU
      </button>
    </div>
  );
};

// ============================================================================
// 13. SCREEN: NASA SCIENCE DOSSIER
// ============================================================================
const ScreenNasaDossier: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [openCard, setOpenCard] = useState<number | null>(null);

  const articles = [
    {
      title: 'Tsiolkovsky Rocket Equation',
      desc: 'Δv = Isp · g₀ · ln(m₀ / m_f)\nGoverns the fundamental velocity change achievable by chemical and ion propulsion systems given propellant mass fraction.',
    },
    {
      title: 'Solar Inverse-Square Law',
      desc: 'P = P₀ · (1 AU / r)²\nSolar flux drops rapidly as distance from the Sun increases. At 1.25 AU, solar panels generate ~64% of their Earth-orbit nominal power.',
    },
    {
      title: 'Shannon-Hartley Comms Theorem',
      desc: 'C = B · log₂(1 + S/N)\nDeep space data throughput is limited by antenna gain, transmitting power, and distance attenuation over interplanetary ranges.',
    },
    {
      title: 'Deep Space Network (DSN)',
      desc: 'NASA ground tracking antennas located 120° apart at Goldstone (USA), Madrid (Spain), and Canberra (Australia) maintain continuous line-of-sight communications.',
    },
    {
      title: 'Asteroid 101955 Bennu (OSIRIS-REx)',
      desc: 'Primordial B-type carbonaceous near-Earth asteroid. Microgravity rubble-pile composition with active particle plume ejections.',
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between p-5 pt-6 pb-8 overflow-y-auto no-scrollbar">
      <div>
        <div className="text-xl font-bold text-white mb-1">NASA Science Dossier</div>
        <p className="text-xs text-[#AAB4C3] mb-4">
          Real aerospace physics and astrodynamics formulas utilized by the simulation engine.
        </p>

        <div className="space-y-2">
          {articles.map((art, i) => (
            <div
              key={art.title}
              className="card cursor-pointer transition-colors"
              onClick={() => {
                playTelemetryClick();
                setOpenCard(openCard === i ? null : i);
              }}
            >
              <div className="flex justify-between items-center text-xs font-bold text-white">
                <span>{art.title}</span>
                <span className="mono text-[#00E5FF]">{openCard === i ? '−' : '+'}</span>
              </div>
              {openCard === i && (
                <pre className="mono mt-2 text-[11px] text-[#AAB4C3] whitespace-pre-wrap pt-2 border-t border-[#293342]/60">
                  {art.desc}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn cursor-pointer mt-4"
        onClick={onBack}
      >
        BACK
      </button>
    </div>
  );
};

// ============================================================================
// MODAL & SHEET COMPONENTS
// ============================================================================
const Sheet: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({
  children,
  onClose,
}) => (
  <div className="sheet">
    <div
      className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#293342] hover:bg-[#00E5FF] cursor-pointer transition-colors"
      onClick={onClose}
    />
    {children}
  </div>
);

const ProgressBar: React.FC<{ label: string; value: number; color?: string }> = ({
  label,
  value,
  color = '#00E5FF',
}) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs text-[#AAB4C3] mono mb-1">
      <span>{label}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <div className="h-2 rounded bg-[#0D111A]">
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
          transition: 'width .4s ease-out',
        }}
        className="h-2 rounded"
      />
    </div>
  </div>
);

const ComponentCompareSheet: React.FC<{
  subIndex: number;
  candidateIndex: number;
  installedIndex: number;
  onInstall: () => void;
  onClose: () => void;
}> = ({ subIndex, candidateIndex, installedIndex, onInstall, onClose }) => {
  const sub = SUBSYSTEMS[subIndex];
  const cand = sub.options[candidateIndex];
  const inst = sub.options[installedIndex];

  return (
    <Sheet onClose={onClose}>
      <div className="text-sm font-bold text-white mb-2">COMPARE · {sub.name}</div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="card p-2 border-[#00E5FF]">
          <span className="text-[10px] mono text-[#00E5FF] block">CURRENT</span>
          <b className="text-white text-xs block mb-1">{inst.name}</b>
          <div className="mono text-[10px] space-y-0.5 text-[#AAB4C3]">
            <div>Mass: {inst.mass}kg</div>
            <div>Power: {inst.power}W</div>
            <div>Cost: ${inst.cost}M</div>
            <div>Δv: {inst.dv}m/s</div>
          </div>
        </div>

        <div className="card p-2 border-[#293342]">
          <span className="text-[10px] mono text-[#FFAB00] block">CANDIDATE</span>
          <b className="text-white text-xs block mb-1">{cand.name}</b>
          <div className="mono text-[10px] space-y-0.5 text-[#AAB4C3]">
            <div>Mass: {cand.mass}kg</div>
            <div>Power: {cand.power}W</div>
            <div>Cost: ${cand.cost}M</div>
            <div>Δv: {cand.dv}m/s</div>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          className="btn p min-h-[40px] text-xs cursor-pointer"
          onClick={onInstall}
        >
          INSTALL CANDIDATE ({cand.name})
        </button>
        <button
          type="button"
          className="btn min-h-[40px] text-xs cursor-pointer"
          onClick={onClose}
        >
          CANCEL
        </button>
      </div>
    </Sheet>
  );
};

const CrisisTriageModal: React.FC<{
  crisis: InFlightCrisis;
  onResolve: (action: 'safe' | 'counter' | 'push') => void;
}> = ({ crisis, onResolve }) => (
  <div className="absolute inset-0 z-40 flex items-end bg-black/80 backdrop-blur-sm">
    <div
      className="sheet border-[#FF1744] border-2"
      style={{ animation: 'sheetUp .3s ease-out' }}
    >
      <div className="mono mb-1 text-center font-bold text-sm text-[#FF1744] animate-pulse">
        {crisis.title}
      </div>
      <p className="mb-3 text-center text-xs text-[#AAB4C3]">{crisis.desc}</p>

      <div className="space-y-2">
        {crisis.options.map((opt) => (
          <button
            key={opt.action}
            type="button"
            className="card w-full text-left p-2.5 cursor-pointer hover:border-[#00E5FF] transition-colors"
            onClick={() => onResolve(opt.action)}
          >
            <b className="text-white text-xs block mb-0.5">{opt.label}</b>
            <span className="text-[10px] text-[#AAB4C3]">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ============================================================================
// SVG ASSETS: SPACECRAFT & ASTEROID
// ============================================================================
const SpacecraftSvg: React.FC<{
  s?: number;
  onPin?: (idx: number) => void;
  activeTab?: number;
}> = ({ s = 1, onPin, activeTab }) => (
  <svg viewBox="0 0 300 200" width="100%" height="100%" className="overflow-visible select-none">
    <g transform={`translate(150 100) scale(${s})`}>
      {/* Solar Wings */}
      <rect x="-110" y="-18" width="70" height="36" fill="#0b3b55" stroke="#00E5FF" rx="2" />
      <line x1="-75" y1="-18" x2="-75" y2="18" stroke="#00E5FF" opacity="0.4" />
      <rect x="40" y="-18" width="70" height="36" fill="#0b3b55" stroke="#00E5FF" rx="2" />
      <line x1="75" y1="-18" x2="75" y2="18" stroke="#00E5FF" opacity="0.4" />

      {/* Main Bus Frame */}
      <rect x="-38" y="-30" width="76" height="60" rx="8" fill="#1d2636" stroke="#AAB4C3" />

      {/* High-gain Dish */}
      <circle cx="0" cy="-42" r="9" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
      <line x1="0" y1="-33" x2="0" y2="-30" stroke="#00E5FF" strokeWidth="2" />

      {/* Thruster Nozzle */}
      <rect x="-10" y="30" width="20" height="14" fill="#FFAB00" rx="2" />

      {/* Subsystem interactive pins (8 subsystems) */}
      {[
        [-70, 0, 2], // 2: Power (Solar)
        [0, -42, 3],  // 3: Comms (Dish)
        [0, 37, 1],   // 1: Propulsion (Thruster)
        [-25, 0, 0],  // 0: Structure (Truss)
        [25, 0, 4],   // 4: Science (Sensor)
        [70, 0, 5],   // 5: Thermal (Radiator)
        [0, 10, 6],   // 6: Navigation (Star tracker)
        [15, -18, 7], // 7: Computing (Flight CPU)
      ].map(([x, y, i]) => (
        <g
          key={i}
          className="cursor-pointer"
          onClick={() => {
            playTelemetryClick();
            if (onPin) onPin(i);
          }}
        >
          <circle
            cx={x}
            cy={y}
            r={activeTab === i ? 10 : 8}
            fill={activeTab === i ? '#00E5FF' : '#00E5FF'}
            opacity={activeTab === i ? 0.5 : 0.25}
          >
            <animate attributeName="r" values="6;12;6" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={y} r="4.5" fill={activeTab === i ? '#FFAB00' : '#00E5FF'} />
        </g>
      ))}
    </g>
  </svg>
);

const AsteroidSvg: React.FC<{ rot: number; size?: number }> = ({ rot, size = 70 }) => (
  <svg viewBox="-100 -100 200 200" width={size * 2} height={size * 2} className="select-none overflow-visible">
    <defs>
      <radialGradient id="astGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#414b5d" />
        <stop offset="60%" stopColor="#222834" />
        <stop offset="100%" stopColor="#0d111a" />
      </radialGradient>
      <filter id="astGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E5FF" floodOpacity="0.25" />
      </filter>
    </defs>
    <circle r="80" fill="url(#astGrad)" stroke="#00E5FF" strokeWidth="1.5" strokeDasharray="5 3" filter="url(#astGlow)" />
    {[0, 1, 2, 3, 4].map((i) => {
      const a = i * 1.3 + rot;
      const cosA = Math.cos(a);
      if (cosA <= 0) return null;
      return (
        <ellipse
          key={i}
          cx={Math.sin(a) * 55}
          cy={(i - 2) * 18}
          rx={Math.max(2, 14 * cosA + 2)}
          ry={12}
          fill="#161b24"
          stroke="#293342"
          strokeWidth="1"
        />
      );
    })}
  </svg>
);

export default App;
