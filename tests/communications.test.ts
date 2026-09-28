import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOneWayLightTimeSec,
  calculateDownlinkRateKbps,
  updateDataBuffer
} from '../src/engine/math/comms.ts';

test('Comms Engine: one-way light time delay calculation', () => {
  // At 1.0 AU (149,597,870.7 km): light delay = 149597870.7 / 299792.458 ≈ 499.0 seconds (~8.3 minutes)
  const delay1Au = calculateOneWayLightTimeSec(1.0);
  assert.equal(delay1Au, 499.0);

  // At Moon distance (~0.00257 AU / 384,400 km): ~1.28 seconds
  const delayMoon = calculateOneWayLightTimeSec(0.00257);
  assert.ok(Math.abs(delayMoon - 1.28) < 0.05);

  // At Mars closest approach (~0.5 AU): ~249.5 seconds (~4.1 minutes)
  const delayMars = calculateOneWayLightTimeSec(0.5);
  assert.equal(delayMars, 249.5);
});

test('Comms Engine: Friis path loss and DSN dish diameter scaling', () => {
  const baseRateAt1Au = 450; // kbps with 34m dish

  // At 1.0 AU with standard 34m dish
  const rate1Au34m = calculateDownlinkRateKbps(baseRateAt1Au, 1.0, 34);
  assert.equal(rate1Au34m, 450.0);

  // At 2.0 AU: drops by 1 / (2^2) = 1/4 -> 112.5 kbps
  const rate2Au34m = calculateDownlinkRateKbps(baseRateAt1Au, 2.0, 34);
  assert.equal(rate2Au34m, 112.5);

  // 70m dish provides roughly (70/34)^2 ≈ 4.24x gain over 34m dish
  const rate1Au70m = calculateDownlinkRateKbps(baseRateAt1Au, 1.0, 70);
  assert.ok(rate1Au70m > 1800, `70m dish rate should be ~1900 kbps, got ${rate1Au70m}`);
});

test('Comms Engine: buffer updates accumulate generated science and drain during DSN pass', () => {
  const initialBufferMb = 500;
  const maxCapacityMb = 10000;
  const instrumentRateKbps = 800; // 800 kbps instrument generation
  const downlinkRateKbps = 1200; // 1200 kbps downlink
  const durationSec = 3600; // 1 hour

  // Case 1: In DSN pass (downlink > generation -> buffer drains)
  const passResult = updateDataBuffer(
    initialBufferMb,
    maxCapacityMb,
    instrumentRateKbps,
    downlinkRateKbps,
    true, // in pass
    durationSec
  );

  // Generated: 800 kbps * 3600 s / 8000 = 360 MB
  assert.equal(passResult.dataGeneratedMb, 360.0);
  // Downlinked: 1200 kbps * 3600 s / 8000 = 540 MB
  assert.equal(passResult.dataTransmittedMb, 540.0);
  // New buffer: 500 + 360 - 540 = 320 MB
  assert.equal(passResult.newBufferMb, 320.0);
  assert.equal(passResult.dataLostDueToOverflowMb, 0);
  assert.equal(passResult.isBufferFull, false);
});

test('Comms Engine: buffer overflow occurs without DSN contact and tracks lost data', () => {
  const initialBufferMb = 900;
  const maxCapacityMb = 1000; // Small 1 GB buffer
  const instrumentRateKbps = 1600; // 1600 kbps high-rate camera
  const durationSec = 1000; // 1000 seconds

  // Out of DSN pass (no downlink)
  const result = updateDataBuffer(
    initialBufferMb,
    maxCapacityMb,
    instrumentRateKbps,
    500,
    false, // No DSN contact
    durationSec
  );

  // Generated: 1600 * 1000 / 8000 = 200 MB
  assert.equal(result.dataGeneratedMb, 200.0);
  assert.equal(result.dataTransmittedMb, 0.0);
  // Would be: 900 + 200 = 1100 MB -> capped at 1000 MB -> 100 MB lost!
  assert.equal(result.newBufferMb, 1000.0);
  assert.equal(result.dataLostDueToOverflowMb, 100.0);
  assert.equal(result.isBufferFull, true);
});
