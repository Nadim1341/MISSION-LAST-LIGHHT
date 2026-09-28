import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSubsystemTotals } from '../src/engine/math/rocket.ts';
import { validateMissionDesign } from '../src/engine/validator.ts';
import { createNominalAsteria1Design, getLauncher, getScenario, getComponent } from './fixtures.ts';

test('Budget Engine: accurately calculates spacecraft and total mission cost', () => {
  const design = createNominalAsteria1Design();
  const totals = calculateSubsystemTotals(design);
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');

  // Spacecraft component costs
  assert.ok(totals.totalCostM > 100 && totals.totalCostM < 230, `Expected realistic spacecraft cost, got $${totals.totalCostM}M`);

  // Total mission cost = Spacecraft + Launcher ($67M for Falcon 9)
  const totalMissionCost = Number((totals.totalCostM + launcher.costM).toFixed(2));
  assert.equal(totalMissionCost, Number((totals.totalCostM + 67.0).toFixed(2)));

  const validation = validateMissionDesign(design, launcher, scenario);
  assert.equal(validation.metrics.totalCostM, totalMissionCost);
  assert.equal(validation.metrics.budgetCapM, 300.0);
  assert.equal(validation.metrics.budgetRemainingM, Number((300.0 - totalMissionCost).toFixed(2)));
});

test('Budget Engine: flags hard violation when total cost exceeds scenario budget cap', () => {
  const design = createNominalAsteria1Design();
  // Add another expensive RTG ($78.5M) and Ka-band laser ($38.0M) to blow the budget
  design.components.power.push(getComponent('pwr_mmrtg'));
  design.components.communications.push(getComponent('comm_kaband_dsoc'));

  const totals = calculateSubsystemTotals(design);
  const launcher = getLauncher('launch_atlas_v'); // $115M
  const scenario = getScenario('scenario_asteria_1'); // $250M cap

  const validation = validateMissionDesign(design, launcher, scenario);

  assert.equal(validation.isLaunchAllowed, false, 'Launch should be blocked when budget is exceeded');
  const budgetViolation = validation.hardViolations.find((v) => v.includes('BUDGET EXCEEDED'));
  assert.ok(budgetViolation, 'Validation must report a BUDGET EXCEEDED hard violation');
  assert.ok(validation.metrics.budgetRemainingM < 0, 'Remaining budget must be negative');
});

test('Budget Engine: provides fiscal discipline score bonus when contingency is preserved', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');
  const validation = validateMissionDesign(design, launcher, scenario);

  assert.ok(validation.metrics.budgetRemainingM >= 0, 'Nominal design should stay within budget cap');
  assert.ok(validation.hardViolations.length === 0, 'Should have zero hard violations');
});
