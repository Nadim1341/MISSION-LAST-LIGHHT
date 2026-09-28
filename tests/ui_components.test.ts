import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSubsystemTotals } from '../src/engine/math/rocket.ts';
import { validateMissionDesign } from '../src/engine/validator.ts';
import { calculateMissionReadiness } from '../src/engine/readiness.ts';
import { runMissionStressTests } from '../src/engine/stressTest.ts';
import { AEROSPACE_GLOSSARY } from '../src/data/glossary.ts';
import { createNominalAsteria1Design, createBudgetVulnerableDesign, getLauncher, getScenario, getComponent } from './fixtures.ts';

test('UI Design Engine: supports mounting and unmounting components dynamically', () => {
  const design = createNominalAsteria1Design();
  const initialTotals = calculateSubsystemTotals(design);

  // Mount an additional instrument (OTES Thermal Spectrometer)
  const otes = getComponent('sci_thermal_spectrometer');
  design.components.science.push(otes);
  const updatedTotals = calculateSubsystemTotals(design);

  assert.equal(updatedTotals.dryMassKg, Number((initialTotals.dryMassKg + otes.massKg).toFixed(1)));
  assert.equal(updatedTotals.sciencePotential, initialTotals.sciencePotential + otes.scienceYield);
  assert.equal(updatedTotals.dataGenerationRateKbps, initialTotals.dataGenerationRateKbps + otes.dataRateKbps);

  // Unmount PolyCam
  design.components.science = design.components.science.filter((s) => s.id !== 'sci_multispectral_imager');
  const postRemovalTotals = calculateSubsystemTotals(design);
  assert.ok(postRemovalTotals.sciencePotential < updatedTotals.sciencePotential);
});

test('UI Design Engine: Commander vs Engineer telemetry fields are defined and valid', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  const totals = calculateSubsystemTotals(design);
  const validation = validateMissionDesign(design, launcher, scenario);

  // Commander mode values
  assert.ok(totals.propellantMassKg > 0);
  assert.ok(totals.netPowerMarginW > 0);
  assert.ok(totals.sciencePotential > 0);
  assert.ok(totals.baseReliability > 0);

  // Engineer mode advanced metrics
  assert.ok(totals.totalDeltaVMs > 0);
  assert.ok(totals.effectiveIspSec > 0);
  assert.ok(totals.radiationToleranceKrad >= 50);
  assert.ok(validation.metrics.massMarginPct > 0);
});

test('UI Design Engine: educational glossary contains all core aerospace concepts', () => {
  const requiredKeys = ['deltaV', 'isp', 'c3', 'linkBudget', 'batteryDoD', 'radHardening'];
  for (const key of requiredKeys) {
    const entry = AEROSPACE_GLOSSARY[key];
    assert.ok(entry, `Missing glossary entry for ${key}`);
    assert.ok(entry.title.length > 0);
    assert.ok(entry.explanation.length > 0);
  }
});

test('UI Design Engine: stress test modal accurately assesses all 8 space hazards', () => {
  const design = createNominalAsteria1Design();
  const scenario = getScenario('scenario_asteria_1');
  const results = runMissionStressTests(design, scenario);

  assert.equal(results.length, 8);
  const expectedScenarios = [
    'stress_solar_storm',
    'stress_comm_outage',
    'stress_propulsion_loss',
    'stress_thermal_anomaly',
    'stress_battery_degradation',
    'stress_micrometeoroid',
    'stress_nav_sensor_drift',
    'stress_science_opportunity'
  ];

  for (const scenarioId of expectedScenarios) {
    const res = results.find((r) => r.scenarioId === scenarioId);
    assert.ok(res, `Missing stress test result for ${scenarioId}`);
    assert.ok(['PASS', 'WARNING', 'CRITICAL_RISK'].includes(res.status));
    assert.ok(res.projectedConsequence.length > 0);
    assert.ok(res.recommendation.length > 0);
  }
});
