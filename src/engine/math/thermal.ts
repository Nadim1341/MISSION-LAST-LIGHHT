export const STEFAN_BOLTZMANN_CONSTANT = 5.670374419e-8; // W / (m^2 K^4)

/**
 * Calculates radiative equilibrium temperature in Kelvin.
 * Qin + Qinternal = epsilon * sigma * A * T^4
 */
export function calculateEquilibriumTemperatureK(
  solarAbsorbedWatts: number,
  internalDissipationWatts: number,
  radiatorAreaM2: number = 2.5,
  surfaceEmissivity: number = 0.85
): number {
  const totalHeatW = Math.max(1.0, solarAbsorbedWatts + internalDissipationWatts);
  const denominator = surfaceEmissivity * STEFAN_BOLTZMANN_CONSTANT * radiatorAreaM2;
  const tempK = Math.pow(totalHeatW / denominator, 0.25);
  return Number(tempK.toFixed(1));
}

/**
 * Evaluates thermal margin against operational component limits (typically 240 K to 330 K).
 * Returns status: nominal, cold_risk, hot_risk, or critical_thermal_violation.
 */
export function evaluateThermalMargin(
  currentTempK: number,
  minOperatingTempK: number = 240,
  maxOperatingTempK: number = 330
): {
  currentTempK: number;
  marginBelowMaxK: number;
  marginAboveMinK: number;
  status: 'nominal' | 'cold_risk' | 'hot_risk' | 'critical_failure';
  warningMessage: string;
} {
  const marginBelowMaxK = Number((maxOperatingTempK - currentTempK).toFixed(1));
  const marginAboveMinK = Number((currentTempK - minOperatingTempK).toFixed(1));

  let status: 'nominal' | 'cold_risk' | 'hot_risk' | 'critical_failure' = 'nominal';
  let warningMessage = 'Thermal envelope nominal.';

  if (currentTempK > maxOperatingTempK + 15 || currentTempK < minOperatingTempK - 25) {
    status = 'critical_failure';
    warningMessage = `CRITICAL THERMAL FAILURE: Core bus temperature ${currentTempK} K breached hardware survival limits!`;
  } else if (currentTempK > maxOperatingTempK) {
    status = 'hot_risk';
    warningMessage = `OVERHEAT WARNING: Temperature ${currentTempK} K exceeds maximum operating limit of ${maxOperatingTempK} K.`;
  } else if (currentTempK < minOperatingTempK) {
    status = 'cold_risk';
    warningMessage = `COLD SOAK WARNING: Temperature ${currentTempK} K is below minimum operating limit of ${minOperatingTempK} K. Survival heaters required.`;
  }

  return {
    currentTempK,
    marginBelowMaxK,
    marginAboveMinK,
    status,
    warningMessage
  };
}
