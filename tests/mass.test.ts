import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSubsystemTotals } from '../src/engine/math/rocket.ts';
import { calculateLauncherCapacityAtC3, calculateMassMargin } from '../src/engine/math/orbital.ts';
import { validateMissionDesign } from '../src/engine/validator.ts';
import { createNominalAsteria1Design, getLauncher, getScenario } from './fixtures.ts';

test('Mass Engine: dry mass, propellant mass, and wet mass summation', () => {
  const design = createNominalAsteria1Design();
  const totals = calculateSubsystemTotals(design);

  // Sum dry mass across components
  let expectedDry = 0;
  let expectedPropellant = 0;
  for (const cat of Object.keys(design.components) as (keyof typeof design.components)[]) {
    for (const item of design.components[cat]) {
      expectedDry += item.massKg;
      if (item.propellantCapacityKg) {
        expectedPropellant += item.propellantCapacityKg;
      }
    }
  }

  assert.equal(totals.dryMassKg, Number(expectedDry.toFixed(1)));
  assert.equal(totals.propellantMassKg, Number(expectedPropellant.toFixed(1)));
  assert.equal(totals.totalWetMassKg, Number((totals.dryMassKg + totals.propellantMassKg).toFixed(1)));
});

test('Mass Engine: linear interpolation of launch vehicle C3 payload capacity', () => {
  const falcon9 = getLauncher('launch_falcon9');

  // Curve: C3 = 15 -> 3100 kg, C3 = 25 -> 1950 kg
  // At C3 = 18.5 (Bennu requirement):
  // fraction = (18.5 - 15) / (25 - 15) = 3.5 / 10 = 0.35
  // capacity = 3100 + 0.35 * (1950 - 3100) = 3100 - 402.5 = 2697.5 -> 2698 kg
  const capacityAt18_5 = calculateLauncherCapacityAtC3(falcon9, 18.5);
  assert.equal(capacityAt18_5, 2698);

  // Edge cases
  assert.equal(calculateLauncherCapacityAtC3(falcon9, 0), 5200);
  assert.equal(calculateLauncherCapacityAtC3(falcon9, 10), 3850);
  assert.equal(calculateLauncherCapacityAtC3(falcon9, 50), 650);
});

test('Mass Engine: positive mass margin calculation', () => {
  const design = createNominalAsteria1Design();
  const totals = calculateSubsystemTotals(design);
  const falcon9 = getLauncher('launch_falcon9');
  const capacity = calculateLauncherCapacityAtC3(falcon9, 18.5); // 2698 kg

  const margin = calculateMassMargin(capacity, totals.totalWetMassKg);
  assert.ok(margin.isValid, 'Nominal design must be within launcher capacity');
  assert.equal(margin.marginKg, Number((capacity - totals.totalWetMassKg).toFixed(1)));
  assert.ok(margin.marginPercentage > 20, 'Nominal spacecraft should have healthy mass margin');
});

test('Mass Engine: flags hard violation when spacecraft wet mass exceeds launch vehicle capacity', () => {
  const design = createNominalAsteria1Design();
  const totals = calculateSubsystemTotals(design); // ~400 kg
  const electron = getLauncher('launch_electron'); // Max 14 kg at C3 = 15
  const scenario = getScenario('scenario_asteria_1');

  const validation = validateMissionDesign(design, electron, scenario);

  assert.equal(validation.isLaunchAllowed, false);
  const massViolation = validation.hardViolations.find((v) => v.includes('MASS EXCEEDED'));
  assert.ok(massViolation, 'Must report MASS EXCEEDED when trying to launch deep space mission on Electron');
});
