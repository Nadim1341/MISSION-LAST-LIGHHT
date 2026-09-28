import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSolarIrradiance,
  calculateSolarPowerGeneration,
  calculateBatteryDoD,
  SOLAR_CONSTANT_EARTH_WM2
} from '../src/engine/math/power.ts';
import { calculateSubsystemTotals } from '../src/engine/math/rocket.ts';
import { createNominalAsteria1Design } from './fixtures.ts';

test('Power Engine: inverse square law for solar irradiance', () => {
  // At 1.0 AU: exactly S0 = 1361 W/m^2
  assert.equal(calculateSolarIrradiance(1.0), SOLAR_CONSTANT_EARTH_WM2);

  // At 2.0 AU: S0 / 4 = 340.25 W/m^2
  assert.equal(calculateSolarIrradiance(2.0), SOLAR_CONSTANT_EARTH_WM2 / 4);

  // At Bennu aphelion (1.356 AU): S0 / (1.356)^2 ≈ 740.2 W/m^2 (54.4% of Earth)
  const irradianceBennu = calculateSolarIrradiance(1.356);
  assert.ok(Math.abs(irradianceBennu - 740.2) < 1.0);
});

test('Power Engine: solar panel generation scaling vs RTG constant output', () => {
  const solarBaseW = 650; // UltraFlex at 1 AU
  const rtgConstantW = 110; // MMRTG constant output

  // At 1.0 AU
  const powerAt1Au = calculateSolarPowerGeneration(solarBaseW, 1.0, rtgConstantW);
  assert.equal(powerAt1Au, 760.0);

  // At 1.356 AU (Bennu): solar drops to 650 / (1.356)^2 ≈ 353.5 W
  const powerAtBennu = calculateSolarPowerGeneration(solarBaseW, 1.356, rtgConstantW);
  assert.ok(Math.abs(powerAtBennu - (353.5 + 110)) < 1.0);

  // For pure RTG (solar = 0) at 10 AU (Kuiper belt): power stays exactly 110W
  const rtgDeepSpace = calculateSolarPowerGeneration(0, 10.0, rtgConstantW);
  assert.equal(rtgDeepSpace, 110.0);
});

test('Power Engine: battery Depth of Discharge (DoD) during shadow eclipse', () => {
  const batteryJoules = 1200 * 3600; // 4.32 MJ (1200 Wh battery)
  const consumptionW = 200; // 200 W active bus load
  const eclipseDurationSec = 3600; // 60 minutes eclipse

  const result = calculateBatteryDoD(batteryJoules, consumptionW, eclipseDurationSec);

  // Drained: 200 W * 3600 s = 720,000 J (0.72 MJ)
  assert.equal(result.joulesDrained, 720000);
  assert.equal(result.remainingJoules, batteryJoules - 720000);
  // DoD = 720,000 / 4,320,000 = 0.167 (16.7% DoD)
  assert.equal(result.depthOfDischargeRatio, 0.167);
  assert.equal(result.isCellDamaged, false);
  assert.equal(result.isBusBrownout, false);
});

test('Power Engine: flags cell damage and brownout when DoD exceeds thresholds', () => {
  const batteryJoules = 100000; // Small 100 kJ battery
  const consumptionW = 100;
  const longEclipseSec = 800; // 80 kJ drain -> 80% DoD

  const damagedResult = calculateBatteryDoD(batteryJoules, consumptionW, longEclipseSec);
  assert.equal(damagedResult.depthOfDischargeRatio, 0.8);
  assert.equal(damagedResult.isCellDamaged, true);
  assert.equal(damagedResult.isBusBrownout, false);

  // Total drain exceeding capacity -> brownout
  const brownoutResult = calculateBatteryDoD(batteryJoules, consumptionW, 1100);
  assert.equal(brownoutResult.isBusBrownout, true);
});

test('Power Engine: net power margin calculation on spacecraft bus', () => {
  const design = createNominalAsteria1Design();
  const totals = calculateSubsystemTotals(design);

  // Power generation is positive, consumption is positive, net margin = gen - con
  assert.ok(totals.powerGenerationW > 0);
  assert.ok(totals.powerConsumptionW > 0);
  assert.equal(totals.netPowerMarginW, Number((totals.powerGenerationW - totals.powerConsumptionW).toFixed(1)));
});
