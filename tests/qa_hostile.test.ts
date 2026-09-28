import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSubsystemTotals } from '../src/engine/math/rocket.ts';
import { calculateSolarPowerGeneration, calculateBatteryDoD } from '../src/engine/math/power.ts';
import { calculateDownlinkRateKbps, calculateOneWayLightTimeSec, updateDataBuffer } from '../src/engine/math/comms.ts';
import { calculateEquilibriumTemperatureK, evaluateThermalMargin } from '../src/engine/math/thermal.ts';
import { calculateLauncherCapacityAtC3, calculateMassMargin } from '../src/engine/math/orbital.ts';
import { validateMissionDesign } from '../src/engine/validator.ts';
import { calculateMissionReadiness } from '../src/engine/readiness.ts';
import { calculateMissionDebrief } from '../src/engine/scoring.ts';
import { createInitialTelemetry, advanceSimulationTick } from '../src/simulation/engine.ts';
import type { SpacecraftDesign } from '../src/types/subsystems.ts';
import {
  createNominalAsteria1Design,
  getLauncher,
  getScenario
} from './fixtures.ts';

test('Hostile QA: Total Empty Spacecraft (All 8 subsystems stripped to 0 components)', () => {
  const emptyDesign: SpacecraftDesign = {
    name: 'Ghost Probe (Empty)',
    components: {
      power: [],
      propulsion: [],
      communications: [],
      navigation: [],
      computing: [],
      thermal: [],
      science: [],
      structure: []
    }
  };

  const totals = calculateSubsystemTotals(emptyDesign);
  assert.equal(totals.dryMassKg, 0);
  assert.equal(totals.propellantMassKg, 0);
  assert.equal(totals.totalWetMassKg, 0);
  assert.equal(totals.totalCostM, 0);
  assert.equal(totals.totalDeltaVMs, 0);
  assert.ok(!Number.isNaN(totals.dryMassKg));
  assert.ok(!Number.isNaN(totals.baseReliability));

  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');

  // Must strictly block launch with 8 hard violations
  const validation = validateMissionDesign(emptyDesign, launcher, scenario);
  assert.equal(validation.isLaunchAllowed, false);
  assert.ok(validation.hardViolations.length >= 8);

  // Readiness must not produce NaN
  const readiness = calculateMissionReadiness(emptyDesign, launcher, scenario);
  assert.ok(!Number.isNaN(readiness.overallScorePct));
  assert.ok(readiness.overallScorePct <= 20);

  // Initial telemetry must not produce NaN
  const telemetry = createInitialTelemetry(emptyDesign, launcher, scenario);
  assert.ok(!Number.isNaN(telemetry.spacecraftHealth));
  assert.ok(!Number.isNaN(telemetry.solarGenerationW));
  assert.ok(!Number.isNaN(telemetry.deltaVRemainingMs));

  // Debrief scoring must not produce NaN
  const debrief = calculateMissionDebrief(emptyDesign, launcher, scenario, telemetry, []);
  assert.ok(!Number.isNaN(debrief.compositeScore));
  assert.ok(!Number.isNaN(debrief.axisScores.engineeringEfficiency));
  assert.ok(debrief.compositeScore >= 0 && debrief.compositeScore <= 1000);
});

test('Hostile QA: Extreme Distance & Zero/Negative Inputs in Communications and Power Math', () => {
  // Distance 0 or negative AU
  const solarZero = calculateSolarPowerGeneration(650, 0);
  assert.ok(!Number.isNaN(solarZero));
  assert.ok(solarZero > 0);

  const solarNegative = calculateSolarPowerGeneration(650, -5);
  assert.ok(!Number.isNaN(solarNegative));
  assert.ok(solarNegative > 0);

  // Downlink rate at 0 AU or negative AU
  const downlinkZero = calculateDownlinkRateKbps(450, 0);
  assert.ok(!Number.isNaN(downlinkZero));
  assert.ok(downlinkZero >= 1.0);

  const downlinkNegative = calculateDownlinkRateKbps(450, -10);
  assert.ok(!Number.isNaN(downlinkNegative));
  assert.ok(downlinkNegative >= 1.0);

  // One-way light time at 0 or negative
  const owltZero = calculateOneWayLightTimeSec(0);
  assert.equal(owltZero, 0);
  assert.ok(!Number.isNaN(owltZero));

  // Battery DoD with 0 capacity
  const dodZeroCap = calculateBatteryDoD(0, 300, 3600);
  assert.ok(!Number.isNaN(dodZeroCap.depthOfDischargeRatio));
  assert.ok(!Number.isNaN(dodZeroCap.remainingJoules));

  // Equilibrium temperature with 0 heat input
  const tempZero = calculateEquilibriumTemperatureK(0, 0);
  assert.ok(!Number.isNaN(tempZero));
  assert.ok(tempZero > 0);
});

test('Hostile QA: Mass Exceeded by 10x Launch Vehicle Capacity', () => {
  const heavyDesign = createNominalAsteria1Design();
  // Manually inject a massive payload (e.g., 25,000 kg)
  heavyDesign.components.structure.push({
    id: 'struct_hyper_massive_ballast',
    name: 'Hyper Massive Tungsten Ballast',
    category: 'structure',
    tier: 'commercial',
    description: 'Extremely heavy ballast block.',
    massKg: 35000,
    costM: 5.0,
    powerDrawW: 0,
    reliability: 0.99,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 500,
    thermalDissipationW: 0,
    minOperatingTempK: 50,
    maxOperatingTempK: 500,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0,
      micrometeoroidVulnerability: 0,
      softwareAnomalyRisk: 0
    },
    nasaReference: {
      missionUsed: 'Test',
      dataset: 'Ballast',
      citation: 'Test Ballast',
      referenceUrl: 'https://nasa.gov'
    }
  });

  const launcher = getLauncher('launch_electron'); // Tiny 300kg launcher
  const scenario = getScenario('scenario_asteria_1');

  const validation = validateMissionDesign(heavyDesign, launcher, scenario);
  assert.equal(validation.isLaunchAllowed, false);
  assert.ok(validation.hardViolations.some((v) => v.includes('MASS EXCEEDED')));

  const massMargin = calculateMassMargin(300, 35000);
  assert.equal(massMargin.isValid, false);
  assert.ok(massMargin.marginKg < 0);
});

test('Hostile QA: Propellant Exhaustion to 0 in Transit', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  let telemetry = createInitialTelemetry(design, launcher, scenario);

  // Forcibly drain propellant to 0
  telemetry.propellantRemainingKg = 0;
  telemetry.deltaVRemainingMs = 0;

  // Advance simulation through insertion and approach
  const next = advanceSimulationTick(telemetry, design, scenario, 250);
  assert.equal(next.propellantRemainingKg, 0);
  assert.equal(next.deltaVRemainingMs, 0);
  assert.ok(next.spacecraftHealth < 100); // Suffers trajectory penalty
  assert.ok(!Number.isNaN(next.spacecraftHealth));
});

test('Hostile QA: Simulation Stepping to Day 350 (Past Conclusion)', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  let telemetry = createInitialTelemetry(design, launcher, scenario);

  // Directly advance by 350 days
  telemetry = advanceSimulationTick(telemetry, design, scenario, 350);
  assert.equal(telemetry.currentStage, 'mission_conclusion');
  assert.equal(telemetry.stageProgress, 1.0);
  assert.ok(telemetry.missionElapsedTimeDays >= 300);

  // Debrief calculation on completed telemetry
  const debrief = calculateMissionDebrief(design, launcher, scenario, telemetry, []);
  assert.ok(debrief.compositeScore >= 0 && debrief.compositeScore <= 1000);
  assert.ok(debrief.outcome !== undefined);
  assert.ok(debrief.causalFactors.length > 0);
  assert.ok(debrief.cinematicTimeline.length > 0);
});
