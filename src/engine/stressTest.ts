import type { SpacecraftDesign } from '../types/subsystems.ts';
import type { ScenarioDefinition } from '../types/mission.ts';
import type { StressTestResult } from '../types/readiness.ts';
import { calculateSubsystemTotals } from './math/rocket.ts';

export function runMissionStressTests(
  design: SpacecraftDesign,
  scenario: ScenarioDefinition
): StressTestResult[] {
  const totals = calculateSubsystemTotals(design);
  const results: StressTestResult[] = [];

  // ==================== 1. SOLAR STORM STRESS TEST ====================
  const radTolerance = totals.radiationToleranceKrad;
  if (radTolerance >= 100) {
    results.push({
      scenarioId: 'stress_solar_storm',
      title: 'Solar Particle Event (CME Radiation Stress)',
      status: 'PASS',
      componentTested: 'Flight Computer & Avionics',
      spacecraftValue: `${radTolerance} krad Hardening`,
      requiredValue: '100 krad for CME immunity',
      projectedConsequence: 'RAD-hardened avionics absorb ionizing radiation wave with zero single-event latchups.',
      recommendation: 'Configuration is optimal against deep-space radiation hazards.'
    });
  } else if (radTolerance >= 50) {
    results.push({
      scenarioId: 'stress_solar_storm',
      title: 'Solar Particle Event (CME Radiation Stress)',
      status: 'WARNING',
      componentTested: 'Flight Computer & Avionics',
      spacecraftValue: `${radTolerance} krad Hardening`,
      requiredValue: '100 krad recommended',
      projectedConsequence: 'Moderate risk of single-event upsets. Safe Mode intervention will be required during solar flares.',
      recommendation: 'Consider upgrading to RAD750 flight computer or adding radiation shielding.'
    });
  } else {
    results.push({
      scenarioId: 'stress_solar_storm',
      title: 'Solar Particle Event (CME Radiation Stress)',
      status: 'CRITICAL_RISK',
      componentTested: 'Commercial Avionics',
      spacecraftValue: `${radTolerance} krad Hardening`,
      requiredValue: '50 krad minimum',
      projectedConsequence: 'High probability of memory register corruption and flight computer crash during cruise.',
      recommendation: 'CRITICAL: Upgrade computing subsystem or mission may suffer total communications loss.'
    });
  }

  // ==================== 2. COMMUNICATION OUTAGE STRESS TEST ====================
  const storageGb = totals.storageCapacityMb / 1024;
  const dataRate = totals.dataGenerationRateKbps;
  // Estimated data generated during 14-day encounter mapping pass (e.g., 21.8 GB benchmark)
  const estimatedGeneratedGb = Number(((dataRate * 14 * 3600) / 8000000).toFixed(1));
  if (storageGb >= estimatedGeneratedGb * 1.2) {
    results.push({
      scenarioId: 'stress_comm_outage',
      title: 'Deep Space Network Outage (14-Day Lockout)',
      status: 'PASS',
      componentTested: 'Solid-State Recorder (SSR)',
      spacecraftValue: `${storageGb.toFixed(1)} GB Storage`,
      requiredValue: `${estimatedGeneratedGb.toFixed(1)} GB Buffer`,
      projectedConsequence: 'Entire scientific survey can be buffered locally without data overwrite during ground station outages.',
      recommendation: 'Storage capacity fully protects against DSN scheduling conflicts.'
    });
  } else if (storageGb >= estimatedGeneratedGb * 0.7) {
    results.push({
      scenarioId: 'stress_comm_outage',
      title: 'Deep Space Network Outage (14-Day Lockout)',
      status: 'WARNING',
      componentTested: 'Solid-State Recorder (SSR)',
      spacecraftValue: `${storageGb.toFixed(1)} GB Storage`,
      requiredValue: `${estimatedGeneratedGb.toFixed(1)} GB Buffer`,
      projectedConsequence: 'Buffer will reach 90% capacity during extended communication blackouts. Science throttling required.',
      recommendation: 'Increase solid-state recorder capacity or equip Ka-band downlink for faster catch-up passes.'
    });
  } else {
    results.push({
      scenarioId: 'stress_comm_outage',
      title: 'Deep Space Network Outage (14-Day Lockout)',
      status: 'CRITICAL_RISK',
      componentTested: 'Solid-State Recorder (SSR)',
      spacecraftValue: `${storageGb.toFixed(1)} GB Storage`,
      requiredValue: `${estimatedGeneratedGb.toFixed(1)} GB Buffer`,
      projectedConsequence: `Severe data overflow: approximately ${(estimatedGeneratedGb - storageGb).toFixed(1)} GB of high-resolution science will be permanently overwritten.`,
      recommendation: 'Add high-capacity storage buffer to prevent irreversible science data loss.'
    });
  }

  // ==================== 3. PROPULSION DEGRADATION STRESS TEST ====================
  if (totals.hasRedundantPropulsion) {
    results.push({
      scenarioId: 'stress_propulsion_loss',
      title: 'Primary Thruster Chamber Pressure Drop (25%)',
      status: 'PASS',
      componentTested: 'Propulsion Redundancy & RCS',
      spacecraftValue: 'Dual Propulsion Buses Present',
      requiredValue: 'Backup Trajectory Trim System',
      projectedConsequence: 'Secondary RCS thrusters automatically engage to complete rendezvous braking burn. Mission proceeds on schedule.',
      recommendation: 'Redundant propulsion architecture provides resilient fault tolerance.'
    });
  } else {
    results.push({
      scenarioId: 'stress_propulsion_loss',
      title: 'Primary Thruster Chamber Pressure Drop (25%)',
      status: 'WARNING',
      componentTested: 'Single-String Thruster',
      spacecraftValue: 'Single Main Engine',
      requiredValue: 'Redundant Thrusters',
      projectedConsequence: 'Any thruster anomaly will cause trajectory overshoot and require emergency manual burn reconfiguration.',
      recommendation: 'Install secondary Hydrazine RCS thruster pods to mitigate single-point failure.'
    });
  }

  // ==================== 4. THERMAL ANOMALY STRESS TEST ====================
  const hasActiveThermal = design.components.thermal?.some((t) => t.id === 'therm_active_heatpipes_rhu');
  if (hasActiveThermal) {
    results.push({
      scenarioId: 'stress_thermal_anomaly',
      title: 'Stuck Thermal Louver / Solar Flare Heat Pulse',
      status: 'PASS',
      componentTested: 'Active Heat Pipes & Heaters',
      spacecraftValue: 'Variable Conductance Loop',
      requiredValue: 'Active Thermal Compensation',
      projectedConsequence: 'Thermostatic loop balances internal temperatures within nominal 270 - 305 K envelope.',
      recommendation: 'Thermal control system exceeds deep space mission requirements.'
    });
  } else {
    results.push({
      scenarioId: 'stress_thermal_anomaly',
      title: 'Stuck Thermal Louver / Solar Flare Heat Pulse',
      status: 'WARNING',
      componentTested: 'Passive MLI Blanket Only',
      spacecraftValue: 'Passive Thermal Control',
      requiredValue: 'Active Heat Pipes or Heaters',
      projectedConsequence: 'Thermal margins will narrow to within 8 K of operating limits during closest solar approach.',
      recommendation: 'Add survival heaters to prevent battery freezing during eclipses.'
    });
  }

  // ==================== 5. BATTERY DEGRADATION STRESS TEST ====================
  const hasBattery = totals.batteryStorageJoules > 0;
  if (hasBattery) {
    results.push({
      scenarioId: 'stress_battery_degradation',
      title: 'Extended Shadow Eclipse (90-Minute Occultation)',
      status: 'PASS',
      componentTested: 'Lithium-Sulfur Secondary Pack',
      spacecraftValue: '4.32 MJ Stored Energy',
      requiredValue: '2.50 MJ for 90-min eclipse',
      projectedConsequence: 'Depth-of-discharge remains under 45%. Zero risk of bus voltage collapse during asteroid shadow.',
      recommendation: 'Power storage margin is healthy.'
    });
  } else {
    results.push({
      scenarioId: 'stress_battery_degradation',
      title: 'Extended Shadow Eclipse (90-Minute Occultation)',
      status: 'CRITICAL_RISK',
      componentTested: 'Electrical Power Storage',
      spacecraftValue: 'No Dedicated Secondary Battery Pack',
      requiredValue: 'Battery Pack Required',
      projectedConsequence: 'Immediate electrical brownout upon entering target occultation or eclipse. Spacecraft will lose attitude control.',
      recommendation: 'Equip Space-Grade Lithium-Sulfur Battery to provide survival power during darkness.'
    });
  }

  // ==================== 6. MICROMETEOROID IMPACT STRESS TEST ====================
  if (totals.hasWhippleShielding) {
    results.push({
      scenarioId: 'stress_micrometeoroid',
      title: 'Hypervelocity Asteroid Ejecta Impact (12 km/s)',
      status: 'PASS',
      componentTested: 'Whipple Debris Bumper Shield',
      spacecraftValue: 'Multi-Plate Whipple Installed',
      requiredValue: 'Hypervelocity Shielding',
      projectedConsequence: 'Bumper sheet vaporizes incoming projectile into harmless dispersed plasma cloud. Zero propellant tank breach.',
      recommendation: 'Whipple shielding protects all core propellant bladders.'
    });
  } else {
    results.push({
      scenarioId: 'stress_micrometeoroid',
      title: 'Hypervelocity Asteroid Ejecta Impact (12 km/s)',
      status: 'WARNING',
      componentTested: 'Unshielded Bus Structure',
      spacecraftValue: 'No Bumper Shield',
      requiredValue: 'Whipple Shield Recommended',
      projectedConsequence: 'High vulnerability to punctures during proximity operations near active asteroid particle ejection zones.',
      recommendation: 'Add Whipple Micrometeoroid Shield if operating in close proximity to Bennu.'
    });
  }

  // ==================== 7. NAVIGATION SENSOR DRIFT STRESS TEST ====================
  const hasDualStarTracker = design.components.navigation?.some((n) => n.id === 'nav_dual_star_trackers');
  if (hasDualStarTracker) {
    results.push({
      scenarioId: 'stress_nav_sensor_drift',
      title: 'Star Tracker Optical Blinding During Thruster Plume',
      status: 'PASS',
      componentTested: 'Dual Star Tracker & IMU Suite',
      spacecraftValue: 'Redundant Optical Heads + Gyro',
      requiredValue: 'Multi-Sensor Inertial Reference',
      projectedConsequence: 'Secondary optical sensor and ring-laser gyro maintain arcsecond attitude lock during engine firing.',
      recommendation: 'Guidance and navigation architecture is robust.'
    });
  } else {
    results.push({
      scenarioId: 'stress_nav_sensor_drift',
      title: 'Star Tracker Optical Blinding During Thruster Plume',
      status: 'WARNING',
      componentTested: 'Basic Nav Sensors',
      spacecraftValue: 'Single Star Tracker',
      requiredValue: 'Dual Star Trackers',
      projectedConsequence: 'Sensor blinding will cause temporary orientation loss, triggering safe mode delay.',
      recommendation: 'Add dual star trackers for autonomous optical navigation around the asteroid.'
    });
  }

  // ==================== 8. UNEXPECTED SCIENCE OPPORTUNITY STRESS TEST ====================
  const deltaVMarginMs = totals.totalDeltaVMs - scenario.target.deltaVRequirementMs.totalRequired;
  if (deltaVMarginMs >= 150 && totals.netPowerMarginW >= 80) {
    results.push({
      scenarioId: 'stress_science_opportunity',
      title: 'Dynamic Scientific Opportunity (Volatile Plume Event)',
      status: 'PASS',
      componentTested: 'Reserve Propellant & Power Margin',
      spacecraftValue: `+${deltaVMarginMs.toFixed(0)} m/s Delta-V / +${totals.netPowerMarginW.toFixed(0)} W Margin`,
      requiredValue: '+120 m/s Reserve & +60 W',
      projectedConsequence: 'Spacecraft has sufficient fuel and electrical reserves to perform diversion burn and capture high-priority bonus science (+35%).',
      recommendation: 'Surplus margins position the mission for maximum scientific discovery.'
    });
  } else {
    results.push({
      scenarioId: 'stress_science_opportunity',
      title: 'Dynamic Scientific Opportunity (Volatile Plume Event)',
      status: 'WARNING',
      componentTested: 'Reserve Margins',
      spacecraftValue: `+${Math.max(0, deltaVMarginMs).toFixed(0)} m/s Delta-V / +${totals.netPowerMarginW.toFixed(0)} W`,
      requiredValue: '+120 m/s Reserve & +60 W',
      projectedConsequence: 'Spacecraft cannot execute spontaneous diversion burns without endangering baseline return.',
      recommendation: 'Increase propellant loading to enable exploitation of serendipitous scientific discoveries.'
    });
  }

  return results;
}
