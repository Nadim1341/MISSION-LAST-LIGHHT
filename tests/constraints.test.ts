import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMissionDesign } from '../src/engine/validator.ts';
import { createNominalAsteria1Design, getLauncher, getScenario, getComponent } from './fixtures.ts';

test('Constraints Engine: allows launch for valid nominal design', () => {
  const design = createNominalAsteria1Design();
  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');

  const validation = validateMissionDesign(design, launcher, scenario);
  assert.equal(validation.isLaunchAllowed, true);
  assert.equal(validation.hardViolations.length, 0);
});

test('Constraints Engine: blocks launch when mandatory subsystem is missing', () => {
  const design = createNominalAsteria1Design();
  // Strip communications subsystem completely
  design.components.communications = [];

  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');

  const validation = validateMissionDesign(design, launcher, scenario);
  assert.equal(validation.isLaunchAllowed, false);
  const commsMissing = validation.hardViolations.find((v) => v.includes('[COMMUNICATIONS]'));
  assert.ok(commsMissing, 'Must report missing COMMUNICATIONS subsystem');
});

test('Constraints Engine: blocks launch when delta-V is insufficient for destination', () => {
  const design = createNominalAsteria1Design();
  // Strip main chemical engine, leaving only small RCS thrusters with tiny delta-V
  design.components.propulsion = [getComponent('prop_hydrazine_rcs')];

  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1'); // Requires 1240 m/s

  const validation = validateMissionDesign(design, launcher, scenario);
  assert.equal(validation.isLaunchAllowed, false);
  const deltaVViolation = validation.hardViolations.find((v) => v.includes('INSUFFICIENT DELTA-V'));
  assert.ok(deltaVViolation, 'Must report INSUFFICIENT DELTA-V violation');
});

test('Constraints Engine: triggers soft warnings for low margins without blocking launch', () => {
  const design = createNominalAsteria1Design();
  // Replace rad-hardened computer with low-tolerance commercial COTS computer (35 krad)
  design.components.computing = [getComponent('comp_cots_arm_dual')];

  const launcher = getLauncher('launch_falcon9');
  const scenario = getScenario('scenario_asteria_1');

  const validation = validateMissionDesign(design, launcher, scenario);
  // Still allowed to launch (soft constraint)
  assert.equal(validation.isLaunchAllowed, true);
  // But has soft warning regarding radiation
  const radWarning = validation.softWarnings.find((w) => w.includes('RADIATION HAZARD'));
  assert.ok(radWarning, 'Must issue radiation vulnerability soft warning');
});
