import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import type {
  ChatGptAdjustmentContext,
  ChatGptAdjustmentResponse,
} from '../types/chatGptAdjustment'
import type { AdjustmentLevel, ProposedChangeType } from '../types/planAdjustment'
import type { RunType } from '../types/training'
import { addDays } from './dateUtils'

const adjustmentLevels: AdjustmentLevel[] = ['low', 'low_medium', 'medium', 'medium_high', 'high']
const proposedChangeTypes: ProposedChangeType[] = [
  'keep',
  'reduce',
  'replace_with_easy_run',
  'replace_with_bike',
  'replace_with_rest',
  'replace_with_mobility',
  'remove_strength',
  'reduce_strength',
  'race_caution',
]
const runTypes: RunType[] = [
  'recovery',
  'easy',
  'steady',
  'medium_long',
  'long',
  'threshold',
  'interval',
  'marathon_pace',
  'progression',
  'race',
  'rest',
]
const lowerLegAreas = ['achilles', 'calf', 'shin', 'foot']
const hardRunTypes: RunType[] = ['threshold', 'interval', 'marathon_pace', 'progression']

export function validateChatGptAdjustmentResponse(
  value: unknown,
  context: ChatGptAdjustmentContext,
): string[] {
  const errors: string[] = []

  if (!isRecord(value)) {
    return ['Response must be a JSON object.']
  }

  if (!isNonEmptyString(value.adjustmentTitle)) {
    errors.push('adjustmentTitle is required.')
  }

  if (!isNonEmptyString(value.summary)) {
    errors.push('summary is required.')
  }

  if (!isNonEmptyString(value.reason)) {
    errors.push('reason is required.')
  }

  if (!isAdjustmentLevel(value.adjustmentLevel)) {
    errors.push('adjustmentLevel must be one of: low, low_medium, medium, medium_high, high.')
  }

  if (!Array.isArray(value.affectedDates) || !value.affectedDates.length) {
    errors.push('affectedDates must be a non-empty array.')
  } else {
    value.affectedDates.forEach((dateValue, index) => {
      if (!isValidPlanDate(dateValue)) {
        errors.push(`affectedDates[${index}] must be an ISO date inside the marathon block.`)
      } else if (!isInsideSelectedWindow(dateValue, context)) {
        errors.push(`affectedDates[${index}] is outside the selected adjustment window.`)
      }
    })
  }

  if (!Array.isArray(value.changes) || !value.changes.length) {
    errors.push('changes must be a non-empty array.')
  } else {
    value.changes.forEach((changeValue, index) => {
      errors.push(...validateChange(changeValue, index, context))
    })
    errors.push(...validateNoBackToBackHardRuns(value.changes))
  }

  return Array.from(new Set(errors))
}

export function isChatGptAdjustmentResponse(
  value: unknown,
  context: ChatGptAdjustmentContext,
): value is ChatGptAdjustmentResponse {
  return validateChatGptAdjustmentResponse(value, context).length === 0
}

function validateChange(
  value: unknown,
  index: number,
  context: ChatGptAdjustmentContext,
): string[] {
  const errors: string[] = []

  if (!isRecord(value)) {
    return [`changes[${index}] must be an object.`]
  }

  const date = value.date

  if (!isValidPlanDate(date)) {
    errors.push(`changes[${index}].date must be an ISO date inside the marathon block.`)
  } else if (!isInsideSelectedWindow(date, context)) {
    errors.push(`changes[${index}].date must stay inside the selected adjustment window.`)
  }

  if (!isNonEmptyString(value.proposedTitle)) {
    errors.push(`changes[${index}].proposedTitle is required.`)
  }

  if (!isNonEmptyString(value.proposedSummary)) {
    errors.push(`changes[${index}].proposedSummary is required.`)
  }

  if (!isProposedChangeType(value.proposedChangeType)) {
    errors.push(`changes[${index}].proposedChangeType is not allowed.`)
  }

  if (!isNonEmptyString(value.reason)) {
    errors.push(`changes[${index}].reason is required.`)
  }

  if (
    value.proposedDistanceKm !== undefined &&
    (typeof value.proposedDistanceKm !== 'number' || !Number.isFinite(value.proposedDistanceKm) || value.proposedDistanceKm < 0)
  ) {
    errors.push(`changes[${index}].proposedDistanceKm must be a non-negative number.`)
  }

  if (value.proposedRunType !== undefined && !isRunType(value.proposedRunType)) {
    errors.push(`changes[${index}].proposedRunType is not an allowed run type.`)
  }

  if (typeof date === 'string') {
    const dayPlan = context.affectedDayPlans.find((day) => day.date === date)
    const originalDistance = dayPlan?.plannedRun?.plannedDistanceKm

    if (
      originalDistance !== undefined &&
      typeof value.proposedDistanceKm === 'number' &&
      value.proposedDistanceKm > originalDistance + 1
    ) {
      errors.push(
        `changes[${index}] increases ${date} by more than 1 km, which is not allowed in an adjustment window.`,
      )
    }

    if (keepsUnsafeLowerLegHardRun(value, dayPlan?.plannedRun?.type, context)) {
      errors.push(
        `changes[${index}] keeps hard running on ${date} despite a moderate lower-leg injury.`,
      )
    }

    if (keepsUnsafeSicknessHardRun(value, context)) {
      errors.push(
        `changes[${index}] keeps hard running on ${date} during fever, chest symptoms, or systemic illness.`,
      )
    }
  }

  return errors
}

function validateNoBackToBackHardRuns(changes: unknown[]) {
  const errors: string[] = []
  const hardDates = changes.reduce<string[]>((dates, change) => {
    if (
      isRecord(change) &&
      typeof change.date === 'string' &&
      isRunType(change.proposedRunType) &&
      hardRunTypes.includes(change.proposedRunType)
    ) {
      dates.push(change.date)
    }

    return dates
  }, []).sort()

  hardDates.forEach((date) => {
    if (hardDates.includes(addDays(date, 1))) {
      errors.push(`Back-to-back hard sessions proposed around ${date}.`)
    }
  })

  return errors
}

function keepsUnsafeLowerLegHardRun(
  change: Record<string, unknown>,
  originalRunType: RunType | undefined,
  context: ChatGptAdjustmentContext,
) {
  const input = context.adjustmentInput

  if (
    input.issueType !== 'injury' ||
    !input.injuryArea ||
    !lowerLegAreas.includes(input.injuryArea) ||
    input.severity < 4
  ) {
    return false
  }

  const proposedRunType = isRunType(change.proposedRunType) ? change.proposedRunType : originalRunType
  return Boolean(
    proposedRunType &&
      hardRunTypes.includes(proposedRunType) &&
      (change.proposedChangeType === 'keep' || change.proposedChangeType === 'reduce'),
  )
}

function keepsUnsafeSicknessHardRun(
  change: Record<string, unknown>,
  context: ChatGptAdjustmentContext,
) {
  const input = context.adjustmentInput

  if (
    input.issueType !== 'sickness' ||
    !input.sicknessType ||
    !['fever_flu', 'chest_symptoms', 'gi_illness'].includes(input.sicknessType)
  ) {
    return false
  }

  return isRunType(change.proposedRunType) && hardRunTypes.includes(change.proposedRunType)
}

function isInsideSelectedWindow(date: string, context: ChatGptAdjustmentContext) {
  return date >= context.adjustmentInput.startDate && date <= context.adjustmentInput.endDate
}

function isValidPlanDate(value: unknown): value is string {
  return typeof value === 'string' && value >= trainingPlanStartDate && value <= trainingPlanEndDate
}

function isAdjustmentLevel(value: unknown): value is AdjustmentLevel {
  return typeof value === 'string' && adjustmentLevels.includes(value as AdjustmentLevel)
}

function isProposedChangeType(value: unknown): value is ProposedChangeType {
  return typeof value === 'string' && proposedChangeTypes.includes(value as ProposedChangeType)
}

function isRunType(value: unknown): value is RunType {
  return typeof value === 'string' && runTypes.includes(value as RunType)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
