export interface CinematicTimelineNode {
  metDay: number;
  stageName: string;
  icon: string;
  title: string;
  decisionMade: string;
  whatHappened: string;
  whyItHappened: string;
  missionConsequence: string;
  severity: 'nominal' | 'caution' | 'critical' | 'triumph';
}

export interface CausalFactor {
  severity: 'CRITICAL_FAILURE' | 'SUBOPTIMAL' | 'POSITIVE_MITIGATION' | 'BRILLIANT_DESIGN';
  subsystem: string;
  playerDecision: string;
  causalConsequence: string;
  scientificContext: string;
}

export interface DebriefReport {
  compositeScore: number; // 0 - 1000
  outcome: 'FULL_SUCCESS' | 'PARTIAL_SUCCESS' | 'CRITICAL_FAILURE';
  outcomeTitle: string;
  outcomeSummary: string;

  // 8-Axis Breakdown (0 - 100 each)
  axisScores: {
    scientificReturn: number;
    engineeringEfficiency: number;
    budgetDiscipline: number;
    systemReliability: number;
    riskManagement: number;
    telecomPerformance: number;
    resourceDiscipline: number;
    thermalPowerStability: number;
  };

  rawMetrics: {
    totalScienceCollected: number;
    dataTransmittedMb: number;
    remainingPropellantKg: number;
    remainingBudgetM: number;
    finalHealthPct: number;
    anomaliesSurvived: number;
  };

  causalFactors: CausalFactor[];
  cinematicTimeline: CinematicTimelineNode[];
  recommendations: string[];
}

export type LeaderboardCategory =
  | 'SCIENCE_HUNTER'
  | 'ENGINEERING_MASTER'
  | 'SURVIVAL_EXPERT'
  | 'COMMUNICATION_MASTER'
  | 'RESOURCE_MASTER';

export interface LeaderboardEntry {
  id: string;
  timestamp: number;
  missionName: string;
  scenarioId: string;
  category: LeaderboardCategory;
  categoryScore: number;
  compositeScore: number;
  spacecraftSummary: string;
}
