import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialTelemetry,
  advanceSimulationTick,
  applyEventConsequenceToTelemetry,
  getUpcomingOrActiveEvent,
  getForeshadowedEventAdvisories
} from '../src/simulation/engine.ts';
import {
  FORESHADOWED_MISSION_EVENTS,
  resolveEventConsequence
} from '../src/simulation/events.ts';
import { calculateMissionDebrief } from '../src/engine/scoring.ts';
import {
  createNominalAsteria1Design,
  createBudgetVulnerableDesign,
  getLauncher,
  getScenario,
  getComponent
} from './fixtures.ts';

test('Simulation Engine: initial telemetry matches physics and subsystem configuration', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');

  const telemetry = createInitialTelemetry(design, launcher, scenario);

  assert.equal(telemetry.missionElapsedTimeDays, 0);
  assert.equal(telemetry.currentStage, 'pre_launch');
  assert.equal(telemetry.distanceFromSunAu, 1.0);
  assert.equal(telemetry.distanceFromEarthAu, 0.002);
  assert.ok(telemetry.solarGenerationW >= 600);
  assert.ok(telemetry.batteryCapacityJoules > 0);
  assert.equal(telemetry.batteryStateOfCharge, 1.0);
  assert.ok(telemetry.propellantRemainingKg > 0);
  assert.equal(telemetry.spacecraftHealth, 100);
  assert.equal(telemetry.subsystemHealth.computing, 100);
  assert.equal(telemetry.subsystemHealth.propulsion, 100);
});

test('Simulation Engine: advances through mission stages as MET increases', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  let telemetry = createInitialTelemetry(design, launcher, scenario);

  // Tick to Day 0.5 -> Launch
  telemetry = advanceSimulationTick(telemetry, design, scenario, 0.5);
  assert.equal(telemetry.currentStage, 'launch');

  // Tick to Day 5 -> Orbit Insertion
  telemetry = advanceSimulationTick(telemetry, design, scenario, 4.5);
  assert.equal(telemetry.currentStage, 'orbit_insertion');

  // Tick to Day 50 -> Cruise
  telemetry = advanceSimulationTick(telemetry, design, scenario, 45.0);
  assert.equal(telemetry.currentStage, 'cruise');
  assert.ok(telemetry.distanceFromSunAu > 1.0); // Moving out toward Bennu
  assert.ok(telemetry.solarGenerationW < 1200); // Solar flux drops with 1/d^2

  // Tick to Day 220 -> Approach
  telemetry = advanceSimulationTick(telemetry, design, scenario, 170.0);
  assert.equal(telemetry.currentStage, 'approach');

  // Tick to Day 260 -> Science Operations
  telemetry = advanceSimulationTick(telemetry, design, scenario, 40.0);
  assert.equal(telemetry.currentStage, 'science_operations');
  assert.ok(telemetry.rawScienceCollected > 0); // Active observation yield

  // Tick to Day 320 -> Mission Conclusion
  telemetry = advanceSimulationTick(telemetry, design, scenario, 60.0);
  assert.equal(telemetry.currentStage, 'mission_conclusion');
});

test('Event Engine: contains all 8 authentic spaceflight hazards across timeline', () => {
  assert.equal(FORESHADOWED_MISSION_EVENTS.length, 8);
  const expectedHazards = [
    'solar_storm',
    'communication_blackout',
    'micrometeoroid_strike',
    'propellant_leak',
    'thermal_anomaly',
    'navigation_error',
    'scientific_discovery',
    'battery_degradation'
  ];

  for (const hazard of expectedHazards) {
    const evt = FORESHADOWED_MISSION_EVENTS.find((e) => e.hazardType === hazard);
    assert.ok(evt, `Missing hazard event for ${hazard}`);
    assert.ok(evt.scheduledMetDay > 0);
    assert.ok(evt.availableActions.length >= 2);
  }
});

test('Event Engine: Player Decision Influence — Solar Storm (RAD750 vs COTS Computing)', () => {
  const nominalDesign = createNominalAsteria1Design();
  const cotsDesign = createBudgetVulnerableDesign();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  const telemetry = createInitialTelemetry(nominalDesign, launcher, scenario);

  const solarEvent = FORESHADOWED_MISSION_EVENTS.find((e) => e.hazardType === 'solar_storm')!;

  // 1. RAD750 design pushing through ops: protected by 100 krad silicon
  const radResolution = resolveEventConsequence(solarEvent, 'CONTINUE_OPS', nominalDesign, telemetry);
  assert.equal(radResolution.damagePercent, 0);
  assert.ok(radResolution.scienceGainedPoints > 0);
  assert.equal(radResolution.mitigatedByHardware, 'RAD750 Radiation-Hardened Computer');

  // 2. COTS ARM design pushing through ops: suffers severe bitflips and damage
  const cotsResolution = resolveEventConsequence(solarEvent, 'CONTINUE_OPS', cotsDesign, telemetry);
  assert.ok(cotsResolution.damagePercent >= 35);
  assert.equal(cotsResolution.subsystemDamaged, 'computing');
  assert.equal(cotsResolution.mitigatedByHardware, null);

  // 3. Pre-launch stress warning ignored: damage is further magnified!
  const ignoredResolution = resolveEventConsequence(solarEvent, 'CONTINUE_OPS', cotsDesign, telemetry, {
    testedStress: true,
    ignoredWeaknessWarning: true,
    unresolvedRisksCount: 2,
    initialLaunchVehicle: 'launch_falcon9',
    hasRedesignedAfterStress: false,
    primaryWeaknessTitle: 'Radiation & Computing Vulnerability'
  });
  assert.ok(ignoredResolution.damagePercent > cotsResolution.damagePercent);
});

test('Event Engine: Player Decision Influence — Whipple Debris Shielding', () => {
  const shieldedDesign = createNominalAsteria1Design();
  const unshieldedDesign = createBudgetVulnerableDesign();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  const telemetry = createInitialTelemetry(shieldedDesign, launcher, scenario);

  const debrisEvent = FORESHADOWED_MISSION_EVENTS.find((e) => e.hazardType === 'micrometeoroid_strike')!;

  // Shielded spacecraft absorbs impacts with zero damage
  const shieldedRes = resolveEventConsequence(debrisEvent, 'CONTINUE_OPS', shieldedDesign, telemetry);
  assert.equal(shieldedRes.damagePercent, 0);
  assert.equal(shieldedRes.mitigatedByHardware, 'Whipple Debris Shield');

  // Unshielded spacecraft hull is punctured, losing structural integrity and propellant
  const unshieldedRes = resolveEventConsequence(debrisEvent, 'CONTINUE_OPS', unshieldedDesign, telemetry);
  assert.ok(unshieldedRes.damagePercent >= 20);
  assert.ok(unshieldedRes.propellantConsumedKg > 0); // Leakage
});

test('Event Engine: Player Decision Influence — Serendipitous Plume Fly-through', () => {
  const nominalDesign = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  const telemetry = createInitialTelemetry(nominalDesign, launcher, scenario);
  telemetry.propellantRemainingKg = 80.0; // Ample fuel

  const plumeEvent = FORESHADOWED_MISSION_EVENTS.find((e) => e.hazardType === 'scientific_discovery')!;

  // Fly-through with sufficient fuel and Whipple shield returns maximum +75 science!
  const bonusRes = resolveEventConsequence(plumeEvent, 'OBSERVE_BONUS', nominalDesign, telemetry);
  assert.equal(bonusRes.scienceGainedPoints, 75);
  assert.equal(bonusRes.propellantConsumedKg, 18.0);
  assert.equal(bonusRes.damagePercent, 0);

  // If fuel is low (e.g. 5 kg left), burn runs out of fuel
  const lowFuelTelemetry = { ...telemetry, propellantRemainingKg: 5.0 };
  const lowFuelRes = resolveEventConsequence(plumeEvent, 'OBSERVE_BONUS', nominalDesign, lowFuelTelemetry);
  assert.equal(lowFuelRes.scienceGainedPoints, 30);
  assert.ok(lowFuelRes.damagePercent > 0);
});

test('Simulation & Event Integration: updates telemetry and feeds debrief causal factors', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  let telemetry = createInitialTelemetry(design, launcher, scenario);

  const event = FORESHADOWED_MISSION_EVENTS[0];
  const resolution = resolveEventConsequence(event, 'CONTINUE_OPS', design, telemetry);

  telemetry = applyEventConsequenceToTelemetry(telemetry, resolution, design);

  assert.ok(telemetry.rawScienceCollected >= 15);
  assert.equal(telemetry.subsystemHealth.computing, 100);

  // Set nominal full-mission telemetry values
  telemetry.rawScienceCollected = 85;
  telemetry.scienceDataTransmitted = 12500;
  telemetry.currentStage = 'mission_conclusion';
  telemetry.missionElapsedTimeDays = 320;

  // Generate debrief
  const debrief = calculateMissionDebrief(
    design,
    launcher,
    scenario,
    telemetry,
    [resolution],
    {
      testedStress: true,
      ignoredWeaknessWarning: false,
      unresolvedRisksCount: 0,
      initialLaunchVehicle: 'launch_falcon9',
      hasRedesignedAfterStress: true
    }
  );

  assert.ok(debrief.compositeScore > 600);
  assert.ok(debrief.causalFactors.length > 0);

  // Verify that iterating design based on pre-launch stress testing is highlighted in debrief
  const stressFactor = debrief.causalFactors.find((f) => f.playerDecision.includes('Pre-Launch Stress Testing'));
  assert.ok(stressFactor, 'Expected debrief to record pre-launch stress test iteration causal factor');
  assert.equal(stressFactor.severity, 'BRILLIANT_DESIGN');
});
