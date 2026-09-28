import type { SpacecraftDesign } from '../types/subsystems.ts';
import type { MissionTelemetry } from '../types/mission.ts';
import type { ForeshadowedEvent, EventConsequenceResolution, PlayerActionType, PlayerDesignHistory } from '../types/events.ts';
import { calculateSubsystemTotals } from '../engine/math/rocket.ts';

export const FORESHADOWED_MISSION_EVENTS: ForeshadowedEvent[] = [
  {
    id: 'evt_solar_storm',
    title: 'Coronal Mass Ejection (Solar Particle Storm)',
    hazardType: 'solar_storm',
    fazeLevel: 'advisory',
    scheduledMetDay: 68,
    targetedSubsystem: 'computing',
    headline: 'Solar monitoring satellites detect coronal magnetic shear. Severe proton flux wave incoming.',
    description: 'A major Coronal Mass Ejection is expanding along the spacecraft trajectory. Without radiation-hardened electronics or active bus shadowing, high-energy protons will cause severe memory bitflips and computer latchups.',
    availableActions: [
      {
        type: 'SAFE_MODE',
        label: 'Engage Autonomous Safe Mode',
        description: 'Slew solar arrays edge-on, power down all science instruments, and reboot into protected ROM kernel. Halts science collection for 48 hours (-12% science loss), but eliminates hardware damage.',
        scienceYieldModifier: 0.88
      },
      {
        type: 'MANEUVER',
        label: 'Reorient Bus Behind Structural Heat Shield',
        description: 'Expend 12 kg of propellant to pivot the spacecraft bus so the engine block and composite frame shadow the avionics bay.',
        propellantCostKg: 12.0
      },
      {
        type: 'CONTINUE_OPS',
        label: 'Push Through Operations',
        description: 'Maintain active observation schedules. Relies purely on the radiation tolerance of onboard computing silicon.',
        scienceYieldModifier: 1.0
      }
    ]
  },
  {
    id: 'evt_dsn_blackout',
    title: 'Deep Space Network Antenna Scheduling Conflict',
    hazardType: 'communication_blackout',
    fazeLevel: 'advisory',
    scheduledMetDay: 110,
    targetedSubsystem: 'communications',
    headline: 'Goldstone DSS-14 70m dish re-allocated to high-priority Artemis emergency. Downlink canceled.',
    description: 'Ground telemetry contacts have been pre-empted for the next 7 days. Your solid-state recorder must buffer all incoming scientific measurements without overflow.',
    availableActions: [
      {
        type: 'TRANSMIT_BURST',
        label: 'Emergency High-Power S-Band Burst to 34m Stations',
        description: 'Overdrive transmitter power by 40W to dump critical science telemetry to smaller regional ground stations.',
        powerDrawWatts: 40.0
      },
      {
        type: 'SAFE_MODE',
        label: 'Throttle Science Instrument Duty Cycles',
        description: 'Reduce spectrometer and camera framing rates by 50% to prevent buffer overflow until DSN re-establishes contact.',
        scienceYieldModifier: 0.80
      },
      {
        type: 'CONTINUE_OPS',
        label: 'Maintain Full Science Gathering',
        description: 'Keep recording at full sensor rate. If storage buffer fills before next pass, oldest data will be overwritten.'
      }
    ]
  },
  {
    id: 'evt_micrometeoroid_cluster',
    title: 'Hypervelocity Interplanetary Debris Swarm',
    hazardType: 'micrometeoroid_strike',
    fazeLevel: 'warning',
    scheduledMetDay: 135,
    targetedSubsystem: 'structure',
    headline: 'Optical sensors track crossing of a dense cometary dust trail. Hypervelocity micro-particles detected.',
    description: 'A cluster of millimetre-sized carbonaceous particles is on an intercept trajectory at 22 km/s. Unshielded composite panels risk penetration.',
    availableActions: [
      {
        type: 'MANEUVER',
        label: 'Orient Protective Bumper Towards Relative Velocity Vector',
        description: 'Burn 8 kg propellant to align the spacecraft forward face directly into the incoming particle vector.',
        propellantCostKg: 8.0
      },
      {
        type: 'SAFE_MODE',
        label: 'Retract / Feather Solar Arrays & Idle Sensors',
        description: 'Minimize surface exposure area to reduce collision cross-section by 40%.',
        scienceYieldModifier: 0.90
      },
      {
        type: 'CONTINUE_OPS',
        label: 'Maintain Trajectory & Rely on Hull Shielding',
        description: 'Trust spacecraft structural armor and Whipple debris shielding to absorb particle kinetic impacts.'
      }
    ]
  },
  {
    id: 'evt_propellant_leak',
    title: 'Reaction Control Valve Stiction Anomaly',
    hazardType: 'propellant_leak',
    fazeLevel: 'warning',
    scheduledMetDay: 165,
    targetedSubsystem: 'propulsion',
    headline: 'Telemetry indicates slow pressure decay in RCS manifold line B.',
    description: 'Micro-debris or thermal cycling has caused a propellant latch valve to bind partially open, causing micro-venting of attitude control propellant.',
    availableActions: [
      {
        type: 'ISOLATE_BRANCH',
        label: 'Isolate Branch B & Switch to Redundant Thruster String',
        description: 'Fire pyrotechnic isolation valve and transfer attitude control to redundant RCS thruster string.',
        propellantCostKg: 2.0
      },
      {
        type: 'REBOOT',
        label: 'Thermal Pulse Valve Actuation Cycle',
        description: 'Apply high-frequency electrical pulses to the solenoid coil to unseat contamination and restore seal.',
        powerDrawWatts: 25.0
      },
      {
        type: 'CONTINUE_OPS',
        label: 'Ignore & Compensate with Reaction Wheels',
        description: 'Venting continues at 0.15 kg/day until the manifold is isolated, wasting vital trajectory fuel.'
      }
    ]
  },
  {
    id: 'evt_eclipse_thermal_shock',
    title: 'Deep Eclipse Shadow & Thermal Freeze-Out',
    hazardType: 'thermal_anomaly',
    fazeLevel: 'warning',
    scheduledMetDay: 195,
    targetedSubsystem: 'thermal',
    headline: 'Spacecraft enters prolonged asteroid shadow cone. Solar generation drops to 0W.',
    description: 'During proximity transit behind Bennu, solar power is completely cut for 110 minutes. Without active thermal heaters, propellant lines risk freezing below 235 K.',
    availableActions: [
      {
        type: 'RECONFIGURE_POWER',
        label: 'Divert Battery Power to Propellant Line Survival Heaters',
        description: 'Supply 45W of battery energy to line heaters to keep hydrazine and bipropellant manifolds above freezing.',
        powerDrawWatts: 45.0
      },
      {
        type: 'SAFE_MODE',
        label: 'Cluster Avionics Heat & Shed Payload Load',
        description: 'Route internal avionics waste heat into the core bus and power down all scientific cameras.',
        scienceYieldModifier: 0.85
      },
      {
        type: 'CONTINUE_OPS',
        label: 'Maintain Nominal Thermal Configuration',
        description: 'Rely purely on passive MLI thermal insulation and existing thermal inertia.'
      }
    ]
  },
  {
    id: 'evt_nav_sensor_drift',
    title: 'Star Tracker Optical Blindness & Gyro Drift',
    hazardType: 'navigation_error',
    fazeLevel: 'advisory',
    scheduledMetDay: 215,
    targetedSubsystem: 'navigation',
    headline: 'Fine guidance star trackers flooded by reflected glint from asteroid regolith dust.',
    description: 'Sunlight scattering off the asteroid surface has saturated optical star tracker baffles, causing attitude knowledge covariance to expand.',
    availableActions: [
      {
        type: 'OPTICAL_ALIGNMENT',
        label: 'Cross-Reference Optical Navigation Framing Cameras',
        description: 'Use optical camera framing against Bennu surface crater landmarks to triangulate inertial position.',
        powerDrawWatts: 20.0
      },
      {
        type: 'MANEUVER',
        label: 'Slew Away from Glint & Recalibrate IMU',
        description: 'Burn 5 kg propellant to pitch the spacecraft 30 degrees away from the sun glint vector for star acquisition.',
        propellantCostKg: 5.0
      },
      {
        type: 'CONTINUE_OPS',
        label: 'Rely on Coarse Sun Sensors & Blind Integration',
        description: 'Accept attitude drift and continue on dead-reckoning inertial measurement units.'
      }
    ]
  },
  {
    id: 'evt_asteroid_outgassing',
    title: 'Serendipitous Discovery: Active Asteroid Volatile Plume',
    hazardType: 'scientific_discovery',
    fazeLevel: 'critical',
    scheduledMetDay: 245,
    targetedSubsystem: 'science',
    headline: 'Optical cameras detect unexpected particle ejection and volatile outgassing plume on Bennu.',
    description: 'Bennu has unexpectedly ejected thousands of carbonaceous particles and volatile gas into orbit. A historic, once-in-a-generation scientific opportunity!',
    availableActions: [
      {
        type: 'OBSERVE_BONUS',
        label: 'Execute Close-Proximity Diversion Burn',
        description: 'Spend 18 kg of propellant and 60W power to alter trajectory and fly directly through the particle plume for mass spectrometry.',
        propellantCostKg: 18.0,
        powerDrawWatts: 60.0,
        scienceYieldModifier: 1.50
      },
      {
        type: 'CONTINUE_OPS',
        label: 'Observe from Safe Stand-Off Distance (10 km)',
        description: 'Record plume visually from a safe stand-off without expending critical propellant reserves.',
        scienceYieldModifier: 1.20
      }
    ]
  },
  {
    id: 'evt_battery_capacity_sag',
    title: 'Peak Science Payload Power Demand Sag',
    hazardType: 'battery_degradation',
    fazeLevel: 'warning',
    scheduledMetDay: 275,
    targetedSubsystem: 'power',
    headline: 'Simultaneous LIDAR mapping, thermal infrared scanning, and high-rate downlink strains electrical bus.',
    description: 'Operating the entire payload suite simultaneously at 1.36 AU pushes total electrical load beyond solar array generation, rapidly drawing down battery reserves.',
    availableActions: [
      {
        type: 'LOAD_SHED',
        label: 'Duty-Cycle Instruments Sequentially',
        description: 'Stagger LIDAR passes and transmitter windows into sequential time blocks. Slightly slows survey rate (-5% science) but eliminates battery stress.',
        scienceYieldModifier: 0.95
      },
      {
        type: 'SAFE_MODE',
        label: 'Halt Science Operations & Prioritize Battery Recharge',
        description: 'Point solar arrays directly at the Sun and top off battery state of charge (-20% science).',
        scienceYieldModifier: 0.80
      },
      {
        type: 'CONTINUE_OPS',
        label: 'Run All Instruments at Full Power',
        description: 'Rely on battery capacity to absorb the peak discharge cycle.'
      }
    ]
  }
];

export function resolveEventConsequence(
  event: ForeshadowedEvent,
  actionTaken: PlayerActionType,
  design: SpacecraftDesign,
  telemetry: MissionTelemetry,
  designHistory?: PlayerDesignHistory
): EventConsequenceResolution {
  const totals = calculateSubsystemTotals(design);
  const wasWeaknessIgnored = Boolean(
    designHistory?.ignoredWeaknessWarning &&
    designHistory?.primaryWeaknessTitle?.toLowerCase().includes(event.targetedSubsystem.toLowerCase())
  );

  // 1. Solar Storm
  if (event.hazardType === 'solar_storm') {
    if (actionTaken === 'SAFE_MODE') {
      const lostScience = Math.round(telemetry.rawScienceCollected * 0.12);
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 0,
        scienceLostPoints: lostScience,
        scienceGainedPoints: 0,
        propellantConsumedKg: 0,
        causalHeadline: 'AUTONOMOUS SAFE MODE SHIELDED AVIONICS',
        causalDetail: 'Spacecraft slewed arrays edge-on and held volatile registers in ROM kernels. Solar proton storm passed without a single transistor latchup.',
        isFatal: false,
        mitigatedByHardware: designHistory?.hasRedesignedAfterStress
          ? 'Safe Mode & Pre-Launch Stress Redesign'
          : 'Safe Mode Protocol'
      };
    } else if (actionTaken === 'MANEUVER') {
      const fuelAvailable = telemetry.propellantRemainingKg >= 12.0;
      if (fuelAvailable) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 5,
          propellantConsumedKg: 12.0,
          causalHeadline: 'BUS ATTITUDE DEFLECTION SUCCESSFUL',
          causalDetail: 'Spacecraft reoriented so the main engine mass and structural deck shadowed the computing bay, reducing radiation dose by 85%.',
          isFatal: false,
          mitigatedByHardware: totals.hasRadShielding ? 'Radiation Shielding & Propellant RCS' : 'Attitude RCS Thrusters'
        };
      } else {
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'computing',
          damagePercent: 30,
          scienceLostPoints: 15,
          scienceGainedPoints: 0,
          propellantConsumedKg: telemetry.propellantRemainingKg,
          causalHeadline: 'INSUFFICIENT PROPELLANT FOR SHADOW MANEUVER',
          causalDetail: 'Tanks ran dry midway through the turn, leaving avionics partially exposed to the incoming particle wave.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    } else {
      // Continue ops relying on hardware
      const radHardness = totals.radiationToleranceKrad;
      if (radHardness >= 100) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 15,
          propellantConsumedKg: 0,
          causalHeadline: 'RAD750 COMPUTER SURVIVED PROTON STORM UNTOUCHED',
          causalDetail: '100 krad radiation-hardened processor absorbed the full solar flare dose with zero bitflips, gathering valuable in-situ plasma physics (+15 Science).',
          isFatal: false,
          mitigatedByHardware: 'RAD750 Radiation-Hardened Computer'
        };
      } else {
        const penaltyMultiplier = wasWeaknessIgnored ? 1.4 : 1.0;
        const damage = Math.min(85, Math.round((35 + (50 - radHardness) * 0.6) * penaltyMultiplier));
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'computing',
          damagePercent: damage,
          scienceLostPoints: 25,
          scienceGainedPoints: 0,
          propellantConsumedKg: 0,
          causalHeadline: wasWeaknessIgnored
            ? 'UNMITIGATED COTS PROCESSOR CRASHED UNDER SOLAR STORM'
            : 'COMMERCIAL PROCESSOR SUFFERED SEVERE BITFLIPS',
          causalDetail: `Radiation flux overwhelmed the ${radHardness} krad rated commercial computing architecture. Multiple core resets caused flight software reboot loops.`,
          isFatal: damage >= 80,
          mitigatedByHardware: null
        };
      }
    }
  }

  // 2. Communication Blackout
  if (event.hazardType === 'communication_blackout') {
    if (actionTaken === 'TRANSMIT_BURST') {
      const hasPower = totals.netPowerMarginW >= -10;
      if (hasPower) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 15,
          propellantConsumedKg: 0,
          causalHeadline: 'HIGH-POWER BURST RELAYED TO 34M GROUND STATIONS',
          causalDetail: 'Transmitter overdrive successfully punched through atmospheric noise to regional 34m dishes, offloading critical science buffer.',
          isFatal: false,
          mitigatedByHardware: totals.hasRedundantComms ? 'Dual Transponders & High-Gain Antenna' : 'High-Gain Antenna'
        };
      } else {
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'power',
          damagePercent: 15,
          scienceLostPoints: 10,
          scienceGainedPoints: 5,
          propellantConsumedKg: 0,
          causalHeadline: 'POWER BUS BROWNOUT DURING TRANSMITTER BURST',
          causalDetail: 'Transmitter overdrive drew more current than the power bus could sustain, tripping protective circuit breakers.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    } else if (actionTaken === 'SAFE_MODE') {
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 0,
        scienceLostPoints: 15,
        scienceGainedPoints: 0,
        propellantConsumedKg: 0,
        causalHeadline: 'INSTRUMENTS THROTTLED TO PREVENT OVERFLOW',
        causalDetail: 'Data collection rate was throttled to preserve solid-state buffer space until full DSN contact was restored.',
        isFatal: false,
        mitigatedByHardware: 'Mission Operations Throttling'
      };
    } else {
      // Continue ops
      const bufferFree = totals.storageCapacityMb - telemetry.dataBufferUsedMb;
      if (bufferFree >= 12000) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 20,
          propellantConsumedKg: 0,
          causalHeadline: 'LARGE SOLID-STATE RECORDER PREVENTED DATA LOSS',
          causalDetail: 'Your high-capacity onboard storage buffer absorbed all incoming scientific files across the 7-day outage with zero overwrite (+20 Science).',
          isFatal: false,
          mitigatedByHardware: 'High-Capacity Solid-State Recorder'
        };
      } else {
        const loss = wasWeaknessIgnored ? 55 : 35;
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'communications',
          damagePercent: 15,
          scienceLostPoints: loss,
          scienceGainedPoints: 0,
          propellantConsumedKg: 0,
          causalHeadline: 'BUFFER OVERFLOW: RAW SCIENCE DATA PERMANENTLY LOST',
          causalDetail: `Without ground station contact, the ${totals.storageCapacityMb / 1024} GB buffer filled completely. Oldest spectral scans were overwritten by incoming telemetry.`,
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    }
  }

  // 3. Micrometeoroid Strike
  if (event.hazardType === 'micrometeoroid_strike') {
    if (actionTaken === 'MANEUVER') {
      const hasProp = telemetry.propellantRemainingKg >= 8.0;
      if (hasProp) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 0,
          propellantConsumedKg: 8.0,
          causalHeadline: 'DEFENSIVE ATTITUDE ORIENTED SHIELD INTO PARTICLE VECTOR',
          causalDetail: 'Spacecraft turned its reinforced structural face into the cometary dust stream, dissipating kinetic energy harmlessly.',
          isFatal: false,
          mitigatedByHardware: totals.hasWhippleShielding ? 'Whipple Shield & Attitude Thrusters' : 'Attitude RCS Thrusters'
        };
      } else {
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'structure',
          damagePercent: 20,
          scienceLostPoints: 0,
          scienceGainedPoints: 0,
          propellantConsumedKg: telemetry.propellantRemainingKg,
          causalHeadline: 'PARTIAL DEFENSIVE SLEW EXPENDED FUEL RESERVES',
          causalDetail: 'Propellant depleted before the defensive orientation was achieved. Glancing micrometeoroid impact pitted the outer bus.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    } else if (actionTaken === 'SAFE_MODE') {
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 5,
        scienceLostPoints: 8,
        scienceGainedPoints: 0,
        propellantConsumedKg: 0,
        causalHeadline: 'FEATHERED SOLAR PANELS MINIMIZED COLLISION CROSS-SECTION',
        causalDetail: 'Feathering solar arrays edge-on cut projected area by 40%. Minor pitting on radiator, core systems undamaged.',
        isFatal: false,
        mitigatedByHardware: 'Autonomous Feathering Protocol'
      };
    } else {
      // Continue ops
      if (totals.hasWhippleShielding) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 10,
          propellantConsumedKg: 0,
          causalHeadline: 'WHIPPLE SHIELD VAPORIZED HYPERVELOCITY DEBRIS',
          causalDetail: 'Kevlar/aluminum sacrificial bumper shattered incoming debris particles, absorbing 100% of kinetic energy without puncturing the pressure hull.',
          isFatal: false,
          mitigatedByHardware: 'Whipple Debris Shield'
        };
      } else {
        const damage = wasWeaknessIgnored ? 40 : 25;
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'structure',
          damagePercent: damage,
          scienceLostPoints: 15,
          scienceGainedPoints: 0,
          propellantConsumedKg: 10.0, // Micro-leak from hull puncture
          causalHeadline: wasWeaknessIgnored
            ? 'UNSHIELDED HULL PUNCTURED BY DUST GRAIN: FUEL VENTING'
            : 'MICROMETEOROID PENETRATED STRUCTURAL BUS',
          causalDetail: 'Hypervelocity debris pierced the unshielded composite panel, severing an auxiliary propellant line and venting 10 kg of fuel into space.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    }
  }

  // 4. Propellant Leak / Valve Stiction
  if (event.hazardType === 'propellant_leak') {
    if (actionTaken === 'ISOLATE_BRANCH') {
      if (totals.hasRedundantPropulsion) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 0,
          propellantConsumedKg: 2.0,
          causalHeadline: 'PYRO ISOLATION FIRED: SWITCHED TO REDUNDANT RCS STRING',
          causalDetail: 'Faulty branch was pyrotechnically sealed. Attitude control transferred smoothly to redundant thruster pods with zero further leakage.',
          isFatal: false,
          mitigatedByHardware: 'Dual Redundant Propulsion System'
        };
      } else {
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'propulsion',
          damagePercent: 35,
          scienceLostPoints: 10,
          scienceGainedPoints: 0,
          propellantConsumedKg: 5.0,
          causalHeadline: 'ISOLATION REDUCED ATTITUDE AUTHORITY (NO BACKUP STRING)',
          causalDetail: 'Without redundant thruster pods, isolating Branch B disabled 50% of attitude control thrusters, forcing reliance on momentum wheels.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    } else if (actionTaken === 'REBOOT') {
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 5,
        scienceLostPoints: 0,
        scienceGainedPoints: 0,
        propellantConsumedKg: 1.5,
        causalHeadline: 'THERMAL PULSE ACTUATION FREED STUCK VALVE',
        causalDetail: 'Rapid solenoid pulse cycling dislodged contamination particle from the valve seat, restoring pressure seal.',
        isFatal: false,
        mitigatedByHardware: 'Thermal Pulse Coil Actuation'
      };
    } else {
      // Continue ops
      const leakTotal = Math.min(telemetry.propellantRemainingKg, 22.0);
      return {
        eventId: event.id,
        actionTaken,
        subsystemDamaged: 'propulsion',
        damagePercent: 20,
        scienceLostPoints: 0,
        scienceGainedPoints: 0,
        propellantConsumedKg: leakTotal,
        causalHeadline: 'CONTINUOUS VALVE LEAK WASTED 22 KG PROPELLANT',
        causalDetail: 'Slow unmitigated venting drained vital trajectory margin across transit. Trajectory correction authority significantly degraded.',
        isFatal: false,
        mitigatedByHardware: null
      };
    }
  }

  // 5. Thermal Anomaly / Deep Eclipse
  if (event.hazardType === 'thermal_anomaly') {
    if (actionTaken === 'RECONFIGURE_POWER') {
      if (totals.hasActiveThermal || totals.batteryStorageJoules >= 5000000) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 5,
          propellantConsumedKg: 0,
          causalHeadline: 'ACTIVE SURVIVAL HEATERS PREVENTED FUEL FREEZE-OUT',
          causalDetail: 'Heatpipes and survival heaters maintained propellant manifold temperatures safely above 275 K throughout the shadow transit.',
          isFatal: false,
          mitigatedByHardware: totals.hasActiveThermal ? 'Active Heatpipes & RHU Heaters' : 'High-Capacity Battery'
        };
      } else {
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'power',
          damagePercent: 20,
          scienceLostPoints: 5,
          scienceGainedPoints: 0,
          propellantConsumedKg: 0,
          causalHeadline: 'BATTERY DOD EXCEEDED 85% UNDER HEATER LOAD',
          causalDetail: 'Heater draw drained undersized battery to deep discharge levels, causing permanent electrochemical cell degradation.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    } else if (actionTaken === 'SAFE_MODE') {
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 5,
        scienceLostPoints: 12,
        scienceGainedPoints: 0,
        propellantConsumedKg: 0,
        causalHeadline: 'AVIONICS HEAT CLUSTERED IN CORE BUS',
        causalDetail: 'Non-essential systems shut down; internal core avionics heat maintained bus survival temperatures until emergence from shadow.',
        isFatal: false,
        mitigatedByHardware: 'Thermal Safing Routine'
      };
    } else {
      // Continue ops
      if (totals.hasActiveThermal) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 10,
          propellantConsumedKg: 0,
          causalHeadline: 'RADIOISOTOPE HEATER UNITS (RHU) MAINTAINED THERMAL STABILITY',
          causalDetail: 'Decay heat from radioisotope units provided steady thermal baseline without consuming electrical power.',
          isFatal: false,
          mitigatedByHardware: 'Active Heatpipes & Radioisotope Heaters'
        };
      } else {
        const damage = wasWeaknessIgnored ? 45 : 30;
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'propulsion',
          damagePercent: damage,
          scienceLostPoints: 20,
          scienceGainedPoints: 0,
          propellantConsumedKg: 5.0,
          causalHeadline: 'PASSIVE-ONLY THERMAL SYSTEM FAILED: FUEL FREEZING IN LINES',
          causalDetail: 'Without active heatpipes or RHUs, manifold temperatures plummeted to 215 K. Hydrazine froze in line segments, cracking joint seals.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    }
  }

  // 6. Navigation Error / Star Tracker Glare
  if (event.hazardType === 'navigation_error') {
    if (actionTaken === 'OPTICAL_ALIGNMENT') {
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 0,
        scienceLostPoints: 0,
        scienceGainedPoints: 10,
        propellantConsumedKg: 0,
        causalHeadline: 'OPTICAL CRATER TRIANGULATION RESTORED POINTING',
        causalDetail: 'Framing camera algorithm identified asteroid surface landmarks, reducing attitude pointing error back to arcsecond accuracy (+10 Science).',
        isFatal: false,
        mitigatedByHardware: 'Optical Science Imager & Star Trackers'
      };
    } else if (actionTaken === 'MANEUVER') {
      const hasProp = telemetry.propellantRemainingKg >= 5.0;
      if (hasProp) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 0,
          propellantConsumedKg: 5.0,
          causalHeadline: 'SLEW AWAY FROM SUN GLINT RESTORED STAR LOCK',
          causalDetail: 'Pivoting 30 degrees shielded star tracker optics from regolith glare, re-acquiring guide stars.',
          isFatal: false,
          mitigatedByHardware: 'Attitude RCS Thrusters'
        };
      } else {
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'navigation',
          damagePercent: 15,
          scienceLostPoints: 10,
          scienceGainedPoints: 0,
          propellantConsumedKg: telemetry.propellantRemainingKg,
          causalHeadline: 'MANEUVER FAILED DUE TO PROPELLANT EXHAUSTION',
          causalDetail: 'Thrusters starved of propellant before completing pitch maneuver.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    } else {
      // Continue ops
      const hasDualStarTrackers = (design.components.navigation || []).some((c) => c.id === 'nav_dual_star_trackers');
      if (hasDualStarTrackers) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 5,
          propellantConsumedKg: 0,
          causalHeadline: 'DUAL REDUNDANT STAR TRACKERS REJECTED OPTICAL GLINT',
          causalDetail: 'Secondary star tracker pointing at deep sky maintained clean star catalog lock despite primary camera glare.',
          isFatal: false,
          mitigatedByHardware: 'Dual Autonomous Star Trackers'
        };
      } else {
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'navigation',
          damagePercent: 25,
          scienceLostPoints: 20,
          scienceGainedPoints: 0,
          propellantConsumedKg: 0,
          causalHeadline: 'ATTITUDE DRIFT CAUGHT ANTENNA OFF-EARTH POINTING',
          causalDetail: 'Gyro integration drift caused 1.5 degree antenna misalignment, losing 24 hours of scheduled science downlink.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    }
  }

  // 7. Scientific Discovery / Bennu Volatile Plume
  if (event.hazardType === 'scientific_discovery') {
    if (actionTaken === 'OBSERVE_BONUS') {
      const hasFuel = telemetry.propellantRemainingKg >= 18.0;
      if (hasFuel) {
        const bonusYield = totals.hasWhippleShielding ? 75 : 60;
        const dustDamage = totals.hasWhippleShielding ? 0 : 15;
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: dustDamage > 0 ? 'structure' : undefined,
          damagePercent: dustDamage,
          scienceLostPoints: 0,
          scienceGainedPoints: bonusYield,
          propellantConsumedKg: 18.0,
          causalHeadline: 'HISTORIC IN-SITU SAMPLING OF ACTIVE ASTEROID PLUME',
          causalDetail: totals.hasWhippleShielding
            ? 'Spacecraft executed a precision fly-through of the volatile plume. Whipple shield absorbed particle impacts while spectrometers captured pristine prebiotic organics (+75 Science)!'
            : 'Spacecraft gathered breakthrough plume data (+60 Science), though unshielded solar arrays sustained minor abrasive pitting.',
          isFatal: false,
          mitigatedByHardware: totals.hasWhippleShielding
            ? 'Whipple Debris Shield & Trajectory Propellant Reserve'
            : 'Trajectory Propellant Reserve'
        };
      } else {
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'propulsion',
          damagePercent: 20,
          scienceLostPoints: 0,
          scienceGainedPoints: 30,
          propellantConsumedKg: telemetry.propellantRemainingKg,
          causalHeadline: 'PROPELLANT DEPLETION DURING PLUME DIVERSION BURN',
          causalDetail: 'Captured partial plume spectrometer data (+30 Science), but maneuver exhausted all remaining attitude fuel reserves.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    } else {
      // Continue ops stand-off
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 0,
        scienceLostPoints: 0,
        scienceGainedPoints: 25,
        propellantConsumedKg: 0,
        causalHeadline: 'STAND-OFF OPTICAL SURVEY OF ASTEROID PLUME',
        causalDetail: 'Safely captured telescopic multispectral imaging of the particle ejection event from 10 km stand-off (+25 Science).',
        isFatal: false,
        mitigatedByHardware: null
      };
    }
  }

  // 8. Battery Degradation / Peak Science Power Sag
  if (event.hazardType === 'battery_degradation') {
    if (actionTaken === 'LOAD_SHED') {
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 0,
        scienceLostPoints: 5,
        scienceGainedPoints: 15,
        propellantConsumedKg: 0,
        causalHeadline: 'SEQUENTIAL DUTY CYCLING PRESERVED BATTERY INTEGRITY',
        causalDetail: 'Instrument operations and downlink passes were interleaved into sequential time slices, capping peak power draw and preventing battery degradation.',
        isFatal: false,
        mitigatedByHardware: 'Payload Duty Cycling Algorithm'
      };
    } else if (actionTaken === 'SAFE_MODE') {
      return {
        eventId: event.id,
        actionTaken,
        damagePercent: 0,
        scienceLostPoints: 20,
        scienceGainedPoints: 0,
        propellantConsumedKg: 0,
        causalHeadline: 'SCIENCE HALTED TO RECHARGE BATTERIES',
        causalDetail: 'Observation run aborted; arrays oriented directly towards Sun to bring battery back to 100% state of charge.',
        isFatal: false,
        mitigatedByHardware: 'Power Protection Safing'
      };
    } else {
      // Continue ops
      const hasLiSulfur = (design.components.power || []).some((c) => c.id === 'pwr_lithium_sulfur_battery');
      if (hasLiSulfur || totals.batteryStorageJoules >= 7200000) {
        return {
          eventId: event.id,
          actionTaken,
          damagePercent: 0,
          scienceLostPoints: 0,
          scienceGainedPoints: 25,
          propellantConsumedKg: 0,
          causalHeadline: 'LITHIUM-SULFUR BATTERY EASILY ABSORBED PEAK LOAD',
          causalDetail: 'High energy density battery handled concurrent LIDAR, camera, and transmitter power draws with DoD remaining below 45% (+25 Science).',
          isFatal: false,
          mitigatedByHardware: 'Lithium-Sulfur High Energy Density Battery'
        };
      } else {
        const damage = wasWeaknessIgnored ? 35 : 20;
        return {
          eventId: event.id,
          actionTaken,
          subsystemDamaged: 'power',
          damagePercent: damage,
          scienceLostPoints: 15,
          scienceGainedPoints: 10,
          propellantConsumedKg: 0,
          causalHeadline: 'BATTERY DOD EXCEEDED 85%: ELECTROCHEMICAL CELL WEAR',
          causalDetail: 'Heavy simultaneous instrument load caused deep battery discharge. Subsystem brownout aborted the second survey orbit.',
          isFatal: false,
          mitigatedByHardware: null
        };
      }
    }
  }

  // Default fallback
  return {
    eventId: event.id,
    actionTaken,
    damagePercent: 0,
    scienceLostPoints: 0,
    scienceGainedPoints: 10,
    propellantConsumedKg: 0,
    causalHeadline: 'ANOMALY STABILIZED BY ONBOARD FDIR',
    causalDetail: 'Fault Detection, Isolation, and Recovery routines maintained nominal telemetry parameters.',
    isFatal: false,
    mitigatedByHardware: 'Autonomous FDIR System'
  };
}
