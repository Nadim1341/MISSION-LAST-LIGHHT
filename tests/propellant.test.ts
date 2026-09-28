import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTsiolkovskyDeltaV,
  calculatePropellantRequired,
  calculateSubsystemTotals,
  STANDARD_GRAVITY
} from '../src/engine/math/rocket.ts';
import { createNominalAsteria1Design } from './fixtures.ts';

test('Propellant Engine: Tsiolkovsky rocket equation exact calculation', () => {
  const dryMass = 1000; // kg
  const propMass = 1000; // kg (wet mass = 2000 kg, mass ratio = 2.0)
  const isp = 300; // seconds

  // DeltaV = 300 * 9.80665 * ln(2) = 2941.995 * 0.693147 = 2039.23 m/s
  const deltaV = calculateTsiolkovskyDeltaV(dryMass, propMass, isp);
  const expected = isp * STANDARD_GRAVITY * Math.log(2.0);

  assert.ok(Math.abs(deltaV - expected) < 0.01, `Expected ${expected}, got ${deltaV}`);
});

test('Propellant Engine: Ion propulsion vs Chemical bipropellant trade-off', () => {
  const payloadDryMass = 300; // kg
  const targetDeltaV = 1500; // m/s required for deep space rendezvous

  // Chemical engine: Isp = 321 s
  const propRequiredChemical = calculatePropellantRequired(payloadDryMass, targetDeltaV, 321);
  // Electric Ion thruster: Isp = 3100 s
  const propRequiredIon = calculatePropellantRequired(payloadDryMass, targetDeltaV, 3100);

  // Chemical needs ~180 kg of propellant
  assert.ok(propRequiredChemical > 170 && propRequiredChemical < 195, `Chemical required: ${propRequiredChemical} kg`);
  // Ion needs only ~15 kg of xenon!
  assert.ok(propRequiredIon > 14 && propRequiredIon < 17, `Ion required: ${propRequiredIon} kg`);

  // Ion propellant required is more than 10x less than chemical
  assert.ok(propRequiredChemical > propRequiredIon * 10);
});

test('Propellant Engine: inverse propellant calculation round-trip verification', () => {
  const dryMass = 450;
  const targetDeltaV = 1240; // Bennu mission requirement
  const isp = 321;

  const propRequired = calculatePropellantRequired(dryMass, targetDeltaV, isp);
  const calculatedDeltaV = calculateTsiolkovskyDeltaV(dryMass, propRequired, isp);

  assert.ok(Math.abs(calculatedDeltaV - targetDeltaV) < 0.1, 'Round-trip calculation must match');
});

test('Propellant Engine: spacecraft totals include propellant and compute available delta-v', () => {
  const design = createNominalAsteria1Design();
  const totals = calculateSubsystemTotals(design);

  assert.ok(totals.propellantMassKg > 0);
  assert.ok(totals.totalDeltaVMs > 1240, `Nominal design must provide at least Bennu requirement (1240 m/s), got ${totals.totalDeltaVMs} m/s`);
  assert.equal(totals.effectiveIspSec, 321);
});
