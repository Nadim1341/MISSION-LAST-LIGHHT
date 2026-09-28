export const SPEED_OF_LIGHT_KMS = 299792.458;
export const AU_TO_KM = 149597870.7;

/**
 * Calculates one-way light time (OWLT) in seconds given distance in AU.
 */
export function calculateOneWayLightTimeSec(distanceAu: number): number {
  const distanceKm = distanceAu * AU_TO_KM;
  return Number((distanceKm / SPEED_OF_LIGHT_KMS).toFixed(1));
}

/**
 * Calculates effective downlink data rate (kbps) to NASA Deep Space Network.
 * Downlink rate scales with inverse square of distance (Friis path loss)
 * and linearly with transmitter power and antenna gain.
 */
export function calculateDownlinkRateKbps(
  baseDataRateAt1AuKbps: number,
  distanceAu: number,
  groundStationDiameterM: number = 34
): number {
  if (distanceAu <= 0) distanceAu = 1.0;
  if (baseDataRateAt1AuKbps <= 0) return 0;

  // Path loss drops as 1 / d^2
  const distanceLossFactor = 1.0 / (distanceAu * distanceAu);

  // 70m dish provides roughly 4x the aperture gain of 34m dish
  const stationApertureFactor = Math.pow(groundStationDiameterM / 34, 2);

  const effectiveRate = baseDataRateAt1AuKbps * distanceLossFactor * stationApertureFactor;
  return Number(Math.max(1.0, effectiveRate).toFixed(1));
}

/**
 * Updates solid-state recorder (SSR) data buffer over a time step (seconds).
 * Accumulates newly collected science data and drains data transmitted during DSN pass.
 */
export function updateDataBuffer(
  currentBufferMb: number,
  bufferCapacityMb: number,
  instrumentGenerationRateKbps: number,
  downlinkRateKbps: number,
  isInDsnPass: boolean,
  durationSec: number
): {
  newBufferMb: number;
  dataGeneratedMb: number;
  dataTransmittedMb: number;
  dataLostDueToOverflowMb: number;
  isBufferFull: boolean;
} {
  // Convert kbps * seconds to Megabytes (1 Byte = 8 bits, 1 MB = 8000 kilobits)
  const dataGeneratedMb = (instrumentGenerationRateKbps * durationSec) / 8000;
  const potentialDownlinkMb = isInDsnPass ? (downlinkRateKbps * durationSec) / 8000 : 0;

  const actualDownlinkMb = Math.min(currentBufferMb + dataGeneratedMb, potentialDownlinkMb);
  const netBufferBeforeCap = currentBufferMb + dataGeneratedMb - actualDownlinkMb;

  let newBufferMb = netBufferBeforeCap;
  let dataLostDueToOverflowMb = 0;

  if (bufferCapacityMb > 0 && newBufferMb > bufferCapacityMb) {
    dataLostDueToOverflowMb = newBufferMb - bufferCapacityMb;
    newBufferMb = bufferCapacityMb;
  }

  return {
    newBufferMb: Number(newBufferMb.toFixed(2)),
    dataGeneratedMb: Number(dataGeneratedMb.toFixed(2)),
    dataTransmittedMb: Number(actualDownlinkMb.toFixed(2)),
    dataLostDueToOverflowMb: Number(dataLostDueToOverflowMb.toFixed(2)),
    isBufferFull: bufferCapacityMb > 0 && newBufferMb >= bufferCapacityMb
  };
}
