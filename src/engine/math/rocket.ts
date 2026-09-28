import type { SpacecraftDesign, SubsystemTotals } from '../../types/subsystems.ts';

export const STANDARD_GRAVITY = 9.80665; // m/s^2

/**
 * Calculates available delta-V using the classic Tsiolkovsky rocket equation:
 * DeltaV = Isp * g0 * ln(m0 / mf)
 */
export function calculateTsiolkovskyDeltaV(
  dryMassKg: number,
  propellantMassKg: number,
  ispSec: number
): number {
  if (dryMassKg <= 0 || ispSec <= 0) return 0;
  const wetMassKg = dryMassKg + Math.max(0, propellantMassKg);
  if (wetMassKg <= dryMassKg) return 0;
  return ispSec * STANDARD_GRAVITY * Math.log(wetMassKg / dryMassKg);
}

/**
 * Calculates propellant mass required to deliver a desired delta-V for a given dry mass.
 * m_prop = m_dry * (exp(deltaV / (Isp * g0)) - 1)
 */
export function calculatePropellantRequired(
  dryMassKg: number,
  targetDeltaVMs: number,
  ispSec: number
): number {
  if (dryMassKg <= 0 || targetDeltaVMs <= 0 || ispSec <= 0) return 0;
  const exponent = targetDeltaVMs / (ispSec * STANDARD_GRAVITY);
  return dryMassKg * (Math.exp(exponent) - 1);
}

/**
 * Aggregates all components on the spacecraft to compute mass, power, cost,
 * data generation, reliability, and total delta-V capability.
 */
export function calculateSubsystemTotals(design: SpacecraftDesign): SubsystemTotals {
  let dryMassKg = 0;
  let propellantMassKg = 0;
  let totalCostM = 0;
  let powerGenerationAt1AuW = 0;
  let powerConsumptionW = 0;
  let batteryStorageJoules = 0;
  let storageCapacityMb = 0;
  let dataGenerationRateKbps = 0;
  let totalScienceYield = 0;
  let thermalDissipationW = 0;
  let radToleranceAccumulator = 0;
  let computingComponentsCount = 0;

  // Weighted Isp calculation
  let totalWeightedIspMass = 0;
  let effectiveIspSec = 220; // Default fallback RCS
  let primaryIsp = 0;

  let hasRedundantPropulsion = false;
  let hasRedundantComms = false;
  let hasRadShielding = false;
  let hasWhippleShielding = false;

  const propulsionItems = design.components.propulsion || [];
  if (propulsionItems.length > 1) {
    hasRedundantPropulsion = true;
  }

  const commsItems = design.components.communications || [];
  if (commsItems.length > 1) {
    hasRedundantComms = true;
  }

  // Iterate over all component categories
  for (const category of Object.keys(design.components) as (keyof typeof design.components)[]) {
    const items = design.components[category] || [];
    for (const item of items) {
      dryMassKg += item.massKg;
      totalCostM += item.costM;
      thermalDissipationW += item.thermalDissipationW;
      totalScienceYield += item.scienceYield;
      dataGenerationRateKbps += item.dataRateKbps;

      // Power calculation: negative powerDrawW = generator (e.g. solar/RTG)
      if (item.powerDrawW < 0) {
        powerGenerationAt1AuW += Math.abs(item.powerDrawW);
      } else {
        powerConsumptionW += item.powerDrawW;
      }

      // Propellant capacity
      if (item.propellantCapacityKg && item.propellantCapacityKg > 0) {
        propellantMassKg += item.propellantCapacityKg;
      }

      // Isp calculation
      if (item.ispSec && item.ispSec > 0) {
        if (!primaryIsp || item.ispSec > primaryIsp) {
          primaryIsp = item.ispSec;
        }
        totalWeightedIspMass += item.ispSec * (item.propellantCapacityKg || 1);
      }

      // Storage & battery
      if (item.storageCapacityMb && item.storageCapacityMb > 0) {
        storageCapacityMb += item.storageCapacityMb;
      }
      if (item.id === 'pwr_lithium_sulfur_battery') {
        batteryStorageJoules += 1200 * 3600; // 1200 Wh -> 4.32 MJ
      }

      // Radiation tolerance
      if (item.category === 'computing' || item.category === 'navigation') {
        radToleranceAccumulator += item.radiationToleranceKrad;
        computingComponentsCount++;
      }

      // Shielding flags
      if (item.id === 'struct_whipple_debris_shield') {
        hasWhippleShielding = true;
      }
      if (item.radiationToleranceKrad >= 150) {
        hasRadShielding = true;
      }
    }
  }

  // Radiation tolerance is determined by computing avionics hardening
  const computingItems = design.components.computing || [];
  const radiationToleranceKrad =
    computingItems.length > 0
      ? Math.min(...computingItems.map((c) => c.radiationToleranceKrad))
      : 50;

  // Base reliability calculation: average component reliability with active redundancy boosts
  let sumReliability = 0;
  let totalComponentCount = 0;
  for (const category of Object.keys(design.components) as (keyof typeof design.components)[]) {
    const items = design.components[category] || [];
    for (const item of items) {
      sumReliability += item.reliability;
      totalComponentCount++;
    }
  }
  let baseReliability = totalComponentCount > 0 ? sumReliability / totalComponentCount : 0.90;
  if (hasRedundantPropulsion) baseReliability = Math.min(0.99, baseReliability + 0.03);
  if (hasRedundantComms) baseReliability = Math.min(0.99, baseReliability + 0.02);
  if (hasRadShielding) baseReliability = Math.min(0.99, baseReliability + 0.02);

  effectiveIspSec = primaryIsp > 0 ? primaryIsp : 220;
  const totalWetMassKg = dryMassKg + propellantMassKg;
  const totalDeltaVMs = calculateTsiolkovskyDeltaV(dryMassKg, propellantMassKg, effectiveIspSec);
  const netPowerMarginW = powerGenerationAt1AuW - powerConsumptionW;

  return {
    dryMassKg: Number(dryMassKg.toFixed(1)),
    propellantMassKg: Number(propellantMassKg.toFixed(1)),
    totalWetMassKg: Number(totalWetMassKg.toFixed(1)),
    totalCostM: Number(totalCostM.toFixed(2)),
    powerGenerationW: Number(powerGenerationAt1AuW.toFixed(1)),
    powerConsumptionW: Number(powerConsumptionW.toFixed(1)),
    netPowerMarginW: Number(netPowerMarginW.toFixed(1)),
    batteryStorageJoules,
    storageCapacityMb,
    dataGenerationRateKbps,
    baseReliability: Number(baseReliability.toFixed(3)),
    radiationToleranceKrad,
    sciencePotential: totalScienceYield,
    effectiveIspSec,
    totalDeltaVMs: Number(totalDeltaVMs.toFixed(1)),
    hasRedundantPropulsion,
    hasRedundantComms,
    hasRadShielding,
    hasWhippleShielding
  };
}
