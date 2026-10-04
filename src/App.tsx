import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  createContext,
  memo
} from 'react';
import {
  playTelemetryClick,
  playSuccessChime,
  playWarningAlert,
  playThrusterPulse,
  isAudioMuted,
  toggleAudio
} from './utils/audio.ts';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Part {
  id: string;
  name: string;
  mass: number;
  cost: number;
  desc: string;
  [key: string]: any;
}

export interface Design {
  prop: string;
  struct: string;
  power: string;
  shield: string;
  comms: string;
  instr: string[];
  load: number;
}

export interface GameState {
  page: number;
  prevPage: number;
  mass: number;
  deltaV: number;
  dvMax: number;
  budget: number;
  scienceScore: number;
  banked: number;
  dataQueue: number;
  queueValue: number;
  maxDataStorage: number;
  txBuffer: number;
  txValue: number;
  delivered: number;
  lostPackets: number;
  compCount: number;
  health: number;
  fuel: number;
  power: { science: number; comms: number; computing: number; thermal: number };
  mode: 'CADET' | 'COMMANDER' | 'VETERAN';
  missionPhase: string;
  eventState: {
    activeEvents: any[];
    decisionHistory: { page: number; label: string; choice: string; effect: string }[];
    causalLog: { met: number; text: string }[];
  };
  met: number;
  cruise: number;
  warp: number;
  nav: number;
  heatSpike: number;
  repoint: number;
  repointCd: number;
  cd: Record<string, number>;
  scans: Record<string, number>;
  design: Design;
  priorities: { science: number; safety: number; economy: number };
  stress: { struct: number; thermal: number; vib: number; result: 'PASS' | 'WARNING' | 'FAIL' | null } | null;
  override: boolean;
  eventId: string;
  eventPick: number | null;
  apInit: boolean;
  range: number;
  vel: number;
  docked: 'success' | 'bad' | 'abort' | null;
  dockTries: number;
  crisisLeft: number;
  crisisPick: number | null;
  crisisDmg: number;
  outcome: 'success' | 'failure' | null;
  timeline: { p: number; met: number; health: number; fuel: number; banked: number }[];
}

export interface GameContextType {
  S: GameState;
  up: (f: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => void;
  go: (p: number) => void;
  restart: () => void;
  retry: () => void;
  audioMuted: boolean;
  toggleMute: () => void;
}

// ============================================================================
// CONSTANTS & GAME DATA
// ============================================================================

const RM = typeof window !== 'undefined' && !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const fmt = (n: number, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pad = (n: number, l = 2) => String(Math.floor(n)).padStart(l, '0');
const ri = (i: number): React.CSSProperties => ({ '--i': i } as any);

const Ctx = createContext<GameContextType | null>(null);
const useG = () => useContext(Ctx)!;

/* ---------- Vector Icons ---------- */
const IC: Record<string, string> = {
  chev: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5L20 7',
  warn: 'M12 3l10 18H2L12 3zM12 10v5M12 18v.5',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  sig: 'M3 20h2v-4H3zM8 20h2v-8H8zM13 20h2V8h-2zM18 20h2V4h-2z',
  data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  rocket: 'M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10zM9 16l-2 5 5-2 5 2-2-5',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 2 2 2 0-3-1-5 1-8z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  cpu: 'M7 7h10v10H7zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',
  therm: 'M10 14V5a2 2 0 114 0v9a4 4 0 11-4 0z',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 118 0v4',
  play: 'M7 4l13 8-13 8z',
  refresh: 'M4 12a8 8 0 0114-5l2-2v6h-6l2.5-2.5A5 5 0 1017 14',
  skip: 'M5 5l9 7-9 7zM17 5v14',
  scan: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M4 12h16',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  sound: 'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07',
  mute: 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6'
};

const Ic: React.FC<{ n: string; s?: number; sw?: number }> = ({ n, s = 20, sw = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={IC[n] || IC.chevron} />
  </svg>
);

const BUS = { mass: 780, cost: 14 };
const LIM = { mass: 3000, budget: 42, dv: 1450 };

const PARTS: Record<string, Part[]> = {
  prop: [
    { id: 'chem', name: 'Bipropellant Engine', mass: 320, cost: 4, isp: 310, vib: 72, heat: 14, thrust: 1.25, desc: 'Cheap and fast, heavy, rough ride.' },
    { id: 'hall', name: 'Hall Thruster Cluster', mass: 240, cost: 8, isp: 520, vib: 40, heat: 10, thrust: 1, desc: 'Balanced efficiency and cruise speed.' },
    { id: 'ion', name: 'Gridded Ion Drive', mass: 210, cost: 10, isp: 700, vib: 24, heat: 8, thrust: 0.8, desc: 'Best fuel economy, slowest cruise.' }
  ],
  struct: [
    { id: 'al', name: 'Aluminum Frame', mass: 410, cost: 3, str: 60, desc: 'Light on budget, thin on margin.' },
    { id: 'cc', name: 'Carbon Composite', mass: 290, cost: 7, str: 78, desc: 'Strong and light, expensive.' },
    { id: 'ti', name: 'Titanium Truss', mass: 520, cost: 5, str: 90, desc: 'Very strong, very heavy.' }
  ],
  power: [
    { id: 'solarS', name: 'Solar Wings S', mass: 110, cost: 3.5, watts: 900, heat: 0, desc: 'Small arrays, little spare power.' },
    { id: 'solarL', name: 'Solar Wings L', mass: 160, cost: 5, watts: 1300, heat: 0, desc: 'Large arrays, good output.' },
    { id: 'rtg', name: 'RTG Pack', mass: 210, cost: 9.5, watts: 1000, heat: 14, flare: true, desc: 'Flare-proof, runs hot.' }
  ],
  shield: [
    { id: 'none', name: 'No Shielding', mass: 0, cost: 0, rating: 0, desc: 'Zero mass, zero protection.' },
    { id: 'light', name: 'Whipple Shield', mass: 60, cost: 2, rating: 25, desc: 'Stops small debris.' },
    { id: 'heavy', name: 'Multi-layer Armor', mass: 140, cost: 4.5, rating: 55, desc: 'Serious protection, heavy.' }
  ],
  comms: [
    { id: 'lga', name: 'Low-Gain Antenna', mass: 15, cost: 1, gain: 1, desc: 'Wide beam, weak link.' },
    { id: 'hga', name: 'High-Gain Dish', mass: 55, cost: 3, gain: 1.35, desc: 'Narrow beam, strong link.' }
  ],
  instr: [
    { id: 'spec', name: 'Spectrometer', mass: 45, cost: 3.5, sci: 14, data: 2.4, heat: 4, desc: 'Surface composition.' },
    { id: 'cam', name: 'Multispectral Camera', mass: 30, cost: 2.2, sci: 9, data: 3.6, heat: 3, desc: 'Imaging, data heavy.' },
    { id: 'radar', name: 'Radar Sounder', mass: 70, cost: 4.8, sci: 16, data: 2, heat: 6, desc: 'Interior structure.' },
    { id: 'sample', name: 'Sample Collector', mass: 95, cost: 6, sci: 22, data: 0.8, heat: 5, needsDock: true, desc: 'Highest value. Needs docking.' },
    { id: 'mag', name: 'Magnetometer', mass: 20, cost: 1.4, sci: 6, data: 0.6, heat: 1, desc: 'Cheap, small returns.' }
  ]
};

const CATS: [string, string, string][] = [
  ['prop', 'Propulsion', 'flame'],
  ['struct', 'Structure', 'shield'],
  ['power', 'Power', 'bolt'],
  ['shield', 'Shielding', 'shield'],
  ['comms', 'Comms', 'sig'],
  ['instr', 'Instruments', 'scan']
];

const DEF_DESIGN: Design = {
  prop: 'hall',
  struct: 'al',
  power: 'solarL',
  shield: 'light',
  comms: 'hga',
  instr: ['spec', 'cam'],
  load: 600
};

const findP = (k: string, id: string): Part => PARTS[k]?.find(p => p.id === id) || { id, name: id, mass: 0, cost: 0, desc: '' };

function calcDesign(d: Design) {
  const P = findP('prop', d.prop);
  const St = findP('struct', d.struct);
  const Pw = findP('power', d.power);
  const Sh = findP('shield', d.shield);
  const Cm = findP('comms', d.comms);
  const ins = d.instr.map(id => findP('instr', id));
  const sum = (a: any[], f: (x: any) => number) => a.reduce((t, x) => t + f(x), 0);
  const dry = BUS.mass + P.mass + St.mass + Pw.mass + Sh.mass + Cm.mass + sum(ins, i => i.mass);
  const wet = dry + d.load;
  const cost = BUS.cost + P.cost + St.cost + Pw.cost + Sh.cost + Cm.cost + sum(ins, i => i.cost);
  const dv = (P.isp || 300) * 9.81 * Math.log(wet / dry);
  const sci = sum(ins, i => i.sci || 0);
  return {
    dry,
    wet,
    cost,
    dv,
    sci,
    P,
    St,
    Pw,
    Sh,
    Cm,
    ins,
    structPct: (wet / ((St.str || 60) * 45)) * 100,
    thermalPct: 40 + sci * 0.45 + (P.heat || 0) + (Pw.heat || 0),
    vibPct: (P.vib || 50) * (wet / 2400)
  };
}

const designPatch = (s: any, d: Design) => {
  const c = calcDesign(d);
  return {
    design: d,
    mass: Math.round(c.wet),
    deltaV: Math.round(c.dv),
    dvMax: Math.round(c.dv),
    fuel: 100,
    budget: Math.round((LIM.budget - c.cost) * 1e6)
  };
};

const PH: Record<number, string> = {
  1: 'STANDBY', 2: 'STANDBY', 3: 'BRIEFING', 4: 'PLANNING', 5: 'DESIGN',
  6: 'STRESS TEST', 7: 'LAUNCH', 8: 'CRUISE', 9: 'CRUISE', 10: 'ANOMALY',
  11: 'APPROACH', 12: 'RENDEZVOUS', 13: 'SCIENCE', 14: 'DATA', 15: 'POWER',
  16: 'COMMS', 17: 'CRISIS', 18: 'RECOVERY', 19: 'DEBRIEF', 20: 'ARCHIVE'
};

const modeMult = (m: string) => ({ CADET: 0.75, COMMANDER: 1, VETERAN: 1.3 }[m] || 1);
const dmgMult = (s: GameState) => (1.25 - (s.priorities.safety / 100) * 0.9) * modeMult(s.mode);
const sciYield = (s: GameState) => clamp(s.power.science / 30, 0.4, 1.8);
const thermalLoad = (s: GameState) => {
  const p = s.power;
  const heat = p.science * 0.9 + p.computing * 0.6 + p.comms * 0.5;
  const cool = p.thermal * 1.6;
  const base = s.stress ? s.stress.thermal : 60;
  return clamp(35 + (heat - cool) * 0.9 + (base - 60) * 0.4 + s.heatSpike, 0, 120);
};
const signalQ = (s: GameState) =>
  clamp(0.3 + (s.power.comms / 100) * 1.1 + ((findP('comms', s.design.comms).gain || 1) - 1) * 0.25 + (s.repoint > 0 ? 0.12 : 0) - 0.05, 0.12, 0.97);

const lvl = (v: number, w: number, c: number, inv?: boolean) => (inv ? (v <= c ? 'crit' : v <= w ? 'warn' : '') : (v >= c ? 'crit' : v >= w ? 'warn' : ''));
const L = (s: GameState, text: string) => ({ ...s.eventState, causalLog: [...s.eventState.causalLog, { met: s.met, text }] });
const hurt = (s: GameState, a: number) => clamp(s.health - a * dmgMult(s), 0, 100);
const dvPatch = (s: GameState, amt: number) => {
  const nd = Math.max(0, s.deltaV - amt);
  const c = calcDesign(s.design);
  return {
    deltaV: nd,
    fuel: Math.round((nd / Math.max(1, s.dvMax)) * 1000) / 10,
    mass: Math.round(c.dry + (c.wet - c.dry) * (nd / Math.max(1, s.dvMax)))
  };
};

const EVENTS: Record<string, {
  title: string;
  icon: string;
  text: string;
  opts: {
    k: string;
    sub: string;
    run: (s: GameState) => { dv?: number; dmg?: number; nav?: number; data?: number; power?: Record<string, number>; log: string };
  }[];
}> = {
  meteor: {
    title: 'MICROMETEOROID SWARM',
    icon: 'warn',
    text: 'Radar shows a dense debris stream crossing the trajectory. Impact in under two minutes.',
    opts: [
      {
        k: 'Rotate stern-first',
        sub: 'Burns 20 m/s of ΔV. Presents the engine bell, not the bus.',
        run: s => ({ dv: 20, dmg: Math.max(2, 14 - (findP('shield', s.design.shield).rating || 0) * 0.1), log: 'Stern-first rotation took the swarm on the engine bell' })
      },
      {
        k: 'Hold attitude, guard the arrays',
        sub: 'Costs nothing. Shielding matters here.',
        run: s => ({ dmg: Math.max(3, 22 - (findP('shield', s.design.shield).rating || 0) * 0.3), log: 'Holding attitude relied on shielding rating' })
      },
      {
        k: 'Ignore it and keep scanning',
        sub: 'Gain 1.5 GB of queued data. Take the hits.',
        run: s => ({ dmg: 30 - (findP('shield', s.design.shield).rating || 0) * 0.4, data: 1.5, log: 'Ignoring the swarm traded hull health for data' })
      }
    ]
  },
  flare: {
    title: 'SOLAR FLARE WARNING',
    icon: 'bolt',
    text: 'The Sun has released an energetic particle burst. Arrival in minutes. Electronics and arrays are exposed.',
    opts: [
      {
        k: 'Enter safe mode',
        sub: 'Instruments off, bus stable. Loses 1.2 GB of queued data.',
        run: () => ({ dmg: 4, data: -1.2, log: 'Safe mode protected hardware at the cost of queued data' })
      },
      {
        k: 'Shift power to thermal',
        sub: '+15 thermal, −15 science power.',
        run: s => ({ dmg: Math.max(2, 10 - (findP('shield', s.design.shield).rating || 0) * 0.08), power: { science: -15, thermal: 15 }, log: 'Power moved from science to thermal to ride out the flare' })
      },
      {
        k: 'Ride it out',
        sub: 'No changes. RTGs cope better than solar arrays.',
        run: s => ({ dmg: Math.max(3, 28 - (findP('shield', s.design.shield).rating || 0) * 0.35 - (findP('power', s.design.power).flare ? 10 : 0)), log: 'Riding out the flare depended on shielding and power source' })
      }
    ]
  },
  tracker: {
    title: 'STAR TRACKER GLITCH',
    icon: 'eye',
    text: 'The primary star tracker is returning noise. Navigation accuracy is degrading.',
    opts: [
      {
        k: 'Recalibrate with sun sensor',
        sub: 'Burns 15 m/s of ΔV. Improves navigation.',
        run: () => ({ dv: 15, nav: 5, dmg: 0, log: 'Sun-sensor recalibration improved navigation at a fuel cost' })
      },
      {
        k: 'Switch to backup tracker',
        sub: 'Costs nothing. Navigation −10.',
        run: () => ({ nav: -10, dmg: 2, log: 'Backup tracker swap cost navigation accuracy' })
      },
      {
        k: 'Trust inertial drift',
        sub: 'Navigation −25. Docking will be harder.',
        run: () => ({ nav: -25, dmg: 0, log: 'Trusting inertial drift degraded navigation sharply' })
      }
    ]
  },
  wheel: {
    title: 'REACTION WHEEL FAULT',
    icon: 'cpu',
    text: 'A reaction wheel bearing shows rising friction. Attitude control is at risk.',
    opts: [
      {
        k: 'Desaturate with thrusters',
        sub: 'Burns 35 m/s of ΔV. Safe.',
        run: () => ({ dv: 35, dmg: 0, log: 'Thruster desaturation spent fuel to save the wheel' })
      },
      {
        k: 'Reduce wheel rate',
        sub: 'Navigation −8 and minor wear.',
        run: () => ({ nav: -8, dmg: 5, log: 'Reducing wheel rate lowered navigation accuracy' })
      },
      {
        k: 'Continue as normal',
        sub: '50% chance of a serious failure.',
        run: () => {
          const bad = Math.random() < 0.5;
          return { dmg: bad ? 35 : 0, log: bad ? 'The wheel seized and damaged the bus' : 'The wheel held and no damage occurred' };
        }
      }
    ]
  }
};
const EVENT_IDS = Object.keys(EVENTS);

const initState = (keep?: any): GameState => {
  const d = { ...DEF_DESIGN };
  const base: GameState = {
    page: 1,
    prevPage: 1,
    mass: 2430,
    deltaV: 1450,
    dvMax: 1450,
    budget: 42e6,
    scienceScore: 0,
    banked: 0,
    dataQueue: 0,
    queueValue: 0,
    maxDataStorage: 32,
    txBuffer: 0,
    txValue: 0,
    delivered: 0,
    lostPackets: 0,
    compCount: 0,
    health: 100,
    fuel: 100,
    power: { science: 30, comms: 25, computing: 25, thermal: 20 },
    mode: 'COMMANDER',
    missionPhase: 'LAUNCH',
    eventState: { activeEvents: [], decisionHistory: [], causalLog: [] },
    met: 0,
    cruise: 0,
    warp: 1,
    nav: 70,
    heatSpike: 0,
    repoint: 0,
    repointCd: 0,
    cd: {},
    scans: {},
    design: d,
    priorities: { science: 40, safety: 35, economy: 25 },
    stress: null,
    override: false,
    eventId: EVENT_IDS[Math.floor(Math.random() * EVENT_IDS.length)],
    eventPick: null,
    apInit: false,
    range: 1800,
    vel: 90,
    docked: null,
    dockTries: 0,
    crisisLeft: 20,
    crisisPick: null,
    crisisDmg: 0,
    outcome: null,
    timeline: []
  };
  Object.assign(base, designPatch(base, d));
  if (keep) {
    base.design = keep.design;
    Object.assign(base, designPatch(base, keep.design));
    base.priorities = keep.priorities;
    base.mode = keep.mode;
  }
  return base;
};

/* per-tick simulation (dt seconds) */
function tick(s: GameState, dt: number): Partial<GameState> {
  const p = s.page;
  const o: Partial<GameState> = {};
  if (p >= 8 && p <= 17 && s.outcome !== 'failure') {
    o.met = s.met + dt * (p <= 10 ? 3600 * s.warp : 700);
    const tl = thermalLoad(s);
    if (tl > 80) o.health = clamp((o.health ?? s.health) - (tl > 92 ? 1.5 : 0.6) * dt * dmgMult(s), 0, 100);
  }
  if (p >= 8 && p <= 10 && s.cruise < 100) {
    o.cruise = Math.min(100, s.cruise + dt * 1.2 * (findP('prop', s.design.prop).thrust || 1) * s.warp);
  }
  if (s.heatSpike > 0) o.heatSpike = Math.max(0, s.heatSpike - dt * 3);
  if (s.repoint > 0) o.repoint = Math.max(0, s.repoint - dt);
  if (s.repointCd > 0) o.repointCd = Math.max(0, s.repointCd - dt);
  if (p === 11 && s.range > 60) o.range = Math.max(60, s.range - s.vel * 0.9 * dt);
  if (p === 17 && s.crisisPick === null) {
    o.crisisLeft = Math.max(0, s.crisisLeft - dt);
    o.health = clamp((o.health ?? s.health) - 0.3 * dt * dmgMult(s), 0, 100);
  }
  const cd = s.cd;
  let any = false;
  const nc: Record<string, number> = {};
  for (const k in cd) {
    if (cd[k] > 0) {
      nc[k] = Math.max(0, cd[k] - dt);
      any = true;
    }
  }
  if (any) o.cd = nc;
  return o;
}

function finalScore(s: GameState) {
  const w = (k: 'science' | 'safety' | 'economy') => s.priorities[k] / 33.3;
  const sci = s.banked * 6 * w('science');
  const surv = (s.health * 5 + (s.docked === 'success' ? 150 : 0)) * w('safety');
  const eco = ((s.budget / 1e6) * 25 + (s.deltaV / Math.max(1, s.dvMax)) * 300) * w('economy');
  const total = s.outcome === 'failure' ? Math.round((sci + eco) * 0.3) : Math.round(sci + surv + eco);
  const grade = s.outcome === 'failure' ? 'F' : total >= 2000 ? 'S' : total >= 1500 ? 'A' : total >= 1000 ? 'B' : total >= 500 ? 'C' : 'D';
  const verdict = s.outcome === 'failure' ? 'MISSION LOST' : s.banked >= 60 ? 'MISSION SUCCESS' : 'PARTIAL SUCCESS';
  return { sci: Math.round(sci), surv: Math.round(surv), eco: Math.round(eco), total, grade, verdict };
}

const bestGet = () => {
  try {
    return +localStorage.getItem('ll-best')! || 0;
  } catch {
    return 0;
  }
};
const bestSet = (v: number) => {
  try {
    localStorage.setItem('ll-best', String(v));
  } catch {}
};

// ============================================================================
// SHARED UI COMPONENTS
// ============================================================================

const Num: React.FC<{ v: number; d?: number; suffix?: string; cls?: string; dur?: number; start?: number }> = ({
  v,
  d = 0,
  suffix = '',
  cls = '',
  dur = 420,
  start
}) => {
  const [x, setX] = useState(start != null ? start : v);
  const from = useRef(start != null ? start : v);
  const raf = useRef(0);

  useEffect(() => {
    if (RM) {
      setX(v);
      from.current = v;
      return;
    }
    const a = from.current;
    const b = v;
    const t0 = performance.now();
    cancelAnimationFrame(raf.current);
    const f = (now: number) => {
      const t = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const val = a + (b - a) * e;
      from.current = val;
      setX(val);
      if (t < 1) raf.current = requestAnimationFrame(f);
    };
    raf.current = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf.current);
  }, [v, dur]);

  return <span className={'num ' + cls}>{fmt(x, d)}{suffix}</span>;
};

const Btn: React.FC<{
  children?: React.ReactNode;
  k?: string;
  onClick?: () => void;
  disabled?: boolean;
  state?: string;
  icon?: string;
  cls?: string;
  title?: string;
  glow?: boolean;
  sm?: boolean;
}> = ({ children, k = 'primary', onClick, disabled, state, icon, cls = '', title, glow, sm }) => {
  const handleClick = () => {
    if (disabled) return;
    playTelemetryClick();
    if (onClick) onClick();
  };

  const b = (
    <button
      type="button"
      className={`btn ${k} ${state || ''} ${sm ? 'sm' : ''} ${cls}`}
      disabled={disabled}
      onClick={handleClick}
      aria-label={title}
    >
      {icon && <Ic n={icon} s={18} />}
      {children}
    </button>
  );
  return glow ? <span className="breathe">{b}</span> : b;
};

const Meter: React.FC<{
  label: string;
  v: number;
  max?: number;
  unit?: string;
  d?: number;
  warn?: number;
  crit?: number;
  inv?: boolean;
  big?: boolean;
  mark?: number;
  st?: string;
  hint?: string;
}> = ({ label, v, max = 100, unit = '', d = 0, warn, crit, inv, big, mark, st, hint }) => {
  const s = st ?? (warn != null ? lvl(v, warn, crit ?? 100, inv) : '');
  return (
    <div className={`meter ${s} ${big ? 'big' : ''}`}>
      <div className="top">
        <span className="lab">{label}</span>
        <span className="val">
          <Num v={v} d={d} />
          {unit}
          {hint && <span className="dim"> {hint}</span>}
        </span>
      </div>
      <div className="bar">
        <div className="fill" style={{ width: clamp((v / max) * 100, 0, 100) + '%' }} />
        {mark != null && <div className="mk" style={{ left: clamp((mark / max) * 100, 0, 100) + '%' }} />}
      </div>
    </div>
  );
};

const Slider: React.FC<{
  v: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}> = ({ v, min = 0, max = 100, step = 1, onChange, label, disabled, id }) => {
  const [drag, setDrag] = useState(false);
  const f = (v - min) / (max - min);
  const lv = f < 0.34 ? 'low' : f < 0.67 ? 'med' : 'high';
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={v}
      disabled={disabled}
      aria-label={label}
      className={`sl ${lv} ${drag ? 'drag' : ''}`}
      style={{ '--p': f * 100 + '%' } as any}
      onPointerDown={() => setDrag(true)}
      onPointerUp={() => setDrag(false)}
      onBlur={() => setDrag(false)}
      onChange={e => onChange(+e.target.value)}
    />
  );
};

const PHead: React.FC<{ n: number; title: string; sub?: string; right?: React.ReactNode }> = ({
  n,
  title,
  sub,
  right
}) => (
  <div className="phead rise">
    <div>
      <div className="pidx">{pad(n)} / 20</div>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    {right}
  </div>
);

const Tele: React.FC<{ label: string; v: number; unit?: string; st?: string; d?: number }> = ({
  label,
  v,
  unit,
  st = 'Nominal',
  d = 0
}) => (
  <div className={'tele ' + st}>
    <span className="lab">{label}</span>
    <span className="v">
      <Num v={v} d={d} />
      {unit && <small className="dim"> {unit}</small>}
    </span>
    <span
      className="state"
      style={{
        color: st === 'Nominal' ? 'var(--green)' : st === 'Warning' ? 'var(--amber)' : st === 'Critical' ? 'var(--red)' : 'var(--faint)'
      }}
    >
      {st.toUpperCase()}
    </span>
  </div>
);

// ============================================================================
// CANVAS & SVG ARTWORK
// ============================================================================

const WARP = { v: 1, t: 1 };

function Starfield({ sc }: { sc: number }) {
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const pr = clamp(sc * (window.devicePixelRatio || 1), 1, 2);
    c.width = 1280 * pr;
    c.height = 720 * pr;
    ctx.setTransform(pr, 0, 0, pr, 0, 0);

    const mk = (near: boolean) => {
      const a = Math.random() * 6.283;
      const r = near ? rnd(20, 120) : Math.sqrt(Math.random()) * 760;
      return { x: 640 + Math.cos(a) * r, y: 360 + Math.sin(a) * r * 0.56, d: rnd(0.2, 1), px: 0, py: 0 };
    };

    const stars = Array.from({ length: RM ? 90 : 150 }, () => mk(false));
    let raf: number;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      WARP.v = lerp(WARP.v, WARP.t, Math.min(1, dt * 3));
      ctx.clearRect(0, 0, 1280, 720);
      const w = WARP.v - 1;

      for (const s of stars) {
        s.px = s.x;
        s.py = s.y;
        if (!RM) {
          s.x -= s.d * 9 * dt;
          if (w > 0.05) {
            s.x = 640 + (s.x - 640) * (1 + dt * w * 0.9);
            s.y = 360 + (s.y - 360) * (1 + dt * w * 0.9);
          }
        }
        if (s.x < -10 || s.x > 1290 || s.y < -10 || s.y > 730) {
          if (w > 0.5) {
            Object.assign(s, mk(true));
            s.px = s.x;
            s.py = s.y;
          } else {
            s.x = 1285;
            s.y = rnd(0, 720);
            s.px = s.x;
            s.py = s.y;
          }
        }
        ctx.strokeStyle = `rgba(190,235,255,${0.25 + s.d * 0.65})`;
        ctx.lineWidth = 0.6 + s.d * 1.1;
        ctx.beginPath();
        ctx.moveTo(w > 0.5 ? s.px : s.x, w > 0.5 ? s.py : s.y);
        ctx.lineTo(s.x + 0.01, s.y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [Math.round(sc * 4)]);

  return <canvas ref={cv} className="stars" aria-hidden="true" />;
}

const Craft = memo(function Craft({
  d,
  burn,
  hl,
  sway,
  scale = 1
}: {
  d?: Design;
  burn?: boolean;
  hl?: string;
  sway?: boolean;
  scale?: number;
}) {
  const cur = d || DEF_DESIGN;
  const pw = cur.power === 'solarL' ? 70 : cur.power === 'solarS' ? 46 : 0;
  const rtg = cur.power === 'rtg';

  const panel = (top: boolean) => {
    if (!pw) return null;
    const y = top ? 130 - 34 - pw : 130 + 34;
    const lines = [];
    for (let i = 1; i < 5; i++) {
      lines.push(<line key={i} x1={170 + i * 22} x2={170 + i * 22} y1={y} y2={y + pw} stroke="#1d6a8a" strokeWidth="1" />);
    }
    return (
      <g>
        <rect x="170" y={y} width="110" height={pw} fill="#0b2a47" stroke="#2fb4d6" strokeWidth="1.4" />
        {lines}
        <line x1="170" x2="280" y1={y + pw / 2} y2={y + pw / 2} stroke="#1d6a8a" />
      </g>
    );
  };

  const ins = cur.instr || [];

  return (
    <svg viewBox="0 0 440 260" width={440 * scale} height={260 * scale} role="img" aria-label="Spacecraft schematic" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="busg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#173250" />
          <stop offset="1" stopColor="#0c1a2d" />
        </linearGradient>
      </defs>
      <g className={sway ? 'floaty' : ''}>
        <g key={'p' + cur.power} className={'snap ' + (hl === 'power' ? 'hl' : '')} style={{ filter: hl === 'power' ? 'drop-shadow(0 0 8px #46e0ff)' : 'none' }}>
          {panel(true)}
          {panel(false)}
          {rtg && (
            <g>
              <rect x="200" y="166" width="60" height="22" rx="4" fill="#3a2a16" stroke="#ffb23e" />
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1={208 + i * 11} x2={208 + i * 11} y1="166" y2="188" stroke="#ffb23e" opacity="0.6" />
              ))}
            </g>
          )}
        </g>
        <g key={'s' + cur.struct} className="snap" style={{ filter: hl === 'struct' ? 'drop-shadow(0 0 8px #46e0ff)' : 'none' }}>
          <rect x="150" y="96" width="150" height="68" rx="6" fill="url(#busg)" stroke="#46e0ff" strokeWidth="1.6" />
          {cur.struct === 'ti' && (
            <g stroke="#46e0ff" strokeOpacity="0.5">
              <line x1="150" y1="96" x2="300" y2="164" />
              <line x1="150" y1="164" x2="300" y2="96" />
            </g>
          )}
          {cur.struct === 'cc' && (
            <g stroke="#46e0ff" strokeOpacity="0.5">
              <line x1="150" y1="112" x2="300" y2="112" />
              <line x1="150" y1="148" x2="300" y2="148" />
            </g>
          )}
          {cur.struct === 'al' && <line x1="150" y1="130" x2="300" y2="130" stroke="#46e0ff" strokeOpacity="0.4" />}
        </g>
        <g key={'e' + cur.prop} className="snap" style={{ filter: hl === 'prop' ? 'drop-shadow(0 0 8px #46e0ff)' : 'none' }}>
          {cur.prop === 'chem' && <path d="M150 108 L112 90 L112 170 L150 152Z" fill="#14263c" stroke="#8da6c2" />}
          {cur.prop === 'hall' && (
            <g>
              <rect x="126" y="102" width="24" height="18" fill="#14263c" stroke="#8da6c2" />
              <rect x="126" y="140" width="24" height="18" fill="#14263c" stroke="#8da6c2" />
            </g>
          )}
          {cur.prop === 'ion' && (
            <g>
              <circle cx="136" cy="130" r="26" fill="#14263c" stroke="#8da6c2" />
              <circle cx="136" cy="130" r="16" fill="none" stroke="#46e0ff" strokeDasharray="3 3" />
            </g>
          )}
          {burn && (
            <path
              className="flame"
              d={
                cur.prop === 'ion'
                  ? 'M110 130 L40 126 L40 134Z'
                  : cur.prop === 'hall'
                  ? 'M126 111 L60 108 L60 114Z M126 149 L60 146 L60 152Z'
                  : 'M112 130 L20 118 L20 142Z'
              }
              fill={cur.prop === 'ion' ? '#7aa8ff' : '#ffb23e'}
              opacity="0.95"
            />
          )}
        </g>
        <g key={'h' + cur.shield} className="snap" style={{ filter: hl === 'shield' ? 'drop-shadow(0 0 8px #ffb23e)' : 'none' }}>
          {cur.shield !== 'none' && (
            <rect x={300} y="92" width={cur.shield === 'heavy' ? 16 : 7} height="76" fill="#3a2a16" stroke="#ffb23e" />
          )}
        </g>
        <g key={'c' + cur.comms} className="snap" style={{ filter: hl === 'comms' ? 'drop-shadow(0 0 8px #46e0ff)' : 'none' }}>
          {cur.comms === 'hga' ? (
            <g>
              <line x1="225" y1="96" x2="225" y2="70" stroke="#8da6c2" />
              <g className="rot slow">
                <path d="M200 62 Q225 86 250 62" fill="none" stroke="#46e0ff" strokeWidth="2.5" />
                <line x1="225" y1="62" x2="225" y2="50" stroke="#46e0ff" />
              </g>
            </g>
          ) : (
            <g>
              <line x1="225" y1="96" x2="225" y2="60" stroke="#46e0ff" strokeWidth="2" />
              <circle cx="225" cy="58" r="3" fill="#46e0ff" />
            </g>
          )}
        </g>
        <g key={'i' + ins.join('')} className="snap" style={{ filter: hl === 'instr' ? 'drop-shadow(0 0 8px #46e0ff)' : 'none' }}>
          {ins.map((id, i) => (
            <g key={id}>
              <line x1="316" y1={108 + i * 13} x2={340 + i * 8} y2={108 + i * 13} stroke="#8da6c2" />
              <circle cx={344 + i * 8} cy={108 + i * 13} r="4.5" fill="#0c1a2d" stroke="#5cf2b0" />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
});

const Asteria = memo(function Asteria({ size = 260, scan, rot = true }: { size?: number; scan?: boolean; rot?: boolean }) {
  return (
    <svg viewBox="-110 -110 220 220" width={size} height={size} role="img" aria-label="Asteroid ASTERIA-1">
      <defs>
        <radialGradient id="agr" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#7a8ea4" />
          <stop offset="1" stopColor="#1a2433" />
        </radialGradient>
      </defs>
      <g className={rot ? 'rot slow' : ''}>
        <path
          d="M-84 -20 C-90 -60 -40 -90 5 -86 C55 -90 92 -52 88 -6 C94 40 52 86 -2 84 C-52 92 -92 52 -84 -20Z"
          fill="url(#agr)"
          stroke="#8da6c2"
          strokeOpacity="0.45"
        />
        <circle cx="-30" cy="-32" r="17" fill="#1b2635" stroke="#5d7189" strokeOpacity="0.6" />
        <circle cx="38" cy="-8" r="11" fill="#1b2635" stroke="#5d7189" strokeOpacity="0.6" />
        <circle cx="-8" cy="38" r="21" fill="#1b2635" stroke="#5d7189" strokeOpacity="0.6" />
        <circle cx="52" cy="40" r="7" fill="#1b2635" stroke="#5d7189" strokeOpacity="0.6" />
        <circle cx="-58" cy="18" r="8" fill="#1b2635" stroke="#5d7189" strokeOpacity="0.6" />
      </g>
      {scan && <circle className="scanring" r="100" />}
    </svg>
  );
});

function Exhaust({ on }: { on: React.MutableRefObject<boolean> }) {
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const x = c.getContext('2d');
    if (!x) return;
    const ps: any[] = [];
    let raf: number;
    const f = () => {
      x.clearRect(0, 0, 300, 420);
      if (on.current && !RM) {
        for (let i = 0; i < 4; i++) {
          ps.push({ x: 150 + rnd(-8, 8), y: 60, vx: rnd(-1.6, 1.6), vy: rnd(3, 6), l: 1 });
        }
      }
      for (let i = ps.length - 1; i >= 0; i--) {
        const q = ps[i];
        q.x += q.vx;
        q.y += q.vy;
        q.l -= 0.025;
        if (q.l <= 0) {
          ps.splice(i, 1);
          continue;
        }
        x.fillStyle = `rgba(255,${Math.round(120 + q.l * 110)},60,${q.l})`;
        x.beginPath();
        x.arc(q.x, q.y, 2 + (1 - q.l) * 10, 0, 6.283);
        x.fill();
      }
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={cv} width="300" height="420" style={{ position: 'absolute', left: 0, top: 0, width: 300, height: 420 }} aria-hidden="true" />;
}

function TeleCanvas({ getv }: { getv: () => number[] }) {
  const cv = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const x = c.getContext('2d');
    if (!x) return;
    const N = 120;
    const ch = [0, 1, 2, 3].map(() => Array(N).fill(0.5));
    let raf: number;
    let last = 0;
    const cols = ['#46e0ff', '#5cf2b0', '#ffb23e', '#b79bff'];
    const names = ['THERMAL', 'BUS VOLTAGE', 'SIGNAL', 'ATTITUDE RATE'];

    const f = (now: number) => {
      if (now - last > 66 && !RM) {
        last = now;
        const v = getv();
        for (let i = 0; i < 4; i++) {
          ch[i].push(clamp(v[i] + rnd(-0.04, 0.04), 0, 1));
          ch[i].shift();
        }
      }
      x.clearRect(0, 0, 760, 420);
      for (let i = 0; i < 4; i++) {
        const ox = (i % 2) * 388;
        const oy = Math.floor(i / 2) * 212;
        const w = 372;
        const h = 196;
        x.strokeStyle = '#1f3856';
        x.lineWidth = 1;
        x.strokeRect(ox + 0.5, oy + 0.5, w, h);
        x.strokeStyle = 'rgba(70,224,255,.08)';
        for (let g = 1; g < 4; g++) {
          x.beginPath();
          x.moveTo(ox, oy + (h * g) / 4);
          x.lineTo(ox + w, oy + (h * g) / 4);
          x.stroke();
        }
        x.strokeStyle = 'rgba(255,178,62,.5)';
        x.setLineDash([5, 5]);
        x.beginPath();
        x.moveTo(ox, oy + h * 0.2);
        x.lineTo(ox + w, oy + h * 0.2);
        x.stroke();
        x.setLineDash([]);
        x.fillStyle = '#8da6c2';
        x.font = '600 10px JetBrains Mono, monospace';
        x.fillText(names[i], ox + 10, oy + 16);
        x.strokeStyle = cols[i];
        x.lineWidth = 2;
        x.beginPath();
        ch[i].forEach((y, k) => {
          const px = ox + (k / (N - 1)) * w;
          const py = oy + h - 6 - y * (h - 34);
          k ? x.lineTo(px, py) : x.moveTo(px, py);
        });
        x.stroke();
        const ly = oy + h - 6 - ch[i][N - 1] * (h - 34);
        x.fillStyle = cols[i];
        x.beginPath();
        x.arc(ox + w, ly, 4, 0, 6.283);
        x.fill();
      }
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={cv} width="760" height="420" style={{ width: 760, height: 420 }} role="img" aria-label="Live telemetry graphs" />;
}

function useTimers() {
  const t = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => t.current.forEach(clearTimeout), []);
  return useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    t.current.push(id);
    return id;
  }, []);
}

// ============================================================================
// PAGES 01–20
// ============================================================================

/* 01 LANDING */
function P1() {
  const { go } = useG();
  const best = bestGet();
  return (
    <section className="page full" aria-label="Landing">
      <div className="p1-ship" style={{ pointerEvents: 'none' }}>
        <Craft d={DEF_DESIGN} scale={1.45} />
      </div>
      <div className="p1-copy">
        <div className="tag rise" style={ri(0)}>SIMULATED DEEP-SPACE PROGRAM · TARGET ASTERIA-1</div>
        <h1 className="title rise" style={ri(1)}>
          Mission<span>Last Light</span>
        </h1>
        <p className="tagline rise" style={ri(2)}>DESIGN. STRESS-TEST. ADAPT. SURVIVE.</p>
        <div className="row gap rise" style={ri(3)}>
          <Btn glow icon="rocket" onClick={() => go(3)}>Start mission</Btn>
          <Btn k="secondary" icon="play" onClick={() => go(2)}>How to play</Btn>
        </div>
        <div className="mono dim rise" style={{ ...ri(4), fontSize: 12, letterSpacing: '.12em' }}>
          {best ? `BEST SCORE ${fmt(best)}` : 'NO MISSIONS FLOWN YET'}
        </div>
      </div>
    </section>
  );
}

/* 02 HOW TO PLAY */
const TUT = [
  { t: 'DESIGN', ic: 'rocket', b: 'Choose propulsion, structure, power, shielding, comms and instruments. Every kilogram and every dollar is a trade-off between range, safety and science.' },
  { t: 'STRESS-TEST', ic: 'therm', b: 'Your craft is shaken, heated and loaded before launch. Weak points show up on the test stand, or later in flight where they cost far more.' },
  { t: 'ADAPT', ic: 'bolt', b: 'Events and crises arrive mid-mission. Your power split, fuel reserve and shielding decide which options are good ones.' },
  { t: 'SURVIVE', ic: 'shield', b: 'Reach ASTERIA-1, collect science, send it home and keep the spacecraft alive. The debrief traces every consequence back to a choice.' }
];

function P2() {
  const { go } = useG();
  const [i, setI] = useState(0);
  const [st, setSt] = useState('');
  const [started, setStarted] = useState(false);
  const x0 = useRef<number | null>(null);
  const t = useTimers();

  const next = () => {
    if (!started) {
      setSt('loading');
      t(() => {
        setSt('success');
        t(() => {
          setSt('');
          setStarted(true);
        }, 400);
      }, 500);
      return;
    }
    if (i < TUT.length - 1) setI(i + 1);
    else go(3);
  };

  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setI(v => Math.min(TUT.length - 1, v + 1));
    if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1));
  };

  return (
    <section className="page full" aria-label="How to play">
      <div className="p1-ship" style={{ opacity: 0.35, pointerEvents: 'none' }}>
        <Craft d={DEF_DESIGN} scale={1.45} />
      </div>
      <div className="sheet" onKeyDown={key}>
        <div className="row between">
          <div>
            <div className="pidx">02 / 20</div>
            <h1 className="h2" style={{ fontSize: 26 }}>HOW TO PLAY</h1>
          </div>
          <Btn k="secondary" cls="icon" icon="x" title="Close" onClick={() => go(1)} />
        </div>
        <div
          style={{ overflow: 'hidden', flex: 1 }}
          onPointerDown={e => { x0.current = e.clientX; }}
          onPointerUp={e => {
            if (x0.current == null) return;
            const dx = e.clientX - x0.current;
            x0.current = null;
            if (dx < -40) setI(v => Math.min(TUT.length - 1, v + 1));
            if (dx > 40) setI(v => Math.max(0, v - 1));
          }}
        >
          <div className="track" style={{ transform: `translateX(${252 - i * 440}px)` }}>
            {TUT.map((c, n) => (
              <div key={c.t} className={'tcard ' + (n === i ? 'act' : '')} aria-hidden={n !== i}>
                <div className="row gap">
                  <span className="cy"><Ic n={c.ic} s={34} /></span>
                  <h2 className="h2" style={{ fontSize: 24 }}>{c.t}</h2>
                </div>
                <p style={{ marginTop: 14, color: 'var(--mute)', fontSize: 15, lineHeight: 1.5 }}>{c.b}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="dots" role="tablist" aria-label="Tutorial steps">
          {TUT.map((_, n) => (
            <i key={n} className={n === i ? 'on' : ''} />
          ))}
        </div>
        <div className="row between">
          <Btn k="secondary" onClick={() => go(3)} icon="skip">Skip</Btn>
          <div className="row gap8">
            <Btn k="secondary" cls="icon" icon="back" title="Previous card" disabled={i === 0} onClick={() => setI(i - 1)} />
            <Btn state={st} onClick={next} icon={started ? (i === TUT.length - 1 ? 'rocket' : 'chev') : 'play'}>
              {st === 'success' ? 'Ready' : !started ? 'Start tutorial' : i === TUT.length - 1 ? 'Enter briefing' : 'Next'}
            </Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 03 BRIEFING */
const OBJ = [
  ['Design a spacecraft', 'Stay inside $42M and 3,000 kg.'],
  ['Survive launch and cruise', 'Pass stress tests and handle anomalies.'],
  ['Rendezvous with ASTERIA-1', 'Match velocity and dock.'],
  ['Collect science', 'Scan the asteroid with your instruments.'],
  ['Send the data home', 'Compress, stage and transmit.']
];

const CONS = [
  ['Budget', 'The program funds $42.0M for hardware. Anything unspent counts toward your economy score.'],
  ['Launch mass', 'The launch vehicle lifts 3,000 kg at most. Propellant counts as mass.'],
  ['Delta-V', 'About 1,450 m/s covers corrections, braking and docking. Less is possible, but tight.'],
  ['Communications', 'Data only counts once it reaches Earth. Signal quality depends on antenna and comms power.']
];

function P3() {
  const { go } = useG();
  const [chk, setChk] = useState([false, false, false, false, false]);
  const [open, setOpen] = useState(0);
  const first = chk.indexOf(false);

  const toggleCheck = (n: number) => {
    playSuccessChime();
    setChk(c => c.map((x, j) => (j === n ? !x : x)));
  };

  return (
    <section className="page" aria-label="Mission briefing">
      <PHead
        n={3}
        title="MISSION BRIEFING"
        sub="Reach the asteroid ASTERIA-1 and bring its data home before the light fades."
        right={<div className="pill cy">SIMULATED / GAME DATA</div>}
      />
      <div className="row gap20" style={{ alignItems: 'flex-start', flexShrink: 0 }}>
        <div className="panel rise col" style={{ ...ri(1), width: 400, alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ position: 'relative', width: 210, height: 210, marginTop: 4 }}>
            <Asteria size={210} scan={true} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', width: '100%' }}>
            {[
              ['DIAMETER', 412, 'm', 0],
              ['SPIN PERIOD', 7.2, 'h', 1],
              ['DISTANCE', 1.42, 'AU', 2],
              ['SURFACE', 6, '% albedo', 0]
            ].map(([l, v, u, dd]) => (
              <div key={l as string}>
                <div className="lab">{l as string}</div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>
                  <Num v={v as number} d={dd as number} start={0} dur={1400} /> <small className="dim">{u as string}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col gap grow" style={{ minWidth: 0 }}>
          <div className="col gap8">
            <div className="lab rise" style={ri(2)}>Objectives · tap to acknowledge</div>
            {OBJ.map(([t, s], n) => {
              const st = chk[n] ? 'completed' : n === first ? 'active' : 'incomplete';
              return (
                <button
                  type="button"
                  key={t}
                  className={'obj rise ' + st}
                  style={ri(3 + n)}
                  aria-pressed={chk[n]}
                  onClick={() => toggleCheck(n)}
                >
                  <span className={'chk ' + (chk[n] ? 'on' : '')}>
                    <Ic n="check" s={18} sw={3} />
                  </span>
                  <span className="grow">
                    <div className="t">{t}</div>
                    <div className="s">{s}</div>
                  </span>
                  <span
                    className="state"
                    style={{
                      color: st === 'completed' ? 'var(--green)' : st === 'active' ? 'var(--cyan)' : 'var(--faint)'
                    }}
                  >
                    {st.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="col gap8 rise" style={ri(9)}>
            <div className="lab">Constraints</div>
            {CONS.map(([h, b], n) => (
              <div key={h} className={'acc ' + (open === n ? 'open' : '')}>
                <button type="button" className="hd" aria-expanded={open === n} onClick={() => setOpen(open === n ? -1 : n)}>
                  {h.toUpperCase()}
                  <span className="chev"><Ic n="chev" s={18} /></span>
                </button>
                <div className="bd">
                  <div>
                    <p>{b}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(10), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 20 }}>
        <Btn k="secondary" icon="back" onClick={() => go(1)}>Back</Btn>
        <Btn glow icon="chev" onClick={() => go(4)}>Accept mission</Btn>
      </div>
    </section>
  );
}

/* 04 SETUP */
const MODES: Record<string, string> = {
  CADET: 'Forgiving. Damage ×0.75.',
  COMMANDER: 'Standard. Damage ×1.0.',
  VETERAN: 'Unforgiving. Damage ×1.3.'
};

function P4() {
  const { S, up, go } = useG();
  const [sel, setSel] = useState('science');

  const setPri = (k: 'science' | 'safety' | 'economy', v: number) => {
    setSel(k);
    up(s => {
      const p = { ...s.priorities };
      const o = (Object.keys(p) as ('science' | 'safety' | 'economy')[]).filter(x => x !== k);
      const rest = 100 - v;
      const tot = o.reduce((t, x) => t + p[x], 0) || 1;
      let acc = 0;
      o.forEach((x, i) => {
        const nv = i === o.length - 1 ? rest - acc : Math.round((p[x] / tot) * rest);
        p[x] = nv;
        acc += nv;
      });
      p[k] = v;
      return { priorities: p };
    });
  };

  const P = S.priorities;
  const w = (k: 'science' | 'safety' | 'economy') => P[k] / 33.3;
  const defs: ['science' | 'safety' | 'economy', string, string, string][] = [
    ['science', 'SCIENCE', 'Returns score for data that reaches Earth.', 'scan'],
    ['safety', 'SAFETY', 'Cuts damage taken and rewards health at the end.', 'shield'],
    ['economy', 'ECONOMY', 'Rewards unspent budget and leftover fuel.', 'bolt']
  ];

  return (
    <section className="page" aria-label="Mission setup">
      <PHead n={4} title="MISSION SETUP" sub="Set what the program values most. Priorities always add up to 100." />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className="col gap grow">
          {defs.map(([k, n, desc, ic], i) => (
            <div
              key={k}
              className={'panel rise ' + (sel === k ? '' : '')}
              style={{
                ...ri(1 + i),
                boxShadow: sel === k ? '0 0 30px rgba(70,224,255,.22)' : 'none',
                borderColor: sel === k ? 'var(--cyan)' : undefined,
                transition: 'box-shadow var(--ui), border-color var(--ui)'
              }}
            >
              <div className="row between">
                <div className="row gap">
                  <span className="cy"><Ic n={ic} s={26} /></span>
                  <div>
                    <h3 className="h2">{n}</h3>
                    <div className="dim" style={{ fontSize: 13 }}>{desc}</div>
                  </div>
                </div>
                <div className="big-num" style={{ fontSize: 54 }}>
                  <Num v={P[k]} />
                  <small style={{ fontSize: 20 }} className="dim">%</small>
                </div>
              </div>
              <Slider id={'pri-' + k} v={P[k]} min={5} max={90} onChange={v => setPri(k, v)} label={n + ' priority'} />
            </div>
          ))}
        </div>
        <div className="col gap" style={{ width: 380 }}>
          <div className="panel rise" style={ri(4)}>
            <div className="lab" style={{ marginBottom: 8 }}>Command mode</div>
            <div className="col gap8">
              {(Object.keys(MODES) as ('CADET' | 'COMMANDER' | 'VETERAN')[]).map(m => (
                <button
                  type="button"
                  key={m}
                  className={'card ' + (S.mode === m ? 'sel' : '')}
                  aria-pressed={S.mode === m}
                  onClick={() => up({ mode: m })}
                >
                  <h3>{m}</h3>
                  <p>{MODES[m]}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="panel rise grow" style={ri(5)}>
            <div className="lab" style={{ marginBottom: 8 }}>Trade-off preview</div>
            <div className="mono col gap8" style={{ fontSize: 13 }}>
              <div className="row between">
                <span className="dim">Science score</span>
                <b className="cy">×<Num v={w('science')} d={2} /></b>
              </div>
              <div className="row between">
                <span className="dim">Damage taken</span>
                <b className={dmgMult(S) > 1 ? 'warnc' : 'good'}>×<Num v={dmgMult(S)} d={2} /></b>
              </div>
              <div className="row between">
                <span className="dim">Survival weight</span>
                <b className="cy">×<Num v={w('safety')} d={2} /></b>
              </div>
              <div className="row between">
                <span className="dim">Economy weight</span>
                <b className="cy">×<Num v={w('economy')} d={2} /></b>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(6), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <Btn k="secondary" icon="back" onClick={() => go(3)}>Back</Btn>
        <Btn glow icon="chev" onClick={() => go(5)}>Continue to design</Btn>
      </div>
    </section>
  );
}

/* 05 DESIGNER */
const partMeta = (k: string, p: Part) => {
  const base = [`${p.mass} kg`, `$${p.cost.toFixed(1)}M`];
  if (k === 'prop') return [...base, `Isp ${p.isp}s`, `Thrust ×${p.thrust}`];
  if (k === 'struct') return [...base, `Strength ${p.str}`];
  if (k === 'power') return [...base, `${p.watts} W`];
  if (k === 'shield') return [...base, `Rating ${p.rating}`];
  if (k === 'comms') return [...base, `Gain ×${p.gain}`];
  return [...base, `Sci ${p.sci}`, `${p.data} GB/scan`];
};

function P5() {
  const { S, up, go } = useG();
  const [cat, setCat] = useState('prop');
  const d = S.design;
  const c = calcDesign(d);

  const set = (patch: Partial<Design>) => up(s => designPatch(s, { ...s.design, ...patch }));

  const overM = c.wet > LIM.mass;
  const overB = c.cost > LIM.budget;
  const lowDv = c.dv < LIM.dv;

  const pick = (k: string, id: string) => {
    playTelemetryClick();
    if (k === 'instr') {
      const has = d.instr.includes(id);
      set({ instr: has ? d.instr.filter(x => x !== id) : [...d.instr, id] });
    } else {
      set({ [k]: id });
    }
  };

  const lock = () => {
    playSuccessChime();
    up(s => {
      const calc = calcDesign(s.design);
      return {
        stress: { struct: calc.structPct, thermal: calc.thermalPct, vib: calc.vibPct, result: null },
        eventState: L(
          s,
          `Design locked: ${calc.P.name}, ${calc.St.name}, ${calc.Pw.name}. Wet mass ${Math.round(calc.wet)} kg, ΔV ${Math.round(calc.dv)} m/s.`
        )
      };
    });
    go(6);
  };

  return (
    <section className="page" aria-label="Spacecraft designer">
      <PHead n={5} title="SPACECRAFT DESIGNER" sub="Build ASTERIA-1's ride. Mass, cost and ΔV all move together." />
      <div className="designer grow">
        <div className="col gap8 rise" style={{ ...ri(1), minHeight: 0 }}>
          <div className="tabs" role="tablist">
            {CATS.map(([k, n]) => (
              <button
                type="button"
                role="tab"
                key={k}
                className="tab"
                aria-selected={cat === k}
                onClick={() => {
                  playTelemetryClick();
                  setCat(k);
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="partlist grow scroll">
            {PARTS[cat]?.map(p => {
              const sel = cat === 'instr' ? d.instr.includes(p.id) : (d as any)[cat] === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  className={'card ' + (sel ? 'sel' : '')}
                  aria-pressed={sel}
                  onClick={() => pick(cat, p.id)}
                >
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                  <div className="meta">
                    {partMeta(cat, p).map(m => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="panel craftbox gridbg rise" style={ri(2)}>
          <Craft d={d} hl={cat} sway={true} scale={1.05} />
          <div className="mono dim" style={{ position: 'absolute', left: 14, bottom: 10, fontSize: 11, letterSpacing: '.12em' }}>
            SCHEMATIC · HIGHLIGHT: {CATS.find(x => x[0] === cat)![1].toUpperCase()}
          </div>
        </div>
        <div className="panel col gap rise" style={ri(3)}>
          <Meter label="Launch mass" v={c.wet} max={3200} unit=" kg" warn={2700} crit={3000.01} mark={3000} />
          <Meter label="Budget" v={c.cost} max={46} d={1} unit=" $M" warn={40} crit={42.01} mark={42} />
          <Meter label="Delta-V" v={c.dv} max={2400} unit=" m/s" warn={1449} crit={1100} inv={true} mark={1450} />
          <div>
            <div className="row between">
              <span className="lab">Propellant load</span>
              <span className="mono">{d.load} kg</span>
            </div>
            <Slider id="load" v={d.load} min={300} max={1000} step={50} onChange={v => set({ load: v })} label="Propellant load" />
          </div>
          {overM && <div className="banner bad"><Ic n="warn" s={14} /> OVER LAUNCH MASS BY {fmt(c.wet - LIM.mass)} KG</div>}
          {overB && <div className="banner bad"><Ic n="warn" s={14} /> OVER BUDGET BY ${(c.cost - LIM.budget).toFixed(1)}M</div>}
          {!overM && !overB && lowDv && <div className="banner"><Ic n="warn" s={14} /> ΔV BELOW 1,450 M/S TARGET</div>}
          {!overM && !overB && !lowDv && <div className="banner ok">WITHIN ALL LIMITS</div>}
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(5), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <Btn k="secondary" icon="back" onClick={() => go(4)}>Back</Btn>
        <Btn glow={!overM && !overB} disabled={overM || overB} icon="lock" onClick={lock}>
          Lock design · stress test
        </Btn>
      </div>
    </section>
  );
}

/* 06 STRESS TEST */
const THR: Record<string, [number, number]> = {
  struct: [85, 100],
  thermal: [75, 90],
  vib: [70, 95]
};

function P6() {
  const { S, up, go } = useG();
  const d = S.design;
  const st =
    S.stress ||
    (() => {
      const c = calcDesign(S.design);
      return { struct: c.structPct, thermal: c.thermalPct, vib: c.vibPct, result: null };
    })();
  const [p, setP] = useState(st && st.result ? 1 : 0);
  const [run, setRun] = useState(false);
  const raf = useRef(0);

  const e = 1 - Math.pow(1 - p, 3);
  const v = { struct: st.struct * e, thermal: st.thermal * e, vib: st.vib * e };
  const L3 = (['struct', 'thermal', 'vib'] as const).map(k => lvl(v[k], THR[k][0], THR[k][1]));
  const done = p >= 1;
  const result = st.result;

  const start = () => {
    setRun(true);
    playThrusterPulse();
    const t0 = performance.now();
    const D = RM ? 50 : 3600;
    const f = (now: number) => {
      const x = clamp((now - t0) / D, 0, 1);
      setP(x);
      if (x < 1) {
        raf.current = requestAnimationFrame(f);
      } else {
        const ls = (['struct', 'thermal', 'vib'] as const).map(k => lvl(st[k], THR[k][0], THR[k][1]));
        const r: 'PASS' | 'WARNING' | 'FAIL' = ls.includes('crit') ? 'FAIL' : ls.includes('warn') ? 'WARNING' : 'PASS';
        if (r === 'FAIL') playWarningAlert();
        else playSuccessChime();
        up(s => ({
          stress: { ...s.stress!, result: r },
          eventState: L(s, `Stress test: ${r}. Structure ${Math.round(st.struct)}%, thermal ${Math.round(st.thermal)}%, vibration ${Math.round(st.vib)}%.`)
        }));
        setRun(false);
      }
    };
    raf.current = requestAnimationFrame(f);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    if (x > p) break;
    const y = st.thermal * (1 - Math.pow(1 - x, 3)) + Math.sin(i * 1.3) * 2;
    pts.push(`${20 + x * 300},${150 - clamp(y, 0, 110) * 1.25}`);
  }

  const failWhy =
    L3[0] === 'crit'
      ? 'FRAME BUCKLING UNDER LAUNCH LOAD'
      : L3[1] === 'crit'
      ? 'THERMAL RUNAWAY IN THE BUS'
      : 'ENGINE VIBRATION SHAKES MOUNTS LOOSE';

  const tele: [string, 'struct' | 'thermal' | 'vib', number][] = [
    ['STRUCTURAL LOAD', 'struct', v.struct],
    ['THERMAL LOAD', 'thermal', v.thermal],
    ['ENGINE VIBRATION', 'vib', v.vib]
  ];

  return (
    <section className="page" aria-label="Stress test">
      <PHead
        n={6}
        title="STRESS TEST"
        sub="Run the structural, thermal and vibration checks. Warnings carry into launch."
        right={done ? <div className={'stamp ' + (result === 'PASS' ? 'good' : result === 'FAIL' ? 'bad' : 'warnc')} style={{ fontSize: 34 }}>{result}</div> : null}
      />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className={'panel craftbox grow gridbg ' + (run || done ? 'on' : '')} style={{ overflow: 'hidden' }}>
          <div
            style={{ animation: run ? `shake ${Math.max(0.05, 0.5 - st.vib / 250)}s linear infinite` : 'none' }}
            className={done && result === 'FAIL' ? 'glitchy' : ''}
          >
            <Craft d={d} scale={1.1} />
          </div>
          {run && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: '30%',
                background: 'linear-gradient(180deg,transparent,rgba(70,224,255,.25),transparent)',
                animation: 'sweep 1.4s linear infinite'
              }}
            />
          )}
          {done && result === 'FAIL' && <div className="banner bad" style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>FAILURE SIMULATED · {failWhy}</div>}
          {done && result === 'WARNING' && <div className="banner" style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>MARGINS ARE THIN · EXPECT DAMAGE AT LAUNCH</div>}
          {done && result === 'PASS' && <div className="banner ok" style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>ALL CHECKS NOMINAL</div>}
          {!run && !done && (
            <div className="mono dim" style={{ position: 'absolute', left: 16, bottom: 14, fontSize: 12, letterSpacing: '.12em' }}>
              TEST STAND READY
            </div>
          )}
        </div>
        <div className="col gap" style={{ width: 430 }}>
          {tele.map(([n, k, val], i) => (
            <div key={k} className={'panel rise ' + (L3[i] === 'crit' ? 'crit' : L3[i] === 'warn' ? 'warn' : '')} style={ri(1 + i)}>
              <Meter label={n} v={val} max={130} unit="%" mark={100} st={L3[i]} />
            </div>
          ))}
          <div className="panel rise grow" style={ri(4)}>
            <div className="lab">Thermal response</div>
            <svg viewBox="0 0 340 160" width="100%" height="120" role="img" aria-label="Thermal graph">
              <g stroke="#1f3856">
                <line x1="20" x2="330" y1="150" y2="150" />
                <line x1="20" x2="330" y1={150 - 75 * 1.25} y2={150 - 75 * 1.25} strokeDasharray="4 4" stroke="#ffb23e" opacity="0.6" />
                <line x1="20" x2="330" y1={150 - 90 * 1.25} y2={150 - 90 * 1.25} strokeDasharray="4 4" stroke="#ff4a5a" opacity="0.6" />
              </g>
              <polyline points={pts.join(' ')} fill="none" stroke="#46e0ff" strokeWidth="2.5" />
              <text x="324" y={150 - 75 * 1.25 - 4} fill="#ffb23e" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">WARN 75%</text>
              <text x="324" y={150 - 90 * 1.25 - 4} fill="#ff4a5a" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">FAIL 90%</text>
            </svg>
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(5), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <Btn k="secondary" icon="back" disabled={run} onClick={() => go(5)}>
          {result === 'FAIL' ? 'Retry in designer' : 'Back to designer'}
        </Btn>
        <div className="row gap">
          {!done && <Btn glow icon="play" state={run ? 'loading' : ''} onClick={start}>Run stress test</Btn>}
          {done && result === 'FAIL' && (
            <Btn
              k="danger"
              icon="warn"
              onClick={() => {
                up(s => ({ override: true, eventState: L(s, 'Launch override: the failed stress test was ignored.') }));
                go(7);
              }}
            >
              Override and launch
            </Btn>
          )}
          {done && result === 'WARNING' && <Btn glow icon="rocket" onClick={() => go(7)}>Accept risk · launch</Btn>}
          {done && result === 'PASS' && <Btn glow icon="rocket" onClick={() => go(7)}>Proceed to launch</Btn>}
        </div>
      </div>
    </section>
  );
}

/* 07 LAUNCH */
function P7() {
  const { S, up, go } = useG();
  const t = useTimers();
  const [ph, setPh] = useState(0);
  const [n, setN] = useState(10);
  const [a, setA] = useState(0);
  const on = useRef(false);
  const raf = useRef(0);

  const st = S.stress || { struct: 70, thermal: 60, vib: 40 };
  const ls = (['struct', 'thermal', 'vib'] as const).map(k => lvl((st as any)[k], THR[k][0], THR[k][1]));
  const dmg = ls.filter(x => x === 'warn').length * 8 + ls.filter(x => x === 'crit').length * 45;

  const begin = () => {
    setPh(1);
    WARP.t = 1;
    let c = 10;
    setN(10);
    const iv = setInterval(() => {
      c--;
      setN(c);
      playTelemetryClick();
      if (c === 0) {
        clearInterval(iv);
        ignite();
      }
    }, RM ? 150 : 850);
    t(() => clearInterval(iv), 20000);
  };

  const ignite = () => {
    setPh(2);
    on.current = true;
    playThrusterPulse();
    WARP.t = RM ? 1 : 6;
    up(s => {
      const h = hurt(s, dmg);
      return {
        health: h,
        eventState: L(s, dmg ? `Launch loads exceeded margins and cost ${Math.round(s.health - h)}% health.` : 'Launch loads stayed inside structural margins.')
      };
    });
    const t0 = performance.now();
    const D = RM ? 200 : 6200;
    const f = (now: number) => {
      const x = clamp((now - t0) / D, 0, 1);
      setA(x);
      if (x < 1) {
        raf.current = requestAnimationFrame(f);
      } else {
        on.current = false;
        WARP.t = 1;
        setPh(3);
        playSuccessChime();
      }
    };
    raf.current = requestAnimationFrame(f);
  };

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    WARP.t = 1;
  }, []);

  const quake = (ph === 1 && n <= 3) || ph === 2;

  return (
    <section className="page full" aria-label="Launch">
      <div className={quake ? 'quake' : ''} style={{ position: 'absolute', inset: 0 }}>
        {ph < 3 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 190,
              transform: `translateY(${a * 900}px)`,
              background: 'linear-gradient(180deg,#0b1626,#06101c)',
              borderTop: '2px solid var(--line2)'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                marginLeft: -80,
                top: 0,
                width: 160,
                height: 90,
                borderLeft: '3px solid var(--line2)',
                borderRight: '3px solid var(--line2)',
                opacity: 0.6
              }}
            />
          </div>
        )}
        {ph < 3 && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              marginLeft: -150,
              top: ph === 2 ? 200 - a * 60 : 230,
              width: 300,
              height: 420,
              transition: 'top .3s'
            }}
          >
            <svg viewBox="0 0 300 420" width="300" height="420" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} aria-label="Launch vehicle">
              <g transform="translate(0,-60)">
                <path d="M150 40 C178 90 182 150 180 210 L120 210 C118 150 122 90 150 40Z" fill="#c9d8e8" />
                <path d="M120 210 L100 268 L120 250Z M180 210 L200 268 L180 250Z" fill="#8da6c2" />
                <rect x="120" y="208" width="60" height="12" fill="#46e0ff" opacity="0.8" />
                <circle cx="150" cy="118" r="10" fill="#0b2a47" stroke="#46e0ff" />
              </g>
            </svg>
            <div style={{ position: 'absolute', left: 0, top: 196 }}>
              <Exhaust on={on} />
            </div>
          </div>
        )}
        {ph === 3 && (
          <>
            <div className="floaty" style={{ position: 'absolute', left: '50%', marginLeft: -250, top: 200 }}>
              <Craft d={S.design} burn={false} scale={1.15} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: -200,
                right: -200,
                bottom: -540,
                height: 700,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 50% 8%,#1c4a78,#0a1c33 60%,#050b16)',
                border: '2px solid rgba(70,224,255,.35)',
                boxShadow: '0 -10px 60px rgba(70,224,255,.3)'
              }}
            />
          </>
        )}
      </div>
      <div style={{ position: 'absolute', left: 40, top: 84 }} className="rise">
        <div className="pidx">07 / 20</div>
        <h1 className="h2" style={{ fontSize: 30 }}>LAUNCH</h1>
      </div>
      {ph === 1 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center' }}>
          <div className="countdown" aria-live="assertive">T-{pad(n)}</div>
        </div>
      )}
      {ph === 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }} className="rise">
          <div className="mono dim" style={{ letterSpacing: '.14em' }}>
            STRESS TEST {S.override ? 'OVERRIDDEN' : (S.stress && S.stress.result) || '—'} · LAUNCH LOAD RISK {dmg ? '−' + Math.round(dmg * dmgMult(S)) + '% HEALTH' : 'LOW'}
          </div>
          <Btn glow icon="rocket" onClick={begin}>Begin countdown</Btn>
        </div>
      )}
      {(ph === 2 || ph === 3) && (
        <div className="panel col gap8" style={{ position: 'absolute', right: 40, top: 100, width: 260 }}>
          <div className="lab">Ascent telemetry</div>
          <div className="row between"><span className="dim">Altitude</span><b className="mono"><Num v={Math.round(a * 200)} dur={150} /> km</b></div>
          <div className="row between"><span className="dim">Velocity</span><b className="mono"><Num v={a * 7.8} d={2} dur={150} /> km/s</b></div>
          <div className="row between"><span className="dim">Load</span><b className={'mono ' + (ph === 2 && a < 0.6 ? 'warnc' : '')}><Num v={ph === 3 ? 0 : 1.2 + Math.sin(a * 9) * 0.4 + a * 2.6} d={1} dur={150} /> g</b></div>
          <Meter label="Health" v={S.health} unit="%" warn={50} crit={25} inv={true} />
        </div>
      )}
      {ph === 3 && (
        <div className="col gap rise" style={{ position: 'absolute', left: 0, right: 0, bottom: 60, alignItems: 'center' }}>
          <div className="stamp cy" style={{ fontSize: 34 }}>ORBIT ACHIEVED</div>
          <div className="mono dim">{dmg ? `LAUNCH LOADS COST ${Math.round(dmg * dmgMult(S))}% HEALTH` : 'NO STRUCTURAL DAMAGE'}</div>
          <Btn glow icon="chev" onClick={() => go(8)}>Continue to cruise</Btn>
        </div>
      )}
    </section>
  );
}

/* 08 CRUISE */
const PATH = 'M110 470 C330 150 680 130 930 262';

function P8() {
  const { S, up, go } = useG();
  const pr = useRef<SVGPathElement | null>(null);
  const [pt, setPt] = useState({ x: 110, y: 470, a: -60 });
  const [burn, setBurn] = useState(false);
  const t = useTimers();

  useEffect(() => {
    const p = pr.current;
    if (!p) return;
    const len = p.getTotalLength();
    const l = (len * S.cruise) / 100;
    const a = p.getPointAtLength(l);
    const b = p.getPointAtLength(Math.min(len, l + 4));
    setPt({ x: a.x, y: a.y, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
  }, [S.cruise]);

  const eta = (100 - S.cruise) * 1.9;

  const correct = () => {
    if (S.deltaV < 40 || burn || (S.cd.corr || 0) > 0) return;
    setBurn(true);
    playThrusterPulse();
    t(() => setBurn(false), 1800);
    up(s => ({
      ...dvPatch(s, 40),
      nav: Math.min(100, s.nav + 12),
      cd: { ...s.cd, corr: 6 },
      eventState: L(s, 'Trajectory correction burn spent 40 m/s and improved navigation to ' + Math.min(100, s.nav + 12) + '%.')
    }));
  };

  return (
    <section className="page full" aria-label="Cruise">
      <svg viewBox="0 0 1280 720" width="1280" height="720" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <g style={{ transform: `translateX(${-S.cruise * 1.6}px)`, transition: 'transform .3s linear' }}>
          <circle cx="-60" cy="760" r="330" fill="#0c2342" stroke="#2fb4d6" strokeOpacity="0.5" />
          <circle cx="-60" cy="760" r="348" fill="none" stroke="#46e0ff" strokeOpacity="0.18" strokeWidth="14" />
        </g>
        <g style={{ transform: `translateX(${-S.cruise * 0.5}px)`, transition: 'transform .3s linear' }} opacity="0.7">
          <circle cx="1130" cy="140" r="26" fill="#ffb23e" opacity="0.85" />
          <circle cx="1130" cy="140" r="50" fill="none" stroke="#ffb23e" strokeOpacity="0.25" />
        </g>
        <path ref={pr} d={PATH} fill="none" stroke="#46e0ff" strokeWidth="2" strokeDasharray="8 8" className="flow" opacity="0.7" />
        <g transform="translate(895,227)"><Asteria size={70} /></g>
        <g style={{ transform: `translate(${pt.x}px,${pt.y}px) rotate(${pt.a}deg)`, transition: 'transform .26s linear' }}>
          <g transform="scale(.2) translate(-225,-130)"><Craft d={S.design} burn={burn} /></g>
          <circle r="26" fill="none" stroke="#46e0ff" strokeOpacity="0.5" className="pulse" />
          {burn && <path d="M-14 0 L-60 -4 L-60 4Z" fill="#ffb23e" className="flame" />}
          <line x1="14" y1="0" x2="62" y2="0" stroke="#5cf2b0" strokeWidth="2" />
          <path d="M62 0 l-8 -5 l0 10z" fill="#5cf2b0" />
        </g>
      </svg>
      <div style={{ padding: '84px 40px 0' }} className="rise">
        <div className="pidx">08 / 20</div>
        <h1 className="h2" style={{ fontSize: 30 }}>CRUISE</h1>
        <p className="dim" style={{ maxWidth: 520, marginTop: 4 }}>Coast toward ASTERIA-1. Time warp saves time but not fuel. Corrections buy docking accuracy.</p>
      </div>
      <div className="panel col gap rise" style={{ ...ri(2), position: 'absolute', right: 40, top: 100, width: 320 }}>
        <Meter label="Trajectory progress" v={S.cruise} unit="%" d={1} big={true} />
        <div className="row between mono"><span className="dim">ETA</span><b><Num v={eta} d={0} /> days</b></div>
        <Meter label="Fuel (ΔV left)" v={S.fuel} unit="%" d={1} warn={25} crit={12} inv={true} hint={fmt(S.deltaV) + ' m/s'} />
        <Meter label="Navigation accuracy" v={S.nav} unit="%" warn={60} crit={40} inv={true} />
        <div>
          <div className="lab" style={{ marginBottom: 6 }}>Time warp</div>
          <div className="row gap8">
            {[1, 4, 8].map(w => (
              <button
                type="button"
                key={w}
                className="tab"
                style={{ flex: 1 }}
                aria-selected={S.warp === w}
                onClick={() => {
                  playTelemetryClick();
                  up({ warp: w });
                }}
              >
                ×{w}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="row between" style={{ position: 'absolute', left: 40, right: 40, bottom: 30 }}>
        <Btn k="secondary" icon="flame" disabled={S.deltaV < 40 || (S.cd.corr || 0) > 0} onClick={correct} state={burn ? 'loading' : ''}>
          Correction burn · 40 m/s
        </Btn>
        <div className="row gap">
          {S.cruise < 30 && <span className="mono dim" style={{ fontSize: 12 }}>TELEMETRY LINK AT 30%</span>}
          <Btn glow={S.cruise >= 30} icon="chev" disabled={S.cruise < 30} onClick={() => go(9)}>
            Open telemetry
          </Btn>
        </div>
      </div>
    </section>
  );
}

/* 09 TELEMETRY */
function P9() {
  const { S, go } = useG();
  const ref = useRef(S);
  ref.current = S;
  const tl = thermalLoad(S);
  const sg = signalQ(S);
  const getv = () => {
    const s = ref.current;
    return [
      thermalLoad(s) / 120,
      0.62 + Math.sin(performance.now() / 900) * 0.05,
      signalQ(s),
      0.25 + Math.sin(performance.now() / 700) * 0.1 + (s.nav < 50 ? 0.2 : 0)
    ];
  };
  const stT = tl > 80 ? 'Critical' : tl > 65 ? 'Warning' : 'Nominal';
  const logs = [
    'DSN lock acquired', 'Star tracker residual 0.02°', 'Hall thruster idle',
    'Bus current nominal', 'Radiator loop 2 flow OK', 'Reaction wheel temp stable',
    'Packet queue clear', 'Solar array tracking sun', 'Memory scrub complete',
    'Attitude hold within 0.1°'
  ];
  const [off, setOff] = useState(0);

  useEffect(() => {
    if (RM) return;
    const i = setInterval(() => setOff(o => o + 1), 1200);
    return () => clearInterval(i);
  }, []);

  return (
    <section className="page" aria-label="Telemetry">
      <PHead n={9} title="TELEMETRY" sub="Live systems feed. Watch the dashed thresholds." />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className="panel rise" style={{ ...ri(1), padding: 10 }}>
          <TeleCanvas getv={getv} />
        </div>
        <div className="col gap grow">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="rise">
            <Tele label="THERMAL LOAD" v={tl} unit="%" st={stT} />
            <Tele label="HEALTH" v={S.health} unit="%" st={S.health < 25 ? 'Critical' : S.health < 50 ? 'Warning' : 'Nominal'} />
            <Tele label="FUEL" v={S.fuel} unit="%" d={1} st={S.fuel < 12 ? 'Critical' : S.fuel < 25 ? 'Warning' : 'Nominal'} />
            <Tele label="SIGNAL" v={sg * 100} unit="%" st={sg < 0.35 ? 'Warning' : 'Nominal'} />
          </div>
          <div className="panel grow logbox rise" style={ri(3)}>
            <div className="lab" style={{ marginBottom: 6 }}>System log</div>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={off - i}>T+{pad(Math.floor(S.met / 3600))}h · {logs[(off + i * 3) % logs.length]}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(4), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <Btn k="secondary" icon="back" onClick={() => go(8)}>Back to cruise</Btn>
        <div className="row gap">
          {S.cruise < 60 && <span className="mono dim" style={{ fontSize: 12 }}>ANOMALY WINDOW AT 60% · NOW {Math.round(S.cruise)}%</span>}
          <Btn glow={S.cruise >= 60} k={S.cruise >= 60 ? 'danger' : 'primary'} icon="warn" disabled={S.cruise < 60} onClick={() => go(10)}>
            Anomaly alert
          </Btn>
        </div>
      </div>
    </section>
  );
}

/* 10 EVENT */
function P10() {
  const { S, up, go } = useG();
  const ev = EVENTS[S.eventId] || EVENTS.meteor;
  const pick = S.eventPick;
  const [show, setShow] = useState(false);
  const t = useTimers();
  const [res, setRes] = useState<any>(null);

  useEffect(() => {
    playWarningAlert();
    t(() => setShow(true), RM ? 0 : 900);
  }, []);

  const choose = (i: number) => {
    if (pick != null) return;
    const o = ev.opts[i];
    const r = o.run(S);
    const dmg = (r.dmg || 0) * dmgMult(S);
    setRes({ k: o.k, hp: -Math.round(dmg * 10) / 10, dv: -(r.dv || 0), nav: r.nav || 0, data: r.data || 0, log: r.log });
    playSuccessChime();
    up(s => {
      const o2: any = {
        eventPick: i,
        eventState: {
          ...L(s, r.log + '.'),
          decisionHistory: [
            ...s.eventState.decisionHistory,
            { page: 10, label: ev.title, choice: o.k, effect: `${dmg ? '−' + Math.round(dmg) + '% health' : 'no damage'}${r.dv ? ', −' + r.dv + ' m/s' : ''}${r.nav ? `, nav ${r.nav > 0 ? '+' : ''}${r.nav}` : ''}` }
          ]
        }
      };
      if (dmg) o2.health = hurt(s, r.dmg || 0);
      if (r.dv) Object.assign(o2, dvPatch(s, r.dv));
      if (r.nav) o2.nav = clamp(s.nav + r.nav, 5, 100);
      if (r.data) {
        const nd = clamp(s.dataQueue + r.data, 0, s.maxDataStorage);
        o2.dataQueue = nd;
        if (r.data > 0) o2.queueValue = s.queueValue + r.data * 3;
      }
      if (r.power) {
        const p = { ...s.power };
        for (const k in r.power) p[k as keyof typeof p] = clamp(p[k as keyof typeof p] + (r.power as any)[k], 5, 70);
        o2.power = p;
      }
      return o2;
    });
  };

  const ready = S.cruise >= 100;

  return (
    <section className="page full" aria-label="Random event">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center,transparent 40%,rgba(255,74,90,.28))',
          animation: 'critflash 1s ease-in-out infinite alternate',
          opacity: pick == null ? 1 : 0.2,
          transition: 'opacity .6s'
        }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 84, textAlign: 'center' }} className="alarm">
        {pick == null ? '⚠ ANOMALY DETECTED' : 'EVENT RESOLVED'}
      </div>
      <div
        className={'panel crit ' + (pick != null && res ? '' : '')}
        style={{
          position: 'absolute',
          left: '50%',
          top: 120,
          width: 760,
          marginLeft: -380,
          animation: RM ? 'none' : 'pop 600ms var(--ease) both',
          opacity: pick != null ? 0.96 : 1,
          transition: 'opacity .5s'
        }}
      >
        <div className="row gap">
          <span className="bad"><Ic n={ev.icon} s={34} /></span>
          <div>
            <div className="pidx" style={{ color: 'var(--red)' }}>10 / 20 · EVENT</div>
            <h1 className="h2" style={{ fontSize: 28 }}>{ev.title}</h1>
          </div>
        </div>
        <p style={{ marginTop: 10, color: 'var(--mute)', fontSize: 16 }}>{ev.text}</p>
        <div className="col gap8" style={{ marginTop: 16 }}>
          {show &&
            ev.opts.map((o, i) => (
              <button
                type="button"
                key={i}
                className={'card rise ' + (pick === i ? 'sel' : '')}
                style={{ ...ri(i), opacity: pick != null && pick !== i ? 0.3 : 1 }}
                disabled={pick != null && pick !== i}
                onClick={() => choose(i)}
              >
                <div className="row between">
                  <h3>{String.fromCharCode(65 + i)} · {o.k}</h3>
                  {pick === i && <span className="cy"><Ic n="lock" s={18} /></span>}
                </div>
                <p>{o.sub}</p>
              </button>
            ))}
        </div>
        {res && (
          <div className="row gap wrap mono" style={{ marginTop: 14, fontSize: 13, animation: 'rise .5s both' }}>
            <span className={'pill ' + (res.hp < 0 ? 'bad' : 'good')}>HEALTH {res.hp < 0 ? res.hp : '±0'}%</span>
            {res.dv < 0 && <span className="pill warnc">ΔV {res.dv} m/s</span>}
            {res.nav !== 0 && <span className={'pill ' + (res.nav > 0 ? 'good' : 'warnc')}>NAV {res.nav > 0 ? '+' : ''}{res.nav}%</span>}
            {res.data !== 0 && <span className="pill cy">DATA {res.data > 0 ? '+' : ''}{res.data} GB</span>}
          </div>
        )}
      </div>
      <div className="row between" style={{ position: 'absolute', left: 40, right: 40, bottom: 30 }}>
        <span className="mono dim" style={{ fontSize: 12 }}>
          {pick == null ? 'CHOOSE A RESPONSE' : ready ? 'APPROACH WINDOW OPEN' : `APPROACH WINDOW IN ${Math.ceil((100 - S.cruise) / (1.2 * S.warp))}s`}
        </span>
        <div className="row gap">
          {pick != null && !ready && (
            <div style={{ width: 220 }}>
              <Meter label="Cruise" v={S.cruise} unit="%" />
            </div>
          )}
          <Btn glow={pick != null && ready} icon="chev" disabled={pick == null || !ready} onClick={() => go(11)}>
            Begin approach
          </Btn>
        </div>
      </div>
    </section>
  );
}

/* 11 APPROACH */
function P11() {
  const { S, up, go } = useG();
  const prog = 1 - (S.range - 60) / 1740;
  const sc = lerp(0.22, 1.9, Math.pow(prog, 1.5));
  const lock = S.range < 600;
  const ready = S.range <= 60.5;

  const brake = () => {
    if (S.vel <= 6 || S.deltaV < 25) return;
    playThrusterPulse();
    up(s => ({
      vel: Math.max(6, s.vel - 12),
      ...dvPatch(s, 25),
      eventState: L(s, 'Braking burn cut closing speed by 12 m/s and cost 25 m/s of ΔV.')
    }));
  };

  return (
    <section className="page full" aria-label="Approach">
      <svg viewBox="0 0 1280 720" width="1280" height="720" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <g style={{ transform: 'translate(640px,380px)' }}>
          {[1, 2, 3].map(i => (
            <ellipse
              key={i}
              rx={120 * i * (1 + prog)}
              ry={60 * i * (1 + prog)}
              fill="none"
              stroke="#46e0ff"
              strokeOpacity={0.28 / i}
              strokeDasharray="6 8"
              className="flow"
            />
          ))}
          <g style={{ transform: `scale(${sc})`, transition: 'transform .3s linear' }}>
            <Asteria size={260} />
          </g>
          {lock && (
            <g>
              <circle r={150 * Math.max(0.6, sc * 0.7)} fill="none" stroke="#5cf2b0" strokeWidth="2" strokeDasharray="14 10" className="rot fast" />
              <path d="M-30 0H30M0 -30V30" stroke="#5cf2b0" />
            </g>
          )}
        </g>
        <g stroke="#5cf2b0" strokeWidth="2" opacity="0.85" style={{ transform: 'translate(210px,560px)' }}>
          <line x1="0" y1="0" x2={Math.min(180, S.vel * 1.8)} y2={-Math.min(100, S.vel)} className="flow" strokeDasharray="10 6" />
        </g>
      </svg>
      <div style={{ padding: '84px 40px 0' }} className="rise">
        <div className="pidx">11 / 20</div>
        <h1 className="h2" style={{ fontSize: 30 }}>APPROACH</h1>
        <p className="dim" style={{ maxWidth: 520, marginTop: 4 }}>
          Brake before arrival. Closing speed carries into docking, and every brake burn spends ΔV.
        </p>
      </div>
      <div className="panel col gap rise" style={{ ...ri(2), position: 'absolute', left: 40, top: 210, width: 300 }}>
        <div className="row between">
          <span className="lab">Range</span>
          <b className="mono" style={{ fontSize: 26 }}><Num v={S.range} d={0} /> <small className="dim">km</small></b>
        </div>
        <div className="row between">
          <span className="lab">Closing speed</span>
          <b className={'mono ' + (S.vel > 30 ? 'warnc' : 'good')} style={{ fontSize: 26 }}><Num v={S.vel} /> <small className="dim">m/s</small></b>
        </div>
        <Meter label="Fuel (ΔV left)" v={S.fuel} unit="%" d={1} warn={25} crit={12} inv={true} hint={fmt(S.deltaV) + ' m/s'} />
        <div className={'pill ' + (lock ? 'good' : 'dim')} style={{ alignSelf: 'flex-start' }}>{lock ? 'TARGET LOCK' : 'ACQUIRING'}</div>
        {S.vel > 30 && <div className="banner">HIGH CLOSING SPEED · DOCKING WILL BE HARSH</div>}
      </div>
      <div className="row between" style={{ position: 'absolute', left: 40, right: 40, bottom: 30 }}>
        <Btn k="secondary" icon="flame" disabled={S.vel <= 6 || S.deltaV < 25} onClick={brake}>
          Braking burn · −12 m/s · 25 ΔV
        </Btn>
        <div className="row gap">
          {!ready && <span className="mono dim" style={{ fontSize: 12 }}>RENDEZVOUS AT RANGE 60 KM</span>}
          <Btn glow={ready} icon="target" disabled={!ready} onClick={() => go(12)}>
            Begin rendezvous
          </Btn>
        </div>
      </div>
    </section>
  );
}

/* 12 RENDEZVOUS — Docking mini-game */
function P12() {
  const { S, up, go } = useG();
  const cv = useRef<HTMLCanvasElement | null>(null);
  const sim = useRef<any>(null);
  const [ph, setPh] = useState<'idle' | 'run' | 'ok' | 'bad'>('idle');
  const [hud, setHud] = useState({ z: 100, vz: 0, off: 0, vl: 0 });

  const reset = () => {
    const spread = (100 - S.nav) * 1.1 + 25;
    sim.current = {
      x: rnd(-spread, spread),
      y: rnd(-spread, spread) * 0.7,
      vx: rnd(-0.5, 0.5),
      vy: rnd(-0.5, 0.5),
      z: 100,
      vz: Math.max(1, S.vel / 12),
      pulses: 0,
      state: 'run',
      tx: 0
    };
  };

  const pulse = (dx: number, dy: number, dz: number) => {
    const m = sim.current;
    if (!m || m.state !== 'run') return;
    if (S.deltaV - m.pulses * 1.5 < 1.5) return;
    playThrusterPulse();
    m.pulses++;
    m.vx += dx * 0.35;
    m.vy += dy * 0.35;
    m.vz = Math.max(0.2, m.vz + dz * 0.35);
  };

  const begin = () => {
    reset();
    setPh('run');
  };

  const finish = (ok: boolean) => {
    const m = sim.current;
    m.state = ok ? 'ok' : 'bad';
    const dv = m.pulses * 1.5;
    if (ok) {
      setPh('ok');
      playSuccessChime();
      up(s => ({
        ...dvPatch(s, dv),
        docked: 'success',
        eventState: {
          ...L(s, 'Docked with ASTERIA-1 after ' + m.pulses + ' RCS pulses.'),
          decisionHistory: [...s.eventState.decisionHistory, { page: 12, label: 'Rendezvous', choice: 'Manual docking', effect: 'docked, ' + m.pulses + ' pulses' }]
        }
      }));
    } else {
      setPh('bad');
      playWarningAlert();
      up(s => ({
        ...dvPatch(s, dv),
        health: hurt(s, 12),
        eventState: L(s, 'Docking failed at ' + m.vz.toFixed(1) + ' m/s closing speed.')
      }));
    }
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'b', 'f'].includes(k)) {
        e.preventDefault();
        if (e.repeat) return;
        if (k === 'arrowleft') pulse(-1, 0, 0);
        if (k === 'arrowright') pulse(1, 0, 0);
        if (k === 'arrowup') pulse(0, -1, 0);
        if (k === 'arrowdown') pulse(0, 1, 0);
        if (k === ' ' || k === 'b') pulse(0, 0, -1);
        if (k === 'f') pulse(0, 0, 1);
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [S.deltaV]);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const x = c.getContext('2d');
    if (!x) return;
    let raf: number;
    let last = performance.now();
    let acc = 0;

    const f = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const m = sim.current;
      x.clearRect(0, 0, 600, 420);
      x.strokeStyle = 'rgba(70,224,255,.12)';
      for (let i = 0; i <= 12; i++) {
        x.beginPath();
        x.moveTo(i * 50, 0);
        x.lineTo(i * 50, 420);
        x.stroke();
      }
      for (let i = 0; i <= 8; i++) {
        x.beginPath();
        x.moveTo(0, i * 52.5);
        x.lineTo(600, i * 52.5);
        x.stroke();
      }
      const cx = 300;
      const cy = 210;

      if (m) {
        if (m.state === 'run') {
          m.x += m.vx * dt * 14;
          m.y += m.vy * dt * 14;
          m.z -= m.vz * dt;
          acc += dt;
          if (acc > 0.1) {
            acc = 0;
            setHud({ z: Math.max(0, m.z), vz: m.vz, off: Math.hypot(m.x, m.y), vl: Math.hypot(m.vx, m.vy) });
          }
          if (m.z <= 0) {
            const ok = Math.hypot(m.x, m.y) <= 14 && m.vz <= 2.5 && Math.hypot(m.vx, m.vy) <= 0.8;
            finish(ok);
          }
        }
        const k = clamp(1 - m.z / 100, 0, 1);
        const R = lerp(26, 140, k * k);

        /* port */
        x.strokeStyle = '#5cf2b0';
        x.lineWidth = 2;
        x.beginPath();
        x.arc(cx, cy, R, 0, 6.283);
        x.stroke();
        x.strokeStyle = 'rgba(92,242,176,.35)';
        x.beginPath();
        x.arc(cx, cy, R * 0.55, 0, 6.283);
        x.stroke();
        for (let i = 0; i < 8; i++) {
          const a = i * 0.785 + performance.now() / 6000;
          x.beginPath();
          x.moveTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9);
          x.lineTo(cx + Math.cos(a) * R * 1.1, cy + Math.sin(a) * R * 1.1);
          x.stroke();
        }

        /* craft reticle */
        const px = cx + (m.x * R) / 60;
        const py = cy + (m.y * R) / 60;
        const good = Math.hypot(m.x, m.y) <= 14 && m.vz <= 2.5 && Math.hypot(m.vx, m.vy) <= 0.8;
        x.strokeStyle = m.state === 'bad' ? '#ff4a5a' : good ? '#5cf2b0' : '#46e0ff';
        x.lineWidth = 2.5;
        x.beginPath();
        x.arc(px, py, 12 + R * 0.12, 0, 6.283);
        x.stroke();
        x.beginPath();
        x.moveTo(px - 24 - R * 0.1, py);
        x.lineTo(px - 8, py);
        x.moveTo(px + 8, py);
        x.lineTo(px + 24 + R * 0.1, py);
        x.moveTo(px, py - 24 - R * 0.1);
        x.lineTo(px, py - 8);
        x.moveTo(px, py + 8);
        x.lineTo(px, py + 24 + R * 0.1);
        x.stroke();
        x.strokeStyle = 'rgba(70,224,255,.4)';
        x.setLineDash([4, 6]);
        x.beginPath();
        x.moveTo(cx, cy);
        x.lineTo(px, py);
        x.stroke();
        x.setLineDash([]);

        if (m.state === 'ok') {
          m.tx += dt;
          const r = lerp(220, 30, Math.min(1, m.tx * 1.4));
          x.strokeStyle = `rgba(92,242,176,${1 - Math.min(1, m.tx * 0.8) * 0.5})`;
          x.lineWidth = 6;
          x.beginPath();
          x.arc(cx, cy, r, 0, 6.283);
          x.stroke();
        }
        if (m.state === 'bad') {
          m.tx += dt;
          x.strokeStyle = '#ff4a5a';
          x.lineWidth = 2;
          for (let i = 0; i < 14; i++) {
            const a = i * 0.45;
            const d = m.tx * 180 + i * 4;
            x.beginPath();
            x.moveTo(px + Math.cos(a) * d * 0.4, py + Math.sin(a) * d * 0.4);
            x.lineTo(px + Math.cos(a) * d, py + Math.sin(a) * d);
            x.stroke();
          }
        }
      }
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stab = hud.vz <= 2.5 && hud.vl <= 0.8;

  const retry = () => {
    if (S.deltaV >= 60) {
      up(s => ({ ...dvPatch(s, 60), eventState: L(s, 'Retry approach cost 60 m/s of ΔV.') }));
      begin();
    }
  };

  const abort = () => {
    up(s => ({
      docked: 'abort',
      eventState: {
        ...L(s, 'Docking aborted. Mission continues as a flyby with halved science.'),
        decisionHistory: [...s.eventState.decisionHistory, { page: 12, label: 'Rendezvous', choice: 'Abort to flyby', effect: 'science ×0.5' }]
      }
    }));
    go(13);
  };

  return (
    <section className="page" aria-label="Rendezvous">
      <PHead
        n={12}
        title="RENDEZVOUS"
        sub="Line up the reticle on the docking port. Touch down slow and centered."
        right={
          <div className="mono dim" style={{ fontSize: 12 }}>
            KEYS <span className="kbd">←↑↓→</span> lateral · <span className="kbd">SPACE</span> brake · <span className="kbd">F</span> forward
          </div>
        }
      />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className={'panel craftbox ' + (ph === 'bad' ? 'shake' : '')} style={{ width: 624, padding: 12, background: ph === 'bad' ? 'rgba(60,8,14,.8)' : undefined }}>
          <canvas ref={cv} width="600" height="420" style={{ width: 600, height: 420 }} role="img" aria-label="Docking view" />
          {ph === 'ok' && <div className="stamp good" style={{ position: 'absolute', fontSize: 36 }}>DOCKED</div>}
          {ph === 'bad' && <div className="stamp bad glitchy" style={{ position: 'absolute', fontSize: 34 }}>DOCKING FAILED</div>}
        </div>
        <div className="col gap grow">
          <div className="panel col gap rise" style={ri(1)}>
            <div className="row between"><span className="lab">Distance to port</span><b className="mono" style={{ fontSize: 24 }}>{hud.z.toFixed(1)} m</b></div>
            <Meter label="Closing speed" v={hud.vz} max={8} d={2} unit=" m/s" warn={2.5} crit={5} mark={2.5} />
            <Meter label="Lateral drift" v={hud.vl} max={3} d={2} unit=" m/s" warn={0.8} crit={1.8} mark={0.8} />
            <Meter label="Offset" v={hud.off} max={90} d={0} unit=" m" warn={14} crit={35} mark={14} />
            <div className={'banner ' + (stab ? 'ok' : '')}>{stab ? 'VELOCITY STABILIZED' : 'STABILIZE VELOCITY'}</div>
          </div>
          <div className="row gap20 rise" style={ri(2)}>
            <div className="dpad" role="group" aria-label="Thruster controls">
              <span />
              <Btn k="secondary" icon="chev" title="Thrust up" onClick={() => pulse(0, -1, 0)} cls="up" />
              <span />
              <Btn k="secondary" icon="back" title="Thrust left" onClick={() => pulse(-1, 0, 0)} />
              <Btn k="secondary" icon="x" title="Brake" onClick={() => pulse(0, 0, -1)} />
              <Btn k="secondary" icon="chev" title="Thrust right" onClick={() => pulse(1, 0, 0)} />
              <span />
              <Btn k="secondary" icon="chev" title="Thrust down" onClick={() => pulse(0, 1, 0)} cls="down" />
              <span />
            </div>
            <div className="col gap8 grow">
              <Btn k="secondary" sm onClick={() => pulse(0, 0, -1)}>Brake · −0.35</Btn>
              <Btn k="secondary" sm onClick={() => pulse(0, 0, 1)}>Forward · +0.35</Btn>
              <div className="mono dim" style={{ fontSize: 11 }}>Each pulse costs 1.5 m/s of ΔV · {fmt(S.deltaV)} left</div>
            </div>
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(3), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <span className="mono dim" style={{ fontSize: 12 }}>
          {ph === 'idle' ? 'READY FOR FINAL APPROACH' : ph === 'run' ? 'DOCKING IN PROGRESS' : ''}
        </span>
        <div className="row gap">
          {ph === 'idle' && <Btn glow icon="play" onClick={begin}>Begin final approach</Btn>}
          {ph === 'ok' && <Btn glow icon="chev" onClick={() => go(13)}>Begin science</Btn>}
          {ph === 'bad' && <Btn k="secondary" icon="skip" onClick={abort}>Abort · flyby science</Btn>}
          {ph === 'bad' && <Btn icon="refresh" disabled={S.deltaV < 60} onClick={retry}>Retry · −60 ΔV</Btn>}
        </div>
      </div>
    </section>
  );
}

/* 13 SCIENCE */
function P13() {
  const { S, up, go } = useG();
  const [beam, setBeam] = useState<string | null>(null);
  const t = useTimers();
  const ins = S.design.instr.map(id => findP('instr', id));
  const yld = sciYield(S);
  const mult = S.docked === 'success' ? 1 : 0.5;

  const scan = (i: Part) => {
    const n = S.scans[i.id] || 0;
    if (n >= 3 || (S.cd[i.id] || 0) > 0 || beam) return;
    if (i.needsDock && S.docked !== 'success') return;
    setBeam(i.id);
    playThrusterPulse();
    t(() => setBeam(null), 1400);
    const pts = Math.round(i.sci * yld * mult * 10) / 10;
    t(() => {
      playSuccessChime();
      up(s => {
        const room = s.maxDataStorage - s.dataQueue;
        const keep = Math.min(room, i.data);
        const frac = keep / i.data;
        return {
          scienceScore: s.scienceScore + pts,
          scans: { ...s.scans, [i.id]: (s.scans[i.id] || 0) + 1 },
          cd: { ...s.cd, [i.id]: 4 },
          dataQueue: s.dataQueue + keep,
          queueValue: s.queueValue + pts * frac,
          heatSpike: s.heatSpike + i.heat * 1.6,
          eventState: L(s, `${i.name} scan: +${pts} points, +${keep.toFixed(1)} GB${frac < 1 ? ' (storage full, data lost)' : ''}.`)
        };
      });
    }, RM ? 0 : 1100);
  };

  return (
    <section className="page" aria-label="Science">
      <PHead
        n={13}
        title="SCIENCE"
        sub="Activate each instrument up to three times. Points only count once the data reaches Earth."
        right={
          <div className="col" style={{ alignItems: 'flex-end' }}>
            <div className="lab">Collected</div>
            <div className="big-num cy" style={{ fontSize: 46 }}><Num v={S.scienceScore} d={0} /></div>
          </div>
        }
      />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className="panel craftbox grow gridbg rise" style={ri(1)}>
          <div style={{ position: 'absolute', left: 30, top: 80 }}><Craft d={S.design} scale={0.5} /></div>
          <div style={{ position: 'relative', marginLeft: 180 }}>
            <Asteria size={300} scan={!!beam} />
            {beam && (
              <div
                style={{
                  position: 'absolute',
                  left: -200,
                  top: '50%',
                  width: 200,
                  height: 3,
                  background: 'linear-gradient(90deg,transparent,#5cf2b0)',
                  boxShadow: '0 0 16px #5cf2b0',
                  animation: 'pulse .35s infinite'
                }}
              />
            )}
          </div>
          {S.docked !== 'success' && <div className="banner" style={{ position: 'absolute', left: 14, right: 14, bottom: 12 }}>FLYBY MODE · SCIENCE ×0.5 · SAMPLE COLLECTOR LOCKED</div>}
          <div className="mono dim" style={{ position: 'absolute', left: 14, top: 12, fontSize: 11 }}>
            YIELD ×{yld.toFixed(2)} · POWER {S.power.science}%
          </div>
        </div>
        <div className="col gap8" style={{ width: 440, minHeight: 0 }}>
          <div className="partlist scroll">
            {ins.map(i => {
              const n = S.scans[i.id] || 0;
              const cdv = S.cd[i.id] || 0;
              const lockd = i.needsDock && S.docked !== 'success';
              const off = n >= 3 || lockd;
              return (
                <div key={i.id} className="panel row gap" style={{ padding: '10px 14px', opacity: lockd ? 0.45 : 1 }}>
                  <div className="grow">
                    <h3 className="h2" style={{ fontSize: 15 }}>{i.name}</h3>
                    <div className="mono dim" style={{ fontSize: 11, marginTop: 2 }}>
                      +{(i.sci * yld * mult).toFixed(1)} pts · +{i.data} GB · scans {n}/3
                    </div>
                    <div className="meter" style={{ marginTop: 6 }}>
                      <div className="bar" style={{ height: 5 }}>
                        <div className="fill" style={{ width: (n / 3) * 100 + '%' }} />
                      </div>
                    </div>
                  </div>
                  <Btn sm k={off ? 'secondary' : 'primary'} disabled={off || cdv > 0 || !!beam} icon={lockd ? 'lock' : 'scan'} onClick={() => scan(i)}>
                    {lockd ? 'Locked' : n >= 3 ? 'Done' : cdv > 0 ? cdv.toFixed(0) + 's' : beam === i.id ? 'Scanning' : 'Scan'}
                  </Btn>
                </div>
              );
            })}
          </div>
          <div className="panel col gap8">
            <Meter label="Data queue" v={S.dataQueue} max={S.maxDataStorage} d={1} unit=" GB" warn={S.maxDataStorage * 0.75} crit={S.maxDataStorage * 0.95} />
            <Meter label="Thermal load" v={thermalLoad(S)} max={120} unit="%" warn={65} crit={80} />
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(3), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <span className="mono dim" style={{ fontSize: 12 }}>Scans add heat. Science power sets yield.</span>
        <Btn glow icon="chev" onClick={() => go(14)}>Data management</Btn>
      </div>
    </section>
  );
}

/* 14 DATA MANAGEMENT */
function P14() {
  const { S, up, go } = useG();
  const [busy, setBusy] = useState<'ll' | 'lossy' | false>(false);
  const [stage, setStage] = useState(Math.round(S.dataQueue));
  const t = useTimers();
  const maxS = Math.floor(S.dataQueue);

  useEffect(() => setStage(s => Math.min(s, Math.floor(S.dataQueue))), [S.dataQueue]);

  const compress = (lossy: boolean) => {
    if (busy || S.dataQueue <= 0) return;
    setBusy(lossy ? 'lossy' : 'll');
    playTelemetryClick();
    t(() => {
      playSuccessChime();
      up(s => {
        const comp = s.power.computing;
        const ratio = lossy ? clamp(0.35 + comp * 0.006, 0.3, 0.6) : (0.1 + comp * 0.004) * Math.pow(0.6, s.compCount);
        const nd = s.dataQueue * (1 - ratio);
        const nv = lossy ? s.queueValue * 0.8 : s.queueValue;
        return {
          dataQueue: nd,
          queueValue: nv,
          compCount: lossy ? s.compCount : s.compCount + 1,
          eventState: L(s, `${lossy ? 'Lossy' : 'Lossless'} compression cut the queue by ${Math.round(ratio * 100)}%${lossy ? ' and discarded 20% of its science value' : ''}.`)
        };
      });
      setBusy(false);
    }, RM ? 0 : 1500);
  };

  const stageNow = () => {
    if (stage <= 0) return;
    playSuccessChime();
    up(s => {
      const amt = Math.min(stage, s.dataQueue);
      const f = s.dataQueue > 0 ? amt / s.dataQueue : 0;
      return {
        dataQueue: s.dataQueue - amt,
        queueValue: s.queueValue * (1 - f),
        txBuffer: s.txBuffer + amt,
        txValue: s.txValue + s.queueValue * f,
        eventState: L(s, `Staged ${amt.toFixed(1)} GB for uplink.`)
      };
    });
  };

  const fill = S.dataQueue / S.maxDataStorage;
  const packets = Math.min(14, Math.ceil(S.dataQueue / 2.4));

  return (
    <section className="page" aria-label="Data management">
      <PHead n={14} title="DATA MANAGEMENT" sub="Storage is limited. Compress to make room, then stage data for the uplink." />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className="panel col rise" style={{ ...ri(1), width: 330 }}>
          <Meter label="Onboard storage" v={S.dataQueue} max={S.maxDataStorage} d={1} unit=" GB" warn={S.maxDataStorage * 0.75} crit={S.maxDataStorage * 0.95} big={true} />
          <div className="grow" style={{ position: 'relative', marginTop: 14, border: '1px solid var(--line)', overflow: 'hidden', borderRadius: 3 }}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fill * 100 + '%', background: 'linear-gradient(180deg,rgba(70,224,255,.35),rgba(70,224,255,.12))', transition: 'height .5s var(--ease)' }} />
            <div style={{ position: 'absolute', inset: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-end' }}>
              {Array.from({ length: packets }).map((_, i) => (
                <i
                  key={i}
                  style={{
                    width: 44,
                    height: 18,
                    background: 'var(--cyan)',
                    opacity: 0.85,
                    borderRadius: 2,
                    transform: busy ? 'scaleX(.55)' : 'none',
                    transition: 'transform .7s var(--ease)',
                    animation: busy ? 'none' : `pulse ${1.4 + i * 0.1}s ease-in-out infinite`
                  }}
                />
              ))}
            </div>
          </div>
          <div className="mono dim" style={{ fontSize: 11, marginTop: 8 }}>Queue value: {S.queueValue.toFixed(0)} pts pending</div>
        </div>
        <div className="col gap grow">
          <div className="panel col gap rise" style={ri(2)}>
            <div className="lab">Compression · uses computing power ({S.power.computing}%)</div>
            <div className="row gap">
              <Btn k="secondary" icon="cpu" state={busy === 'll' ? 'loading' : ''} disabled={!!busy || S.dataQueue <= 0} onClick={() => compress(false)}>
                Lossless · −{Math.round((0.1 + S.power.computing * 0.004) * Math.pow(0.6, S.compCount) * 100)}%
              </Btn>
              <Btn k="secondary" icon="cpu" state={busy === 'lossy' ? 'loading' : ''} disabled={!!busy || S.dataQueue <= 0} onClick={() => compress(true)}>
                Lossy · −{Math.round(clamp(0.35 + S.power.computing * 0.006, 0.3, 0.6) * 100)}% / value −20%
              </Btn>
            </div>
            <div className="dim" style={{ fontSize: 13 }}>Lossless works less each time you repeat it. Lossy frees the most space but throws away part of the science value.</div>
          </div>
          <div className="panel col gap rise" style={ri(3)}>
            <div className="lab">Stage for uplink</div>
            <div className="row between">
              <span className="mono" style={{ fontSize: 24 }}><Num v={stage} d={0} /> GB</span>
              <Btn icon="data" disabled={stage <= 0} onClick={stageNow}>Stage batch</Btn>
            </div>
            <Slider id="stage" v={Math.min(stage, maxS)} min={0} max={Math.max(1, maxS)} onChange={setStage} label="Amount to stage" disabled={maxS < 1} />
          </div>
          <div className="panel rise" style={ri(4)}>
            <Meter label="Uplink buffer (staged)" v={S.txBuffer} max={S.maxDataStorage} d={1} unit=" GB" />
            {S.txBuffer > 0 && <div className="banner ok" style={{ marginTop: 10 }}>TRANSFER CONFIRMED · {S.txBuffer.toFixed(1)} GB READY FOR COMMS</div>}
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(5), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <Btn k="secondary" icon="back" onClick={() => go(13)}>Back to science</Btn>
        <Btn glow icon="chev" onClick={() => go(15)}>Power management</Btn>
      </div>
    </section>
  );
}

/* 15 POWER */
function P15() {
  const { S, up, go } = useG();
  const p = S.power;

  const setP = (k: keyof typeof p, v: number) => {
    up(s => {
      const q = { ...s.power };
      const o = (Object.keys(q) as (keyof typeof q)[]).filter(x => x !== k);
      const rest = 100 - v;
      const tot = o.reduce((a, x) => a + q[x], 0) || 1;
      let acc = 0;
      o.forEach((x, i) => {
        const nv = i === o.length - 1 ? rest - acc : Math.round((q[x] / tot) * rest);
        q[x] = Math.max(5, nv);
        acc += q[x];
      });
      const sum = Object.values(q).reduce((a, b) => a + b, 0) + v;
      if (sum !== 100) {
        const big = o.reduce((a, x) => (q[x] > q[a] ? x : a), o[0]);
        q[big] -= sum - 100;
      }
      q[k] = v;
      return { power: q };
    });
  };

  const tl = thermalLoad(S);
  const w = findP('power', S.design.power).watts || 1000;
  const rows: [keyof typeof p, string, string, string][] = [
    ['science', 'SCIENCE', 'scan', 'Instrument yield'],
    ['comms', 'COMMS', 'sig', 'Signal strength'],
    ['computing', 'COMPUTING', 'cpu', 'Compression'],
    ['thermal', 'THERMAL', 'therm', 'Cooling']
  ];
  const nodes: Record<string, [number, number]> = {
    science: [210, 70],
    comms: [610, 70],
    computing: [210, 300],
    thermal: [610, 300]
  };

  return (
    <section className="page" aria-label="Power management">
      <PHead n={15} title="POWER MANAGEMENT" sub={`Bus output ${fmt(w)} W. Every watt you give one system is taken from another.`} />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className="panel rise" style={{ ...ri(1), width: 810, padding: 8 }}>
          <svg viewBox="0 0 820 400" width="100%" height="100%" role="img" aria-label="Power distribution">
            {Object.entries(nodes).map(([k, [x, y]]) => (
              <g key={k}>
                <line
                  x1="410"
                  y1="200"
                  x2={x + 90}
                  y2={y + 45}
                  stroke={k === 'thermal' && tl > 80 ? '#ff4a5a' : '#46e0ff'}
                  strokeWidth={1 + p[k as keyof typeof p] / 6}
                  strokeDasharray="10 8"
                  className="flow"
                  style={{ animationDuration: 2.4 - p[k as keyof typeof p] / 25 + 's' }}
                  opacity="0.85"
                />
                <rect x={x} y={y} width="180" height="90" rx="3" fill="#0b1422" stroke={k === 'thermal' && tl > 80 ? '#ff4a5a' : '#2c4f78'} />
                <text x={x + 14} y={y + 26} fill="#8da6c2" fontFamily="JetBrains Mono" fontSize="11" letterSpacing="2">{k.toUpperCase()}</text>
                <text x={x + 14} y={y + 62} fill="#e8f2fc" fontFamily="JetBrains Mono" fontSize="28" fontWeight="600">{p[k as keyof typeof p]}%</text>
                <text x={x + 166} y={y + 62} fill="#46e0ff" fontFamily="JetBrains Mono" fontSize="12" textAnchor="end">{fmt((w * p[k as keyof typeof p]) / 100)} W</text>
              </g>
            ))}
            <circle cx="410" cy="200" r="46" fill="#10223a" stroke="#46e0ff" strokeWidth="2" />
            <circle cx="410" cy="200" r="58" fill="none" stroke="#46e0ff" strokeOpacity="0.35" className="scanring" />
            <text x="410" y="196" textAnchor="middle" fill="#46e0ff" fontFamily="Chakra Petch" fontWeight="700" fontSize="16">BUS</text>
            <text x="410" y="216" textAnchor="middle" fill="#8da6c2" fontFamily="JetBrains Mono" fontSize="11">{fmt(w)} W</text>
          </svg>
        </div>
        <div className="col gap grow">
          <div className="panel col gap8 rise" style={ri(2)}>
            {rows.map(([k, n, ic, eff]) => (
              <div key={k}>
                <div className="row between">
                  <span className="row gap8">
                    <span className="cy"><Ic n={ic} s={16} /></span>
                    <span className="lab">{n}</span>
                  </span>
                  <span className="mono dim" style={{ fontSize: 11 }}>{eff}</span>
                </div>
                <Slider id={'pw-' + k} v={p[k]} min={5} max={70} onChange={v => setP(k, v)} label={n + ' power'} />
              </div>
            ))}
          </div>
          <div className="panel col gap8 rise" style={ri(3)}>
            <Meter label="Thermal load" v={tl} max={120} unit="%" warn={65} crit={80} big={true} />
            <div className="mono dim col" style={{ fontSize: 12, gap: 2 }}>
              <span>Science yield ×{sciYield(S).toFixed(2)}</span>
              <span>Signal quality {Math.round(signalQ(S) * 100)}%</span>
              <span>Lossless ratio {Math.round((0.1 + p.computing * 0.004) * 100)}%</span>
            </div>
            {tl > 80 ? (
              <div className="banner bad">OVERHEATING · HULL DAMAGE IN PROGRESS</div>
            ) : tl > 65 ? (
              <div className="banner">THERMAL MARGIN LOW</div>
            ) : (
              <div className="banner ok">THERMAL NOMINAL</div>
            )}
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(4), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <Btn k="secondary" icon="back" onClick={() => go(14)}>Back to data</Btn>
        <Btn glow icon="chev" onClick={() => go(16)}>Communications</Btn>
      </div>
    </section>
  );
}

/* 16 COMMUNICATION */
function P16() {
  const { S, up, go } = useG();
  const [tx, setTx] = useState(false);
  const [pk, setPk] = useState<{ id: number; ok: boolean }[]>([]);
  const ref = useRef(S);
  ref.current = S;
  const id = useRef(0);

  useEffect(() => {
    if (!tx) return;
    const iv = setInterval(() => {
      const s = ref.current;
      if (s.txBuffer <= 0.01) {
        setTx(false);
        playSuccessChime();
        return;
      }
      const gain = findP('comms', s.design.comms).gain || 1;
      const size = Math.min(s.txBuffer, 0.5 * gain);
      const ok = Math.random() < signalQ(s);
      const pid = ++id.current;
      setPk(a => [...a.slice(-6), { id: pid, ok }]);
      if (ok) playTelemetryClick();
      else playWarningAlert();
      up(q => {
        const f = q.txBuffer > 0 ? size / q.txBuffer : 0;
        return ok
          ? { txBuffer: q.txBuffer - size, txValue: q.txValue * (1 - f), banked: q.banked + q.txValue * f, delivered: q.delivered + size }
          : { lostPackets: q.lostPackets + 1 };
      });
    }, RM ? 200 : 450);
    return () => clearInterval(iv);
  }, [tx]);

  const sg = signalQ(S);
  const repoint = () => {
    if (S.repointCd > 0) return;
    playSuccessChime();
    up(s => ({ repoint: 10, repointCd: 30, eventState: L(s, 'Antenna repoint boosted the link for 10 seconds.') }));
  };

  return (
    <section className="page" aria-label="Communication">
      <PHead
        n={16}
        title="COMMUNICATION"
        sub="Send staged data to Earth. Lost packets are resent, and each resend costs time."
        right={
          <div className="col" style={{ alignItems: 'flex-end' }}>
            <div className="lab">Banked score</div>
            <div className="big-num good" style={{ fontSize: 46 }}><Num v={S.banked} d={0} /></div>
          </div>
        }
      />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className="panel grow rise" style={{ ...ri(1), position: 'relative', overflow: 'hidden' }}>
          <svg viewBox="0 0 700 360" width="100%" height="100%" aria-label="Signal beam">
            <g transform="translate(60,170) scale(.5) translate(-225,-130)"><Craft d={S.design} /></g>
            <circle cx="620" cy="180" r="62" fill="#0c2342" stroke="#2fb4d6" />
            <path d="M590 160 q18 -14 36 4 q10 14 -6 28 q-18 8 -30 -10z" fill="#1d6a8a" opacity="0.7" />
            <line
              x1="160"
              y1="150"
              x2="560"
              y2="180"
              stroke={S.repoint > 0 ? '#5cf2b0' : '#46e0ff'}
              strokeWidth={1 + sg * 5}
              strokeDasharray="12 10"
              className={tx ? 'flow' : ''}
              opacity={tx ? 0.9 : 0.3}
            />
            {tx && <circle cx="360" cy="165" r="48" fill="none" stroke="#46e0ff" className="scanring" opacity="0.5" />}
            {pk.map(k => (
              <g key={k.id} style={{ '--d': '400px', animation: 'packet .9s linear both' } as any} transform="translate(150,146)">
                {k.ok ? (
                  <rect width="14" height="8" fill="#5cf2b0" rx="1" />
                ) : (
                  <g>
                    <rect width="14" height="8" fill="#ff4a5a" rx="1" opacity="0.8" style={{ animation: 'flick .4s linear' }} />
                  </g>
                )}
              </g>
            ))}
          </svg>
          <div className="mono dim" style={{ position: 'absolute', left: 14, bottom: 10, fontSize: 11 }}>
            DELIVERED {S.delivered.toFixed(1)} GB · PACKETS LOST {S.lostPackets}
          </div>
        </div>
        <div className="col gap" style={{ width: 380 }}>
          <div className="panel col gap rise" style={ri(2)}>
            <Meter label="Signal strength" v={sg * 100} unit="%" warn={50} crit={35} inv={true} big={true} />
            <div className="mono dim" style={{ fontSize: 12 }}>
              Comms power {S.power.comms}% · {findP('comms', S.design.comms).name} · packet loss ≈ {Math.round((1 - sg) * 100)}%
            </div>
            <Meter label="Uplink buffer" v={S.txBuffer} max={S.maxDataStorage} d={1} unit=" GB" />
            <div className="row gap8">
              <Btn k="secondary" sm icon="target" disabled={S.repointCd > 0} onClick={repoint}>
                {S.repointCd > 0 ? Math.ceil(S.repointCd) + 's' : 'Repoint antenna'}
              </Btn>
              <Btn sm k={tx ? 'danger' : 'primary'} icon={tx ? 'x' : 'sig'} disabled={S.txBuffer <= 0.01 && !tx} onClick={() => setTx(!tx)}>
                {tx ? 'Pause' : 'Transmit'}
              </Btn>
            </div>
            {S.txBuffer <= 0.01 && !tx && (
              <div className="banner">{S.delivered > 0 ? 'BUFFER EMPTY · ALL STAGED DATA SENT' : 'NOTHING STAGED · RETURN TO DATA MANAGEMENT'}</div>
            )}
          </div>
          {S.dataQueue > 0 && <div className="banner">{S.dataQueue.toFixed(1)} GB STILL ONBOARD, NOT STAGED</div>}
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(3), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <Btn k="secondary" icon="back" onClick={() => { setTx(false); go(14); }}>Back to data</Btn>
        <Btn glow={S.txBuffer <= 0.01} k={S.txBuffer > 0.01 ? 'danger' : 'primary'} icon="warn" onClick={() => { setTx(false); go(17); }}>
          Proceed to crisis window
        </Btn>
      </div>
    </section>
  );
}

/* 17 CRISIS */
function P17() {
  const { S, up, go } = useG();
  const pick = S.crisisPick;
  const tl = thermalLoad(S);
  const done = useRef(false);
  const base = 20 + Math.max(0, tl - 55) * 1.2;
  const comp = S.power.computing;

  useEffect(() => {
    playWarningAlert();
  }, []);

  const OPTS = [
    {
      k: 'Reroute coolant through the computing bus',
      sub: 'Works better with more computing power. Shifts +20 to thermal.',
      calc: () => ({ dmg: (base * 0.5) / clamp(comp / 25, 0.4, 1.2), power: { thermal: 20, science: -20 }, txt: 'Coolant reroute' })
    },
    {
      k: 'Enter safe mode',
      sub: 'Steady, never perfect. Loses 30% of the uplink buffer.',
      calc: () => ({ dmg: base * 0.6 + 5, lose: 0.3, txt: 'Safe mode' })
    },
    {
      k: 'Vent coolant and bypass the loop',
      sub: comp >= 20 ? 'Computing power is high enough to run the bypass.' : 'Computing under 20%. This is likely to go badly.',
      calc: () => ({ dmg: comp >= 20 ? base * 0.2 : base * 1.5, txt: 'Vent and bypass' })
    }
  ];

  const resolve = (i: number | null) => {
    if (done.current) return;
    done.current = true;
    const o = i == null ? { calc: () => ({ dmg: base * 1.6, txt: 'No action taken', power: undefined, lose: undefined }), k: 'No decision' } : OPTS[i];
    const r = o.calc();
    up(s => {
      const dm = r.dmg;
      const h = hurt(s, dm);
      const o2: any = {
        crisisPick: i == null ? -1 : i,
        crisisDmg: Math.round((s.health - h) * 10) / 10,
        health: h,
        eventState: {
          ...L(s, `Crisis: ${r.txt} cost ${Math.round(s.health - h)}% health.`),
          decisionHistory: [
            ...s.eventState.decisionHistory,
            { page: 17, label: 'Coolant loop failure', choice: o.k, effect: `−${Math.round(s.health - h)}% health` }
          ]
        }
      };
      if (r.power) {
        const q = { ...s.power };
        for (const k in r.power) q[k as keyof typeof q] = clamp(q[k as keyof typeof q] + (r.power as any)[k], 5, 70);
        const sum = Object.values(q).reduce((a, b) => a + b, 0);
        if (sum !== 100) q.computing -= sum - 100;
        o2.power = q;
      }
      if (r.lose) {
        o2.txBuffer = s.txBuffer * (1 - r.lose);
        o2.txValue = s.txValue * (1 - r.lose);
      }
      return o2;
    });
  };

  useEffect(() => {
    if (S.crisisLeft <= 0 && S.crisisPick == null) resolve(null);
  }, [S.crisisLeft]);

  const rem = Math.ceil(S.crisisLeft);

  return (
    <section className={'page ' + (pick == null ? '' : '')} aria-label="Crisis">
      <PHead
        n={17}
        title="CRISIS"
        sub="Radiator coolant loop failure. Heat is building and the bus is degrading."
        right={
          pick == null ? (
            <div className="col" style={{ alignItems: 'flex-end' }}>
              <div className="alarm">DECIDE NOW</div>
              <div className="big-num bad" style={{ fontSize: 64 }}>{pad(rem)}</div>
            </div>
          ) : null
        }
      />
      <div className="row gap20 grow" style={{ alignItems: 'stretch' }}>
        <div className="panel crit col gap rise" style={{ ...ri(1), width: 420 }}>
          <div className="alarm">⚠ EMERGENCY PANEL</div>
          <div className={pick == null ? 'flick' : ''}>
            <Meter label="Hull health" v={S.health} unit="%" d={0} warn={50} crit={25} inv={true} big={true} />
          </div>
          <div className={pick == null ? 'flick' : ''}>
            <Meter label="Thermal load" v={tl + (pick == null ? (20 - S.crisisLeft) * 0.8 : 0)} max={120} unit="%" warn={65} crit={80} big={true} />
          </div>
          <Meter label="Bus integrity" v={Math.max(0, S.health - (pick == null ? (20 - S.crisisLeft) * 0.4 : 0))} unit="%" warn={50} crit={25} inv={true} />
          <div className="mono dim" style={{ fontSize: 12 }}>
            Severity base {base.toFixed(0)}% · comp {comp}% · thermal {S.power.thermal}%
          </div>
        </div>
        <div className="col gap8 grow">
          {OPTS.map((o, i) => (
            <button
              type="button"
              key={i}
              className={'card rise ' + (pick === i ? 'sel' : '')}
              style={{ ...ri(2 + i), opacity: pick != null && pick !== i ? 0.3 : 1, minHeight: 84 }}
              disabled={pick != null}
              onClick={() => resolve(i)}
            >
              <div className="row between">
                <h3 style={{ fontSize: 17 }}>{String.fromCharCode(65 + i)} · {o.k}</h3>
                {pick === i && <span className="cy"><Ic n="lock" s={18} /></span>}
              </div>
              <p style={{ fontSize: 14 }}>{o.sub}</p>
            </button>
          ))}
          {pick != null && (
            <div className={'banner rise ' + (S.health > 0 ? '' : 'bad')} style={{ fontSize: 13 }}>
              {pick === -1 ? 'TIME EXPIRED · WORST CASE APPLIED · ' : ''}
              {S.crisisDmg > 0 ? `HULL DAMAGE −${S.crisisDmg}%` : 'NO DAMAGE'} · HEALTH NOW {Math.round(S.health)}%
            </div>
          )}
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(5), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <span className="mono dim" style={{ fontSize: 12 }}>{pick == null ? 'NO DECISION IN TIME MEANS THE WORST OUTCOME' : ''}</span>
        <Btn glow={pick != null} k={pick != null && S.health <= 0 ? 'danger' : 'primary'} icon="chev" disabled={pick == null} onClick={() => go(18)}>
          Assess damage
        </Btn>
      </div>
    </section>
  );
}

/* 18 RECOVERY / FAILURE */
function P18() {
  const { S, up, go, retry } = useG();
  const fail = S.health <= 0 || S.outcome === 'failure';
  const t = useTimers();

  useEffect(() => {
    if (fail) {
      playWarningAlert();
      up({ outcome: 'failure', health: 0 });
      return;
    }
    playSuccessChime();
    t(() => {
      up(s => ({
        health: Math.min(100, s.health + 12),
        outcome: 'success',
        eventState: L(s, 'System reboot restored 12% health.')
      }));
    }, RM ? 0 : 1800);
  }, []);

  return (
    <section className={'page full ' + (fail ? '' : '')} aria-label={fail ? 'Mission failure' : 'System recovery'}>
      {fail ? (
        <div style={{ position: 'absolute', inset: 0, background: '#000', animation: 'blackout 2.4s ease-in both' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,rgba(92,242,176,.18),transparent 60%)', animation: 'boot 2s both' }} />
      )}
      <div className="col" style={{ position: 'absolute', left: 0, right: 0, top: 130, alignItems: 'center', gap: 18, textAlign: 'center' }}>
        <div className="pidx rise">18 / 20</div>
        {fail ? (
          <>
            <div className="stamp bad glitchy" style={{ animationDelay: '.5s' }}>SIGNAL LOST</div>
            <p className="dim rise" style={{ ...ri(2), maxWidth: 560, fontSize: 16 }}>
              Telemetry has stopped. The spacecraft did not survive the crisis. Whatever data was already home still counts.
            </p>
            <div className="mono bad flick">TELEMETRY FAILURE · NO CARRIER</div>
          </>
        ) : (
          <>
            <div className="stamp good">SYSTEMS REBOOT</div>
            <div className="panel col gap rise" style={{ ...ri(2), width: 460 }}>
              <Meter label="Health restoring" v={S.health} unit="%" big={true} warn={50} crit={25} inv={true} />
              <div className="mono good" style={{ fontSize: 12 }}>BUS STABILIZED · GREEN</div>
            </div>
          </>
        )}
      </div>
      <div className="row gap" style={{ position: 'absolute', left: 0, right: 0, bottom: 60, justifyContent: 'center' }}>
        {fail && <Btn k="secondary" icon="refresh" onClick={retry}>Retry from designer</Btn>}
        <Btn glow icon="chev" onClick={() => go(19)}>
          {fail ? 'Final mission report' : 'Mission debrief'}
        </Btn>
      </div>
    </section>
  );
}

/* 19 DEBRIEF */
function P19() {
  const { S, go, retry, restart } = useG();
  const sc = useMemo(() => finalScore(S), []);
  const [shown, setShown] = useState(0);
  const t = useTimers();

  useEffect(() => {
    if (sc.total > bestGet()) bestSet(sc.total);
    const n = S.eventState.causalLog.length;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setShown(i);
      if (i >= n) clearInterval(iv);
    }, RM ? 10 : 260);
    t(() => clearInterval(iv), 30000);
    return () => clearInterval(iv);
  }, []);

  const tlr = S.timeline.filter(x => x.p >= 6);
  const W = 360;
  const H = 150;
  const pt = (k: 'health' | 'fuel') =>
    tlr.map((x, i) => `${10 + (i / Math.max(1, tlr.length - 1)) * (W - 20)},${H - 10 - (clamp(x[k], 0, 100) / 100) * (H - 24)}`).join(' ');

  const col = sc.grade === 'F' ? 'bad' : sc.verdict === 'MISSION SUCCESS' ? 'good' : 'warnc';
  const D = S.eventState.decisionHistory;
  const cp = findP('prop', S.design.prop).name;

  return (
    <section className="page" aria-label="Debrief">
      <PHead n={19} title="MISSION DEBRIEF" right={<div className={'stamp ' + col} style={{ fontSize: 34 }}>{sc.verdict}</div>} />
      <div className="row gap20 grow" style={{ alignItems: 'stretch', minHeight: 0 }}>
        <div className="col gap" style={{ width: 330 }}>
          <div className="panel rise col" style={{ ...ri(1), alignItems: 'center', gap: 4 }}>
            <div className="lab">Final score</div>
            <div className="big-num" style={{ fontSize: 76 }}><Num v={sc.total} start={0} dur={1800} /></div>
            <div className="mono">GRADE <b className={col} style={{ fontSize: 26 }}>{sc.grade}</b></div>
          </div>
          <div className="panel col gap8 rise" style={ri(2)}>
            {[
              ['Science (banked)', sc.sci, S.banked.toFixed(0) + ' pts sent'],
              ['Survival', sc.surv, Math.round(S.health) + '% health'],
              ['Economy', sc.eco, '$' + (S.budget / 1e6).toFixed(1) + 'M · ' + S.fuel.toFixed(0) + '% fuel']
            ].map(([l, v, sub]) => (
              <div key={l as string}>
                <div className="row between">
                  <span className="lab">{l as string}</span>
                  <b className="mono"><Num v={v as number} start={0} dur={1500} /></b>
                </div>
                <div className="dim mono" style={{ fontSize: 11 }}>{sub as string}</div>
              </div>
            ))}
            <div className="mono dim" style={{ fontSize: 11 }}>
              Collected {S.scienceScore.toFixed(0)} · lost packets {S.lostPackets} · unsent {(S.dataQueue + S.txBuffer).toFixed(1)} GB
            </div>
          </div>
          <div className="panel rise" style={ri(3)}>
            <div className="lab">Mission timeline</div>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Health and fuel over the mission">
              <g stroke="#1f3856">
                <line x1="10" x2={W - 10} y1={H - 10} y2={H - 10} />
                <line x1="10" x2={W - 10} y1="12" y2="12" strokeDasharray="3 4" />
              </g>
              <polyline
                points={pt('health')}
                fill="none"
                stroke="#5cf2b0"
                strokeWidth="2.5"
                pathLength={1}
                strokeDasharray="1"
                style={{ strokeDashoffset: 1, animation: 'drawline 1.6s .3s var(--ease) forwards' }}
              />
              <polyline
                points={pt('fuel')}
                fill="none"
                stroke="#46e0ff"
                strokeWidth="2.5"
                pathLength={1}
                strokeDasharray="1"
                style={{ strokeDashoffset: 1, animation: 'drawline 1.6s .6s var(--ease) forwards' }}
              />
              <text x="14" y="10" fill="#5cf2b0" fontSize="9" fontFamily="JetBrains Mono">HEALTH</text>
              <text x="70" y="10" fill="#46e0ff" fontSize="9" fontFamily="JetBrains Mono">FUEL</text>
            </svg>
          </div>
        </div>
        <div className="col gap grow" style={{ minHeight: 0 }}>
          <div className="panel grow col rise" style={{ ...ri(2), minHeight: 0 }}>
            <div className="lab" style={{ marginBottom: 8 }}>Why it happened · causal log</div>
            <div className="scroll grow col gap8" style={{ minHeight: 0 }}>
              {S.eventState.causalLog.slice(0, shown).map((l, i) => (
                <div key={i} className="row gap" style={{ animation: 'rise .4s both', alignItems: 'flex-start' }}>
                  <span className="mono cy" style={{ fontSize: 11, flex: 'none', width: 64 }}>T+{pad(Math.floor(l.met / 3600))}h</span>
                  <span style={{ fontSize: 13.5 }}>{l.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel rise" style={ri(4)}>
            <div className="lab" style={{ marginBottom: 6 }}>Decision tree</div>
            <svg viewBox="0 0 560 100" width="100%" role="img" aria-label="Decision tree">
              {[
                { l: 'Design', s: cp.split(' ')[0] },
                ...D.map(d => ({ l: d.label.split(' ').slice(0, 2).join(' '), s: d.choice.slice(0, 22) })),
                { l: 'Outcome', s: sc.verdict.split(' ')[1] || sc.verdict }
              ].map((n, i, a) => {
                const step = 520 / Math.max(1, a.length - 1);
                const x = 20 + i * step;
                return (
                  <g key={i}>
                    {i > 0 && <line x1={x - step + 34} y1="38" x2={x - 34} y2="38" stroke="#46e0ff" strokeWidth="1.5" strokeDasharray="4 3" className="flow" />}
                    <circle cx={x} cy="38" r="9" fill={i === a.length - 1 ? (S.outcome === 'failure' ? '#ff4a5a' : '#5cf2b0') : '#46e0ff'} style={{ animation: `pop .5s ${i * 0.3}s both` }} />
                    <text x={x} y="64" textAnchor="middle" fill="#e8f2fc" fontSize="10" fontFamily="Chakra Petch" fontWeight="600">{n.l}</text>
                    <text x={x} y="78" textAnchor="middle" fill="#8da6c2" fontSize="8.5" fontFamily="JetBrains Mono">{n.s}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(5), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <div className="row gap">
          <Btn k="secondary" icon="refresh" onClick={retry}>Retry · new design</Btn>
          <Btn k="secondary" icon="back" onClick={restart}>Restart</Btn>
        </div>
        <Btn glow icon="search" onClick={() => go(20)}>Data center</Btn>
      </div>
    </section>
  );
}

/* 20 NASA DATA */
const DB = [
  { t: 'ASTERIA-1', tag: 'GAME OBJECT', b: 'A fictional C-type asteroid invented for this game. Its size, spin and orbit are not measurements of any real body.', x: 'Game model: 412 m diameter, 7.2 h spin, 0.06 albedo.' },
  { t: 'Delta-V budget', tag: 'CONCEPT', b: 'Delta-V is the total change in velocity a spacecraft can make. The rocket equation links it to exhaust speed and the ratio of full to empty mass.', x: 'Game model: ΔV = Isp × 9.81 × ln(wet mass ÷ dry mass).' },
  { t: 'Electric propulsion', tag: 'CONCEPT', b: 'Ion and Hall thrusters accelerate charged propellant. They use little fuel but push gently, so trips take longer.', x: 'Game model: Hall 520 s, Ion 700 s, chemical 310 s, with matching cruise speeds.' },
  { t: 'Thermal control', tag: 'CONCEPT', b: 'Spacecraft must shed the heat their electronics and instruments make. Radiators and heat pipes move heat to space.', x: 'Game model: thermal load rises with science, computing and comms power and falls with thermal power.' },
  { t: 'Deep space communications', tag: 'CONCEPT', b: 'Distant probes talk to large ground antennas. Higher-gain dishes narrow the beam and raise the data rate, but need accurate pointing.', x: 'Game model: signal quality from comms power, antenna gain and repointing.' },
  { t: 'Rendezvous and docking', tag: 'CONCEPT', b: 'Meeting another body means matching its position and velocity. Small thruster pulses correct drift in each axis.', x: 'Game model: lateral and closing speed tolerances of 0.8 and 2.5 m/s.' }
];

function P20() {
  const { go, restart } = useG();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(DB[0].t);
  const [ld, setLd] = useState(RM ? 100 : 0);

  useEffect(() => {
    if (RM) return;
    let v = 0;
    const iv = setInterval(() => {
      v += 8;
      setLd(Math.min(100, v));
      if (v >= 100) clearInterval(iv);
    }, 60);
    return () => clearInterval(iv);
  }, []);

  const items = DB.filter(d => (d.t + d.b + d.tag).toLowerCase().includes(q.toLowerCase()));

  return (
    <section className="page" aria-label="Data center">
      <PHead n={20} title="DATA CENTER" sub="Background on the ideas behind the game." right={<div className="banner" style={{ fontSize: 13 }}>SIMULATED / GAME DATA</div>} />
      <div className="row gap20 grow" style={{ alignItems: 'stretch', minHeight: 0 }}>
        <div className="col gap grow" style={{ minHeight: 0 }}>
          <div style={{ position: 'relative' }} className="rise">
            <span style={{ position: 'absolute', left: 14, top: 14, color: 'var(--mute)' }}><Ic n="search" s={20} /></span>
            <input id="dbq" className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search the database" aria-label="Search the database" />
          </div>
          {ld < 100 && <Meter label="Loading database" v={ld} unit="%" />}
          <div className="col gap8 scroll grow" style={{ minHeight: 0 }}>
            {ld >= 100 &&
              items.map((d, i) => (
                <div key={d.t} className={'acc rise ' + (open === d.t ? 'open' : '')} style={ri(i)}>
                  <button type="button" className="hd" aria-expanded={open === d.t} onClick={() => setOpen(open === d.t ? null : d.t)}>
                    <span>
                      {d.t.toUpperCase()} <span className="pill dim" style={{ marginLeft: 8 }}>{d.tag}</span>
                    </span>
                    <span className="chev"><Ic n="chev" s={18} /></span>
                  </button>
                  <div className="bd">
                    <div>
                      <p>{d.b}</p>
                      <p className="cy mono" style={{ fontSize: 12 }}>{d.x}</p>
                    </div>
                  </div>
                </div>
              ))}
            {ld >= 100 && items.length === 0 && <div className="dim mono">No entries match “{q}”.</div>}
          </div>
        </div>
        <div className="col gap" style={{ width: 380 }}>
          <div className="panel rise" style={ri(2)}>
            <div className="lab">Rocket equation (game model)</div>
            <svg viewBox="0 0 340 170" width="100%" role="img" aria-label="Delta-V versus mass ratio">
              <g stroke="#1f3856">
                <line x1="30" x2="330" y1="150" y2="150" />
                <line x1="30" x2="30" y1="10" y2="150" />
              </g>
              <path
                d={Array.from({ length: 30 }, (_, i) => {
                  const r = 1 + (i / 29) * 2;
                  return `${i ? 'L' : 'M'}${30 + ((r - 1) / 2) * 300},${150 - (Math.log(r) / Math.log(3)) * 130}`;
                }).join(' ')}
                fill="none"
                stroke="#46e0ff"
                strokeWidth="2.5"
                pathLength={1}
                strokeDasharray="1"
                style={{ strokeDashoffset: 1, animation: 'drawline 1.8s var(--ease) forwards' }}
              />
              <text x="180" y="166" fill="#8da6c2" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">WET ÷ DRY MASS</text>
              <text x="34" y="20" fill="#8da6c2" fontSize="9" fontFamily="JetBrains Mono">ΔV</text>
            </svg>
          </div>
          <div className="panel col gap8 rise" style={ri(3)}>
            <div className="lab">Real-world sources</div>
            <div className="dim" style={{ fontSize: 13 }}>Nothing in this game is real NASA data. For actual missions and small-body data, visit:</div>
            <a href="https://ssd.jpl.nasa.gov/" target="_blank" rel="noopener noreferrer" className="cy mono" style={{ fontSize: 12 }}>JPL Solar System Dynamics</a>
            <a href="https://science.nasa.gov/" target="_blank" rel="noopener noreferrer" className="cy mono" style={{ fontSize: 12 }}>NASA Science</a>
          </div>
        </div>
      </div>
      <div className="row between rise" style={{ ...ri(4), flexShrink: 0, marginTop: 'auto', paddingTop: 16, paddingBottom: 24 }}>
        <Btn k="secondary" icon="back" onClick={() => go(19)}>Back to debrief</Btn>
        <Btn glow icon="refresh" onClick={restart}>New mission</Btn>
      </div>
    </section>
  );
}

// ============================================================================
// APP SHELL, HUD, TRANSITIONS
// ============================================================================

const PAGES: Record<number, React.FC> = {
  1: P1, 2: P2, 3: P3, 4: P4, 5: P5, 6: P6, 7: P7, 8: P8, 9: P9, 10: P10,
  11: P11, 12: P12, 13: P13, 14: P14, 15: P15, 16: P16, 17: P17, 18: P18, 19: P19, 20: P20
};

const KIND: Record<string, string> = {
  '1>3': 'zoom',
  '3>4': 'slide',
  '5>6': 'eng',
  '6>7': 'launch',
  '11>12': 'rdv',
  '18>19': 'data'
};

const DUR: Record<string, number> = {
  zoom: 1100,
  slide: 600,
  eng: 900,
  launch: 1000,
  rdv: 1100,
  data: 900,
  fade: 450
};

function enter(s: GameState, p: number): Partial<GameState> {
  const o: Partial<GameState> = {};
  if (p === 11 && !s.apInit) {
    o.apInit = true;
    o.range = 1800;
    o.vel = 90;
  }
  if (p === 17) {
    o.crisisLeft = 20;
    o.crisisPick = null;
  }
  if (p >= 3) {
    o.timeline = [...s.timeline, { p, met: s.met, health: Math.round(s.health), fuel: Math.round(s.fuel), banked: Math.round(s.banked) }];
  }
  return o;
}

const Hud = memo(function Hud({
  S,
  hc,
  setHc,
  audioMuted,
  toggleMute
}: {
  S: GameState;
  hc: boolean;
  setHc: React.Dispatch<React.SetStateAction<boolean>>;
  audioMuted: boolean;
  toggleMute: () => void;
}) {
  const h = S.health;
  const fu = S.fuel;
  const clock = `${pad(Math.floor(S.met / 3600))}:${pad((S.met / 60) % 60)}:${pad(S.met % 60)}`;

  return (
    <header className={'hud ' + (S.page < 3 ? 'dim' : '')}>
      <div>
        <div className="h-mis">MISSION: LAST LIGHT</div>
        <div className="h-ph">
          PHASE: <b>{PH[S.page]}</b>
        </div>
      </div>
      <div className="h-c" aria-label="Mission elapsed time">
        T+ {clock}
      </div>
      <div className="h-r">
        <div className={'stat ' + lvl(h, 50, 25, true)}>
          <small>HEALTH</small>
          <span className="num"><Num v={h} d={0} />%</span>
        </div>
        <div className={'stat ' + lvl(fu, 25, 12, true)}>
          <small>FUEL</small>
          <span className="num"><Num v={fu} d={0} />%</span>
        </div>
        <div className={'stat ' + lvl(S.dataQueue + S.txBuffer, S.maxDataStorage * 0.75, S.maxDataStorage * 0.95)}>
          <small>DATA</small>
          <span className="num"><Num v={S.dataQueue + S.txBuffer} d={1} /> GB</span>
        </div>
        <button
          type="button"
          className="hc-btn"
          aria-pressed={audioMuted}
          aria-label={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
          onClick={toggleMute}
          title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          <Ic n={audioMuted ? 'mute' : 'sound'} s={18} />
        </button>
        <button
          type="button"
          className="hc-btn"
          aria-pressed={hc}
          aria-label="High contrast mode"
          onClick={() => setHc(prev => !prev)}
        >
          HC
        </button>
      </div>
    </header>
  );
});

export function App() {
  const [S, setS] = useState<GameState>(() => initState());
  const ref = useRef(S);
  ref.current = S;
  const [view, setView] = useState<{ cur: number; prev: number | null; kind: string }>({ cur: 1, prev: null, kind: 'fade' });
  const [hc, setHc] = useState(false);
  const [audioMuted, setMuted] = useState(isAudioMuted());
  const [sc, setSc] = useState(1);
  const fit = useRef<HTMLDivElement | null>(null);

  const toggleMute = useCallback(() => {
    const next = toggleAudio();
    setMuted(next);
  }, []);

  useEffect(() => {
    const el = fit.current;
    if (!el) return;
    const f = () => setSc(clamp(Math.min(el.clientWidth / 1280, el.clientHeight / 720), 0.2, 1.5));
    f();
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const up = useCallback((f: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => {
    setS(s => ({ ...s, ...(typeof f === 'function' ? f(s) : f) }));
  }, []);

  const swap = useCallback((p: number, kind: string) => {
    const prev = ref.current.page;
    const dur = RM ? 40 : DUR[kind] || 450;
    setView({ cur: p, prev: prev === p ? null : prev, kind });
    if (kind === 'zoom' || kind === 'rdv') {
      WARP.t = RM ? 1 : 18;
      setTimeout(() => {
        WARP.t = 1;
      }, dur * 0.8);
    }
    setTimeout(() => setView(v => (v.cur === p ? { ...v, prev: null } : v)), dur + 40);
  }, []);

  const go = useCallback(
    (p: number) => {
      const s = ref.current;
      if (p === s.page) return;
      swap(p, KIND[`${s.page}>${p}`] || 'fade');
      setS(q => ({ ...q, ...enter(q, p), page: p, prevPage: q.page }));
    },
    [swap]
  );

  const restart = useCallback(() => {
    swap(1, 'fade');
    setS(initState());
  }, [swap]);

  const retry = useCallback(() => {
    swap(5, 'fade');
    setS({ ...initState(ref.current), page: 5 });
  }, [swap]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) up(s => tick(s, 0.25));
    }, 250);
    return () => clearInterval(id);
  }, [up]);

  useEffect(() => {
    if (S.health <= 0 && S.page >= 7 && S.page < 18 && S.page !== 17) {
      go(18);
    }
  }, [S.health, S.page, go]);

  const ctx = useMemo(() => ({ S, up, go, restart, retry, audioMuted, toggleMute }), [S, up, go, restart, retry, audioMuted, toggleMute]);

  const CurrentPage = PAGES[view.cur] || P1;
  const PreviousPage = view.prev != null ? PAGES[view.prev] : null;

  const crit = S.page === 17 && S.crisisPick == null;

  return (
    <Ctx.Provider value={ctx}>
      <div className="vp">
        <div className="fit" ref={fit}>
          <div className="frame" style={{ width: 1280 * sc, height: 720 * sc }}>
            <div className={'stage ' + (hc ? 'hc' : '')} style={{ transform: `scale(${sc})` }} role="application" aria-label="Mission: Last Light">
              <div className="bg" />
              <Starfield sc={sc} />
              <div className="layer">
                {PreviousPage && (
                  <div key={'pg' + view.prev} className={'pg-wrap out-' + view.kind}>
                    <PreviousPage />
                  </div>
                )}
                <div key={'pg' + view.cur} className={'pg-wrap ' + (view.prev != null ? 'in-' + view.kind : '')}>
                  <CurrentPage />
                </div>
              </div>
              {crit && <div className="crit-vignette" />}
              <Hud S={S} hc={hc} setHc={setHc} audioMuted={audioMuted} toggleMute={toggleMute} />
              {view.prev != null && <div key={'fx' + view.cur} className={'fx ' + view.kind} />}
              <div className="rail" aria-hidden="true">
                {Array.from({ length: 20 }).map((_, i) => (
                  <i key={i} className={i + 1 < S.page ? 'done' : i + 1 === S.page ? 'cur' : ''} />
                ))}
              </div>
              <div className="scan-lines" />
            </div>
          </div>
        </div>
        <div className="rotate-hint">Rotate your device to landscape for the best view.</div>
      </div>
    </Ctx.Provider>
  );
}

export default App;
