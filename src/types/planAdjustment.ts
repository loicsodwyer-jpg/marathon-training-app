export type AdjustmentIssueType =
  | 'injury'
  | 'sickness'
  | 'fatigue'
  | 'missed_training'
  | 'life_event'
  | 'party_social'
  | 'travel'
  | 'work_stress'
  | 'other'

export type InjuryArea =
  | 'achilles'
  | 'calf'
  | 'shin'
  | 'foot'
  | 'knee'
  | 'hamstring_glute'
  | 'hip'
  | 'back'
  | 'other'

export type SicknessType =
  | 'mild_cold'
  | 'fever_flu'
  | 'chest_symptoms'
  | 'gi_illness'
  | 'other'

export type AdjustmentLevel = 'low' | 'low_medium' | 'medium' | 'medium_high' | 'high'

export type SymptomTrend = 'improving' | 'stable' | 'worsening' | 'unknown'

export type RunningTolerance =
  | 'normal'
  | 'easy_only'
  | 'short_easy_only'
  | 'no_running'
  | 'unknown'

export type StrengthTolerance =
  | 'full'
  | 'reduced'
  | 'upper_core_only'
  | 'mobility_only'
  | 'none'

export interface PlanAdjustmentInput {
  issueType: AdjustmentIssueType
  injuryArea?: InjuryArea
  sicknessType?: SicknessType
  severity: number
  symptomTrend: SymptomTrend
  painDuringRun?: 'none' | 'better' | 'same' | 'worse' | 'changes_stride' | 'unknown'
  nextMorningResponse?: 'normal' | 'stiff' | 'worse' | 'unknown'
  hasRedFlag?: boolean
  description: string
  startDate: string
  endDate: string
  userOverrodeDates: boolean
  adjustmentLevel: AdjustmentLevel
  userOverrodeLevel: boolean
  runningTolerance: RunningTolerance
  canBike: boolean
  strengthTolerance: StrengthTolerance
  raceGoalStillValid: 'yes' | 'maybe' | 'no'
}

export interface AdjustmentRecommendation {
  recommendedStartDate: string
  recommendedEndDate: string
  recommendedLevel: AdjustmentLevel
  recommendedDurationDays: number
  summary: string
  reasoning: string[]
  safetyWarnings: string[]
}

export type ProposedChangeType =
  | 'keep'
  | 'reduce'
  | 'replace_with_easy_run'
  | 'replace_with_bike'
  | 'replace_with_rest'
  | 'replace_with_mobility'
  | 'remove_strength'
  | 'reduce_strength'
  | 'race_caution'

export interface ProposedPlanChange {
  date: string
  originalTitle: string
  originalSummary: string
  originalDistanceKm?: number
  originalRunType?: string
  proposedTitle: string
  proposedSummary: string
  proposedDistanceKm?: number
  proposedChangeType: ProposedChangeType
  proposedRunType?: string
  proposedStartTime?: string
  targetPaceDescription?: string
  targetHrZone?: string
  instructions?: string[]
  fuelNotes?: string[]
  recoveryNotes?: string[]
  strengthAdjustment?: string
  removeStrength?: boolean
  nutritionNote?: string
  reason: string
  warnings: string[]
}

export interface PlanAdjustmentProposal {
  id: string
  createdAt: string
  source?: 'rule_engine' | 'manual_chatgpt'
  issueType: AdjustmentIssueType
  adjustmentLevel: AdjustmentLevel
  startDate: string
  endDate: string
  title: string
  summary: string
  recommendation: AdjustmentRecommendation
  changes: ProposedPlanChange[]
  globalWarnings: string[]
  cannotAutoApplyReasons?: string[]
}
