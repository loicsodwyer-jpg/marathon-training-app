import type { DayPlanOverride, PlanAdjustmentRecord } from '../types/planOverride'
import type {
  PlanAdjustmentProposal,
  ProposedPlanChange,
} from '../types/planAdjustment'

export function convertProposalToPlanOverrides(proposal: PlanAdjustmentProposal): {
  record: PlanAdjustmentRecord
  dayOverrides: DayPlanOverride[]
} {
  const now = new Date().toISOString()
  const dayOverrides = proposal.changes
    .map((change) => convertProposedChangeToDayOverride(change, proposal, now))
    .filter((override) => override !== undefined)
  const record: PlanAdjustmentRecord = {
    id: proposal.id,
    title: proposal.title,
    summary: proposal.summary,
    source: proposal.source ?? 'rule_engine',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    issueType: proposal.issueType,
    adjustmentLevel: proposal.adjustmentLevel,
    startDate: proposal.startDate,
    endDate: proposal.endDate,
    affectedDates: dayOverrides.map((override) => override.date),
    globalWarnings: proposal.globalWarnings,
  }

  return {
    record,
    dayOverrides,
  }
}

export function convertProposedChangeToDayOverride(
  change: ProposedPlanChange,
  proposal: PlanAdjustmentProposal,
  timestamp = new Date().toISOString(),
): DayPlanOverride | undefined {
  const hasMeaningfulOverride =
    change.proposedChangeType !== 'keep' ||
    Boolean(change.strengthAdjustment) ||
    Boolean(change.nutritionNote) ||
    change.warnings.length > 0

  if (!hasMeaningfulOverride) {
    return undefined
  }

  const removeRun =
    change.proposedChangeType === 'replace_with_bike' ||
    change.proposedChangeType === 'replace_with_rest' ||
    change.proposedChangeType === 'replace_with_mobility'
  const removeStrength =
    change.removeStrength ||
    change.proposedChangeType === 'remove_strength' ||
    change.strengthAdjustment?.toLowerCase().includes('remove gym') ||
    change.strengthAdjustment?.toLowerCase().includes('no heavy strength')
  const adjustedRun =
    change.proposedDistanceKm !== undefined &&
    (change.proposedChangeType === 'reduce' ||
      change.proposedChangeType === 'replace_with_easy_run')
      ? {
          id: `adjusted-run-${proposal.id}-${change.date}`,
          type: change.proposedRunType ?? 'easy',
          title: change.proposedTitle,
          plannedDistanceKm: change.proposedDistanceKm,
          startTime: change.proposedStartTime,
          estimatedDurationMinutes: Math.round(change.proposedDistanceKm * 5.2),
          targetPaceDescription:
            change.targetPaceDescription ?? 'Controlled effort from local adjustment',
          targetHrZone: change.targetHrZone,
          targetHrDescription: 'Keep effort conservative for the adjustment window.',
          instructions: change.instructions ?? [
            change.proposedSummary,
            change.reason,
            ...change.warnings,
          ],
          fuelNotes: change.fuelNotes ?? (change.nutritionNote ? [change.nutritionNote] : undefined),
          recoveryNotes: change.recoveryNotes ?? ['Use the adjustment window to protect consistency.'],
          replacementType: 'run' as const,
        }
      : change.proposedChangeType === 'race_caution' && change.proposedDistanceKm !== undefined
        ? {
            id: `adjusted-race-caution-${proposal.id}-${change.date}`,
            type: change.proposedRunType ?? 'race',
            title: change.proposedTitle,
            plannedDistanceKm: change.proposedDistanceKm,
            startTime: change.proposedStartTime,
            estimatedDurationMinutes: undefined,
            targetPaceDescription: change.targetPaceDescription ?? 'Race decision caution',
            targetHrZone: change.targetHrZone,
            targetHrDescription: 'Decide based on symptoms closer to race day.',
            instructions: change.instructions ?? [change.proposedSummary, change.reason, ...change.warnings],
            fuelNotes: change.fuelNotes ?? (change.nutritionNote ? [change.nutritionNote] : undefined),
            recoveryNotes: change.recoveryNotes ?? ['Race-day changes need human judgement.'],
            replacementType: 'run' as const,
          }
        : undefined

  return {
    date: change.date,
    adjustmentId: proposal.id,
    source: proposal.source ?? 'rule_engine',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    originalTitle: change.originalTitle,
    originalSummary: change.originalSummary,
    originalDistanceKm: change.originalDistanceKm,
    originalRunType: change.originalRunType,
    adjustedTitle: change.proposedTitle,
    adjustedSummary: change.proposedSummary,
    adjustedDayType: getAdjustedDayType(change.proposedChangeType),
    adjustedIntensity: getAdjustedIntensity(change.proposedChangeType),
    removeRun,
    adjustedRun,
    strengthAdjustment: change.strengthAdjustment,
    removeStrength,
    nutritionNote: change.nutritionNote,
    reason: change.reason,
    warnings: change.warnings,
    proposalChangeType: change.proposedChangeType,
  }
}

function getAdjustedDayType(changeType: ProposedPlanChange['proposedChangeType']) {
  if (changeType === 'replace_with_rest') {
    return 'rest'
  }

  if (changeType === 'replace_with_bike' || changeType === 'replace_with_mobility') {
    return 'recovery'
  }

  if (changeType === 'remove_strength' || changeType === 'reduce_strength') {
    return 'recovery'
  }

  return undefined
}

function getAdjustedIntensity(changeType: ProposedPlanChange['proposedChangeType']) {
  if (changeType === 'replace_with_rest' || changeType === 'replace_with_mobility') {
    return 'rest'
  }

  if (changeType === 'replace_with_bike' || changeType === 'replace_with_easy_run') {
    return 'low'
  }

  if (changeType === 'reduce' || changeType === 'reduce_strength') {
    return 'low'
  }

  return undefined
}
