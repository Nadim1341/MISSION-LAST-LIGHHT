import type { SpacecraftComponent } from '../types/subsystems.ts';

export const COMPONENT_CATALOG: SpacecraftComponent[] = [
  // ==================== POWER ====================
  {
    id: 'pwr_ultraflex_solar',
    name: 'UltraFlex Circular Solar Array (2.2m)',
    category: 'power',
    tier: 'space_proven',
    description: 'Circular accordion-folding high-efficiency gallium-arsenide array offering exceptional power-to-mass ratio.',
    massKg: 18.5,
    costM: 14.2,
    powerDrawW: -650, // Generates 650W at 1 AU
    reliability: 0.94,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 50,
    thermalDissipationW: 5,
    minOperatingTempK: 120,
    maxOperatingTempK: 390,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.35, // Cell degradation from CME
      micrometeoroidVulnerability: 0.40,
      softwareAnomalyRisk: 0.10
    },
    nasaReference: {
      missionUsed: 'Mars Phoenix / InSight / Orion',
      dataset: 'NASA Glenn Power Systems Tech Transfer',
      citation: 'Karp et al. (2018), UltraFlex Solar Array Technology Characterization',
      referenceUrl: 'https://ntrs.nasa.gov/citations/20180002134'
    }
  },
  {
    id: 'pwr_rigid_silicon',
    name: 'Rigid Silicon Solar Panels',
    category: 'power',
    tier: 'commercial',
    description: 'Standard rigid body-mounted silicon solar panels. Heavier and less efficient, but cost-effective and rugged.',
    massKg: 34.0,
    costM: 6.8,
    powerDrawW: -420,
    reliability: 0.90,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 30,
    thermalDissipationW: 10,
    minOperatingTempK: 140,
    maxOperatingTempK: 370,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.50,
      micrometeoroidVulnerability: 0.25,
      softwareAnomalyRisk: 0.05
    },
    nasaReference: {
      missionUsed: 'SmallSat / Lunar Trailblazer COTS',
      dataset: 'NASA Small Spacecraft Technology State of the Art (SST-SOA)',
      citation: 'NASA Ames SST-SOA Power Subsystems Section 3',
      referenceUrl: 'https://www.nasa.gov/smallsat-institute/sst-soa/power/'
    }
  },
  {
    id: 'pwr_mmrtg',
    name: 'Multi-Mission RTG (Pu-238)',
    category: 'power',
    tier: 'deep_space_hardened',
    description: 'Plutonium-238 thermoelectric decay generator providing constant 110W uninterrupted power anywhere in the solar system.',
    massKg: 45.0,
    costM: 78.5,
    powerDrawW: -110, // Constant power regardless of solar distance
    reliability: 0.995,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 300,
    thermalDissipationW: 2000, // Massive thermal dissipation must be managed
    minOperatingTempK: 50,
    maxOperatingTempK: 450,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: true,
      spaceWeatherVulnerability: 0.02,
      micrometeoroidVulnerability: 0.05,
      softwareAnomalyRisk: 0.01
    },
    nasaReference: {
      missionUsed: 'Curiosity / Perseverance / New Horizons',
      dataset: 'NASA Radioisotope Power Systems (RPS)',
      citation: 'NASA RPS Multi-Mission Radioisotope Thermoelectric Generator Fact Sheet',
      referenceUrl: 'https://rps.nasa.gov/systems/mmrtg/'
    }
  },
  {
    id: 'pwr_lithium_sulfur_battery',
    name: 'Space-Grade Lithium-Sulfur Battery (1200 Wh)',
    category: 'power',
    tier: 'cutting_edge',
    description: 'High specific energy secondary battery pack for energy storage during occultations and high-power instrument passes.',
    massKg: 9.8,
    costM: 11.5,
    powerDrawW: 4, // Idle control draw
    reliability: 0.92,
    scienceYield: 0,
    dataRateKbps: 0,
    storageCapacityMb: 0,
    radiationToleranceKrad: 60,
    thermalDissipationW: 8,
    minOperatingTempK: 250,
    maxOperatingTempK: 320,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.15,
      micrometeoroidVulnerability: 0.30,
      softwareAnomalyRisk: 0.12
    },
    nasaReference: {
      missionUsed: 'NASA NextGen Battery Technologies',
      dataset: 'NASA Glenn Electrochemistry Branch Research',
      citation: 'NASA TechPort: Advanced Li-S Battery Demonstration for Planetary Missions',
      referenceUrl: 'https://techport.nasa.gov/view/105432'
    }
  },

  // ==================== PROPULSION ====================
  {
    id: 'prop_bipropellant_mmh',
    name: 'Bi-Propellant MMH/NTO Engine (450 N)',
    category: 'propulsion',
    tier: 'space_proven',
    description: 'Hypergolic bipropellant main engine. Delivers high impulsive thrust for rapid orbital insertion and rendezvous braking.',
    massKg: 28.0,
    costM: 18.0,
    powerDrawW: 25,
    reliability: 0.96,
    scienceYield: 0,
    dataRateKbps: 0,
    propellantCapacityKg: 180,
    ispSec: 321,
    thrustN: 450,
    radiationToleranceKrad: 100,
    thermalDissipationW: 15,
    minOperatingTempK: 260,
    maxOperatingTempK: 340,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: true,
      spaceWeatherVulnerability: 0.05,
      micrometeoroidVulnerability: 0.35,
      softwareAnomalyRisk: 0.08
    },
    nasaReference: {
      missionUsed: 'Cassini / Juno / OSIRIS-REx Main Thruster',
      dataset: 'NASA Marshall Space Flight Center Propulsion Database',
      citation: 'Aerojet Rocketdyne R-4D MMH/NTO Flight History',
      referenceUrl: 'https://ntrs.nasa.gov/citations/19710015486'
    }
  },
  {
    id: 'prop_hall_ion_thruster',
    name: 'Hall-Effect Electric Ion Propulsion (NEXT-C)',
    category: 'propulsion',
    tier: 'cutting_edge',
    description: 'Xenon ion thruster offering massive 3,100s specific impulse. Demands continuous 850W electrical power and millinewton thrust.',
    massKg: 38.0,
    costM: 32.5,
    powerDrawW: 850, // Heavy electrical consumption!
    reliability: 0.93,
    scienceYield: 0,
    dataRateKbps: 0,
    propellantCapacityKg: 65,
    ispSec: 3100,
    thrustN: 0.236, // Millinewtons
    radiationToleranceKrad: 80,
    thermalDissipationW: 60,
    minOperatingTempK: 240,
    maxOperatingTempK: 350,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.20,
      micrometeoroidVulnerability: 0.25,
      softwareAnomalyRisk: 0.20
    },
    nasaReference: {
      missionUsed: 'Dawn / DART / Psyche',
      dataset: 'NASA Evolutionary Xenon Thruster Commercial (NEXT-C)',
      citation: 'Patterson et al., NASA/TM-2020-220478 NEXT-C Ion Propulsion System',
      referenceUrl: 'https://ntrs.nasa.gov/citations/20205001391'
    }
  },
  {
    id: 'prop_hydrazine_rcs',
    name: 'Hydrazine Monopropellant RCS Thruster Pods',
    category: 'propulsion',
    tier: 'commercial',
    description: 'Catalytic hydrazine attitude control thrusters for fine orientation, detumbling, and secondary backup maneuvers.',
    massKg: 14.5,
    costM: 7.2,
    powerDrawW: 15,
    reliability: 0.95,
    scienceYield: 0,
    dataRateKbps: 0,
    propellantCapacityKg: 40,
    ispSec: 220,
    thrustN: 22,
    radiationToleranceKrad: 70,
    thermalDissipationW: 10,
    minOperatingTempK: 275,
    maxOperatingTempK: 330,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.08,
      micrometeoroidVulnerability: 0.20,
      softwareAnomalyRisk: 0.05
    },
    nasaReference: {
      missionUsed: 'MRO / Lunar Reconnaissance Orbiter (LRO)',
      dataset: 'NASA SmallSat Propulsion Technologies',
      citation: 'NASA Ames Tech Digest: Monopropellant Hydrazine Blowdown Systems',
      referenceUrl: 'https://www.nasa.gov/smallsat-institute/sst-soa/propulsion/'
    }
  },

  // ==================== COMMUNICATIONS ====================
  {
    id: 'comm_xband_hga_12m',
    name: '1.2m Cassegrain X-Band High-Gain Antenna',
    category: 'communications',
    tier: 'space_proven',
    description: 'Deep-space parabolic dish with motorized 2-axis gimbal for targeted downlink to NASA Deep Space Network 34m/70m dishes.',
    massKg: 16.2,
    costM: 16.4,
    powerDrawW: 65,
    reliability: 0.95,
    scienceYield: 0,
    dataRateKbps: 450, // 450 kbps at 1.2 AU
    antennaGainDbi: 38.5,
    radiationToleranceKrad: 80,
    thermalDissipationW: 20,
    minOperatingTempK: 130,
    maxOperatingTempK: 370,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: true,
      spaceWeatherVulnerability: 0.15,
      micrometeoroidVulnerability: 0.35, // Reflector surface strike
      softwareAnomalyRisk: 0.10
    },
    nasaReference: {
      missionUsed: 'OSIRIS-REx / New Horizons / Parker Solar Probe',
      dataset: 'NASA Deep Space Network 810-005 Design Handbook',
      citation: 'JPL DSN Telecommunications Link Design 810-005 Module 101',
      referenceUrl: 'https://deepspace.jpl.nasa.gov/dsndocs/810-005/'
    }
  },
  {
    id: 'comm_kaband_dsoc',
    name: 'Ka-Band / DSOC Optical Laser Comms Hybrid',
    category: 'communications',
    tier: 'cutting_edge',
    description: 'Advanced Ka-band transponder coupled with Deep Space Optical Communications laser terminal for ultra-broadband scientific downlink.',
    massKg: 24.5,
    costM: 38.0,
    powerDrawW: 135,
    reliability: 0.88, // TRL 7 - high complexity
    scienceYield: 15, // Enables raw high-def imagery telemetry
    dataRateKbps: 4200, // 4.2 Mbps downlink capability!
    antennaGainDbi: 48.0,
    radiationToleranceKrad: 100,
    thermalDissipationW: 45,
    minOperatingTempK: 200,
    maxOperatingTempK: 340,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.25,
      micrometeoroidVulnerability: 0.30,
      softwareAnomalyRisk: 0.28 // Complex precision pointing algorithms
    },
    nasaReference: {
      missionUsed: 'Psyche DSOC Tech Demo',
      dataset: 'NASA Space Communications and Navigation (SCaN)',
      citation: 'Biswas et al. (2024), Deep Space Optical Communications Flight Demonstration Results',
      referenceUrl: 'https://www.nasa.gov/mission/deep-space-optical-communications-dsoc/'
    }
  },
  {
    id: 'comm_sband_lga_omni',
    name: 'Dual Omnidirectional S-Band Low-Gain Antenna',
    category: 'communications',
    tier: 'commercial',
    description: 'Rugged, non-steerable omnidirectional antennas providing 360-degree coverage. Immune to pointing errors, but limited to 12 kbps.',
    massKg: 4.2,
    costM: 3.5,
    powerDrawW: 18,
    reliability: 0.99,
    scienceYield: 0,
    dataRateKbps: 14,
    antennaGainDbi: 6.0,
    radiationToleranceKrad: 120,
    thermalDissipationW: 4,
    minOperatingTempK: 100,
    maxOperatingTempK: 400,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.05,
      micrometeoroidVulnerability: 0.10,
      softwareAnomalyRisk: 0.02
    },
    nasaReference: {
      missionUsed: 'Universal Deep Space Contingency Link (Voyager/Cassini/LRO)',
      dataset: 'NASA SCaN Comm Architecture',
      citation: 'JPL DESCANSO Series: Planetary Radio Communications',
      referenceUrl: 'https://descanso.jpl.nasa.gov/'
    }
  },

  // ==================== NAVIGATION & COMPUTING ====================
  {
    id: 'comp_rad750_hardened',
    name: 'RAD750 Radiation-Hardened Flight Computer',
    category: 'computing',
    tier: 'deep_space_hardened',
    description: 'Space-qualified PowerPC processor rated for 100 krad total ionizing dose. Immune to single-event latchups.',
    massKg: 10.5,
    costM: 26.0,
    powerDrawW: 24,
    reliability: 0.985,
    scienceYield: 0,
    dataRateKbps: 0,
    storageCapacityMb: 32768, // 32 GB Solid State Buffer
    radiationToleranceKrad: 100,
    thermalDissipationW: 22,
    minOperatingTempK: 215,
    maxOperatingTempK: 355,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.04, // Highly immune to CMEs
      micrometeoroidVulnerability: 0.05,
      softwareAnomalyRisk: 0.04
    },
    nasaReference: {
      missionUsed: 'Mars Reconnaissance Orbiter / Kepler / Fermi / Europa Clipper',
      dataset: 'BAE Systems RAD750 Space Microprocessor Radiation Reports',
      citation: 'NASA Electronic Parts and Packaging (NEPP) Program RAD750 Testing',
      referenceUrl: 'https://nepp.nasa.gov/'
    }
  },
  {
    id: 'comp_cots_arm_dual',
    name: 'Dual Fault-Tolerant Commercial ARM SoC',
    category: 'computing',
    tier: 'commercial',
    description: 'High-performance multicore commercial processor with software-level triple-modular redundancy (TMR). Fast, but vulnerable to heavy ions.',
    massKg: 3.5,
    costM: 5.5,
    powerDrawW: 16,
    reliability: 0.89,
    scienceYield: 5, // Enables fast onboard image compression
    dataRateKbps: 0,
    storageCapacityMb: 65536, // 64 GB Storage
    radiationToleranceKrad: 35, // Vulnerable to severe solar storms!
    thermalDissipationW: 14,
    minOperatingTempK: 230,
    maxOperatingTempK: 345,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.65, // HIGH RISK under solar flare
      micrometeoroidVulnerability: 0.10,
      softwareAnomalyRisk: 0.22
    },
    nasaReference: {
      missionUsed: 'Ingenuity Mars Helicopter / CAPSTONE Lunar CubeSat',
      dataset: 'NASA SmallSat Tech: COTS Processing Systems',
      citation: 'Balaram et al. (2021), Mars Ingenuity Avionics and Commercial Electronics',
      referenceUrl: 'https://www.nasa.gov/mission/mars-helicopter-ingenuity/'
    }
  },
  {
    id: 'nav_dual_star_trackers',
    name: 'Autonomous Dual Star Tracker Suite + IMU',
    category: 'navigation',
    tier: 'space_proven',
    description: 'Two autonomous optical star cameras with redundant ring-laser gyroscope inertial measurement unit for sub-arcsecond pointing.',
    massKg: 6.8,
    costM: 12.0,
    powerDrawW: 18,
    reliability: 0.97,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 75,
    thermalDissipationW: 12,
    minOperatingTempK: 240,
    maxOperatingTempK: 330,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.12,
      micrometeoroidVulnerability: 0.18,
      softwareAnomalyRisk: 0.08
    },
    nasaReference: {
      missionUsed: 'New Horizons / Dawn / Bennu OSIRIS-REx Optical Nav',
      dataset: 'NASA Goddard Guidance, Navigation and Control Architecture',
      citation: 'JPL Interplanetary Optical Navigation Handbook',
      referenceUrl: 'https://descanso.jpl.nasa.gov/monograph/series12_chapter.cfm'
    }
  },

  // ==================== THERMAL CONTROL ====================
  {
    id: 'therm_passive_mli_louvers',
    name: 'Multi-Layer Insulation (MLI) & Passive Louvers',
    category: 'thermal',
    tier: 'commercial',
    description: '20-layer aluminized Mylar blanket combined with bimetallic thermal louvers that open and close passively with temperature.',
    massKg: 8.5,
    costM: 4.2,
    powerDrawW: 0,
    reliability: 0.97,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 150,
    thermalDissipationW: 0,
    minOperatingTempK: 80,
    maxOperatingTempK: 420,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.05,
      micrometeoroidVulnerability: 0.35, // Punctures degrade thermal vacuum
      softwareAnomalyRisk: 0.01
    },
    nasaReference: {
      missionUsed: 'Pioneer / Voyager / Lunar Reconnaissance Orbiter',
      dataset: 'NASA Thermal Control Architecture Handbook',
      citation: 'Gilmore (2002), Spacecraft Thermal Control Handbook Volume 1',
      referenceUrl: 'https://ntrs.nasa.gov/citations/20030062816'
    }
  },
  {
    id: 'therm_active_heatpipes_rhu',
    name: 'Variable Conductance Heat Pipes + Active Survival Heaters',
    category: 'thermal',
    tier: 'deep_space_hardened',
    description: 'Ammonia heat pipes with automated thermostatically controlled survival heaters to safeguard batteries and optics through deep eclipses.',
    massKg: 15.0,
    costM: 14.8,
    powerDrawW: 35, // Draws power when cold
    reliability: 0.96,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 200,
    thermalDissipationW: 50,
    minOperatingTempK: 50,
    maxOperatingTempK: 450,
    redundancySupported: true,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.08,
      micrometeoroidVulnerability: 0.15,
      softwareAnomalyRisk: 0.10
    },
    nasaReference: {
      missionUsed: 'James Webb Space Telescope / Mars Rover Heat Loop',
      dataset: 'NASA Goddard Thermal Engineering Branch',
      citation: 'NASA/SP-20205003605 Guidelines for Spacecraft Thermal Control Design',
      referenceUrl: 'https://ntrs.nasa.gov/citations/20205003605'
    }
  },

  // ==================== SCIENCE INSTRUMENTS ====================
  {
    id: 'sci_multispectral_imager',
    name: 'High-Resolution Multi-Spectral Camera (PolyCam)',
    category: 'science',
    tier: 'space_proven',
    description: '8-band visible/near-infrared framing camera capable of 1 cm/pixel resolution surface mapping at 1 km altitude.',
    massKg: 8.9,
    costM: 28.5,
    powerDrawW: 32,
    reliability: 0.94,
    scienceYield: 45, // Major science points contributor
    dataRateKbps: 1800, // Generates high data volume!
    radiationToleranceKrad: 80,
    thermalDissipationW: 18,
    minOperatingTempK: 230,
    maxOperatingTempK: 320,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: true,
      spaceWeatherVulnerability: 0.30, // CCD sensor charge degradation
      micrometeoroidVulnerability: 0.25, // Optical aperture exposure
      softwareAnomalyRisk: 0.15
    },
    nasaReference: {
      missionUsed: 'OSIRIS-REx OCAMS (PolyCam / MapCam)',
      dataset: 'NASA Planetary Data System (PDS) Small Bodies Node',
      citation: 'Rizk et al. (2018), OCAMS: The OSIRIS-REx Camera Suite, Space Sci Rev',
      referenceUrl: 'https://pds-smallbodies.astro.umd.edu/data_sb/missions/orex/'
    }
  },
  {
    id: 'sci_lidar_altimeter',
    name: '3D Scanning LIDAR Altimeter (OLA)',
    category: 'science',
    tier: 'cutting_edge',
    description: 'Pulsed laser altimeter producing billions of 3D surface elevation coordinates to construct meter-accurate asteroid topological shape models.',
    massKg: 14.8,
    costM: 34.0,
    powerDrawW: 55,
    reliability: 0.91,
    scienceYield: 38,
    dataRateKbps: 1200,
    radiationToleranceKrad: 70,
    thermalDissipationW: 30,
    minOperatingTempK: 240,
    maxOperatingTempK: 315,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: true,
      spaceWeatherVulnerability: 0.22,
      micrometeoroidVulnerability: 0.20,
      softwareAnomalyRisk: 0.18
    },
    nasaReference: {
      missionUsed: 'OSIRIS-REx Laser Altimeter (OLA - Canadian Space Agency/NASA)',
      dataset: 'NASA PDS Geosciences Node OLA Archive',
      citation: 'Daly et al. (2017), The OSIRIS-REx Laser Altimeter (OLA) Investigation',
      referenceUrl: 'https://pds-geosciences.wustl.edu/missions/orex/ola.htm'
    }
  },
  {
    id: 'sci_thermal_spectrometer',
    name: 'Thermal Emission Spectrometer (OTES)',
    category: 'science',
    tier: 'space_proven',
    description: 'Fourier transform infrared spectrometer detecting mineral compositions, hydrated silicates, and surface thermal inertia.',
    massKg: 6.3,
    costM: 22.0,
    powerDrawW: 22,
    reliability: 0.95,
    scienceYield: 32,
    dataRateKbps: 350,
    radiationToleranceKrad: 90,
    thermalDissipationW: 12,
    minOperatingTempK: 245,
    maxOperatingTempK: 325,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: true,
      spaceWeatherVulnerability: 0.15,
      micrometeoroidVulnerability: 0.15,
      softwareAnomalyRisk: 0.10
    },
    nasaReference: {
      missionUsed: 'OSIRIS-REx OTES / Mars Global Surveyor TES',
      dataset: 'NASA PDS Geosciences Node OTES Dataset',
      citation: 'Christensen et al. (2018), The OSIRIS-REx Thermal Emission Spectrometer (OTES)',
      referenceUrl: 'https://pds-geosciences.wustl.edu/missions/orex/otes.htm'
    }
  },
  {
    id: 'sci_regolith_xray_spectrometer',
    name: 'Regolith X-Ray Imaging Spectrometer (REXIS)',
    category: 'science',
    tier: 'commercial',
    description: 'Measures solar-induced fluorescent X-rays to map surface elemental abundances (Fe, Mg, Si, S) across asteroid terrain.',
    massKg: 5.1,
    costM: 15.0,
    powerDrawW: 14,
    reliability: 0.92,
    scienceYield: 24,
    dataRateKbps: 180,
    radiationToleranceKrad: 60,
    thermalDissipationW: 8,
    minOperatingTempK: 220,
    maxOperatingTempK: 310,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: true,
      spaceWeatherVulnerability: 0.40, // High solar activity overwhelms detector
      micrometeoroidVulnerability: 0.12,
      softwareAnomalyRisk: 0.12
    },
    nasaReference: {
      missionUsed: 'OSIRIS-REx Student Collaboration Experiment (MIT/Harvard/NASA)',
      dataset: 'NASA PDS Small Bodies REXIS Calibrated Science Data',
      citation: 'Masterson et al. (2018), Regolith X-Ray Imaging Spectrometer (REXIS) on OSIRIS-REx',
      referenceUrl: 'https://pds-smallbodies.astro.umd.edu/data_sb/missions/orex/rexis.shtml'
    }
  },

  // ==================== STRUCTURE ====================
  {
    id: 'struct_carbon_composite_bus',
    name: 'Carbon-Fiber Reinforced Polymer (CFRP) Bus',
    category: 'structure',
    tier: 'space_proven',
    description: 'High-stiffness, ultra-lightweight carbon composite primary central cylinder and mounting decks with integrated thermal doublers.',
    massKg: 32.0,
    costM: 16.5,
    powerDrawW: 0,
    reliability: 0.99,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 250,
    thermalDissipationW: 0,
    minOperatingTempK: 50,
    maxOperatingTempK: 450,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.02,
      micrometeoroidVulnerability: 0.20,
      softwareAnomalyRisk: 0.0
    },
    nasaReference: {
      missionUsed: 'Dawn / OSIRIS-REx / Psyche Central Structure',
      dataset: 'NASA Composite Materials for Spacecraft Structures Handbook',
      citation: 'NASA-HDBK-7008 Advanced Composites Engineering Guide',
      referenceUrl: 'https://standards.nasa.gov/'
    }
  },
  {
    id: 'struct_whipple_debris_shield',
    name: 'Whipple Micrometeoroid & Debris Bumper Shield',
    category: 'structure',
    tier: 'deep_space_hardened',
    description: 'Standoff Nextel/Kevlar and aluminum bumper layer that shatters hypervelocity dust particles and asteroid ejecta fragments.',
    massKg: 18.5,
    costM: 11.2,
    powerDrawW: 0,
    reliability: 0.98,
    scienceYield: 0,
    dataRateKbps: 0,
    radiationToleranceKrad: 200,
    thermalDissipationW: 0,
    minOperatingTempK: 50,
    maxOperatingTempK: 450,
    redundancySupported: false,
    riskModifiers: {
      singlePointOfFailure: false,
      spaceWeatherVulnerability: 0.02,
      micrometeoroidVulnerability: 0.03, // Cuts micrometeoroid risk by 90%!
      softwareAnomalyRisk: 0.0
    },
    nasaReference: {
      missionUsed: 'Stardust / Giotto / ISS Whipple Bumpers',
      dataset: 'NASA Orbital Debris Program Office Hypervelocity Impact Testing',
      citation: 'Christiansen (2003), Meteoroid/Debris Shielding Design and Analysis',
      referenceUrl: 'https://orbitaldebris.jsc.nasa.gov/'
    }
  }
];
