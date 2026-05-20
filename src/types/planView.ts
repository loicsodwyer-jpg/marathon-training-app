import type { DayPlan, TrainingPhase, WeekPlan } from './training'

export type PlanFilter =
  | 'all'
  | 'runs'
  | 'key_workouts'
  | 'long_runs'
  | 'strength'
  | 'rest_social'
  | 'race_week'

export type PlanBadgeTone = 'running' | 'strength' | 'success' | 'warning' | 'neutral' | 'race'

export interface PlanBadge {
  label: string
  tone: PlanBadgeTone
}

export interface PlanStats {
  totalPlannedKm: number
  totalWeeks: number
  peakWeekNumber: number
  peakWeekKm: number
  plannedRuns: number
  strengthSessions: number
  longRuns: number
  keyWorkouts: number
  raceDate?: string
}

export interface PlanPhaseSegment {
  phase: TrainingPhase
  startWeek: number
  endWeek: number
  weekCount: number
  minMileageKm: number
  maxMileageKm: number
}

export interface PlanWeekViewSection {
  week: WeekPlan
  matchingDays: DayPlan[]
  specialEventLabels: string[]
  plannedRunCount: number
  keyWorkoutCount: number
  longRunDistanceKm?: number
}
