import type { MissionTarget } from '../types/mission.ts';

export const TARGET_CATALOG: MissionTarget[] = [
  {
    id: 'target_bennu_101955',
    name: '101955 Bennu (1999 RQ36)',
    designation: 'Near-Earth Asteroid / Apollo-class / B-type',
    type: 'asteroid',
    distanceAuMin: 0.897, // Perihelion
    distanceAuMax: 1.356, // Aphelion
    deltaVRequirementMs: {
      escape: 0, // Provided by launch vehicle C3
      transfer: 680, // Deep space trajectory correction burns
      orbitInsertion: 420, // Asteroid approach and rendezvous braking
      rendezvousRCS: 140, // Proximity operations and station-keeping
      totalRequired: 1240 // Total delta-V needed on spacecraft bus
    },
    requiredC3Km2S2: 18.5, // Characteristic launch energy required
    solarIrradianceFactorMin: 0.544, // At 1.356 AU: S0 / (1.356)^2
    solarIrradianceFactorMax: 1.242, // At 0.897 AU
    communicationDelayMinSec: 420, // ~7 minutes one-way
    communicationDelayMaxSec: 1080, // ~18 minutes one-way
    scientificThemes: [
      'Carbonaceous Chondrite Regolith Composition',
      'Volatile Organic Molecules & Prebiotic Amino Acids',
      'Yarkovsky Effect & Planetary Defense Trajectory Deflection',
      '3D Topography & Surface Particle Ejection Dynamics'
    ],
    historicalAnalog: 'NASA OSIRIS-REx Sample Return Mission (2016 - 2023)',
    jplHorizonsId: '2101955',
    orbitalParameters: {
      semiMajorAxisAu: 1.1264,
      eccentricity: 0.20375,
      inclinationDeg: 6.035,
      rotationPeriodHours: 4.296,
      albedo: 0.046
    }
  },
  {
    id: 'target_mars',
    name: 'Mars (Planetary Science Orbiter)',
    designation: 'Fourth Planet / Terrestrial Planet',
    type: 'mars',
    distanceAuMin: 1.381,
    distanceAuMax: 1.666,
    deltaVRequirementMs: {
      escape: 0,
      transfer: 450,
      orbitInsertion: 1850, // Mars Orbit Insertion (MOI) requires significant impulsive delta-V
      rendezvousRCS: 120,
      totalRequired: 2420
    },
    requiredC3Km2S2: 15.2,
    solarIrradianceFactorMin: 0.360, // At 1.666 AU
    solarIrradianceFactorMax: 0.524, // At 1.381 AU
    communicationDelayMinSec: 240, // 4 minutes
    communicationDelayMaxSec: 1440, // 24 minutes
    scientificThemes: [
      'Atmospheric Escape & MAVEN Solar Wind Interaction',
      'Subsurface Permafrost & Glacial Water Ice Mapping',
      'Methane Seasonality & Trace Gas Signatures',
      'Surface Geology & Paleolakes in Jezero / Gale Craters'
    ],
    historicalAnalog: 'Mars Reconnaissance Orbiter (MRO) / MAVEN',
    jplHorizonsId: '499',
    orbitalParameters: {
      semiMajorAxisAu: 1.5237,
      eccentricity: 0.0934,
      inclinationDeg: 1.85,
      rotationPeriodHours: 24.62,
      albedo: 0.170
    }
  },
  {
    id: 'target_moon',
    name: 'The Moon (Lunar South Pole Shackleton Crater)',
    designation: 'Earth Natural Satellite',
    type: 'moon',
    distanceAuMin: 0.998,
    distanceAuMax: 1.002,
    deltaVRequirementMs: {
      escape: 0,
      transfer: 180,
      orbitInsertion: 850, // Lunar Orbit Insertion
      rendezvousRCS: 80,
      totalRequired: 1110
    },
    requiredC3Km2S2: -2.0, // Trans-Lunar Injection (TLI)
    solarIrradianceFactorMin: 0.996,
    solarIrradianceFactorMax: 1.004,
    communicationDelayMinSec: 1.25,
    communicationDelayMaxSec: 1.35,
    scientificThemes: [
      'Permanently Shadowed Regions (PSR) Volatile Water Ice',
      'Lunar South Pole-Aitken Basin Regolith Geology',
      'Radiation Environment Characterization for Artemis Astronauts'
    ],
    historicalAnalog: 'Lunar Reconnaissance Orbiter (LRO) / LCROSS',
    jplHorizonsId: '301',
    orbitalParameters: {
      semiMajorAxisAu: 1.000,
      eccentricity: 0.0549,
      inclinationDeg: 5.145,
      rotationPeriodHours: 655.7,
      albedo: 0.120
    }
  }
];
