import type { SubsystemCategory } from './subsystems.ts';

export interface BudgetTriangleCoordinates {
  science: number; // 0 - 100
  survivability: number; // 0 - 100
  affordability: number; // 0 - 100
}

export interface PrimaryWeaknessDiagnosis {
  subsystem: SubsystemCategory | 'budget' | 'margin';
  title: string;
  explanation: string;
  suggestedAction: string;
  impactScoreLoss: number;
}

export interface MissionReadinessReport {
  overallScorePct: number; // 0 - 100%
  breakdown: {
    science: number;
    propulsion: number;
    power: number;
    communications: number;
    thermal: number;
    reliability: number;
    budget: number;
    resourceMargin: number;
  };
  primaryWeakness: PrimaryWeaknessDiagnosis;
  triangle: BudgetTriangleCoordinates;
  isFlightReady: boolean;
  blockerReasons: string[];
}

export interface StressTestScenario {
  id: string;
  title: string;
  category: SubsystemCategory | 'environment';
  description: string;
  expectedHazard: string;
}

export type StressTestStatus = 'PASS' | 'WARNING' | 'CRITICAL_RISK';

export interface StressTestResult {
  scenarioId: string;
  title: string;
  status: StressTestStatus;
  componentTested: string;
  spacecraftValue: string;
  requiredValue: string;
  projectedConsequence: string;
  recommendation: string;
}
