export interface WeeklyDashboardSummary {
  weekNumber: number
  startDate: string
  endDate: string
  phase: string
  focus: string
  plannedKm: number
  actualKm: number
  plannedRunCount: number
  completedRunCount: number
  plannedStrengthCount: number
  completedStrengthCount: number
  completionPercent: number
  averageHr?: number
  averagePaceSecondsPerKm?: number
  plannedLongRunKm?: number
  longestRunKm?: number
  alcoholFlags: number
}

export interface DashboardTotals {
  plannedKmToDate: number
  actualKmToDate: number
  completedRuns: number
  plannedRuns: number
  completedStrengthSessions: number
  plannedStrengthSessions: number
  completionPercent: number
  averageHr?: number
  latestLogDate?: string
  currentWeekNumber?: number
}

export interface RiskSignal {
  id: string
  label: string
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface MarathonReadiness {
  score: number
  label: 'Not enough data' | 'Building' | 'On track' | 'Strong' | 'At risk'
  description: string
  positives: string[]
  concerns: string[]
}

export interface PaceHeartRateTrendPoint {
  date: string
  paceSecondsPerKm?: number
  averageHr?: number
}
