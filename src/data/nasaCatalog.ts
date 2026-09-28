export interface NASADatasetEntry {
  id: string;
  source: string;
  datasetName: string;
  targetOrDomain: string;
  explanation: string;
  referenceUrl: string;
  inGameEffect: string;
  educationalDataPayload: Record<string, string | number | boolean>;
}

export const NASA_DATA_HUB: NASADatasetEntry[] = [
  {
    id: 'nasa_jpl_sbdb_bennu',
    source: 'NASA Jet Propulsion Laboratory (JPL)',
    datasetName: 'Small-Body Database (SBDB) / Horizons Ephemeris System',
    targetOrDomain: '101955 Bennu (1999 RQ36)',
    explanation: 'High-precision orbital elements, physical dimensions, gravitational parameter (GM), rotation rate, and thermal inertia of near-Earth asteroid Bennu derived from radar astrometry and the OSIRIS-REx mission.',
    referenceUrl: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=101955',
    inGameEffect: 'Determines the baseline orbital transfer delta-V, solar distance range (0.897 - 1.356 AU), communication delay (420 - 1080s), and approach velocity.',
    educationalDataPayload: {
      semiMajorAxisAu: 1.1264,
      eccentricity: 0.20375,
      inclinationDeg: 6.035,
      perihelionAu: 0.8968,
      aphelionAu: 1.3560,
      massKg: 7.329e10,
      meanDiameterM: 490.0,
      bulkDensityGcm3: 1.19,
      rotationPeriodHours: 4.296
    }
  },
  {
    id: 'nasa_dsn_telecom_handbook',
    source: 'NASA Space Communications and Navigation (SCaN)',
    datasetName: 'Deep Space Network (DSN) Telecommunications Link Design Handbook (810-005)',
    targetOrDomain: 'Deep Space Telecommunications (Goldstone, Madrid, Canberra)',
    explanation: 'Engineering standards for 34m Beam Waveguide (BWG) and 70m Cassegrain ground antennas, frequency allocations for X-band (8.4 GHz) and Ka-band (32 GHz), and receiver G/T sensitivity figures.',
    referenceUrl: 'https://deepspace.jpl.nasa.gov/dsndocs/810-005/',
    inGameEffect: 'Directly powers the Friis path-loss equation, calculating maximum downlink data rate (kbps) based on distance squared and antenna gain.',
    educationalDataPayload: {
      dsnDishDiameter70mM: 70,
      dsnDishDiameter34mM: 34,
      xBandFrequencyGhz: 8.4,
      kaBandFrequencyGhz: 32.0,
      goldstoneStationId: 'DSS-14',
      madridStationId: 'DSS-63',
      canberraStationId: 'DSS-43'
    }
  },
  {
    id: 'nasa_lsp_performance_curves',
    source: 'NASA Launch Services Program (LSP)',
    datasetName: 'Launch Vehicle Performance Calculator Archive',
    targetOrDomain: 'Commercial & Government Deep Space Launchers',
    explanation: 'Empirical payload mass versus characteristic launch energy (C3 km^2/s^2) curves for NASA-contracted rockets including Falcon 9, Falcon Heavy, and Atlas V.',
    referenceUrl: 'https://elvperf.ksc.nasa.gov/',
    inGameEffect: 'Establishes the hard mass constraint: your spacecraft wet mass cannot exceed the launcher payload capacity at the target C3.',
    educationalDataPayload: {
      falcon9_C3_15_kg: 3100,
      falconHeavy_C3_18_kg: 10400,
      atlasV401_C3_18_kg: 2200,
      standardTargetC3_Bennu: 18.5
    }
  },
  {
    id: 'nasa_planetary_factsheet_moon_mars',
    source: 'NASA Goddard Space Flight Center (NSSDC)',
    datasetName: 'Planetary Fact Sheet - Metric',
    targetOrDomain: 'Moon & Mars Physical and Orbital Parameters',
    explanation: 'Standardized physical and orbital parameters for Solar System bodies compiled by Dr. David R. Williams at NASA Goddard Space Flight Center.',
    referenceUrl: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
    inGameEffect: 'Governs gravitational capture burn requirements (vis-viva equation) and solar irradiance scaling factors.',
    educationalDataPayload: {
      earthSolarConstantWm2: 1361.0,
      marsSolarConstantWm2: 586.2,
      moonGravitationalParameterKm3s2: 4902.8,
      marsGravitationalParameterKm3s2: 42828.3
    }
  },
  {
    id: 'nasa_spdf_space_weather',
    source: 'NASA Space Physics Data Facility (SPDF) / OMNIWeb',
    datasetName: 'OMNI High-Resolution Solar Proton and Interplanetary Magnetic Field Data',
    targetOrDomain: 'Heliospheric Radiation and Solar Storms',
    explanation: 'Historic in-situ observations of solar proton events (>10 MeV and >60 MeV flux) and coronal mass ejections (CME) that threaten spacecraft avionics in deep space transit.',
    referenceUrl: 'https://omniweb.gsfc.nasa.gov/',
    inGameEffect: 'Determines the probability and radiation flux of solar storm events and validates spacecraft radiation hardening against single-event upsets.',
    educationalDataPayload: {
      nominalSolarWindSpeedKms: 450.0,
      cmeShockSpeedKms: 1200.0,
      protonEventThresholdPfu: 10.0,
      severeStormRadiationDoseKrad: 85.0
    }
  }
];
