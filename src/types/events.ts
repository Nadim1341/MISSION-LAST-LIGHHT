import type { SubsystemCategory } from './subsystems.ts';

export type EventFazeLevel = 'advisory' | 'warning' | 'critical';

export type PlayerActionType =
  | 'SAFE_MODE'
  | 'MANEUVER'
  | 'REBOOT'
  | 'CONTINUE_OPS'
  | 'OBSERVE_BONUS'
  | 'RECONFIGURE_POWER'
  | 'TRANSMIT_BURST'
  | 'ISOLATE_BRANCH'
  | 'LOAD_SHED'
  | 'OPTICAL_ALIGNMENT';

export interface PlayerDesignHistory {
  testedStress: boolean;
  ignoredWeaknessWarning: boolean;
  unresolvedRisksCount: number;
  initialLaunchVehicle: string;
  hasRedesignedAfterStress: boolean;
  primaryWeaknessTitle?: string;
}

export interface PlayerActionChoice {
  type: PlayerActionType;
  label: string;
  description: string;
  propellantCostKg?: number;
  powerDrawWatts?: number;
  timeDelayHours?: number;
  scienceYieldModifier?: number; // e.g. 0.85 = -15% science loss, 1.35 = +35% bonus
}

export interface ForeshadowedEvent {
  id: string;
  title: string;
  hazardType:
    | 'solar_storm'
    | 'communication_blackout'
    | 'propellant_leak'
    | 'thermal_anomaly'
    | 'battery_degradation'
    | 'micrometeoroid_strike'
    | 'navigation_error'
    | 'scientific_discovery';
  fazeLevel: EventFazeLevel;
  scheduledMetDay: number;
  targetedSubsystem: SubsystemCategory;
  headline: string;
  description: string;
  availableActions: PlayerActionChoice[];
}

export interface EventConsequenceResolution {
  eventId: string;
  actionTaken: PlayerActionType;
  subsystemDamaged?: SubsystemCategory;
  damagePercent: number; // 0 - 100%
  scienceLostPoints: number;
  scienceGainedPoints: number;
  propellantConsumedKg: number;
  causalHeadline: string;
  causalDetail: string;
  isFatal: boolean;
  mitigatedByHardware: string | null;
}
