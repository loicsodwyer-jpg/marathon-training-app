export type PlanOverrideSource = 'rule_engine' | 'manual_chatgpt' | 'manual_user'

export type PlanOverrideStatus = 'active' | 'archived'

export type AdjustedRunReplacementType =
  | 'run'
  | 'bike'
  | 'rest'
  | 'mobility'
  | 'reduced_strength'
  | 'none'

export interface AdjustedRunOverride {
  id: string
  type: string
  title: string
  startTime?: string
  plannedDistanceKm: number
  estimatedDurationMinutes?: number
  targetPaceDescription?: string
  targetHrZone?: string
  targetHrDescription?: string
  instructions: string[]
  fuelNotes?: string[]
  recoveryNotes?: string[]
  replacementType: AdjustedRunReplacementType
}

export interface DayPlanOverride {
  date: string
  adjustmentId: string
  source: PlanOverrideSource
  status: PlanOverrideStatus
  createdAt: string
  updatedAt: string
  originalTitle: string
  originalSummary: string
  originalDistanceKm?: number
  originalRunType?: string
  adjustedTitle: string
  adjustedSummary: string
  adjustedDayType?: string
  adjustedIntensity?: string
  removeRun?: boolean
  adjustedRun?: AdjustedRunOverride
  strengthAdjustment?: string
  removeStrength?: boolean
  adjustedStrengthSessionIds?: string[]
  nutritionNote?: string
  reason: string
  warnings: string[]
  proposalChangeType: string
}

export interface PlanAdjustmentRecord {
  id: string
  title: string
  summary: string
  source: PlanOverrideSource
  status: PlanOverrideStatus
  createdAt: string
  updatedAt: string
  issueType: string
  adjustmentLevel: string
  startDate: string
  endDate: string
  affectedDates: string[]
  globalWarnings: string[]
}

export interface PlanOverridesState {
  schemaVersion: 1
  records: Record<string, PlanAdjustmentRecord>
  dayOverrides: Record<string, DayPlanOverride>
}
