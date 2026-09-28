import type { SubsystemCategory } from './subsystems.ts';

export type MissionStage =
  | 'pre_launch'
  | 'launch'
  | 'orbit_insertion'
  | 'cruise'
  | 'approach'
  | 'science_operations'
  | 'communication_pass'
  | 'mission_conclusion';

export type InterfaceMode = 'commander' | 'engineer';

export interface MissionTarget {
  id: string;
  name: string;
  designation: string;
  type: 'asteroid' | 'moon' | 'mars' | 'outer_body';
  distanceAuMin: number;
  distanceAuMax: number;
  deltaVRequirementMs: {
    escape: number;
    transfer: number;
    orbitInsertion: number;
    rendezvousRCS: number;
    totalRequired: number;
  };
  requiredC3Km2S2: number;
  solarIrradianceFactorMin: number; // At furthest distance
  solarIrradianceFactorMax: number; // At closest distance
  communicationDelayMinSec: number;
  communicationDelayMaxSec: number;
  scientificThemes: string[];
  historicalAnalog: string;
  jplHorizonsId: string;
  orbitalParameters: {
    semiMajorAxisAu: number;
    eccentricity: number;
    inclinationDeg: number;
    rotationPeriodHours: number;
    albedo: number;
  };
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  targetMetric: 'science_points' | 'downlink_mb' | 'orbit_stability' | 'spectral_survey';
  thresholdValue: number;
  isMandatory: boolean;
  bonusScore: number;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  tagline: string;
  briefing: string;
  target: MissionTarget;
  budgetCapM: number;
  allowedLaunchers: string[];
  mandatoryObjectives: MissionObjective[];
  secondaryObjectives: MissionObjective[];
  baselineTimelineDays: number;
  defaultSeed: number;
}

export interface MissionTelemetry {
  missionElapsedTimeDays: number;
  currentStage: MissionStage;
  stageProgress: number; // 0.0 - 1.0 within stage
  distanceToTargetKm: number;
  distanceFromSunAu: number;
  distanceFromEarthAu: number;

  // Power
  solarGenerationW: number;
  powerConsumptionW: number;
  batteryStoredJoules: number;
  batteryCapacityJoules: number;
  batteryStateOfCharge: number; // 0.0 - 1.0

  // Propulsion
  propellantRemainingKg: number;
  propellantTotalKg: number;
  deltaVRemainingMs: number;

  // Thermal
  spacecraftTempK: number;
  thermalMarginK: number; // Deviation from safe nominal 295 K
  isThermalAnomaly: boolean;

  // Science & Data
  dataBufferUsedMb: number;
  dataBufferMaxMb: number;
  rawScienceCollected: number;
  scienceDataTransmitted: number;

  // Telecom
  oneWayLightTimeSec: number;
  currentDownlinkRateKbps: number;
  isInDsnWindow: boolean;
  activeGroundStation: 'Goldstone' | 'Madrid' | 'Canberra' | 'None';

  // Health
  spacecraftHealth: number; // 0 - 100%
  subsystemHealth: Record<SubsystemCategory, number>;
  safeModeEngaged: boolean;
  anomalyActive: boolean;
}
