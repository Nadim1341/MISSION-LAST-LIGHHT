export interface GlossaryEntry {
  term: string;
  title: string;
  explanation: string;
  formula?: string;
  nasaContext?: string;
}

export const AEROSPACE_GLOSSARY: Record<string, GlossaryEntry> = {
  deltaV: {
    term: 'deltaV',
    title: 'Delta-V (Δv) — Velocity Change Capability',
    explanation: 'Delta-v is the total impulse capacity of the spacecraft propulsion system, measured in meters per second (m/s). It represents the spacecraft\'s ability to change its orbital velocity to perform planetary transfer, trajectory corrections, and orbit insertion braking.',
    formula: 'Δv = Isp · g0 · ln(m_wet / m_dry)',
    nasaContext: 'NASA missions calculate strict delta-V budgets with at least a 15% reserve margin to handle launch dispersion and unexpected trajectory correction maneuvers (TCMs).'
  },
  isp: {
    term: 'isp',
    title: 'Specific Impulse (Isp) — Propellant Efficiency',
    explanation: 'Specific impulse measures how effectively a rocket engine utilizes propellant mass to produce thrust, expressed in seconds. Higher Isp means the engine produces more velocity change per kilogram of fuel.',
    formula: 'Isp = Thrust / (mass_flow_rate · g0)',
    nasaContext: 'Chemical engines (e.g. MMH/NTO) provide ~320s Isp with high thrust for impulsive burns. NASA\'s NEXT-C and Dawn ion thrusters achieve ~3,100s Isp by electrostatically accelerating xenon ions.'
  },
  c3: {
    term: 'c3',
    title: 'Characteristic Launch Energy (C3)',
    explanation: 'C3 represents the square of hyperbolic excess velocity (km²/s²) imparted by the launch vehicle above Earth\'s gravitational escape threshold. Higher C3 missions (like reaching Mars or Asteroids) exponentially reduce the rocket\'s lift payload capacity.',
    formula: 'C3 = v_infinity²',
    nasaContext: 'NASA\'s Launch Services Program (LSP) publishes empirical C3 performance curves to determine which rocket can launch a spacecraft to deep space targets.'
  },
  linkBudget: {
    term: 'linkBudget',
    title: 'Friis Transmission & Telecom Link Margin',
    explanation: 'Radio signal power drops with the square of distance (1/d²). The link margin represents the signal power received by NASA Deep Space Network antennas above the thermal noise floor, determining maximum downlink bandwidth (kbps).',
    formula: 'Pr = Pt · Gt · Gr · (λ / 4πd)²',
    nasaContext: 'NASA DSN uses 34-meter and 70-meter Cassegrain antennas located in Goldstone (USA), Madrid (Spain), and Canberra (Australia) to communicate with distant spacecraft.'
  },
  batteryDoD: {
    term: 'batteryDoD',
    title: 'Battery Depth of Discharge (DoD)',
    explanation: 'The percentage of total battery capacity consumed during an eclipse or high-power observation pass. Discharging beyond 70% accelerates electrochemical cell degradation; exceeding 90% risks bus brownout and loss of orientation.',
    formula: 'DoD = (Power_draw · Eclipse_duration) / Battery_capacity',
    nasaContext: 'Robotic missions strictly manage battery thermal blankets and duty cycles to preserve secondary cell cycle life over multi-year journeys.'
  },
  radHardening: {
    term: 'radHardening',
    title: 'Total Ionizing Dose (TID) & Radiation Hardness',
    explanation: 'Radiation tolerance, measured in kilorads (krad), defines how much cumulative high-energy cosmic ray and solar proton radiation semiconductor chips can absorb before suffering memory bitflips or permanent single-event latchups.',
    nasaContext: 'Deep space missions mandate silicon-on-insulator processors like the BAE Systems RAD750 (rated at 100 krad) to survive intense coronal mass ejections.'
  }
};
