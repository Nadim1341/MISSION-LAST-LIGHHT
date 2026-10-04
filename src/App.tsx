import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  playTelemetryClick,
  playSuccessChime,
  playWarningAlert,
  playThrusterPulse,
  isAudioMuted,
  toggleAudio,
} from './utils/audio.ts';

// Subsystems definition: [name, options: [name, mass, power, cost, dv, reliability, desc]]
export interface SubsystemOption {
  name: string;
  mass: number;
  power: number;
  cost: number;
  dv: number;
  rel: number;
  desc: string;
}

export interface SubsystemCategoryItem {
  category: string;
  options: SubsystemOption[];
}

export const C: [string, [string, number, number, number, number, number, string][]][] = [
  ['Structure', [
    ['Al Frame', 0, 0, 0, 0, 0, 'Baseline aluminium bus structure'],
    ['Carbon Truss', -60, 0, 3, 25, 2, 'Lighter, stiffer, higher cost']
  ]],
  ['Propulsion', [
    ['Ion Thruster', 0, 0, 0, 0, 0, 'High specific impulse (Isp 3000s)'],
    ['Hall Thruster XL', 45, 8, 4, 120, 1, 'Greater thrust, higher power demand']
  ]],
  ['Power', [
    ['Solar Array A', 0, 0, 0, 0, 0, 'Standard 1.8 kW dual wings'],
    ['Solar Array B', 42, -6, 3, 0, 2, 'High-efficiency expanded gallium wings']
  ]],
  ['Comms', [
    ['Antenna A', 0, 0, 0, 0, 0, '2.4 Mbps X-band horn antenna'],
    ['Antenna B', 38, 5, 4, 0, 6, '4.8 Mbps high-gain Ka-band dish']
  ]],
  ['Science', [
    ['Camera + Spec', 0, 0, 0, 0, 0, 'High-res multispectral camera'],
    ['+Radar Sounder', 55, 12, 6, -20, 1, 'Deep subsurface penetration radar']
  ]],
  ['Thermal', [
    ['Passive Radiators', 0, 0, 0, 0, 0, 'Multi-layer insulation louvers'],
    ['Active Loop', 30, 4, 2, 0, 5, 'Closed-loop pumped fluid system']
  ]],
  ['Navigation', [
    ['Star Tracker', 0, 0, 0, 0, 0, 'Standard stellar inertial tracker'],
    ['Optical Nav', 12, 2, 2, 0, 3, 'Autonomous optical hazard guidance']
  ]],
  ['Computing', [
    ['Flight CPU', 0, 0, 0, 0, 0, 'Standard COTS redundant flight computer'],
    ['Rad-Hard CPU', 10, 3, 3, 0, 4, 'Radiation-hardened RAD750 processor']
  ]]
];

export interface SubsystemTotals {
  m: number;
  p: number;
  b: number;
  d: number;
  r: number;
}

export const tot = (inst: Record<number, number>): SubsystemTotals => {
  let m = 2430;
  let p = 62;
  let b = 42;
  let d = 1450;
  let r = 82;

  C.forEach(([, o], i) => {
    const x = o[inst[i] || 0];
    m += x[1];
    p += x[2];
    b -= x[3];
    d += x[4];
    r += x[5];
  });

  if (m > 2500) r -= 8;
  if (b < 0) r -= 8;
  if (p > 100) r -= 8;

  return { m, p, b, d, r: Math.max(30, Math.min(99, r)) };
};

export interface GameState {
  page: number;
  inst: Record<number, number>;
  mode: 'COMMANDER' | 'ENGINEER';
  day: number;
  speed: number;
  fuel: number;
  health: number;
  data: number;
  sci: number;
  ret: number;
  pw: { science: number; comms: number; computing: number; thermal: number };
  pri: { s: number; v: number; a: number };
  safe: boolean;
  stormDone: boolean;
  stormChoice: 'safe' | 'sci' | 'power' | null;
  surveys: number;
  tx: number;
  toast: string | null;
  flash: Record<string, number> | null;
  tab: number;
  cmp: number | null;
  mtab: number;
  hit: number;
  how: boolean;
}

export const init: GameState = {
  page: 1,
  inst: {},
  mode: 'COMMANDER',
  day: 1,
  speed: 1,
  fuel: 85,
  health: 100,
  data: 18.4,
  sci: 0,
  ret: 0,
  pw: { science: 30, comms: 25, computing: 25, thermal: 20 },
  pri: { s: 1, v: 1, a: 1 },
  safe: false,
  stormDone: false,
  stormChoice: null,
  surveys: 0,
  tx: 0,
  toast: null,
  flash: null,
  tab: 0,
  cmp: null,
  mtab: 0,
  hit: 0,
  how: false,
};

// UI Primitives
export const Btn: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  p?: boolean | number;
  dis?: boolean;
  why?: string;
  set: (updater: Partial<GameState> | ((prev: GameState) => GameState)) => void;
  className?: string;
}> = ({ children, onClick, p, dis, why, set, className = '' }) => (
  <button
    type="button"
    className={`btn ${p ? 'p ' : ''}${dis ? 'off ' : ''}${className}`}
    onClick={() => {
      if (dis) {
        if (why) set({ toast: why });
      } else {
        playTelemetryClick();
        if (onClick) onClick();
      }
    }}
  >
    {children}
  </button>
);

export const Sheet: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}> = ({ children, onClose, className = '' }) => (
  <div className={`sheet ${className}`}>
    <div
      className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#293342] hover:bg-[#00E5FF] cursor-pointer transition-colors"
      onClick={onClose}
    />
    {children}
  </div>
);

export const Bar: React.FC<{
  v: number;
  c?: string;
  l: string;
}> = ({ v, c = '#00E5FF', l }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs text-[#AAB4C3] mono mb-1">
      <span>{l}</span>
      <span>{Math.round(v)}%</span>
    </div>
    <div className="h-2 rounded bg-[#0D111A]">
      <div
        style={{
          width: `${Math.max(0, Math.min(100, v))}%`,
          background: c,
          transition: 'width .5s ease-out',
        }}
        className="h-2 rounded"
      />
    </div>
  </div>
);

// Spacecraft Schematic with interactive subsystem pins
export const Sat: React.FC<{
  s?: number;
  onPin?: (index: number) => void;
}> = ({ s = 1, onPin }) => (
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
        [15, -18, 7]  // 7: Computing (Flight CPU)
      ].map(([x, y, i]) => (
        <g key={i} className="cursor-pointer" onClick={() => onPin && onPin(i)}>
          <circle cx={x} cy={y} r="8" fill="#00E5FF" opacity="0.25">
            <animate attributeName="r" values="6;12;6" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={y} r="4.5" fill="#00E5FF">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </g>
  </svg>
);

// 3D/Interactive Asteroid Sphere with Dynamic Craters
export const Asteroid: React.FC<{
  rot: number;
  size?: number;
}> = ({ rot, size = 70 }) => (
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

// Context prop type passed to pages
export interface PageCtx {
  g: GameState;
  set: (updater: Partial<GameState> | ((prev: GameState) => GameState)) => void;
  go: (page: number) => void;
  T: SubsystemTotals;
  phase: string;
}

// ----------------------------------------------------
// PAGE 1: LANDING
// ----------------------------------------------------
export const Landing: React.FC<PageCtx> = ({ set, go }) => (
  <div className="flex h-full flex-col items-center justify-between p-6 pt-16 pb-8">
    <div className="fl h-48 w-64 flex items-center justify-center">
      <Sat />
    </div>
    <div className="text-center my-auto">
      <div className="text-[28px] font-bold tracking-tight text-[#F3F6FA]">MISSION: LAST LIGHT</div>
      <div className="mono mt-2 text-xs tracking-widest text-[#00E5FF]">DESIGN. STRESS-TEST. ADAPT. SURVIVE.</div>
      <div className="mt-3 text-xs text-[#AAB4C3] max-w-xs mx-auto">
        A scientifically grounded aerospace mission simulator. Every design decision creates flight consequences.
      </div>
    </div>
    <div className="w-full space-y-3 pb-4">
      <Btn p={true} set={set} onClick={() => go(3)}>START MISSION</Btn>
      <Btn set={set} onClick={() => set({ how: true })}>HOW TO PLAY</Btn>
      <Btn set={set} onClick={() => go(20)}>NASA DATA</Btn>
    </div>
  </div>
);

// ----------------------------------------------------
// PAGE 2: HOW TO PLAY (TUTORIAL SHEET)
// ----------------------------------------------------
export const How: React.FC<PageCtx> = ({ set, go }) => {
  const [i, setI] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);

  const cs = [
    ['Design Spacecraft', 'Pick components across 8 subsystems. Balance mass, power, cost, and reliability.'],
    ['Manage Trade-Offs', 'Mass, power, budget, and delta-v are constantly in tension. No component is free.'],
    ['Stress Test', 'Simulate space hazards (storms, failures, debris) before authorizing launch.'],
    ['Command Flight', 'Execute trajectory burns, observe telemetry, manage power, and stream science data.'],
    ['Complete Mission', 'Safely rendezvous with ASTERIA-1, survey its surface, and downlink vital data.']
  ];

  return (
    <div
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = e.changedTouches[0].clientX - touchStartX;
        if (diff < -40) setI((prev) => Math.min(4, prev + 1));
        if (diff > 40) setI((prev) => Math.max(0, prev - 1));
      }}
      className="select-none"
    >
      <div className="card mb-3 h-64 flex flex-col items-center justify-center text-center p-6">
        <div className="mono text-[#00E5FF] text-xs font-semibold tracking-wider">{i + 1} / 5</div>
        <div className="mt-4 text-2xl font-bold text-white">{cs[i][0]}</div>
        <p className="mt-3 text-sm text-[#AAB4C3] leading-relaxed">{cs[i][1]}</p>
        <div className="mt-auto text-[11px] text-[#6F7B8C] mono">swipe ◂ ▸ or tap indicators</div>
      </div>

      <div className="mb-4 flex justify-center gap-2">
        {cs.map((_, k) => (
          <button
            key={k}
            type="button"
            className="h-2 rounded-full transition-all"
            style={{
              width: k === i ? '24px' : '8px',
              background: k === i ? '#00E5FF' : '#293342'
            }}
            onClick={() => setI(k)}
          />
        ))}
      </div>

      <div className="grid gap-2">
        <Btn p={true} set={set} onClick={() => { set({ how: false }); go(3); }}>
          START TUTORIAL
        </Btn>
        <Btn set={set} onClick={() => set({ how: false })}>
          SKIP
        </Btn>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PAGE 3: MISSION BRIEFING
// ----------------------------------------------------
export const Brief: React.FC<PageCtx> = ({ set, go }) => {
  const [ck, setCk] = useState([true, false, false, false]);
  const [showConstraints, setShowConstraints] = useState(true);

  const ob = [
    'Rendezvous with ASTERIA-1',
    'Collect 60+ science points',
    'Return 15+ GB of data',
    'Keep health above 40%'
  ];

  return (
    <div className="p-4 pb-28 relative min-h-full">
      <div className="mb-3 flex justify-center pt-2">
        <svg viewBox="-60 -60 120 120" width="130" height="130">
          <g className="sp">
            <circle r="48" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
            <ellipse rx="48" ry="16" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.6" />
            <ellipse rx="16" ry="48" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.6" />
          </g>
          <circle cx="0" cy="0" r="8" fill="#FFAB00" />
        </svg>
      </div>

      <div className="mono mb-3 text-center text-xs font-semibold text-[#00E5FF]">
        ASTERIA-1 · Ø 1.2 km · 146 d transit
      </div>

      <div className="card mb-3">
        <div className="mb-2 text-sm font-bold text-white tracking-wide">MISSION OBJECTIVES</div>
        {ob.map((t, i) => (
          <label key={i} className="flex min-h-[44px] items-center gap-3 text-sm cursor-pointer border-b border-[#293342]/40 last:border-none py-1">
            <input
              type="checkbox"
              className="h-5 w-5 rounded accent-[#00E5FF]"
              checked={!!ck[i]}
              onChange={() => setCk(ck.map((v, k) => (k === i ? !v : v)))}
            />
            <span className="text-[#F3F6FA]">
              <b className={i < 2 ? 'text-[#00E5FF]' : 'text-[#AAB4C3]'}>
                {i < 2 ? 'Primary: ' : 'Secondary: '}
              </b>
              {t}
            </span>
          </label>
        ))}
      </div>

      <div className="card mb-4">
        <div
          className="flex min-h-[40px] items-center justify-between font-bold text-sm cursor-pointer"
          onClick={() => setShowConstraints(!showConstraints)}
        >
          <span>FLIGHT CONSTRAINTS</span>
          <span className="mono text-base text-[#00E5FF]">{showConstraints ? '−' : '+'}</span>
        </div>
        {showConstraints && (
          <div className="mono text-xs text-[#AAB4C3] space-y-1.5 pt-2 border-t border-[#293342]/60 mt-1">
            <div className="flex justify-between"><span>Dry Mass Limit:</span><b className="text-white">≤ 2500 kg</b></div>
            <div className="flex justify-between"><span>Mission Budget:</span><b className="text-white">≤ $50M</b></div>
            <div className="flex justify-between"><span>Power Generation:</span><b className="text-white">≤ 100 W Bus Load</b></div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#080B12] via-[#080B12] to-transparent">
        <Btn p={true} set={set} onClick={() => go(4)}>ACCEPT MISSION</Btn>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PAGE 4: SETUP (PRIORITIES)
// ----------------------------------------------------
export const Setup: React.FC<PageCtx> = ({ g, set, go }) => {
  const L = ['LOW', 'MED', 'HIGH'];
  const rows: [string, 's' | 'v' | 'a'][] = [
    ['SCIENCE PRIORITY', 's'],
    ['SURVIVABILITY', 'v'],
    ['AFFORDABILITY', 'a']
  ];

  return (
    <div className="p-4 pb-24 relative min-h-full">
      <div className="mb-4 mt-4 text-xl font-bold text-white tracking-tight">Mission Priorities</div>
      <p className="text-xs text-[#AAB4C3] mb-4">
        Calibrate your flight doctrine. High science demands more payload mass, while survivability requires thermal shielding and radiation tolerance.
      </p>

      {rows.map(([t, k]) => (
        <div key={k} className="card mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">{t}</span>
            <b className="mono text-[#00E5FF] text-xs font-bold">{L[g.pri[k]]}</b>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            value={g.pri[k]}
            onChange={(e) => set({ pri: { ...g.pri, [k]: +e.target.value } })}
            className="my-1"
          />
          <div className="mono flex justify-between text-[10px] text-[#6F7B8C]">
            <span>LOW</span>
            <span>MED</span>
            <span>HIGH</span>
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4">
        <Btn p={true} set={set} onClick={() => go(5)}>CONTINUE TO DESIGN</Btn>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PAGE 5 & 6: DESIGN STUDIO & COMPARE SHEET
// ----------------------------------------------------
export const Design: React.FC<PageCtx> = ({ g, set, go, T }) => {
  const cat = C[g.tab];
  const inst = g.inst[g.tab] || 0;
  const fl = g.flash || {};

  const badge = (k: string, v: string | number, u: string) => {
    const delta = fl[k];
    return (
      <div className="pill mono text-[11px] gap-1">
        <span className="text-[#AAB4C3]">{k}</span>
        <b className={delta && delta > 0 ? 'up bl' : delta && delta < 0 ? 'dn bl' : 'text-white'}>
          {v}{u}
        </b>
        {delta !== undefined && delta !== 0 && (
          <span className={delta > 0 ? 'up' : 'dn'}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>
    );
  };

  const install = (i: number) => {
    const a = cat[1][inst];
    const b = cat[1][i];
    playSuccessChime();
    set({
      inst: { ...g.inst, [g.tab]: i },
      cmp: null,
      page: 5,
      flash: {
        Mass: b[1] - a[1],
        Power: b[2] - a[2],
        '$M': b[3] - a[3],
        'Δv': b[4] - a[4]
      }
    });
  };

  const cmpOpen = g.page === 6;

  return (
    <div className="flex h-full flex-col relative select-none">
      {/* Top telemetry and spacecraft schematic */}
      <div className="flex-none p-3 pb-0" style={{ height: '38%' }}>
        <div className="flex flex-wrap gap-1.5 justify-between mb-2">
          {badge('Mass', T.m, 'kg')}
          {badge('Power', T.p, 'W')}
          {badge('$M', (42 - T.b).toFixed(0), 'M')}
          {badge('Δv', T.d, 'm/s')}
        </div>
        <div className="h-[76%] flex items-center justify-center">
          <Sat onPin={(i) => set({ tab: i })} />
        </div>
      </div>

      {/* Subsystem category horizontal pills */}
      <div className="flex flex-none gap-2 overflow-x-auto px-3 pb-2 no-scrollbar">
        {C.map(([n], i) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              playTelemetryClick();
              set({ tab: i });
            }}
            className="pill min-h-[38px] whitespace-nowrap text-xs font-semibold cursor-pointer transition-colors"
            style={{
              borderColor: i === g.tab ? '#00E5FF' : '#293342',
              color: i === g.tab ? '#00E5FF' : '#AAB4C3',
              background: i === g.tab ? '#00E5FF1a' : '#0D111Acc'
            }}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Component Options List */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-24 no-scrollbar">
        {cat[1].map((c, i) => (
          <div
            key={i}
            className="card transition-all"
            style={{ borderColor: i === inst ? '#00E5FF' : '#293342' }}
          >
            <div className="flex justify-between items-center">
              <b className="text-white text-sm">{c[0]}</b>
              <span className="mono text-xs text-[#AAB4C3]">
                {c[1]}kg · {c[2]}W · ${c[3]}M
              </span>
            </div>
            <div className="my-1.5 text-xs text-[#6F7B8C]">{c[6]}</div>
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <Btn
                  p={i !== inst}
                  set={set}
                  onClick={() => install(i)}
                  className="text-xs min-h-[40px]"
                >
                  {i === inst ? 'INSTALLED' : 'INSTALL'}
                </Btn>
              </div>
              <div className="flex-1">
                <Btn
                  set={set}
                  onClick={() => set({ page: 6, cmp: i })}
                  className="text-xs min-h-[40px]"
                >
                  COMPARE
                </Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sticky Action */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <Btn p={true} set={set} onClick={() => go(7)}>MISSION READINESS</Btn>
      </div>

      {/* Compare Modal Sheet (Page 6) */}
      {cmpOpen && (
        <Sheet onClose={() => go(5)}>
          <div className="mb-3 font-bold text-base text-white">COMPARE · {cat[0]}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[inst, g.cmp == null ? 1 : g.cmp].map((ix, k) => {
              const c = cat[1][ix];
              const b = cat[1][inst];
              return (
                <div key={k} className="card p-2.5">
                  <b className="text-[#00E5FF] text-xs block mb-2">{c[0]}</b>
                  {[
                    ['Mass', c[1], b[1], 1, 'kg'],
                    ['Power', c[2], b[2], 1, 'W'],
                    ['Cost', c[3], b[3], 1, '$M'],
                    ['Δv', c[4], b[4], -1, 'm/s'],
                    ['Reliab.', c[5], b[5], -1, '%']
                  ].map(([n, v, w, s, u]) => {
                    const diff = (+v - +w) * +s;
                    return (
                      <div key={n} className="mono text-[11px] mb-1 flex justify-between items-center">
                        <span className="text-[#AAB4C3]">{n}:</span>
                        <span className="text-white font-medium">
                          {v}{u}
                          {k !== 0 && diff !== 0 && (
                            <span
                              className={`ml-1 rounded px-1 text-[9px] font-bold ${
                                diff < 0 ? 'bg-[#00E67633] dn' : 'bg-[#FF174433] up'
                              }`}
                            >
                              {diff < 0 ? 'ADV' : 'PEN'}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-2">
            <Btn p={true} set={set} onClick={() => install(g.cmp == null ? 1 : g.cmp)}>
              INSTALL THIS
            </Btn>
            <Btn set={set} onClick={() => go(5)}>
              CANCEL
            </Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
};

// ----------------------------------------------------
// PAGE 7: READINESS
// ----------------------------------------------------
export const Ready: React.FC<PageCtx> = ({ g, set, go, T }) => {
  const eng = g.mode === 'ENGINEER';
  const r = T.r;
  const risk =
    (g.inst[3] || 0) === 0
      ? 'COMMUNICATION CAPACITY'
      : T.p > 90
      ? 'POWER MARGIN'
      : 'THERMAL RESILIENCE';
  const col = r >= 80 ? '#00E676' : r >= 60 ? '#FFAB00' : '#FF1744';

  return (
    <div className="p-4 pb-24 relative min-h-full">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-white">Flight Readiness</div>
        <button
          type="button"
          className="pill min-h-[38px] text-xs font-semibold cursor-pointer border-[#00E5FF] text-[#00E5FF]"
          onClick={() => {
            playTelemetryClick();
            set({ mode: eng ? 'COMMANDER' : 'ENGINEER' });
          }}
        >
          MODE: {g.mode}
        </button>
      </div>

      {/* Circular Gauge */}
      <div className="my-4 flex justify-center">
        <svg viewBox="0 0 120 120" width="160" height="160">
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
            fontSize="26"
            className="mono font-bold"
          >
            {r}%
          </text>
        </svg>
      </div>

      <div className="card mb-3 bl border-[#FFAB00] text-[#FFAB00] text-xs font-bold text-center">
        ⚠ PRIMARY RISK: {risk}
      </div>

      <Bar l="Power System Margin" v={100 - T.p + 20} c="#00E676" />
      <Bar l="Communications Link" v={60 + (g.inst[3] ? 35 : 0)} />
      <Bar l="Thermal Shielding" v={55 + (g.inst[5] ? 35 : 0)} />
      <Bar l="Propulsion (Δv Available)" v={T.d / 20} />
      <Bar l="Hardware Reliability" v={r} />
      <Bar l="Budget Reserve" v={T.b * 2} c="#FFAB00" />

      {eng && (
        <div className="card mono text-xs text-[#AAB4C3] mt-3 space-y-1">
          <div>Δv: {T.d} m/s · Isp 3000 s</div>
          <div>Mass: {T.m} kg · Power {T.p}/100 W</div>
          <div>Link: {g.inst[3] ? '4.8' : '2.4'} Mbps @ 1.2 AU, margin {g.inst[3] ? '+6.1' : '+1.8'} dB</div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4">
        <Btn p={true} set={set} onClick={() => go(8)}>CONTINUE TO STRESS TEST</Btn>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PAGE 8: STRESS TEST
// ----------------------------------------------------
const SC = [
  ['Solar Storm', 30],
  ['Comms Failure', 15],
  ['Thermal Stress', 22],
  ['Micrometeoroid', 26],
  ['Radiation Belt', 20],
  ['Power Dip', 18],
  ['Dust Cloud', 12],
  ['Eclipse Soak', 10],
] as const;

export const Stress: React.FC<PageCtx> = ({ g, set, go, T }) => {
  const [sel, setSel] = useState(0);
  const [st, setSt] = useState<{ beam?: number; drop?: number; res?: number }>({});

  const run = () => {
    playWarningAlert();
    setSt({ beam: 1 });
    setTimeout(() => {
      setSt((s) => ({ ...s, drop: 1 }));
    }, 400);
    setTimeout(() => {
      setSt((s) => ({ ...s, res: 1 }));
    }, 1400);
  };

  const s =
    T.r -
    SC[sel][1] +
    ((g.inst[5] || 0) && sel === 2 ? 10 : 0) +
    ((g.inst[7] || 0) && sel === 0 ? 8 : 0);

  const res =
    s >= 70
      ? 'SURVIVES NOMINAL'
      : s >= 48
      ? 'SURVIVES WITH DEGRADATION'
      : 'CRITICAL FAILURE';
  const dmg = Math.max(4, Math.round((92 - s) / 2));

  return (
    <div className="p-4 pb-24 relative min-h-full">
      <div className="relative mb-3 h-40 overflow-hidden rounded-xl bg-[#0D111A] flex items-center justify-center">
        <Sat s={0.8} />
        {st.beam && (
          <div
            className="absolute inset-0 bl pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, #FF174488, transparent)'
            }}
          />
        )}
      </div>

      <Bar l="POWER SYSTEM" v={st.drop ? 100 - dmg : 100} c="#FFAB00" />
      <Bar l="SPACECRAFT HEALTH" v={st.drop ? 100 - dmg * 1.3 : 100} c="#00E676" />

      <div className="my-3 grid grid-cols-2 gap-2">
        {SC.map(([n], i) => (
          <button
            key={n}
            type="button"
            className="card min-h-[52px] text-xs font-semibold cursor-pointer text-left transition-colors"
            style={{
              borderColor: i === sel ? '#00E5FF' : '#293342',
              color: i === sel ? '#00E5FF' : '#F3F6FA'
            }}
            onClick={() => {
              playTelemetryClick();
              setSel(i);
              setSt({});
            }}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <Btn p={true} set={set} onClick={run}>RUN TEST</Btn>
      </div>

      {st.res && (
        <Sheet onClose={() => setSt({})}>
          <div className={`mono mb-1 text-xs font-bold ${s >= 48 ? 'text-[#FFAB00]' : 'up'}`}>
            TEST RESULT
          </div>
          <div className="mb-1 text-lg font-bold text-white">{res}</div>
          <div className="mb-3 text-sm text-[#AAB4C3]">
            {SC[sel][0]}: est. {dmg}% damage. Hazard score {Math.round(s)}.
          </div>
          <div className="grid gap-2">
            <Btn set={set} onClick={() => go(5)}>REDESIGN</Btn>
            <Btn set={set} onClick={() => { setSt({}); setTimeout(run, 50); }}>RUN AGAIN</Btn>
            <Btn p={true} set={set} onClick={() => go(9)}>LAUNCH ANYWAY</Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
};

// ----------------------------------------------------
// PAGE 9: LAUNCH COUNTDOWN
// ----------------------------------------------------
export const Launch: React.FC<PageCtx> = ({ g, set, go, T }) => {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    if (n === null) return;
    if (n < 0) {
      playSuccessChime();
      set({
        toast: 'MISSION CONTROL: ASTERIA-1 is now in space.',
        fuel: 85,
        health: 100
      });
      const t = setTimeout(() => {
        set({ page: 10, day: 1 });
      }, 1200);
      return () => clearTimeout(t);
    }
    if (n === 0) {
      playThrusterPulse();
    } else {
      playTelemetryClick();
    }
    const t = setTimeout(() => setN(n - 1), n === 0 ? 1500 : 800);
    return () => clearTimeout(t);
  }, [n, set]);

  if (n !== null) {
    return (
      <div className="flex h-full items-center justify-center bg-black relative overflow-hidden select-none">
        {n > 0 ? (
          <div key={n} className="pg mono text-[130px] font-bold text-[#00E5FF]">
            {n}
          </div>
        ) : n === 0 ? (
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
            IN ORBIT
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between p-5 pt-16 pb-8 select-none">
      <div className="text-center text-2xl font-bold text-white tracking-wide">
        LAUNCH AUTHORIZATION
      </div>
      <div className="space-y-3">
        <div className="card flex justify-between items-center">
          <span className="text-sm">Readiness Score</span>
          <b className="mono text-[#00E5FF] text-base">{T.r}%</b>
        </div>
        <div className="card flex justify-between items-center">
          <span className="text-sm">Δv Margin Reserve</span>
          <b className="mono text-[#00E676] text-base">+{T.d - 1199} m/s</b>
        </div>
        <div className="card flex justify-between items-center">
          <span className="text-sm">Primary Monitored Risk</span>
          <b className="text-[#FFAB00] text-sm">
            {(g.inst[3] || 0) ? 'Solar Storm' : 'Comms Capacity'}
          </b>
        </div>
      </div>
      <Btn p={true} set={set} onClick={() => setN(10)}>
        CONFIRM LAUNCH
      </Btn>
    </div>
  );
};

// ----------------------------------------------------
// PAGE 10: FLIGHT DASHBOARD & TRAJECTORY MAP
// ----------------------------------------------------
export const Dash: React.FC<PageCtx> = ({ g, set, go, phase }) => {
  const sh = g.page > 10 && g.page <= 15 ? g.page : null;
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [z, setZ] = useState(1);
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const [sw, setSw] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [txv, setTxv] = useState<number | null>(null);

  const t = g.day / 146;
  const bz = (a: number, b: number, c: number, progress: number) =>
    (1 - progress) * (1 - progress) * a + 2 * (1 - progress) * progress * b + progress * progress * c;

  const cp = g.mtab > 0 && g.mtab < 3 ? [260, 120] : [200, 420];
  const sx = bz(80, cp[0] * 0.8, 310, t);
  const sy = bz(300, cp[1], 200, t);

  const eg = g.pw.science >= 70;
  const close = () => set({ page: 10 });
  const win = g.day % 30 < 20;

  const doTx = () => {
    if (!win) return set({ toast: 'No communication window available' });
    if (g.data <= 0.1) return set({ toast: 'Transmission queue empty' });

    playTelemetryClick();
    const amt = g.data;
    let v = amt;
    setTxv(amt);
    const iv = setInterval(() => {
      v -= amt / 12;
      if (v <= 0) {
        clearInterval(iv);
        playSuccessChime();
        set((o) => ({
          data: 0,
          ret: o.ret + amt,
          tx: o.tx + 1,
          toast: `+${amt.toFixed(1)} GB Transmitted`
        }));
        setTxv(null);
      } else {
        setTxv(v);
      }
    }, 120);
  };

  const scan = (n: string) => {
    if (g.safe) return set({ toast: 'Safe mode active — instruments offline' });
    if (g.data + 2.8 > 32) return set({ toast: 'Data storage full — transmit first' });

    playTelemetryClick();
    setSw(true);
    setTimeout(() => {
      setSw(false);
      playSuccessChime();
      set((o) => ({
        sci: o.sci + 8,
        data: o.data + 2.8,
        toast: `+8 Science Points / +2.8 GB Data (${n})`
      }));
    }, 1600);
  };

  const exec = () => {
    if (g.fuel < 8) return set({ toast: 'Insufficient propellant' });
    playThrusterPulse();
    setPulse(true);
    setTimeout(() => setPulse(false), 700);
    set({ fuel: g.fuel - 8, toast: 'Burn complete: −84 m/s, −120 kg' });
  };

  const storm = (c: 'safe' | 'sci' | 'power') => {
    const sh2 = (g.inst[5] || 0) + (g.inst[7] || 0);
    if (c === 'safe') {
      playTelemetryClick();
      set({
        safe: true,
        stormDone: true,
        stormChoice: 'safe',
        page: 10,
        toast: 'Safe mode: computer protected, power reduced'
      });
    } else if (c === 'sci') {
      playWarningAlert();
      set({
        stormDone: true,
        stormChoice: 'sci',
        sci: g.sci + 12,
        data: Math.min(32, g.data + 4),
        health: g.health - (sh2 ? 18 : 34),
        page: 10,
        toast: 'Extra data gathered — damage taken'
      });
    } else {
      playTelemetryClick();
      set({
        stormDone: true,
        stormChoice: 'power',
        pw: { science: 10, comms: 20, computing: 25, thermal: 45 },
        health: g.health - (sh2 ? 4 : 12),
        page: 10,
        toast: 'Power redistributed to thermal'
      });
    }
  };

  const dock: [string, string, () => void][] = [
    ['⌖', 'MANEUVER', () => set({ page: 11 })],
    ['◉', 'OBSERVE', () => set({ page: 14 })],
    ['⚡', 'POWER', () => set({ page: 12 })],
    ['📡', 'COMMS', () => set({ page: 13 })],
    ['⚗', 'SCIENCE', () => set({ page: 14 })],
    ['⛨', 'SAFE MODE', () => set({ safe: !g.safe, toast: g.safe ? 'Safe mode off' : 'Safe mode on' })]
  ];

  return (
    <div className="relative h-full overflow-hidden select-none">
      {/* Top HUD status bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-1 p-3 pt-3 bg-gradient-to-b from-[#080B12] via-[#080B12]/80 to-transparent">
        <div className="pill mono font-bold text-[10px] text-[#00E5FF]">{phase}</div>
        <div className="pill mono text-[10px]">Day {g.day}/146</div>
        <div className={`pill mono text-[10px] ${eg ? 'bl text-[#FFAB00]' : 'text-[#00E676]'}`}>
          THERM {eg ? 'WARN' : 'OK'}
        </div>
        <div className="flex-1" />
        {[1, 5, 20, 100].map((s) => (
          <button
            key={s}
            type="button"
            className="pill min-h-[30px] px-2 text-[10px] font-mono cursor-pointer"
            style={{
              color: g.speed === s ? '#00E5FF' : '#AAB4C3',
              borderColor: g.speed === s ? '#00E5FF' : '#293342',
              background: g.speed === s ? '#00E5FF22' : '#0D111Acc'
            }}
            onClick={() => {
              playTelemetryClick();
              set({ speed: s });
            }}
          >
            {s}X
          </button>
        ))}
      </div>

      {/* Interactive Orbit Map Canvas */}
      <svg
        viewBox="0 0 393 560"
        className="absolute inset-0 h-full w-full touch-none"
        style={{ marginTop: 30 }}
        onPointerDown={(e) => setDrag([e.clientX, e.clientY])}
        onPointerMove={(e) => {
          if (drag) {
            setPan([pan[0] + e.clientX - drag[0], pan[1] + e.clientY - drag[1]]);
            setDrag([e.clientX, e.clientY]);
          }
        }}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
      >
        <g transform={`translate(${pan[0]} ${pan[1]}) scale(${z})`}>
          {/* Deep space starfield */}
          {Array.from({ length: 32 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 97) % 393}
              cy={(i * 61) % 560}
              r={i % 3 ? 0.9 : 1.5}
              fill="#fff"
              opacity="0.45"
            />
          ))}

          {/* Trajectory Arc */}
          <path
            d={`M80 300 Q ${cp[0] * 0.8} ${cp[1]} 310 200`}
            fill="none"
            stroke="#00E676"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.75"
          />

          {/* Earth Body */}
          <circle cx="80" cy="300" r="34" fill="#12467a" stroke="#00E5FF" strokeWidth="1.5" />
          <circle cx="80" cy="300" r="38" fill="none" stroke="#00E5FF" strokeWidth="0.5" opacity="0.4" />
          <text x="80" y="348" fill="#AAB4C3" fontSize="10" textAnchor="middle" className="mono">
            EARTH
          </text>

          {/* Target ASTERIA-1 */}
          <g className="cursor-pointer" onClick={() => go(16)}>
            <circle cx="310" cy="200" r="16" fill="#3a3f4b" stroke="#AAB4C3" strokeWidth="1.5" />
            <circle cx="310" cy="200" r="22" fill="none" stroke="#00E5FF" strokeWidth="1" strokeDasharray="3 3">
              <animate attributeName="r" values="20;26;20" dur="3s" repeatCount="indefinite" />
            </circle>
            <text x="310" y="234" fill="#AAB4C3" fontSize="10" textAnchor="middle" className="mono">
              ASTERIA-1
            </text>
          </g>

          {/* Spacecraft marker */}
          <g transform={`translate(${sx} ${sy})`}>
            <circle
              r={pulse ? 20 : 8}
              fill={pulse ? '#FFAB0055' : '#00E5FF'}
              style={{ transition: 'r .3s ease-out' }}
            />
            <rect x="-4" y="-4" width="8" height="8" fill="#F3F6FA" rx="1" />
            {sw && (
              <path
                d="M0 0 L120 -45 A128 128 0 0 1 120 45 Z"
                fill="#00E5FF"
                opacity="0.25"
                style={{ transformOrigin: '0 0', animation: 'sw 1.6s ease-in-out' }}
              />
            )}
          </g>
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute right-3 top-20 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          className="pill min-h-[40px] min-w-[40px] cursor-pointer text-base font-bold text-white"
          onClick={() => setZ(Math.min(2.5, z + 0.25))}
        >
          ＋
        </button>
        <button
          type="button"
          className="pill min-h-[40px] min-w-[40px] cursor-pointer text-base font-bold text-white"
          onClick={() => setZ(Math.max(0.6, z - 0.25))}
        >
          －
        </button>
      </div>

      {/* Left HUD Telemetry */}
      <div className="absolute left-3 top-20 z-10 flex flex-col gap-1.5">
        {[
          ['Power', '1.82 kW'],
          ['Fuel', `${Math.round(g.fuel * 15.1)} kg`],
          ['Health', `${Math.round(g.health)}%`],
          ['Data', `${(txv ?? g.data).toFixed(1)} GB`],
        ].map(([k, v]) => (
          <div key={k} className="pill mono text-[10px]">
            <span className="text-[#AAB4C3] mr-1">{k}:</span>
            <b className="text-[#00E5FF]">{v}</b>
          </div>
        ))}
      </div>

      {/* Bottom 6-icon Docking Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 grid grid-cols-6 gap-1 border-t border-[#293342] bg-[#0D111Aee] backdrop-blur-md p-2 pb-5">
        {dock.map(([i, l, f]) => (
          <button
            key={l}
            type="button"
            onClick={() => {
              playTelemetryClick();
              f();
            }}
            className="min-h-[52px] rounded-lg text-center active:scale-95 transition-transform cursor-pointer"
            style={{
              color: l === 'SAFE MODE' && g.safe ? '#FFAB00' : '#F3F6FA'
            }}
          >
            <div className="text-lg leading-tight">{i}</div>
            <div className="text-[7.5px] tracking-tight font-semibold mt-0.5">{l}</div>
          </button>
        ))}
      </div>

      {/* SHEET 11: MANEUVER */}
      {sh === 11 && (
        <Sheet onClose={close}>
          <div className="mb-2 flex gap-1">
            {['Course Correction', 'Approach Burn', 'Rendezvous Burn'].map((n, i) => (
              <button
                key={n}
                type="button"
                className="pill min-h-[38px] flex-1 text-[9.5px] cursor-pointer"
                style={{
                  color: g.mtab === i ? '#00E5FF' : '#AAB4C3',
                  borderColor: g.mtab === i ? '#00E5FF' : '#293342',
                  background: g.mtab === i ? '#00E5FF22' : '#0D111Acc'
                }}
                onClick={() => set({ mtab: i })}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="card mono mb-3 text-xs space-y-1">
            <div>
              Miss distance: {[42000, 18000, 6000][g.mtab].toLocaleString()} km ➔{' '}
              <b className="dn">{[2100, 900, 300][g.mtab].toLocaleString()} km</b>
            </div>
            <div>Δv cost: <b className="up">−84 m/s</b></div>
            <div>Propellant: <b className="up">−120 kg</b></div>
          </div>
          <Btn p={true} set={set} onClick={exec}>EXECUTE MANEUVER</Btn>
        </Sheet>
      )}

      {/* SHEET 12: POWER MANAGEMENT */}
      {sh === 12 && (
        <Sheet onClose={close}>
          <div className="mb-2 font-bold text-white text-sm">POWER MANAGEMENT</div>
          {(['science', 'comms', 'computing', 'thermal'] as const).map((k) => (
            <div key={k} className="mb-2">
              <div className="mono flex justify-between text-xs text-[#AAB4C3] mb-0.5">
                <span>{k.toUpperCase()}</span>
                <span className="text-[#00E5FF] font-bold">{g.pw[k]}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={g.pw[k]}
                onChange={(e) => set({ pw: { ...g.pw, [k]: +e.target.value } })}
              />
            </div>
          ))}
          <div className="mono mb-2 text-xs text-[#AAB4C3]">
            Total {Object.values(g.pw).reduce((a, b) => a + b, 0)}% (normalized on apply)
          </div>
          <Btn
            p={true}
            set={set}
            onClick={() => {
              const s = Object.values(g.pw).reduce((a, b) => a + b, 0) || 1;
              const n: any = {};
              for (const k in g.pw) {
                n[k] = Math.round(((g.pw as any)[k] * 100) / s);
              }
              set({ pw: n, page: 10, toast: 'Power configuration applied' });
            }}
          >
            APPLY POWER CONFIGURATION
          </Btn>
        </Sheet>
      )}

      {/* SHEET 13: COMMUNICATIONS */}
      {sh === 13 && (
        <Sheet onClose={close}>
          <div className="mb-2 font-bold text-white text-sm">COMMUNICATIONS DOWNLINK</div>
          <svg viewBox="0 0 340 50" className="w-full my-1">
            <circle cx="15" cy="25" r="8" fill="#00E5FF" />
            <circle cx="325" cy="25" r="8" fill="#00E676" />
            <path
              d="M25 25 Q 60 5 95 25 T 165 25 T 235 25 T 305 25"
              fill="none"
              stroke="#00E5FF"
              strokeDasharray="4 3"
            >
              <animate attributeName="stroke-dashoffset" values="14;0" dur="1s" repeatCount="indefinite" />
            </path>
            {txv != null &&
              [0, 1, 2, 3, 4].map((i) => (
                <circle key={i} r="4" cy="25" fill="#00E5FF">
                  <animate
                    attributeName="cx"
                    values="20;320"
                    dur="1s"
                    begin={`${i * 0.2}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
          </svg>
          <div className="mono my-2 grid grid-cols-2 gap-2 text-xs">
            <div className="card py-1.5 px-2">Signal: <b className="text-[#00E5FF]">{win ? 'STRONG' : 'NONE'}</b></div>
            <div className="card py-1.5 px-2">Rate: <b className="text-[#00E5FF]">{g.inst[3] ? '4.8' : '2.4'} Mbps</b></div>
            <div className="card py-1.5 px-2">Latency: <b className="text-[#00E5FF]">{((g.day / 146) * 8 + 4).toFixed(1)} min</b></div>
            <div className="card py-1.5 px-2">Window: <b className={win ? 'text-[#00E676]' : 'text-[#FF1744]'}>{win ? 'OPEN' : 'CLOSED'}</b></div>
          </div>
          <Bar
            l={`Queue ${(txv ?? g.data).toFixed(1)} GB / 32 GB`}
            v={((txv ?? g.data) / 32) * 100}
          />
          <Btn
            p={true}
            dis={!win}
            why="No communication window available"
            set={set}
            onClick={doTx}
          >
            TRANSMIT NOW
          </Btn>
        </Sheet>
      )}

      {/* SHEET 14: SCIENCE OPERATIONS */}
      {sh === 14 && (
        <Sheet onClose={close}>
          <div className="mb-2 font-bold text-white text-sm">SCIENCE OPERATIONS</div>
          {[
            ['Camera', '4W · 20s'],
            ['Spectrometer', '9W · 45s'],
            ['Radar', '14W · 60s'],
            ['Thermal Sensor', '6W · 30s'],
          ].map(([n, c]) => (
            <div key={n} className="card mb-2 flex items-center justify-between gap-2 p-2">
              <div>
                <b className="text-white text-xs">{n}</b>
                <div className="mono text-[10px] text-[#6F7B8C]">{c}</div>
              </div>
              <div className="w-32">
                <Btn p={true} set={set} onClick={() => scan(n)} className="min-h-[36px] text-xs">
                  EXECUTE SCAN
                </Btn>
              </div>
            </div>
          ))}
          <Btn
            set={set}
            dis={g.day < 110}
            why="Asteroid not yet in range (Day 110+ required)"
            onClick={() => go(16)}
            className="mt-1"
          >
            SURFACE SURVEY
          </Btn>
        </Sheet>
      )}

      {/* SHEET 15: HIGH ALERT SOLAR STORM */}
      {sh === 15 && (
        <div className="absolute inset-0 z-30 flex items-end bg-black/70">
          <div
            className="sheet bl border-[#FF1744] border-2"
            style={{ animation: 'sheetUp .3s ease-out' }}
          >
            <div className="mono mb-1 text-center font-bold up text-sm">
              HIGH ALERT: SOLAR STORM DETECTED
            </div>
            <p className="mb-3 text-center text-xs text-[#AAB4C3]">
              Dangerous proton flux spike incoming. Take immediate action to protect the spacecraft bus.
            </p>
            <div className="grid gap-2">
              <Btn set={set} onClick={() => storm('safe')}>
                SAFE MODE (PROTECT CPU)
              </Btn>
              <Btn set={set} onClick={() => storm('sci')}>
                CONTINUE SCIENCE (TAKE DAMAGE)
              </Btn>
              <Btn set={set} onClick={() => storm('power')}>
                REDISTRIBUTE POWER (PROTECT THERMAL)
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// PAGE 16: ROCK (ASTEROID SURFACE SURVEY)
// ----------------------------------------------------
export const Rock: React.FC<PageCtx> = ({ g, set, go }) => {
  const [rot, setRot] = useState(0);
  const [dragX, setDragX] = useState<number | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const pins = ['Region A', 'Region B', 'Region C'];

  return (
    <div className="flex h-full flex-col items-center p-4 pt-10 pb-8 select-none">
      <div className="mono mb-2 text-[#00E5FF] text-sm font-bold tracking-wider">
        ASTERIA-1 · SURFACE MAPPING
      </div>
      <div
        className="touch-none cursor-grab flex items-center justify-center my-auto"
        onPointerDown={(e) => setDragX(e.clientX)}
        onPointerMove={(e) => {
          if (dragX != null) {
            setRot((r) => r + (e.clientX - dragX) / 60);
            setDragX(e.clientX);
          }
        }}
        onPointerUp={() => setDragX(null)}
        onPointerLeave={() => setDragX(null)}
        style={{ position: 'relative', width: 280, height: 280 }}
      >
        <Asteroid rot={rot} size={140} />
        {pins.map((p, i) => {
          const a = i * 2.1 + rot;
          if (Math.cos(a) <= 0) return null;
          return (
            <button
              key={p}
              type="button"
              className="pill absolute min-h-[40px] min-w-[40px] text-xs font-bold border-[#00E5FF] text-[#00E5FF] cursor-pointer shadow-lg active:scale-95"
              style={{
                left: 140 + Math.sin(a) * 95 - 20,
                top: 120 + i * 28 - 20,
                background: '#0D111Aee'
              }}
              onClick={() => {
                playTelemetryClick();
                setPin(p);
              }}
            >
              {p.slice(-1)}
            </button>
          );
        })}
      </div>
      <div className="mono text-xs text-[#6F7B8C] mb-4">drag to rotate · tap a pin to inspect</div>

      <div className="mt-auto w-full">
        <Btn set={set} onClick={() => go(10)}>BACK TO FLIGHT</Btn>
      </div>

      {pin && (
        <Sheet onClose={() => setPin(null)}>
          <div className="mb-1 font-bold text-white text-sm">{pin}</div>
          <p className="mb-3 text-xs text-[#AAB4C3]">
            High-reflectance regolith with strong olivine signatures. Est. +10 science yield.
          </p>
          <Btn
            p={true}
            set={set}
            dis={g.data + 1.2 > 32}
            why="Data storage full — transmit first"
            onClick={() => {
              playSuccessChime();
              set({
                sci: g.sci + 10,
                data: g.data + 1.2,
                surveys: g.surveys + 1,
                toast: '+10 Science / +1.2 GB Data'
              });
              setPin(null);
            }}
          >
            SCAN TARGET
          </Btn>
        </Sheet>
      )}
    </div>
  );
};

// ----------------------------------------------------
// PAGE 17: RESULT
// ----------------------------------------------------
export const Result: React.FC<PageCtx> = ({ g, set, go, T }) => {
  const win = g.health >= 40 && g.sci >= 30;

  return (
    <div className="p-4 pb-36 relative min-h-full select-none">
      <div
        className="mx-auto mb-4 mt-8 w-fit rounded-full px-6 py-2 font-bold text-sm tracking-wide"
        style={{
          background: win ? '#00E67622' : '#FFAB0022',
          color: win ? '#00E676' : '#FFAB00',
          border: '1px solid',
          borderColor: win ? '#00E676' : '#FFAB00'
        }}
      >
        {win ? 'MISSION COMPLETE' : 'MISSION FAILED'}
      </div>

      {[
        ['Science Gathered', `${g.sci} pts`],
        ['Data Returned to Earth', `${g.ret.toFixed(1)} GB`],
        ['Final Spacecraft Health', `${Math.round(Math.max(0, g.health))}%`],
        ['Total Project Cost', `$${(42 - T.b).toFixed(0)}M`],
        ['Flight Duration', `${g.day} Days`],
      ].map(([k, v]) => (
        <div key={k} className="card mono mb-2 flex justify-between text-xs">
          <span className="text-[#AAB4C3]">{k}</span>
          <b className="text-[#00E5FF]">{v}</b>
        </div>
      ))}

      {!win && (
        <div className="card text-xs mt-3 border-[#FFAB00]">
          <b className="text-[#FFAB00]">Cause & Effect Analysis:</b>
          <p className="mt-1 text-[#AAB4C3]">
            {g.health < 40
              ? 'Solar storm flux and thermal stresses degraded bus health below survival margin.'
              : 'Science payload fell short of the 30-point threshold. Scans and downlinks were insufficient.'}
          </p>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 grid gap-2 bg-[#080B12] p-4">
        <Btn p={true} set={set} onClick={() => go(18)}>
          VIEW CINEMATIC DEBRIEF
        </Btn>
        <Btn set={set} onClick={() => set({ ...init, page: 5, inst: {} })}>
          RETRY MISSION
        </Btn>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PAGE 18: CINEMATIC DEBRIEF
// ----------------------------------------------------
export const Debrief: React.FC<PageCtx> = ({ g, T }) => {
  const [n, setN] = useState(0);
  const st = g.stormChoice;

  const N = [
    [
      'Launch',
      `Launched at ${T.r}% readiness`,
      'Your design set the margins you flew with.',
      `Δv margin ${T.d - 1199} m/s and ${T.p} W load defined every later option.`,
      'Constraints stayed tight, so every burn mattered.'
    ],
    [
      'Solar Storm',
      st === 'safe'
        ? 'Entered Safe Mode'
        : st === 'sci'
        ? 'Kept running science'
        : st === 'power'
        ? 'Redistributed power to thermal'
        : 'No storm decision recorded',
      'Flux spiked on Day 90 as foreshadowed.',
      st === 'safe'
        ? 'Hardware protected, but science paused.'
        : st === 'sci'
        ? 'Extra data gathered, but heavy structural damage.'
        : 'Moderate damage, preserved critical systems.',
      `Health ended at ${Math.round(g.health)}%.`
    ],
    [
      'Rendezvous',
      `${g.surveys} surface surveys completed`,
      'Close approach opened regional scan targets.',
      'Surface imaging generated high-yield science telemetry.',
      `Science total: ${g.sci} pts.`
    ],
    [
      'Transmission',
      `${g.tx} downlinks completed`,
      'Data only counts toward mission success when it reaches Earth.',
      'Windows open 20 of every 30 days; antenna selection sets data throughput.',
      `${g.ret.toFixed(1)} GB returned.`
    ]
  ];

  const x = N[n];

  return (
    <div className="flex h-full flex-col select-none">
      <div className="flex h-[20%] items-center gap-6 overflow-x-auto px-6 no-scrollbar">
        {N.map((a, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              playTelemetryClick();
              setN(i);
            }}
            className="flex-none text-center cursor-pointer"
          >
            <div
              className="mx-auto h-8 w-8 rounded-full bg-[#151B26] transition-all"
              style={{
                boxShadow:
                  i === n
                    ? '0 0 0 3px #00E5FF, 0 0 18px #00E5FF'
                    : 'none',
                borderColor: i === n ? '#00E5FF' : '#293342',
                borderWidth: 1
              }}
            />
            <div className="mono mt-2 text-[10px] text-white font-semibold">{a[0]}</div>
          </button>
        ))}
      </div>
      <div className="h-[80%] space-y-2 overflow-y-auto p-4 no-scrollbar">
        {['Your Decision', 'What Happened', 'Why It Happened', 'Mission Consequence'].map((t, i) => (
          <div key={t} className="card">
            <div className="mono text-[10px] text-[#00E5FF] font-bold">{t.toUpperCase()}</div>
            <div className="text-xs text-[#F3F6FA] mt-1">{x[i + 1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// PAGE 19: LEADERBOARD / RECORDS
// ----------------------------------------------------
export const Board: React.FC<PageCtx> = () => {
  const [t, setT] = useState(0);
  let a: any[] = [];
  try {
    a = JSON.parse(localStorage.getItem('ll_rec') || '[]');
  } catch {
    a = [];
  }

  const key = ['sci', 'hp', 'cost'][t] as 'sci' | 'hp' | 'cost';
  const arr = [...a].sort((p, q) => (t === 2 ? p.cost - q.cost : q[key] - p[key]));

  return (
    <div className="p-4 select-none">
      <div className="mb-3 mt-4 text-xl font-bold text-white tracking-tight">Mission Records</div>
      <div className="mb-3 flex gap-1">
        {['Science Hunter', 'Survival Expert', 'Engineering Master'].map((n, i) => (
          <button
            key={n}
            type="button"
            className="pill min-h-[40px] flex-1 text-[9.5px] cursor-pointer"
            style={{
              color: t === i ? '#00E5FF' : '#AAB4C3',
              borderColor: t === i ? '#00E5FF' : '#293342',
              background: t === i ? '#00E5FF22' : '#0D111Acc'
            }}
            onClick={() => {
              playTelemetryClick();
              setT(i);
            }}
          >
            {n}
          </button>
        ))}
      </div>
      {arr.length ? (
        arr.map((r, i) => (
          <div key={i} className="card mono mb-2 flex justify-between text-xs">
            <span>#{i + 1} · {new Date(r.t).toLocaleDateString()}</span>
            <span className="text-[#00E5FF]">
              Sci {r.sci} · HP {Math.round(r.hp)}% · ${r.cost}M
            </span>
          </div>
        ))
      ) : (
        <div className="card text-xs text-[#6F7B8C] text-center py-8">
          No saved missions yet. Complete a flight to log your mission record!
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// PAGE 20: NASA DATA & SCIENCE
// ----------------------------------------------------
export const Nasa: React.FC<PageCtx> = ({ set, go }) => {
  const [o, setO] = useState<number | null>(null);

  const it = [
    ['JPL Horizons', 'Ephemerides for solar-system bodies, spacecraft trajectories, and asteroid orbits.'],
    ['Small-Body Database', 'High-precision orbital elements and physical properties for asteroids and comets.'],
    ['Tsiolkovsky Rocket Equation', 'Δv = Isp · g₀ · ln(m₀ / m_f)\nRelates propellant mass ratio and specific impulse to available velocity change.'],
    ['Delta-v Budget', 'Δv_total = Σ Δv_burns + margin\nSum course corrections, approach and rendezvous burns, then allocate reserve margin.'],
    ['Solar Inverse-Square Law', 'P = P₀ · (1 AU / r)²\nAvailable solar energy decreases quadratically with distance from the Sun.']
  ];

  return (
    <div className="p-4 pb-20 select-none">
      <div className="mb-3 mt-4 text-xl font-bold text-white tracking-tight">NASA Data & Science</div>
      {it.map(([n, d], i) => (
        <div
          key={n}
          className="card mb-2 cursor-pointer transition-colors"
          onClick={() => {
            playTelemetryClick();
            setO(o === i ? null : i);
          }}
        >
          <div className="flex min-h-[32px] justify-between items-center font-bold text-sm text-white">
            <span>{n}</span>
            <span className="mono text-[#00E5FF] text-base">{o === i ? '−' : '+'}</span>
          </div>
          {o === i && (
            <pre className="mono mt-2 whitespace-pre-wrap text-xs text-[#AAB4C3] border-t border-[#293342]/60 pt-2 font-mono">
              {d}
            </pre>
          )}
        </div>
      ))}
      <div className="mt-4">
        <Btn set={set} onClick={() => go(1)}>BACK TO TITLE</Btn>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// MAIN APP COMPONENT
// ----------------------------------------------------
export const App: React.FC = () => {
  const [g, S] = useState<GameState>(init);
  const set = (p: Partial<GameState> | ((prev: GameState) => GameState)) =>
    S((o) => ({ ...o, ...(typeof p === 'function' ? p(o) : p) }));
  const go = (page: number) => {
    playTelemetryClick();
    set({ page });
  };

  const T = tot(g.inst);
  const phase =
    g.day < 5
      ? 'LAUNCH'
      : g.day < 60
      ? 'CRUISE'
      : g.day < 110
      ? 'APPROACH'
      : g.day < 130
      ? 'RENDEZVOUS'
      : g.day < 146
      ? 'SCIENCE'
      : 'DEBRIEF';

  // Responsive scale and screen adaptation
  const [sc, setSc] = useState(1);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isMuted, setIsMutedState] = useState(isAudioMuted());

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 640;
      setIsMobileScreen(isMobile);
      if (!isMobile) {
        setSc(Math.min(1, (window.innerHeight - 80) / 852, (window.innerWidth - 30) / 393));
      } else {
        setSc(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toast timeout
  useEffect(() => {
    if (g.toast) {
      const t = setTimeout(() => set({ toast: null }), 2600);
      return () => clearTimeout(t);
    }
  }, [g.toast]);

  // Flash badge timeout
  useEffect(() => {
    if (g.flash) {
      const t = setTimeout(() => set({ flash: null }), 1500);
      return () => clearTimeout(t);
    }
  }, [g.flash]);

  // Autonomous flight simulation loop
  useEffect(() => {
    if (g.page !== 10) return;
    const t = setInterval(() => {
      S((o) => {
        if (o.page !== 10) return o;
        let nd = Math.min(146, o.day + o.speed);
        const ev: [number, string][] = [
          [60, 'Solar activity increasing'],
          [75, 'Flare precursors detected on solar limb']
        ];
        let toast = o.toast;
        for (const [d, m] of ev) {
          if (o.day < d && d <= nd) {
            nd = d;
            toast = m;
          }
        }
        if (!o.stormDone && o.day < 90 && 90 <= nd) {
          playWarningAlert();
          return { ...o, day: 90, page: 15 };
        }
        if (nd >= 146) {
          playSuccessChime();
          return { ...o, day: 146, page: 17 };
        }
        return {
          ...o,
          day: nd,
          toast,
          data: Math.min(32, o.data + 0.05 * o.speed)
        };
      });
    }, 600);
    return () => clearInterval(t);
  }, [g.page]);

  // Persist record on result
  useEffect(() => {
    if (g.page === 17) {
      try {
        const a = JSON.parse(localStorage.getItem('ll_rec') || '[]');
        a.unshift({
          sci: g.sci,
          hp: g.health,
          cost: +(42 - T.b + 42).toFixed(0),
          ret: g.ret,
          t: Date.now()
        });
        localStorage.setItem('ll_rec', JSON.stringify(a.slice(0, 20)));
      } catch {
        // Ignore localStorage error
      }
    }
  }, [g.page]);

  const ctx: PageCtx = { g, set, go, T, phase };

  const pages: Record<number, React.FC<PageCtx>> = {
    1: Landing,
    3: Brief,
    4: Setup,
    5: Design,
    6: Design,
    7: Ready,
    8: Stress,
    9: Launch,
    16: Rock,
    17: Result,
    18: Debrief,
    19: Board,
    20: Nasa,
  };

  const CurrentPageComponent = pages[g.page] || Dash;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] bg-[#05070c] py-1 select-none">
      {/* Dev Controls Header (visible on desktop or can be toggled) */}
      {!isMobileScreen && (
        <div className="mb-2 flex items-center gap-2 z-50">
          <select
            className="rounded bg-[#151B26] px-3 py-1.5 text-xs mono text-[#00E5FF] border border-[#293342] cursor-pointer"
            value={g.page}
            onChange={(e) => go(+e.target.value)}
          >
            {Array.from({ length: 20 }, (_, i) => (
              <option key={i} value={i + 1}>
                DEV · Page {String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded bg-[#151B26] px-3 py-1.5 text-xs mono text-[#AAB4C3] border border-[#293342] cursor-pointer hover:text-white"
            onClick={() => {
              const muted = toggleAudio();
              setIsMutedState(muted);
            }}
          >
            {isMuted ? '🔇 MUTED' : '🔊 AUDIO'}
          </button>
        </div>
      )}

      {/* Mobile Device Frame Container */}
      <div
        style={
          isMobileScreen
            ? { width: '100%', height: '100dvh', maxHeight: '100vh' }
            : { width: 393 * sc, height: 852 * sc }
        }
      >
        <div
          className={`relative overflow-hidden ${
            isMobileScreen
              ? 'w-full h-full'
              : 'rounded-[38px] border border-[#293342] shadow-[0_0_80px_#00e5ff22]'
          }`}
          style={
            isMobileScreen
              ? { background: 'linear-gradient(#080B12, #0D111A)' }
              : {
                  width: 393,
                  height: 852,
                  background: 'linear-gradient(#080B12, #0D111A)',
                  transform: `scale(${sc})`,
                  transformOrigin: 'top left',
                }
          }
        >
          {/* Simulated Mobile Status Notch on Desktop */}
          {!isMobileScreen && (
            <div className="absolute top-0 left-0 right-0 z-40 flex justify-between items-center px-6 pt-2 pointer-events-none">
              <span className="mono text-[10px] text-[#AAB4C3]">NASA 12:00</span>
              <div className="h-4 w-28 bg-[#05070C] rounded-full mx-auto" />
              <span className="mono text-[10px] text-[#00E5FF]">5G ■■■</span>
            </div>
          )}

          {/* Active Screen View */}
          <div
            key={g.page >= 10 && g.page <= 15 ? 10 : g.page}
            className="pg absolute inset-0 overflow-y-auto no-scrollbar"
            style={{ paddingTop: isMobileScreen ? 'env(safe-area-inset-top, 0px)' : '16px' }}
          >
            <CurrentPageComponent {...ctx} />
          </div>

          {/* How to Play Modal Sheet */}
          {g.how && (
            <Sheet onClose={() => set({ how: false })}>
              <How {...ctx} />
            </Sheet>
          )}

          {/* Safe Mode Alert Hazard Overlay */}
          {g.safe && (
            <div
              className="pointer-events-none absolute inset-0 z-40"
              style={{
                background:
                  'repeating-linear-gradient(0deg, #ffab0020 0 2px, transparent 2px 6px), #ffab0012',
                boxShadow: 'inset 0 0 60px #FFAB0066',
              }}
            >
              <div className="mono absolute top-2 w-full text-center text-[10px] font-bold text-[#FFAB00] tracking-widest">
                SAFE MODE ACTIVE
              </div>
            </div>
          )}

          {/* Toast Notification Pill */}
          {g.toast && (
            <div className="mono absolute left-4 right-4 top-8 z-50 rounded-xl border border-[#00E5FF] bg-[#0D111Aee] backdrop-blur-md p-3 text-center text-xs text-[#F3F6FA] shadow-[0_0_20px_#00e5ff44]">
              {g.toast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
