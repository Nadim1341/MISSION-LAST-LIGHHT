import type { LaunchVehicle } from '../../types/launcher.ts';

export const MU_SUN_KM3S2 = 1.32712440018e11; // Gravitational parameter of Sun
export const KM_PER_AU = 149597870.7;

/**
 * Calculates payload capacity of a launch vehicle at a given C3 characteristic energy
 * via linear interpolation between empirical C3 performance points.
 */
export function calculateLauncherCapacityAtC3(
  launcher: LaunchVehicle,
  targetC3Km2S2: number
): number {
  const curve = launcher.c3Curve;
  if (!curve || curve.length === 0) return 0;

  // If C3 is below the lowest measured point
  if (targetC3Km2S2 <= curve[0].c3Km2S2) {
    return curve[0].payloadCapacityKg;
  }

  // If C3 is above the highest measured point
  const last = curve[curve.length - 1];
  if (targetC3Km2S2 >= last.c3Km2S2) {
    return Math.max(0, last.payloadCapacityKg);
  }

  // Interpolate between surrounding points
  for (let i = 0; i < curve.length - 1; i++) {
    const p1 = curve[i];
    const p2 = curve[i + 1];
    if (targetC3Km2S2 >= p1.c3Km2S2 && targetC3Km2S2 <= p2.c3Km2S2) {
      const fraction = (targetC3Km2S2 - p1.c3Km2S2) / (p2.c3Km2S2 - p1.c3Km2S2);
      const interpolated = p1.payloadCapacityKg + fraction * (p2.payloadCapacityKg - p1.payloadCapacityKg);
      return Math.round(interpolated);
    }
  }

  return 0;
}

/**
 * Calculates Hohmann heliocentric transfer duration in Earth days.
 * Semi-major axis a = (r1 + r2) / 2
 * Orbital period T = a^(1.5) * 365.25 days
 * Transfer duration = T / 2
 */
export function calculateTransferDurationDays(r1Au: number, r2Au: number): number {
  const aAu = (r1Au + r2Au) / 2.0;
  const fullPeriodDays = Math.pow(aAu, 1.5) * 365.25;
  return Number((fullPeriodDays / 2.0).toFixed(1));
}

/**
 * Computes Keplerian orbital speed using the Vis-Viva equation:
 * v = sqrt(mu * (2/r - 1/a))
 */
export function calculateVisVivaSpeedKms(
  rKm: number,
  aKm: number,
  muKm3S2: number = MU_SUN_KM3S2
): number {
  if (rKm <= 0 || aKm <= 0) return 0;
  const v2 = muKm3S2 * (2.0 / rKm - 1.0 / aKm);
  return Number(Math.sqrt(Math.max(0, v2)).toFixed(2));
}

/**
 * Calculates launch vehicle mass margin percentage:
 * margin = (capacity - wetMass) / capacity * 100%
 */
export function calculateMassMargin(
  launcherCapacityKg: number,
  spacecraftWetMassKg: number
): {
  capacityKg: number;
  wetMassKg: number;
  marginKg: number;
  marginPercentage: number;
  isValid: boolean;
} {
  const marginKg = Number((launcherCapacityKg - spacecraftWetMassKg).toFixed(1));
  const marginPercentage =
    launcherCapacityKg > 0 ? Number(((marginKg / launcherCapacityKg) * 100).toFixed(1)) : -100;

  return {
    capacityKg: launcherCapacityKg,
    wetMassKg: spacecraftWetMassKg,
    marginKg,
    marginPercentage,
    isValid: marginKg >= 0
  };
}
