import type {
  ChatGptAdjustmentContext,
  ChatGptAdjustmentResponse,
  ChatGptParseResult,
  ChatGptPlanChange,
} from '../types/chatGptAdjustment'
import type { PlanAdjustmentProposal, ProposedPlanChange } from '../types/planAdjustment'
import { validateChatGptAdjustmentResponse } from './chatGptAdjustmentValidation'
import { validateAdjustmentProposal } from './planAdjustmentProposalUtils'

export function parseChatGptAdjustmentJson(
  input: string,
  context: ChatGptAdjustmentContext,
): ChatGptParseResult {
  const trimmedInput = stripMarkdownCodeFence(input).trim()

  if (!trimmedInput) {
    return {
      success: false,
      errors: ['Paste the JSON response from ChatGPT first.'],
    }
  }

  let parsedValue: unknown

  try {
    parsedValue = JSON.parse(trimmedInput)
  } catch (error) {
    return {
      success: false,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Could not parse response.'}`],
    }
  }

  const errors = validateChatGptAdjustmentResponse(parsedValue, context)

  if (errors.length) {
    return {
      success: false,
      errors,
    }
  }

  const response = parsedValue as ChatGptAdjustmentResponse

  return {
    success: true,
    proposal: convertChatGptResponseToProposal(response, context),
    errors: [],
    rawResponse: response,
  }
}

export function convertChatGptResponseToProposal(
  response: ChatGptAdjustmentResponse,
  context: ChatGptAdjustmentContext,
): PlanAdjustmentProposal {
  const dates = response.affectedDates.length
    ? [...response.affectedDates].sort()
    : response.changes.map((change) => change.date).sort()
  const now = new Date().toISOString()
  const assumptions = response.assumptions?.filter(Boolean) ?? []
  const globalWarnings = [
    ...(response.globalWarnings ?? []),
    ...assumptions.map((assumption) => `Assumption: ${assumption}`),
  ]

  const proposal: PlanAdjustmentProposal = {
    id: `chatgpt-${Date.now()}`,
    createdAt: now,
    source: 'manual_chatgpt',
    issueType: context.adjustmentInput.issueType,
    adjustmentLevel: response.adjustmentLevel,
    startDate: dates[0] ?? context.adjustmentInput.startDate,
    endDate: dates[dates.length - 1] ?? context.adjustmentInput.endDate,
    title: response.adjustmentTitle,
    summary: response.summary,
    recommendation: {
      recommendedStartDate: dates[0] ?? context.adjustmentInput.startDate,
      recommendedEndDate: dates[dates.length - 1] ?? context.adjustmentInput.endDate,
      recommendedLevel: response.adjustmentLevel,
      recommendedDurationDays: dates.length,
      summary: response.summary,
      reasoning: [response.reason, ...assumptions],
      safetyWarnings: response.globalWarnings ?? [],
    },
    changes: response.changes.map((change) => convertChange(change, context)),
    globalWarnings,
    cannotAutoApplyReasons: [],
  }

  return {
    ...proposal,
    globalWarnings: Array.from(
      new Set([
        ...proposal.globalWarnings,
        ...validateAdjustmentProposal(proposal, context.adjustmentInput),
      ]),
    ),
  }
}

function convertChange(
  change: ChatGptPlanChange,
  context: ChatGptAdjustmentContext,
): ProposedPlanChange {
  const matchingDay = context.affectedDayPlans.find((day) => day.date === change.date)

  return {
    date: change.date,
    originalTitle: matchingDay?.title ?? 'Original plan day',
    originalSummary: change.originalSummary ?? matchingDay?.summary ?? 'Original day unavailable.',
    originalDistanceKm: matchingDay?.plannedRun?.plannedDistanceKm,
    originalRunType: matchingDay?.plannedRun?.type,
    proposedTitle: change.proposedTitle,
    proposedSummary: change.proposedSummary,
    proposedDistanceKm: change.proposedDistanceKm,
    proposedChangeType: change.proposedChangeType,
    proposedRunType: change.proposedRunType,
    proposedStartTime: change.proposedStartTime,
    targetPaceDescription: change.targetPaceDescription,
    targetHrZone: change.targetHrZone,
    instructions: normalizeStringArray(change.instructions),
    fuelNotes: normalizeStringArray(change.fuelNotes),
    recoveryNotes: normalizeStringArray(change.recoveryNotes),
    strengthAdjustment: change.strengthAdjustment,
    removeStrength: change.removeStrength,
    nutritionNote: change.nutritionNote,
    reason: change.reason,
    warnings: normalizeStringArray(change.warnings) ?? [],
  }
}

function stripMarkdownCodeFence(input: string) {
  const trimmed = input.trim()

  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function normalizeStringArray(value: string[] | undefined) {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.filter((item) => typeof item === 'string' && item.trim().length > 0)
}
