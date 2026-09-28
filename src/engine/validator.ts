import type { SpacecraftDesign } from '../types/subsystems.ts';
import type { LaunchVehicle } from '../types/launcher.ts';
import type { ScenarioDefinition } from '../types/mission.ts';
import { calculateSubsystemTotals } from './math/rocket.ts';
import { calculateLauncherCapacityAtC3, calculateMassMargin } from './math/orbital.ts';

export interface ConstraintValidationResult {
  isLaunchAllowed: boolean;
  hardViolations: string[];
  softWarnings: string[];
  metrics: {
    totalCostM: number;
    budgetCapM: number;
    budgetRemainingM: number;
    spacecraftWetMassKg: number;
    launcherCapacityKg: number;
    massMarginKg: number;
    massMarginPct: number;
    availableDeltaVMs: number;
    requiredDeltaVMs: number;
    deltaVMarginMs: number;
    powerGenerationW: number;
    powerConsumptionW: number;
    storageCapacityMb: number;
  };
}

export function validateMissionDesign(
  design: SpacecraftDesign,
  launcher: LaunchVehicle,
  scenario: ScenarioDefinition
): ConstraintValidationResult {
  const totals = calculateSubsystemTotals(design);
  const launcherCapacityKg = calculateLauncherCapacityAtC3(launcher, scenario.target.requiredC3Km2S2);
  const massMargin = calculateMassMargin(launcherCapacityKg, totals.totalWetMassKg);
  const totalMissionCostM = Number((totals.totalCostM + launcher.costM).toFixed(2));
  const budgetRemainingM = Number((scenario.budgetCapM - totalMissionCostM).toFixed(2));
  const requiredDeltaVMs = scenario.target.deltaVRequirementMs.totalRequired;
  const deltaVMarginMs = Number((totals.totalDeltaVMs - requiredDeltaVMs).toFixed(1));

  const hardViolations: string[] = [];
  const softWarnings: string[] = [];

  // ==================== HARD CONSTRAINTS ====================
  // 1. Mandatory Subsystem Presence
  const categories = ['power', 'propulsion', 'communications', 'computing', 'navigation', 'thermal', 'science', 'structure'] as const;
  for (const cat of categories) {
    const count = (design.components[cat] || []).length;
    if (count === 0) {
      hardViolations.push(`CRITICAL: Spacecraft is missing mandatory [${cat.toUpperCase()}] subsystem components.`);
    }
  }

  // 2. Mass Constraint vs Launcher C3
  if (totals.totalWetMassKg > launcherCapacityKg) {
    hardViolations.push(
      `MASS EXCEEDED: Spacecraft wet mass (${totals.totalWetMassKg} kg) exceeds ${launcher.name} payload capacity (${launcherCapacityKg} kg) at C3 = ${scenario.target.requiredC3Km2S2} km²/s².`
    );
  }

  // 3. Budget Cap Constraint
  if (totalMissionCostM > scenario.budgetCapM) {
    hardViolations.push(
      `BUDGET EXCEEDED: Total mission cost ($${totalMissionCostM}M) exceeds scenario cap ($${scenario.budgetCapM}M) by $${Math.abs(budgetRemainingM)}M.`
    );
  }

  // 4. Propulsion Viability
  if (totals.totalDeltaVMs < requiredDeltaVMs) {
    hardViolations.push(
      `INSUFFICIENT DELTA-V: Available delta-V (${totals.totalDeltaVMs} m/s) is lower than required trajectory delta-V (${requiredDeltaVMs} m/s). Spacecraft will not reach ${scenario.target.name}.`
    );
  }

  // 5. Basic Power Generation
  if (totals.powerGenerationW <= 0) {
    hardViolations.push('CRITICAL: Spacecraft has no electrical power source (solar arrays or RTG).');
  }

  // ==================== SOFT CONSTRAINTS ====================
  // 1. Low Mass Margin
  if (massMargin.marginPercentage < 10.0 && massMargin.marginPercentage >= 0) {
    softWarnings.push(
      `CAUTION: Launch mass margin is very tight (${massMargin.marginPercentage}%). Recommend at least 15% reserve for launch vehicle insertion variations.`
    );
  }

  // 2. Low Delta-V Reserve
  if (deltaVMarginMs < requiredDeltaVMs * 0.15 && deltaVMarginMs >= 0) {
    softWarnings.push(
      `PROPULSION WARNING: Delta-V reserve margin is below 15% (+${deltaVMarginMs} m/s). Minimal margin for anomaly correction burns.`
    );
  }

  // 3. Power Bus Margin at Destination Distance
  const minSolarFactor = scenario.target.solarIrradianceFactorMin;
  const powerAtTargetW = totals.powerGenerationW * minSolarFactor;
  if (powerAtTargetW < totals.powerConsumptionW) {
    softWarnings.push(
      `POWER DEFICIT AT TARGET: At ${scenario.target.name} maximum distance, solar generation drops to ~${Math.round(powerAtTargetW)} W, below continuous load (${totals.powerConsumptionW} W). Battery drain risk during science ops.`
    );
  }

  // 4. Telecom Data Rate Mismatch
  if (totals.dataGenerationRateKbps > 1000 && totals.storageCapacityMb < 16384) {
    softWarnings.push(
      'TELECOM BOTTLENECK: High-yield science payload generates > 1 Mbps, but onboard buffer is smaller than 16 GB. Buffer overflow risk between DSN passes.'
    );
  }

  // 5. Radiation Vulnerability
  if (totals.radiationToleranceKrad < 50) {
    softWarnings.push(
      `RADIATION HAZARD: Flight avionics rated at ${totals.radiationToleranceKrad} krad. High vulnerability to deep-space solar coronal mass ejections.`
    );
  }

  return {
    isLaunchAllowed: hardViolations.length === 0,
    hardViolations,
    softWarnings,
    metrics: {
      totalCostM: totalMissionCostM,
      budgetCapM: scenario.budgetCapM,
      budgetRemainingM,
      spacecraftWetMassKg: totals.totalWetMassKg,
      launcherCapacityKg,
      massMarginKg: massMargin.marginKg,
      massMarginPct: massMargin.marginPercentage,
      availableDeltaVMs: totals.totalDeltaVMs,
      requiredDeltaVMs,
      deltaVMarginMs,
      powerGenerationW: totals.powerGenerationW,
      powerConsumptionW: totals.powerConsumptionW,
      storageCapacityMb: totals.storageCapacityMb
    }
  };
}
