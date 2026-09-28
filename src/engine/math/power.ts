export const SOLAR_CONSTANT_EARTH_WM2 = 1361.0; // W/m^2 at 1 AU

/**
 * Calculates solar irradiance in W/m^2 at distance d from Sun in AU:
 * S(d) = S0 * (1 / d)^2
 */
export function calculateSolarIrradiance(distanceAu: number): number {
  if (distanceAu <= 0) return SOLAR_CONSTANT_EARTH_WM2;
  return SOLAR_CONSTANT_EARTH_WM2 / (distanceAu * distanceAu);
}

/**
 * Calculates solar array electrical generation scaled by distance from Sun.
 * Note: RTGs are non-solar and generate constant wattage regardless of distance.
 */
export function calculateSolarPowerGeneration(
  solarPowerAt1AuW: number,
  distanceAu: number,
  rtgPowerConstantW: number = 0
): number {
  if (distanceAu <= 0) distanceAu = 1.0;
  const solarFactor = 1.0 / (distanceAu * distanceAu);
  const currentSolarW = solarPowerAt1AuW * solarFactor;
  return Number((currentSolarW + rtgPowerConstantW).toFixed(1));
}

/**
 * Calculates battery Depth-of-Discharge (DoD) during an eclipse period.
 * Returns percentage (0.0 to 1.0). DoD > 0.70 causes degradation; > 0.85 risks brownout.
 */
export function calculateBatteryDoD(
  totalBatteryCapacityJoules: number,
  consumptionRateWatts: number,
  eclipseDurationSeconds: number
): {
  joulesDrained: number;
  remainingJoules: number;
  depthOfDischargeRatio: number; // 0.0 - 1.0
  isCellDamaged: boolean;
  isBusBrownout: boolean;
} {
  const safeCapacity = Math.max(1, totalBatteryCapacityJoules);
  const joulesDrained = consumptionRateWatts * Math.max(0, eclipseDurationSeconds);
  const remainingJoules = Math.max(0, safeCapacity - joulesDrained);
  const depthOfDischargeRatio = Number((joulesDrained / safeCapacity).toFixed(3));

  return {
    joulesDrained,
    remainingJoules,
    depthOfDischargeRatio,
    isCellDamaged: depthOfDischargeRatio > 0.70,
    isBusBrownout: depthOfDischargeRatio >= 0.90
  };
}
