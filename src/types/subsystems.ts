export type SubsystemCategory =
  | 'power'
  | 'propulsion'
  | 'communications'
  | 'navigation'
  | 'computing'
  | 'thermal'
  | 'science'
  | 'structure';

export type ComponentTier =
  | 'commercial'
  | 'space_proven'
  | 'deep_space_hardened'
  | 'cutting_edge';

export interface SpacecraftComponent {
  id: string;
  name: string;
  category: SubsystemCategory;
  tier: ComponentTier;
  description: string;
  massKg: number;
  costM: number; // Millions USD
  powerDrawW: number; // Positive = consumes power, negative = generates power
  reliability: number; // 0.0 - 1.0 baseline MTBF score
  scienceYield: number; // Science points contributed
  dataRateKbps: number; // Data generation rate when active
  
  // Specific subsystem traits
  storageCapacityMb?: number; // Computing / Solid State Recorder
  propellantCapacityKg?: number; // Propulsion propellant mass
  ispSec?: number; // Propulsion specific impulse
  thrustN?: number; // Propulsion thrust output
  antennaGainDbi?: number; // Communications antenna gain
  radiationToleranceKrad: number; // Computing / Avionics rad tolerance
  thermalDissipationW: number; // Heat generated internally
  minOperatingTempK: number;
  maxOperatingTempK: number;
  redundancySupported: boolean;

  riskModifiers: {
    singlePointOfFailure: boolean;
    spaceWeatherVulnerability: number; // 0.0 (immune) to 1.0 (vulnerable)
    micrometeoroidVulnerability: number;
    softwareAnomalyRisk: number;
  };

  nasaReference: {
    missionUsed: string;
    dataset: string;
    citation: string;
    referenceUrl: string;
  };
}

export interface SpacecraftDesign {
  name: string;
  components: Record<SubsystemCategory, SpacecraftComponent[]>;
  backupComponents?: Partial<Record<SubsystemCategory, SpacecraftComponent>>;
}

export interface SubsystemTotals {
  dryMassKg: number;
  propellantMassKg: number;
  totalWetMassKg: number;
  totalCostM: number;
  powerGenerationW: number;
  powerConsumptionW: number;
  netPowerMarginW: number;
  batteryStorageJoules: number;
  storageCapacityMb: number;
  dataGenerationRateKbps: number;
  baseReliability: number;
  radiationToleranceKrad: number;
  sciencePotential: number;
  effectiveIspSec: number;
  totalDeltaVMs: number;
  hasRedundantPropulsion: boolean;
  hasRedundantComms: boolean;
  hasRadShielding: boolean;
  hasWhippleShielding: boolean;
}
