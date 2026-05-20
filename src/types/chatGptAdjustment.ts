import type {
  AdjustmentLevel,
  PlanAdjustmentInput,
  PlanAdjustmentProposal,
  ProposedChangeType,
} from './planAdjustment'
import type { DayPlan } from './training'
import type { DayPlanOverride } from './planOverride'
import type { RunType } from './training'

export interface ChatGptAdjustmentResponse {
  adjustmentTitle: string
  summary: string
  reason: string
  affectedDates: string[]
  adjustmentLevel: AdjustmentLevel
  changes: ChatGptPlanChange[]
  globalWarnings?: string[]
  assumptions?: string[]
}

export interface ChatGptPlanChange {
  date: string
  originalSummary?: string
  proposedTitle: string
  proposedSummary: string
  proposedChangeType: ProposedChangeType
  proposedDistanceKm?: number
  proposedRunType?: RunType
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
  warnings?: string[]
}

export interface ChatGptParseResult {
  success: boolean
  proposal?: PlanAdjustmentProposal
  errors: string[]
  rawResponse?: ChatGptAdjustmentResponse
}

export interface ChatGptAdjustmentContext {
  adjustmentInput: PlanAdjustmentInput
  ruleBasedProposal: PlanAdjustmentProposal
  affectedDayPlans: DayPlan[]
  activePlanOverrides?: Record<string, DayPlanOverride>
}
