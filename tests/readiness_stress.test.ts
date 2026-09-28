import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMissionReadiness } from '../src/engine/readiness.ts';
import { runMissionStressTests } from '../src/engine/stressTest.ts';
import { createNominalAsteria1Design, createBudgetVulnerableDesign, getLauncher, getScenario, getComponent } from './fixtures.ts';

test('Readiness Engine: calculates live readiness score and breakdown for nominal design', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');

  const report = calculateMissionReadiness(design, launcher, scenario);

  assert.ok(report.overallScorePct >= 70, `Nominal design should have high readiness, got ${report.overallScorePct}%`);
  assert.equal(report.isFlightReady, true);
  assert.equal(report.blockerReasons.length, 0);

  // Check 8 sub-indices are bounded [0, 100]
  const b = report.breakdown;
  assert.ok(b.science >= 0 && b.science <= 100);
  assert.ok(b.propulsion >= 0 && b.propulsion <= 100);
  assert.ok(b.power >= 0 && b.power <= 100);
  assert.ok(b.communications >= 0 && b.communications <= 100);
  assert.ok(b.thermal >= 0 && b.thermal <= 100);
  assert.ok(b.reliability >= 0 && b.reliability <= 100);
  assert.ok(b.budget >= 0 && b.budget <= 100);
  assert.ok(b.resourceMargin >= 0 && b.resourceMargin <= 100);

  // Budget Triangle
  assert.ok(report.triangle.science >= 0 && report.triangle.science <= 100);
  assert.ok(report.triangle.survivability >= 0 && report.triangle.survivability <= 100);
  assert.ok(report.triangle.affordability >= 0 && report.triangle.affordability <= 100);
});

test('Readiness Engine: identifies primary weakness when communications is undersized', () => {
  const design = createNominalAsteria1Design();
  // Downgrade communications to basic S-band omni (14 kbps, 0 buffer) while keeping high-yield PolyCam
  design.components.communications = [getComponent('comm_sband_lga_omni')];

  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');

  const report = calculateMissionReadiness(design, launcher, scenario);

  assert.equal(report.primaryWeakness.subsystem, 'communications');
  assert.ok(report.primaryWeakness.title.includes('COMMUNICATIONS'));
  assert.ok(report.primaryWeakness.suggestedAction.length > 0);
});

test('Stress Test Engine: executes 8 stress tests against nominal design', () => {
  const design = createNominalAsteria1Design();
  const scenario = getScenario('scenario_asteria_1');

  const results = runMissionStressTests(design, scenario);
  assert.equal(results.length, 8, 'Must execute exactly 8 pre-launch stress tests');

  // Verify specific tests pass on the nominal hardened design
  const solarStorm = results.find((r) => r.scenarioId === 'stress_solar_storm');
  assert.equal(solarStorm?.status, 'PASS'); // 100 krad RAD750 passes

  const commOutage = results.find((r) => r.scenarioId === 'stress_comm_outage');
  assert.equal(commOutage?.status, 'PASS'); // 32 GB buffer passes

  const propulsionLoss = results.find((r) => r.scenarioId === 'stress_propulsion_loss');
  assert.equal(propulsionLoss?.status, 'PASS'); // Redundant propulsion passes

  const micrometeoroid = results.find((r) => r.scenarioId === 'stress_micrometeoroid');
  assert.equal(micrometeoroid?.status, 'PASS'); // Whipple shield passes
});

test('Stress Test Engine: flags critical risks on vulnerable spacecraft design', () => {
  const vulnerableDesign = createBudgetVulnerableDesign();
  const scenario = getScenario('scenario_asteria_1');

  const results = runMissionStressTests(vulnerableDesign, scenario);
  assert.equal(results.length, 8);

  // Solar storm should be CRITICAL_RISK on commercial COTS processor (35 krad)
  const solarStorm = results.find((r) => r.scenarioId === 'stress_solar_storm');
  assert.equal(solarStorm?.status, 'CRITICAL_RISK');

  // Battery degradation should be CRITICAL_RISK with no dedicated battery
  const batteryTest = results.find((r) => r.scenarioId === 'stress_battery_degradation');
  assert.equal(batteryTest?.status, 'CRITICAL_RISK');
});
