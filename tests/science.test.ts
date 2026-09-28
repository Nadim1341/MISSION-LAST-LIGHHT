import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSubsystemTotals } from '../src/engine/math/rocket.ts';
import { calculateMissionDebrief } from '../src/engine/scoring.ts';
import { createInitialTelemetry } from '../src/simulation/engine.ts';
import { createNominalAsteria1Design, getLauncher, getScenario } from './fixtures.ts';

test('Science Engine: totals aggregate individual instrument science yield and data rates', () => {
  const design = createNominalAsteria1Design();
  const totals = calculateSubsystemTotals(design);

  // Design has PolyCam (45 pts, 1800 kbps) + OLA LIDAR (38 pts, 1200 kbps) + X-Band HGA (450 kbps) + S-Band (14 kbps)
  assert.equal(totals.sciencePotential, 83); // 45 + 38
  assert.equal(totals.dataGenerationRateKbps, 3464); // 1800 + 1200 + 450 + 14
});

test('Science Engine: debrief calculates 8-axis scores and composite score', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  const telemetry = createInitialTelemetry(design, launcher, scenario);

  // Simulate mission completion values
  telemetry.missionElapsedTimeDays = 320;
  telemetry.rawScienceCollected = 95.0; // High science collected
  telemetry.scienceDataTransmitted = 12000.0; // 12 GB downlinked
  telemetry.propellantRemainingKg = 45.0; // Reserve maintained
  telemetry.spacecraftHealth = 92;

  const eventResolutions = [
    {
      eventId: 'evt_solar_storm',
      actionTaken: 'SAFE_MODE',
      causalHeadline: 'SAFE MODE SHIELDED AVIONICS',
      causalDetail: 'Protected electronics from proton flux.'
    }
  ];

  const debrief = calculateMissionDebrief(design, launcher, scenario, telemetry, eventResolutions);

  // Composite score should be 0 - 1000
  assert.ok(debrief.compositeScore >= 0 && debrief.compositeScore <= 1000);
  assert.equal(debrief.outcome, 'FULL_SUCCESS');

  // Verify all 8 axes are present and bounded [0, 100]
  const axes = debrief.axisScores;
  assert.ok(axes.scientificReturn >= 70 && axes.scientificReturn <= 100);
  assert.ok(axes.engineeringEfficiency >= 0 && axes.engineeringEfficiency <= 100);
  assert.ok(axes.budgetDiscipline >= 0 && axes.budgetDiscipline <= 100);
  assert.ok(axes.systemReliability >= 70 && axes.systemReliability <= 100);
  assert.ok(axes.riskManagement >= 0 && axes.riskManagement <= 100);
  assert.ok(axes.telecomPerformance >= 70 && axes.telecomPerformance <= 100);
  assert.ok(axes.resourceDiscipline >= 0 && axes.resourceDiscipline <= 100);
  assert.ok(axes.thermalPowerStability >= 0 && axes.thermalPowerStability <= 100);

  // Causal factors should explain why the mission succeeded
  assert.ok(debrief.causalFactors.length > 0);
  assert.ok(debrief.cinematicTimeline.length >= 5);
});

test('Science Engine: debrief reports failure when health collapses or science is missed', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  const telemetry = createInitialTelemetry(design, launcher, scenario);

  // Simulate failed mission
  telemetry.rawScienceCollected = 10.0; // Missed mandatory threshold (60)
  telemetry.spacecraftHealth = 20; // Critical damage

  const debrief = calculateMissionDebrief(design, launcher, scenario, telemetry, []);
  assert.equal(debrief.outcome, 'CRITICAL_FAILURE');
  assert.ok(debrief.compositeScore < 500);
});
