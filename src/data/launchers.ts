import type { LaunchVehicle } from '../types/launcher.ts';

export const LAUNCH_VEHICLE_CATALOG: LaunchVehicle[] = [
  {
    id: 'launch_falcon9',
    name: 'Falcon 9 Block 5 (Expendable Mode)',
    provider: 'SpaceX / NASA LSP',
    costM: 67.0,
    maxPayloadLeoKg: 22800,
    maxPayloadGtoKg: 8300,
    maxPayloadTliKg: 4020,
    fairingDiameterM: 5.2,
    fairingHeightM: 13.1,
    reliabilityRating: 0.992,
    c3Curve: [
      { c3Km2S2: 0, payloadCapacityKg: 5200 },
      { c3Km2S2: 10, payloadCapacityKg: 3850 },
      { c3Km2S2: 15, payloadCapacityKg: 3100 },
      { c3Km2S2: 25, payloadCapacityKg: 1950 },
      { c3Km2S2: 35, payloadCapacityKg: 1200 },
      { c3Km2S2: 50, payloadCapacityKg: 650 }
    ],
    nasaCatalogReference: 'NASA LSP Flight Operations / DART / PACE Mission Catalog',
    referenceUrl: 'https://www.nasa.gov/launch-services-program/'
  },
  {
    id: 'launch_falcon_heavy',
    name: 'Falcon Heavy (Center Core Expendable)',
    provider: 'SpaceX / NASA LSP',
    costM: 97.0,
    maxPayloadLeoKg: 63800,
    maxPayloadGtoKg: 26700,
    maxPayloadTliKg: 15100,
    fairingDiameterM: 5.2,
    fairingHeightM: 13.1,
    reliabilityRating: 0.985,
    c3Curve: [
      { c3Km2S2: 0, payloadCapacityKg: 16800 },
      { c3Km2S2: 15, payloadCapacityKg: 11200 },
      { c3Km2S2: 25, payloadCapacityKg: 8200 },
      { c3Km2S2: 40, payloadCapacityKg: 5100 },
      { c3Km2S2: 60, payloadCapacityKg: 3000 },
      { c3Km2S2: 80, payloadCapacityKg: 1600 }
    ],
    nasaCatalogReference: 'NASA LSP Psyche / Europa Clipper Mission Data',
    referenceUrl: 'https://www.nasa.gov/mission/europa-clipper/'
  },
  {
    id: 'launch_atlas_v',
    name: 'Atlas V 401 (4m Fairing / Centaur)',
    provider: 'United Launch Alliance (ULA) / NASA LSP',
    costM: 115.0,
    maxPayloadLeoKg: 9800,
    maxPayloadGtoKg: 4750,
    maxPayloadTliKg: 2900,
    fairingDiameterM: 4.2,
    fairingHeightM: 12.0,
    reliabilityRating: 0.998,
    c3Curve: [
      { c3Km2S2: 0, payloadCapacityKg: 4100 },
      { c3Km2S2: 10, payloadCapacityKg: 2950 },
      { c3Km2S2: 20, payloadCapacityKg: 2050 },
      { c3Km2S2: 30, payloadCapacityKg: 1400 },
      { c3Km2S2: 45, payloadCapacityKg: 780 }
    ],
    nasaCatalogReference: 'OSIRIS-REx / MAVEN / Mars 2020 Launch Vehicle Documentation',
    referenceUrl: 'https://ntrs.nasa.gov/citations/20170005845'
  },
  {
    id: 'launch_electron',
    name: 'Electron (Dedicated SmallSat / Curie Stage)',
    provider: 'Rocket Lab / NASA Venture-Class LSP',
    costM: 7.5,
    maxPayloadLeoKg: 300,
    maxPayloadGtoKg: 65,
    maxPayloadTliKg: 28, // Trans-Lunar CAPSTONE class
    fairingDiameterM: 1.2,
    fairingHeightM: 2.5,
    reliabilityRating: 0.940,
    c3Curve: [
      { c3Km2S2: 0, payloadCapacityKg: 75 },
      { c3Km2S2: 5, payloadCapacityKg: 48 },
      { c3Km2S2: 10, payloadCapacityKg: 28 },
      { c3Km2S2: 15, payloadCapacityKg: 14 },
      { c3Km2S2: 20, payloadCapacityKg: 0 }
    ],
    nasaCatalogReference: 'NASA CAPSTONE Lunar Autonomous Positioning System Demonstration',
    referenceUrl: 'https://www.nasa.gov/mission/capstone/'
  },
  {
    id: 'launch_sls_block1',
    name: 'Space Launch System (SLS) Block 1 (Shared Secondary)',
    provider: 'NASA Marshall Space Flight Center / Boeing',
    costM: 175.0, // Prorated secondary deep space manifest
    maxPayloadLeoKg: 95000,
    maxPayloadGtoKg: 42000,
    maxPayloadTliKg: 27000,
    fairingDiameterM: 8.4,
    fairingHeightM: 19.1,
    reliabilityRating: 0.999,
    c3Curve: [
      { c3Km2S2: 0, payloadCapacityKg: 28000 },
      { c3Km2S2: 20, payloadCapacityKg: 18500 },
      { c3Km2S2: 40, payloadCapacityKg: 12400 },
      { c3Km2S2: 60, payloadCapacityKg: 8500 },
      { c3Km2S2: 80, payloadCapacityKg: 5200 }
    ],
    nasaCatalogReference: 'NASA Artemis Program / Orion ICPS Mission Manifest',
    referenceUrl: 'https://www.nasa.gov/exploration/systems/sls/'
  }
];
