export interface C3PerformancePoint {
  c3Km2S2: number; // Characteristic energy C3 in km^2/s^2
  payloadCapacityKg: number;
}

export interface LaunchVehicle {
  id: string;
  name: string;
  provider: string;
  costM: number;
  maxPayloadLeoKg: number;
  maxPayloadGtoKg: number;
  maxPayloadTliKg: number;
  fairingDiameterM: number;
  fairingHeightM: number;
  reliabilityRating: number; // 0.0 - 1.0 historical success rate
  c3Curve: C3PerformancePoint[];
  nasaCatalogReference: string;
  referenceUrl: string;
}
