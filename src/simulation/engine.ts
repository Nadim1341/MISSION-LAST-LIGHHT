import type { SpacecraftDesign } from '../types/subsystems.ts';
import type { LaunchVehicle } from '../types/launcher.ts';
import type { ScenarioDefinition, MissionTelemetry, MissionStage } from '../types/mission.ts';
import { calculateSubsystemTotals } from '../engine/math/rocket.ts';
import { calculateSolarPowerGeneration } from '../engine/math/power.ts';
import { calculateDownlinkRateKbps, calculateOneWayLightTimeSec, updateDataBuffer } from '../engine/math/comms.ts';
import { calculateEquilibriumTemperatureK } from '../engine/math/thermal.ts';
import { DeterministicPRNG } from '../engine/prng.ts';

export const MISSION_STAGE_SEQUENCE: MissionStage[] = [
  'pre_launch',
  'launch',
  'orbit_insertion',
  'cruise',
  'approach',
  'science_operations',
  'communication_pass',
  'mission_conclusion'
];

export function createInitialTelemetry(
  design: SpacecraftDesign,
  launcher: LaunchVehicle,
  scenario: ScenarioDefinition
): MissionTelemetry {
  const totals = calculateSubsystemTotals(design);
  const initialDistSunAu = 1.0;
  const initialDistEarthAu = 0.002;
  const initialDistTargetKm = 180000000; // ~1.2 AU to Bennu

  const solarW = calculateSolarPowerGeneration(totals.powerGenerationW, initialDistSunAu);
  const oneWayLightTime = calculateOneWayLightTimeSec(initialDistEarthAu);

  const subsystemHealth = {
    power: 100,
    propulsion: 100,
    communications: 100,
    navigation: 100,
    computing: 100,
    thermal: 100,
    science: 100,
    structure: 100
  };

  return {
    missionElapsedTimeDays: 0,
    currentStage: 'pre_launch',
    stageProgress: 0.0,
    distanceToTargetKm: initialDistTargetKm,
    distanceFromSunAu: initialDistSunAu,
    distanceFromEarthAu: initialDistEarthAu,

    solarGenerationW: solarW,
    powerConsumptionW: totals.powerConsumptionW,
    batteryStoredJoules: totals.batteryStorageJoules,
    batteryCapacityJoules: totals.batteryStorageJoules,
    batteryStateOfCharge: totals.batteryStorageJoules > 0 ? 1.0 : 0.0,

    propellantRemainingKg: totals.propellantMassKg,
    propellantTotalKg: totals.propellantMassKg,
    deltaVRemainingMs: totals.totalDeltaVMs,

    spacecraftTempK: 295.0,
    thermalMarginK: 0.0,
    isThermalAnomaly: false,

    dataBufferUsedMb: 0,
    dataBufferMaxMb: totals.storageCapacityMb,
    rawScienceCollected: 0,
    scienceDataTransmitted: 0,

    oneWayLightTimeSec: oneWayLightTime,
    currentDownlinkRateKbps: calculateDownlinkRateKbps(totals.dataGenerationRateKbps > 0 ? 450 : 25, initialDistEarthAu),
    isInDsnWindow: true,
    activeGroundStation: 'Goldstone',

    spacecraftHealth: 100,
    subsystemHealth,
    safeModeEngaged: false,
    anomalyActive: false
  };
}

export function advanceSimulationTick(
  telemetry: MissionTelemetry,
  design: SpacecraftDesign,
  scenario: ScenarioDefinition,
  tickDeltaDays: number,
  prng?: DeterministicPRNG
): MissionTelemetry {
  const totals = calculateSubsystemTotals(design);
  const newMetDays = Number((telemetry.missionElapsedTimeDays + tickDeltaDays).toFixed(2));
  const totalMissionDays = scenario.baselineTimelineDays;

  // Determine stage based on MET timeline
  let currentStage: MissionStage = telemetry.currentStage;
  let stageProgress = 0.0;

  if (newMetDays <= 1) {
    currentStage = 'launch';
    stageProgress = newMetDays / 1.0;
  } else if (newMetDays <= 8) {
    currentStage = 'orbit_insertion';
    stageProgress = (newMetDays - 1) / 7.0;
  } else if (newMetDays <= 200) {
    currentStage = 'cruise';
    stageProgress = (newMetDays - 8) / 192.0;
  } else if (newMetDays <= 240) {
    currentStage = 'approach';
    stageProgress = (newMetDays - 200) / 40.0;
  } else if (newMetDays <= 290) {
    currentStage = 'science_operations';
    stageProgress = (newMetDays - 240) / 50.0;
  } else if (newMetDays < totalMissionDays) {
    currentStage = 'communication_pass';
    stageProgress = (newMetDays - 290) / (totalMissionDays - 290);
  } else {
    currentStage = 'mission_conclusion';
    stageProgress = 1.0;
  }

  // Interplanetary trajectory position interpolation
  const overallFraction = Math.min(1.0, newMetDays / totalMissionDays);
  const minSunAu = scenario.target.distanceAuMin;
  const maxSunAu = scenario.target.distanceAuMax;
  // Sinusoidal distance variation along heliocentric transfer ellipse
  const currentSunAu = Number(
    (1.0 + (maxSunAu - 1.0) * Math.sin(overallFraction * (Math.PI / 2))).toFixed(3)
  );
  const currentEarthAu = Number((0.002 + 1.25 * overallFraction).toFixed(3));
  const currentDistTargetKm = Math.max(0, Math.round(180000000 * (1.0 - overallFraction)));

  // Solar power drops with distance squared
  const currentSolarW = calculateSolarPowerGeneration(totals.powerGenerationW, currentSunAu);

  // Electrical load depends on stage and safe mode
  let activePowerConsumptionW = totals.powerConsumptionW;
  if (telemetry.safeModeEngaged) {
    activePowerConsumptionW = Math.round(totals.powerConsumptionW * 0.35); // Base avionics only
  } else if (currentStage === 'science_operations') {
    activePowerConsumptionW = Math.round(totals.powerConsumptionW * 1.15); // Full sensor load
  }

  // Battery charge dynamics
  const netWatts = currentSolarW - activePowerConsumptionW;
  let storedJoules = telemetry.batteryStoredJoules;
  const batteryCapJoules = telemetry.batteryCapacityJoules;

  if (batteryCapJoules > 0) {
    const tickSeconds = tickDeltaDays * 86400;
    storedJoules = Math.max(0, Math.min(batteryCapJoules, storedJoules + netWatts * tickSeconds));
  }
  const batterySoC = batteryCapJoules > 0 ? Number((storedJoules / batteryCapJoules).toFixed(2)) : 1.0;

  // Propellant usage by stage
  let propellantUsedKg = 0;
  if (currentStage === 'orbit_insertion' && telemetry.currentStage !== 'orbit_insertion') {
    propellantUsedKg = totals.propellantMassKg * 0.35; // Major insertion burn
  } else if (currentStage === 'approach' && telemetry.currentStage !== 'approach') {
    propellantUsedKg = totals.propellantMassKg * 0.30; // Braking into asteroid proximity
  } else if (currentStage === 'science_operations') {
    propellantUsedKg = 0.05 * tickDeltaDays; // Station-keeping thruster pulses
  }
  const newPropellantKg = Math.max(0, Number((telemetry.propellantRemainingKg - propellantUsedKg).toFixed(1)));
  const newDeltaVMs = Number(
    (totals.totalDeltaVMs * (totals.propellantMassKg > 0 ? newPropellantKg / totals.propellantMassKg : 1.0)).toFixed(1)
  );

  // Science gathering
  let newSciencePoints = telemetry.rawScienceCollected;
  let instrumentRateKbps = 0;
  if (!telemetry.safeModeEngaged && (currentStage === 'approach' || currentStage === 'science_operations')) {
    const scienceRateFactor = currentStage === 'science_operations' ? 1.0 : 0.3;
    const gainedScience = totals.sciencePotential * 0.03 * tickDeltaDays * scienceRateFactor;
    newSciencePoints += Number(gainedScience.toFixed(1));
    instrumentRateKbps = totals.dataGenerationRateKbps;
  }

  // Deep Space Network communications
  const dsnGroundStations: ('Goldstone' | 'Madrid' | 'Canberra')[] = ['Goldstone', 'Madrid', 'Canberra'];
  const stationIndex = Math.floor((newMetDays * 3) % 3);
  const activeStation = dsnGroundStations[stationIndex];
  const isInDsnWindow = (newMetDays % 1.0) < 0.65; // 65% visibility pass duty cycle

  const baseCommKbps = totals.dataGenerationRateKbps > 0 ? 450 : 25;
  const currentDownlinkKbps = calculateDownlinkRateKbps(baseCommKbps, currentEarthAu, 34);

  // Buffer update
  const bufferUpdate = updateDataBuffer(
    telemetry.dataBufferUsedMb,
    telemetry.dataBufferMaxMb,
    instrumentRateKbps,
    currentDownlinkKbps,
    isInDsnWindow && !telemetry.safeModeEngaged,
    tickDeltaDays * 86400
  );

  const newTransmittedMb = Number((telemetry.scienceDataTransmitted + bufferUpdate.dataTransmittedMb).toFixed(1));

  // Thermal state
  const currentTempK = calculateEquilibriumTemperatureK(
    (currentSolarW * 0.7),
    activePowerConsumptionW,
    2.5,
    0.85
  );

  // Spacecraft health
  let overallHealth = telemetry.spacecraftHealth;
  if (batterySoC < 0.15) overallHealth = Math.max(20, overallHealth - 5);
  if (newPropellantKg <= 0 && currentStage !== 'mission_conclusion') overallHealth = Math.max(30, overallHealth - 2);

  return {
    missionElapsedTimeDays: newMetDays,
    currentStage,
    stageProgress: Number(stageProgress.toFixed(2)),
    distanceToTargetKm: currentDistTargetKm,
    distanceFromSunAu: currentSunAu,
    distanceFromEarthAu: currentEarthAu,

    solarGenerationW: currentSolarW,
    powerConsumptionW: activePowerConsumptionW,
    batteryStoredJoules: Math.round(storedJoules),
    batteryCapacityJoules: batteryCapJoules,
    batteryStateOfCharge: batterySoC,

    propellantRemainingKg: newPropellantKg,
    propellantTotalKg: totals.propellantMassKg,
    deltaVRemainingMs: newDeltaVMs,

    spacecraftTempK: currentTempK,
    thermalMarginK: Number((currentTempK - 295.0).toFixed(1)),
    isThermalAnomaly: currentTempK > 335 || currentTempK < 235,

    dataBufferUsedMb: bufferUpdate.newBufferMb,
    dataBufferMaxMb: telemetry.dataBufferMaxMb,
    rawScienceCollected: Number(newSciencePoints.toFixed(1)),
    scienceDataTransmitted: newTransmittedMb,

    oneWayLightTimeSec: calculateOneWayLightTimeSec(currentEarthAu),
    currentDownlinkRateKbps: currentDownlinkKbps,
    isInDsnWindow,
    activeGroundStation: isInDsnWindow ? activeStation : 'None',

    spacecraftHealth: overallHealth,
    subsystemHealth: { ...telemetry.subsystemHealth },
    safeModeEngaged: telemetry.safeModeEngaged,
    anomalyActive: telemetry.anomalyActive
  };
}

export function applyEventConsequenceToTelemetry(
  telemetry: MissionTelemetry,
  consequence: {
    subsystemDamaged?: string;
    damagePercent: number;
    scienceLostPoints: number;
    scienceGainedPoints: number;
    propellantConsumedKg: number;
    isFatal: boolean;
  },
  design: SpacecraftDesign
): MissionTelemetry {
  const totals = calculateSubsystemTotals(design);
  const newScience = Math.max(
    0,
    Number((telemetry.rawScienceCollected + consequence.scienceGainedPoints - consequence.scienceLostPoints).toFixed(1))
  );

  const newFuel = Math.max(
    0,
    Number((telemetry.propellantRemainingKg - consequence.propellantConsumedKg).toFixed(1))
  );

  const newDeltaV = Number(
    (totals.totalDeltaVMs * (totals.propellantMassKg > 0 ? newFuel / totals.propellantMassKg : 1.0)).toFixed(1)
  );

  const updatedSubsystemHealth = { ...telemetry.subsystemHealth };
  if (consequence.subsystemDamaged && consequence.subsystemDamaged in updatedSubsystemHealth) {
    const key = consequence.subsystemDamaged as keyof typeof updatedSubsystemHealth;
    updatedSubsystemHealth[key] = Math.max(0, updatedSubsystemHealth[key] - consequence.damagePercent);
  }

  let newOverallHealth = consequence.isFatal
    ? 0
    : Math.max(10, telemetry.spacecraftHealth - Math.round(consequence.damagePercent * 0.75));

  if (newFuel <= 0 && telemetry.currentStage !== 'mission_conclusion') {
    newOverallHealth = Math.min(newOverallHealth, 40);
  }

  return {
    ...telemetry,
    rawScienceCollected: newScience,
    propellantRemainingKg: newFuel,
    deltaVRemainingMs: newDeltaV,
    subsystemHealth: updatedSubsystemHealth,
    spacecraftHealth: newOverallHealth,
    currentStage: consequence.isFatal ? 'mission_conclusion' : telemetry.currentStage,
    anomalyActive: consequence.damagePercent > 0
  };
}

export function getUpcomingOrActiveEvent(
  telemetry: MissionTelemetry,
  resolvedEventIds: string[],
  events: import('../types/events.ts').ForeshadowedEvent[]
): import('../types/events.ts').ForeshadowedEvent | null {
  return (
    events.find(
      (e) => telemetry.missionElapsedTimeDays >= e.scheduledMetDay && !resolvedEventIds.includes(e.id)
    ) || null
  );
}

export function getForeshadowedEventAdvisories(
  telemetry: MissionTelemetry,
  resolvedEventIds: string[],
  events: import('../types/events.ts').ForeshadowedEvent[]
): import('../types/events.ts').ForeshadowedEvent[] {
  return events.filter(
    (e) =>
      !resolvedEventIds.includes(e.id) &&
      e.scheduledMetDay > telemetry.missionElapsedTimeDays &&
      e.scheduledMetDay - telemetry.missionElapsedTimeDays <= 15
  );
}

