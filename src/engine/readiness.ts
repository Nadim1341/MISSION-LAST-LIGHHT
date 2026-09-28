import type { SpacecraftDesign } from '../types/subsystems.ts';
import type { LaunchVehicle } from '../types/launcher.ts';
import type { ScenarioDefinition } from '../types/mission.ts';
import type { MissionReadinessReport, PrimaryWeaknessDiagnosis, BudgetTriangleCoordinates } from '../types/readiness.ts';
import { calculateSubsystemTotals } from './math/rocket.ts';
import { calculateLauncherCapacityAtC3 } from './math/orbital.ts';
import { validateMissionDesign } from './validator.ts';

export function calculateMissionReadiness(
  design: SpacecraftDesign,
  launcher: LaunchVehicle,
  scenario: ScenarioDefinition
): MissionReadinessReport {
  const totals = calculateSubsystemTotals(design);
  const launcherCapacityKg = calculateLauncherCapacityAtC3(launcher, scenario.target.requiredC3Km2S2);
  const validation = validateMissionDesign(design, launcher, scenario);

  // 1. Science Readiness (0 - 100%)
  // Evaluates instruments against mandatory objectives
  const scienceScore = Math.min(100, Math.round((totals.sciencePotential / 75) * 100));

  // 2. Propulsion Readiness (0 - 100%)
  const requiredDeltaV = scenario.target.deltaVRequirementMs.totalRequired;
  const deltaVRatio = requiredDeltaV > 0 ? totals.totalDeltaVMs / requiredDeltaV : 1.0;
  const propulsionScore = Math.min(100, Math.max(0, Math.round(deltaVRatio * 80 + (totals.hasRedundantPropulsion ? 20 : 0))));

  // 3. Power Readiness (0 - 100%)
  const minSolarFactor = scenario.target.solarIrradianceFactorMin;
  const powerAtTarget = totals.powerGenerationW * minSolarFactor;
  let powerScore = 0;
  if (totals.powerGenerationW > 0) {
    const powerRatio = totals.powerConsumptionW > 0 ? powerAtTarget / totals.powerConsumptionW : 1.0;
    powerScore = Math.min(100, Math.max(0, Math.round(Math.min(1.4, powerRatio) * 70)));
  }

  // 4. Communications Readiness (0 - 100%)
  // Balances data generation rate with downlink & storage
  const commsComponents = design.components.communications || [];
  let commsScore = 0;
  if (commsComponents.length > 0) {
    const hasHga = commsComponents.some((c) => (c.antennaGainDbi || 0) >= 30);
    commsScore = 50;
    if (totals.storageCapacityMb >= 32768) commsScore += 25;
    else if (totals.storageCapacityMb >= 16384) commsScore += 15;
    if (totals.hasRedundantComms) commsScore += 15;
    if (hasHga) commsScore += 10;

    // Severe penalty if high-rate science instruments are equipped with only low-gain omni antennas
    if (!hasHga && totals.dataGenerationRateKbps > 500) {
      commsScore = Math.max(15, commsScore - 50);
    }
    commsScore = Math.min(100, commsScore);
  }

  // 5. Thermal Readiness (0 - 100%)
  const thermalComponents = design.components.thermal || [];
  let thermalScore = 0;
  if (thermalComponents.length > 0) {
    thermalScore = 75;
    if (totals.hasRadShielding) thermalScore += 15;
    if (totals.hasWhippleShielding) thermalScore += 10;
    thermalScore = Math.min(100, thermalScore);
  }

  // 6. Reliability Readiness (0 - 100%)
  const reliabilityScore = totals.dryMassKg > 0 ? Math.min(100, Math.round(totals.baseReliability * 100)) : 0;

  // 7. Budget Compliance (0 - 100%)
  const totalCost = totals.totalCostM + launcher.costM;
  const budgetRatio = totalCost / scenario.budgetCapM;
  let budgetScore = 100;
  if (budgetRatio > 1.0) {
    budgetScore = Math.max(0, Math.round(100 - (budgetRatio - 1.0) * 300));
  } else {
    budgetScore = Math.round(60 + (1.0 - budgetRatio) * 40);
  }

  // 8. Resource Margin (Mass) (0 - 100%)
  const massMarginPct = validation.metrics.massMarginPct;
  const resourceMarginScore = Math.min(100, Math.max(0, Math.round(massMarginPct > 0 ? 50 + massMarginPct * 2.5 : 0)));

  const breakdown = {
    science: scienceScore,
    propulsion: propulsionScore,
    power: powerScore,
    communications: commsScore,
    thermal: thermalScore,
    reliability: reliabilityScore,
    budget: budgetScore,
    resourceMargin: resourceMarginScore
  };

  // Weighted overall readiness percentage
  let rawScorePct = Math.round(
    breakdown.science * 0.15 +
    breakdown.propulsion * 0.18 +
    breakdown.power * 0.14 +
    breakdown.communications * 0.14 +
    breakdown.thermal * 0.10 +
    breakdown.reliability * 0.12 +
    breakdown.budget * 0.10 +
    breakdown.resourceMargin * 0.07
  );

  // Penalize unready designs that have active hard violations
  if (validation.hardViolations.length > 0) {
    rawScorePct = Math.max(0, Math.round(rawScorePct * Math.pow(0.80, validation.hardViolations.length)));
  }

  const overallScorePct = rawScorePct;

  // Identify Primary Weakness
  const candidates: Array<{ key: keyof typeof breakdown; score: number }> = [
    { key: 'communications', score: breakdown.communications },
    { key: 'power', score: breakdown.power },
    { key: 'propulsion', score: breakdown.propulsion },
    { key: 'reliability', score: breakdown.reliability },
    { key: 'science', score: breakdown.science },
    { key: 'thermal', score: breakdown.thermal },
    { key: 'budget', score: breakdown.budget },
    { key: 'resourceMargin', score: breakdown.resourceMargin }
  ];

  candidates.sort((a, b) => a.score - b.score);
  const lowest = candidates[0];

  let primaryWeakness: PrimaryWeaknessDiagnosis = {
    subsystem: lowest.key === 'resourceMargin' ? 'margin' : (lowest.key as any),
    title: `LOW ${lowest.key.toUpperCase()} READINESS (${lowest.score}%)`,
    explanation: 'Subsystem performance is below acceptable engineering thresholds for deep-space mission survival.',
    suggestedAction: 'Review component allocations and upgrade subsystem before launch.',
    impactScoreLoss: 100 - lowest.score
  };

  if (lowest.key === 'communications') {
    primaryWeakness = {
      subsystem: 'communications',
      title: 'COMMUNICATIONS BOTTLENECK',
      explanation: 'Your science suite produces data faster than your antenna/buffer can downlink during DSN contact windows.',
      suggestedAction: 'Upgrade to a 1.2m X-band High-Gain Antenna or expand Solid-State Recorder capacity.',
      impactScoreLoss: 100 - lowest.score
    };
  } else if (lowest.key === 'power') {
    primaryWeakness = {
      subsystem: 'power',
      title: 'POWER BUS DEFICIT AT APHELION',
      explanation: `Solar panel electrical generation drops sharply at ${scenario.target.name} distance due to the inverse square law of solar flux.`,
      suggestedAction: 'Equip larger UltraFlex solar arrays or add secondary battery capacity.',
      impactScoreLoss: 100 - lowest.score
    };
  } else if (lowest.key === 'propulsion') {
    primaryWeakness = {
      subsystem: 'propulsion',
      title: 'INSUFFICIENT DELTA-V MARGIN',
      explanation: 'Propellant reserves are near or below the minimum required for transfer and rendezvous braking burns.',
      suggestedAction: 'Select higher-Isp engines (MMH/NTO or Ion) or add secondary propellant capacity.',
      impactScoreLoss: 100 - lowest.score
    };
  } else if (lowest.key === 'budget') {
    primaryWeakness = {
      subsystem: 'budget',
      title: 'BUDGET CAP BREACH',
      explanation: `Total mission expenditures exceed the scenario cap of $${scenario.budgetCapM}M.`,
      suggestedAction: 'Replace expensive deep-space hardened parts with space-proven alternatives.',
      impactScoreLoss: 100 - lowest.score
    };
  }

  // Budget Triangle Coordinates (0 - 100)
  const triangle: BudgetTriangleCoordinates = {
    science: Math.min(100, Math.round((totals.sciencePotential / 80) * 100)),
    survivability: Math.min(
      100,
      Math.round(
        (totals.baseReliability * 40) +
        (totals.radiationToleranceKrad >= 100 ? 30 : 15) +
        (totals.hasRedundantPropulsion ? 15 : 0) +
        (totals.hasWhippleShielding ? 15 : 0)
      )
    ),
    affordability: Math.min(
      100,
      Math.max(10, Math.round((1.0 - (totalCost / scenario.budgetCapM)) * 100 + 40))
    )
  };

  return {
    overallScorePct,
    breakdown,
    primaryWeakness,
    triangle,
    isFlightReady: validation.isLaunchAllowed && overallScorePct >= 65,
    blockerReasons: validation.hardViolations
  };
}
