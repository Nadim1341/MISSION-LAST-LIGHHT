import type { ScenarioDefinition } from '../types/mission.ts';
import { TARGET_CATALOG } from './targets.ts';

const bennuTarget = TARGET_CATALOG.find((t) => t.id === 'target_bennu_101955')!;
const marsTarget = TARGET_CATALOG.find((t) => t.id === 'target_mars')!;
const moonTarget = TARGET_CATALOG.find((t) => t.id === 'target_moon')!;

export const SCENARIO_CATALOG: ScenarioDefinition[] = [
  // ==================== PRIMARY SHOWCASE SCENARIO ====================
  {
    id: 'scenario_asteria_1',
    title: 'ASTERIA-1: Asteroid Rendezvous',
    tagline: 'The asteroid won\'t wait.',
    briefing:
      'Near-Earth Asteroid 101955 Bennu represents a primordial time capsule from the birth of our Solar System, rich in organic molecules and volatile water. As Mission Director, design an autonomous deep-space spacecraft capable of surviving a 2.5-year interplanetary cruise, braking into proximity operations around a microgravity rubble-pile asteroid, acquiring multi-spectral topographic surveys, and safely downlinking high-priority science data through NASA\'s Deep Space Network under strict budget, power, and radiation constraints.',
    target: bennuTarget,
    budgetCapM: 300.0, // Discovery-class budget cap ($300M)
    allowedLaunchers: ['launch_falcon9', 'launch_falcon_heavy', 'launch_atlas_v'],
    mandatoryObjectives: [
      {
        id: 'obj_spectral_survey',
        title: 'Global Carbonaceous Regolith Survey',
        description: 'Collect high-resolution multi-spectral and infrared spectral maps of surface minerals.',
        targetMetric: 'science_points',
        thresholdValue: 60,
        isMandatory: true,
        bonusScore: 250
      },
      {
        id: 'obj_downlink_recovery',
        title: 'Deep Space Downlink Recovery',
        description: 'Successfully transmit at least 10,000 MB (10 GB) of scientific data to DSN ground stations without buffer loss.',
        targetMetric: 'downlink_mb',
        thresholdValue: 10000,
        isMandatory: true,
        bonusScore: 300
      },
      {
        id: 'obj_proximity_operations',
        title: 'Proximity Orbit & Maneuver Survival',
        description: 'Arrive at Bennu with at least 15% propellant reserve for safe station-keeping maneuvers.',
        targetMetric: 'orbit_stability',
        thresholdValue: 15,
        isMandatory: true,
        bonusScore: 200
      }
    ],
    secondaryObjectives: [
      {
        id: 'obj_bonus_lidar_shape',
        title: 'Centimeter-Grade 3D LIDAR Shape Model',
        description: 'Utilize active laser altimetry to map asteroid boulder fields for landing site reconnaissance.',
        targetMetric: 'spectral_survey',
        thresholdValue: 35,
        isMandatory: false,
        bonusScore: 150
      },
      {
        id: 'obj_bonus_frugal_engineering',
        title: 'Fiscal Discipline Award',
        description: 'Deliver the mission with more than $30M in unspent project budget contingency reserves.',
        targetMetric: 'science_points',
        thresholdValue: 30,
        isMandatory: false,
        bonusScore: 100
      }
    ],
    baselineTimelineDays: 320, // Accelerated mission simulation timeline
    defaultSeed: 20261019
  },

  // ==================== SECONDARY SCENARIOS ====================
  {
    id: 'scenario_mars_window',
    title: 'MARS WINDOW: Atmospheric Science Orbiter',
    tagline: 'Seize the synodic window.',
    briefing:
      'Earth-Mars synodic alignment opens every 26 months. Design a high-payload orbiter capable of performing Mars Orbit Insertion (MOI) and conducting atmospheric profiling.',
    target: marsTarget,
    budgetCapM: 380.0,
    allowedLaunchers: ['launch_falcon9', 'launch_falcon_heavy', 'launch_atlas_v', 'launch_sls_block1'],
    mandatoryObjectives: [
      {
        id: 'obj_mars_atmosphere',
        title: 'Atmospheric Isotope & Trace Gas Survey',
        description: 'Survey upper atmospheric volatile loss and trace gas signatures.',
        targetMetric: 'science_points',
        thresholdValue: 80,
        isMandatory: true,
        bonusScore: 300
      }
    ],
    secondaryObjectives: [],
    baselineTimelineDays: 450,
    defaultSeed: 4991024
  },
  {
    id: 'scenario_lunar_shadow',
    title: 'LUNAR SHADOW: Polar Water Ice Reconnaissance',
    tagline: 'Illuminating the permanently shadowed craters.',
    briefing:
      'Map permanently shadowed craters at the lunar south pole for trapped water ice volatiles in support of NASA Artemis human exploration.',
    target: moonTarget,
    budgetCapM: 140.0,
    allowedLaunchers: ['launch_falcon9', 'launch_atlas_v', 'launch_electron'],
    mandatoryObjectives: [
      {
        id: 'obj_lunar_ice',
        title: 'Permanently Shadowed Region Hydrogen Mapping',
        description: 'Survey neutron and radar backscatter in south pole craters.',
        targetMetric: 'science_points',
        thresholdValue: 50,
        isMandatory: true,
        bonusScore: 250
      }
    ],
    secondaryObjectives: [],
    baselineTimelineDays: 180,
    defaultSeed: 3012026
  }
];
