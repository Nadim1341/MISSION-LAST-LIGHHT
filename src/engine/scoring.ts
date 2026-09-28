import type { SpacecraftDesign } from '../types/subsystems.ts';
import type { LaunchVehicle } from '../types/launcher.ts';
import type { ScenarioDefinition, MissionTelemetry } from '../types/mission.ts';
import type { DebriefReport, CausalFactor, CinematicTimelineNode } from '../types/scoring.ts';
import type { PlayerDesignHistory } from '../types/events.ts';
import { calculateSubsystemTotals } from './math/rocket.ts';
import { calculateLauncherCapacityAtC3 } from './math/orbital.ts';

export function calculateMissionDebrief(
  design: SpacecraftDesign,
  launcher: LaunchVehicle,
  scenario: ScenarioDefinition,
  telemetry: MissionTelemetry,
  eventResolutions: Array<{ eventId: string; causalHeadline: string; causalDetail: string; actionTaken: string }>,
  designHistory?: PlayerDesignHistory
): DebriefReport {
  const totals = calculateSubsystemTotals(design);
  const totalCostM = totals.totalCostM + launcher.costM;
  const launcherCapacityKg = calculateLauncherCapacityAtC3(launcher, scenario.target.requiredC3Km2S2);

  // 1. Scientific Return (0 - 100)
  const mandatoryScienceThreshold = scenario.mandatoryObjectives[0]?.thresholdValue || 60;
  const scienceRatio = telemetry.rawScienceCollected / mandatoryScienceThreshold;
  const scientificReturn = Math.min(100, Math.round(scienceRatio * 85 + (telemetry.rawScienceCollected > 100 ? 15 : 0)));

  // 2. Engineering Efficiency (0 - 100)
  // Payload mass fraction and power efficiency
  const payloadMassFraction = totals.totalWetMassKg > 0 ? totals.dryMassKg / totals.totalWetMassKg : 0;
  const engineeringEfficiency = Math.min(
    100,
    Math.round(payloadMassFraction * 70 + (totals.netPowerMarginW > 0 ? 30 : 10))
  );

  // 3. Budget Discipline (0 - 100)
  const remainingBudgetM = scenario.budgetCapM - totalCostM;
  let budgetDiscipline = 50;
  if (remainingBudgetM >= 0) {
    budgetDiscipline = Math.min(100, Math.round(60 + (remainingBudgetM / scenario.budgetCapM) * 100));
  } else {
    budgetDiscipline = Math.max(0, Math.round(50 - (Math.abs(remainingBudgetM) / scenario.budgetCapM) * 200));
  }

  // 4. System Reliability (0 - 100)
  const systemReliability = Math.min(100, Math.round(telemetry.spacecraftHealth * 0.7 + totals.baseReliability * 30));

  // 5. Risk Management (0 - 100)
  let riskScore = 60;
  if (totals.hasRadShielding) riskScore += 15;
  if (totals.hasWhippleShielding) riskScore += 15;
  if (totals.hasRedundantPropulsion) riskScore += 10;
  const riskManagement = Math.min(100, riskScore);

  // 6. Telecom Performance (0 - 100)
  const downlinkedRatio = telemetry.rawScienceCollected > 0 ? telemetry.scienceDataTransmitted / (telemetry.rawScienceCollected * 100) : 1.0;
  const telecomPerformance = Math.min(100, Math.round(Math.min(1.0, downlinkedRatio) * 80 + (totals.hasRedundantComms ? 20 : 10)));

  // 7. Resource Discipline (0 - 100)
  const fuelRemainingPct = totals.propellantMassKg > 0 ? (telemetry.propellantRemainingKg / totals.propellantMassKg) * 100 : 0;
  const resourceDiscipline = Math.min(100, Math.round(fuelRemainingPct * 2.0));

  // 8. Thermal & Power Stability (0 - 100)
  const thermalPowerStability = Math.min(
    100,
    Math.round(
      (telemetry.batteryStateOfCharge * 50) +
      (!telemetry.isThermalAnomaly ? 50 : 20)
    )
  );

  // Composite Score (0 - 1000)
  const compositeScore = Math.round(
    scientificReturn * 2.5 +
    engineeringEfficiency * 1.5 +
    budgetDiscipline * 1.5 +
    systemReliability * 1.5 +
    riskManagement * 1.0 +
    telecomPerformance * 1.0 +
    resourceDiscipline * 0.5 +
    thermalPowerStability * 0.5
  );

  // Determine Mission Outcome
  let outcome: 'FULL_SUCCESS' | 'PARTIAL_SUCCESS' | 'CRITICAL_FAILURE' = 'PARTIAL_SUCCESS';
  let outcomeTitle = 'MISSION PARTIAL SUCCESS: SCIENCE RETURNED WITH LOSSES';
  let outcomeSummary = 'The spacecraft successfully reached the target and completed baseline surveys, but resource bottlenecks impacted final data recovery.';

  if (scientificReturn >= 75 && systemReliability >= 70 && budgetDiscipline >= 60) {
    outcome = 'FULL_SUCCESS';
    outcomeTitle = 'MISSION SUCCESS: HISTORIC DISCOVERY ACCOMPLISHED';
    outcomeSummary = 'All primary and secondary scientific objectives were met with exemplary engineering precision and budget discipline.';
  } else if (systemReliability < 35 || scientificReturn < 30) {
    outcome = 'CRITICAL_FAILURE';
    outcomeTitle = 'MISSION FAILURE: SPACECRAFT LOST OR OBJECTIVES MISSED';
    outcomeSummary = 'Subsystem failures or severe resource depletion prevented the spacecraft from delivering mandatory scientific data.';
  }

  // Failure scaling: critical failures are capped at 450 points
  const finalCompositeScore =
    outcome === 'CRITICAL_FAILURE'
      ? Math.min(450, Math.round(compositeScore * 0.6))
      : compositeScore;

  // Causal Root-Cause Factors
  const causalFactors: CausalFactor[] = [];

  // Comms causal analysis
  if (totals.storageCapacityMb < 16384 && totals.dataGenerationRateKbps > 1000) {
    causalFactors.push({
      severity: 'SUBOPTIMAL',
      subsystem: 'Communications & Data Handling',
      playerDecision: 'Selected Compact 8 GB Buffer with High-Rate Imagers',
      causalConsequence: 'Scientific instruments generated data faster than memory could buffer between ground station visibility passes.',
      scientificContext: 'Deep space telemetry requires ample local memory to buffer observations across intermittent Deep Space Network tracking windows.'
    });
  } else if (totals.storageCapacityMb >= 32768) {
    causalFactors.push({
      severity: 'POSITIVE_MITIGATION',
      subsystem: 'Communications & Data Handling',
      playerDecision: 'Equipped 32+ GB Solid-State Recorder Buffer',
      causalConsequence: 'All spectral and imagery files were safely retained throughout DSN blackout passes with zero data overwrite.',
      scientificContext: 'High-capacity solid-state recorders isolate instrument operations from ground station availability.'
    });
  }

  // Radiation & Computing
  if (totals.radiationToleranceKrad >= 100) {
    causalFactors.push({
      severity: 'BRILLIANT_DESIGN',
      subsystem: 'Command & Data Handling',
      playerDecision: 'Selected 100 krad RAD750 Radiation-Hardened Computer',
      causalConsequence: 'Spacecraft survived severe Coronal Mass Ejection proton storms without a single processor crash or telemetry loss.',
      scientificContext: 'Ionizing space radiation causes single-event latchups in commercial silicon; rad-hardened processors are mandatory for deep space resilience.'
    });
  } else if (totals.radiationToleranceKrad < 50) {
    causalFactors.push({
      severity: 'CRITICAL_FAILURE',
      subsystem: 'Command & Data Handling',
      playerDecision: 'Selected Low-Cost Commercial Processor (35 krad)',
      causalConsequence: 'High-energy solar protons triggered memory bitflips and autonomous reboots during interplanetary transit.',
      scientificContext: 'Commercial-off-the-shelf (COTS) processors lack silicon-on-insulator isolation against deep-space cosmic rays.'
    });
  }

  // Propulsion redundancy
  if (totals.hasRedundantPropulsion) {
    causalFactors.push({
      severity: 'POSITIVE_MITIGATION',
      subsystem: 'Propulsion & Attitude Control',
      playerDecision: 'Equipped Dual Propulsion / Backup Hydrazine RCS Thrusters',
      causalConsequence: 'Provided fault-tolerant trajectory trim margin, ensuring pinpoint rendezvous with Asteroid Bennu.',
      scientificContext: 'Redundant chemical thruster manifolds eliminate single-point mission failure during critical braking maneuvers.'
    });
  }

  // Whipple Shielding
  if (totals.hasWhippleShielding) {
    causalFactors.push({
      severity: 'POSITIVE_MITIGATION',
      subsystem: 'Structures & Mechanisms',
      playerDecision: 'Equipped Nextel/Kevlar Whipple Debris Shielding',
      causalConsequence: 'Successfully protected propellant tanks and avionics from hypervelocity cometary dust and asteroid proximity ejecta.',
      scientificContext: 'Whipple shields vaporize high-speed projectiles on the outer bumper, diffusing destructive kinetic energy.'
    });
  } else {
    causalFactors.push({
      severity: 'SUBOPTIMAL',
      subsystem: 'Structures & Mechanisms',
      playerDecision: 'Omitted Whipple Shielding to Save Mass/Cost',
      causalConsequence: 'Spacecraft bus lacked physical bumper protection against asteroid proximity dust and micrometeoroid streams.',
      scientificContext: 'Near-Earth asteroid proximity environments contain active particulate clouds that pose collision risks to unshielded surfaces.'
    });
  }

  // Launch Vehicle Mass Margin
  const massMarginPct = Number((((launcherCapacityKg - totals.totalWetMassKg) / launcherCapacityKg) * 100).toFixed(1));
  if (massMarginPct >= 20) {
    causalFactors.push({
      severity: 'POSITIVE_MITIGATION',
      subsystem: 'Launch Vehicle & Trajectory Insertion',
      playerDecision: `Selected ${launcher.name} with ${massMarginPct}% Mass Margin`,
      causalConsequence: 'Ample C3 payload capacity enabled a fast, direct trajectory insertion while preserving spacecraft attitude propellant.',
      scientificContext: 'Generous launch vehicle margin provides vital insurance against dry mass growth and trajectory dispersion.'
    });
  }

  // Pre-Launch Stress Testing & Iteration History
  if (designHistory?.hasRedesignedAfterStress) {
    causalFactors.push({
      severity: 'BRILLIANT_DESIGN',
      subsystem: 'Mission Systems Engineering',
      playerDecision: 'Iterated Design Based on Pre-Launch Stress Testing',
      causalConsequence: 'Identified and eliminated structural and thermal vulnerabilities before committing flight hardware to the launch pad.',
      scientificContext: 'Rigorous pre-flight environmental qualification testing is the cornerstone of NASA Discovery and New Frontiers mission success.'
    });
  }

  if (designHistory?.ignoredWeaknessWarning) {
    causalFactors.push({
      severity: 'CRITICAL_FAILURE',
      subsystem: 'Risk Management & Mission Assurance',
      playerDecision: `Bypassed Pre-Flight Warning on ${designHistory.primaryWeaknessTitle || 'Subsystem Weakness'}`,
      causalConsequence: 'The unmitigated subsystem bottleneck experienced high failure stress during flight, degrading mission objectives.',
      scientificContext: 'Launching with unmitigated single-point failure modes directly elevates mission risk during unforeseen environmental hazards.'
    });
  }

  // Cinematic Timeline Nodes (Replay sequence)
  const cinematicTimeline: CinematicTimelineNode[] = [
    {
      metDay: 0,
      stageName: 'Launch',
      icon: '🚀',
      title: 'T-00: Liftoff from Space Launch Complex',
      decisionMade: `Launched atop ${launcher.name}`,
      whatHappened: 'Nominal stage separation and Trans-Asteroid Injection burn executed.',
      whyItHappened: `Delivered initial C3 of ${scenario.target.requiredC3Km2S2} km²/s² with ${(launcherCapacityKg - totals.totalWetMassKg).toFixed(0)} kg mass margin.`,
      missionConsequence: 'Spacecraft cleanly entered heliocentric transfer orbit.',
      severity: 'nominal'
    },
    {
      metDay: 8,
      stageName: 'Orbit Insertion',
      icon: '🛰',
      title: 'Solar Array Deployment & Bus Initialization',
      decisionMade: 'Solar panel deployment & attitude acquisition',
      whatHappened: `Bus generated ${totals.powerGenerationW} W at 1.0 AU.`,
      whyItHappened: 'GaAs solar array oriented sunward; star trackers established arcsecond inertial pointing.',
      missionConsequence: 'Electrical bus fully stabilized.',
      severity: 'nominal'
    },
    {
      metDay: 68,
      stageName: 'Cruise Anomaly',
      icon: '⚠',
      title: 'Coronal Mass Ejection Encounter',
      decisionMade: eventResolutions.find((e) => e.eventId === 'evt_solar_storm')?.actionTaken || 'Safe Mode Engaged',
      whatHappened: eventResolutions.find((e) => e.eventId === 'evt_solar_storm')?.causalHeadline || 'Proton wave impacted spacecraft.',
      whyItHappened: eventResolutions.find((e) => e.eventId === 'evt_solar_storm')?.causalDetail || 'Radiation flux absorbed by shielding.',
      missionConsequence: 'Avionics health preserved during cruise transit.',
      severity: totals.radiationToleranceKrad >= 100 ? 'triumph' : 'caution'
    },
    {
      metDay: 200,
      stageName: 'Approach',
      icon: '🔭',
      title: 'Target Optical Navigation & Proximity Acquisition',
      decisionMade: 'Optical tracking using PolyCam imager and star trackers',
      whatHappened: 'Asteroid Bennu resolved in framing camera optics.',
      whyItHappened: 'Trajectory correction burn placed spacecraft within 20 km stand-off corridor.',
      missionConsequence: 'Fine proximity approach trajectory nominal.',
      severity: 'nominal'
    },
    {
      metDay: 245,
      stageName: 'Science Operations',
      icon: '🔬',
      title: 'Comprehensive Multi-Spectral & LIDAR Mapping',
      decisionMade: 'Executed primary science survey sequences',
      whatHappened: `Collected ${telemetry.rawScienceCollected.toFixed(0)} raw science survey points.`,
      whyItHappened: 'Instruments surveyed carbonaceous regolith boulders and surface topography.',
      missionConsequence: 'Primary mission scientific objectives completed.',
      severity: 'triumph'
    },
    {
      metDay: 300,
      stageName: 'Communication Pass',
      icon: '📡',
      title: 'NASA Deep Space Network High-Rate Downlink',
      decisionMade: 'Continuous X-Band / Ka-Band DSN transmissions',
      whatHappened: `Transmitted ${telemetry.scienceDataTransmitted.toFixed(0)} MB of calibrated data to Earth.`,
      whyItHappened: 'Goldstone, Madrid, and Canberra ground stations tracked spacecraft pass.',
      missionConsequence: 'Mission science safely archived in NASA Planetary Data System.',
      severity: 'triumph'
    }
  ];

  // Specific aerospace recommendations
  const recommendations: string[] = [];
  if (telemetry.scienceDataTransmitted < 8000) {
    recommendations.push('Upgrade to a 1.2m Ka-band High-Gain Antenna or increase Solid-State Recorder capacity to at least 32 GB.');
  }
  if (totals.radiationToleranceKrad < 80) {
    recommendations.push('Select RAD750 flight computer or add tantalum shielding to withstand deep-space coronal mass ejections.');
  }
  if (!totals.hasRedundantPropulsion) {
    recommendations.push('Add secondary Hydrazine RCS thruster pods to provide backup trajectory trim authority.');
  }
  if (telemetry.propellantRemainingKg < totals.propellantMassKg * 0.15) {
    recommendations.push('Increase initial propellant loading or select higher-Isp ion thrusters for larger fuel margins.');
  }

  return {
    compositeScore: finalCompositeScore,
    outcome,
    outcomeTitle,
    outcomeSummary,
    axisScores: {
      scientificReturn,
      engineeringEfficiency,
      budgetDiscipline,
      systemReliability,
      riskManagement,
      telecomPerformance,
      resourceDiscipline,
      thermalPowerStability
    },
    rawMetrics: {
      totalScienceCollected: telemetry.rawScienceCollected,
      dataTransmittedMb: telemetry.scienceDataTransmitted,
      remainingPropellantKg: telemetry.propellantRemainingKg,
      remainingBudgetM: Number(remainingBudgetM.toFixed(1)),
      finalHealthPct: telemetry.spacecraftHealth,
      anomaliesSurvived: eventResolutions.length
    },
    causalFactors,
    cinematicTimeline,
    recommendations
  };
}
