import type {
  AdjustmentRecommendation,
  PlanAdjustmentInput,
  PlanAdjustmentProposal,
  ProposedPlanChange,
} from '../types/planAdjustment'
import type { DayPlan, RunWorkout } from '../types/training'
import { getAdjustmentLevelLabel } from './planAdjustmentRules'
import { getFullTrainingPlan } from './trainingPlanUtils'

const hardRunTypes = ['threshold', 'interval', 'marathon_pace', 'progression']
const lowerLegAreas = ['achilles', 'calf', 'shin', 'foot']

export function buildAdjustmentProposal(
  input: PlanAdjustmentInput,
  recommendation: AdjustmentRecommendation,
): PlanAdjustmentProposal {
  const affectedDays = getFullTrainingPlan().filter(
    (dayPlan) => dayPlan.date >= input.startDate && dayPlan.date <= input.endDate,
  )
  const changes = affectedDays.map((dayPlan) => buildChangeForDay(dayPlan, input))
  const globalWarnings = validateAdjustmentProposalChanges(changes, input)
  const originalKm = getOriginalKm(changes)
  const proposedKm = getProposedKm(changes)

  if (!changes.length) {
    globalWarnings.push('No training-plan days were found inside the selected window.')
  }

  return {
    id: `proposal-${input.startDate}-${input.endDate}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    source: 'rule_engine',
    issueType: input.issueType,
    adjustmentLevel: input.adjustmentLevel,
    startDate: input.startDate,
    endDate: input.endDate,
    title: `${getAdjustmentLevelLabel(input.adjustmentLevel)} plan adjustment preview`,
    summary: `${changes.length} day${changes.length === 1 ? '' : 's'} affected. Planned running changes from ${originalKm.toFixed(1)} km to ${proposedKm.toFixed(1)} km.`,
    recommendation,
    changes,
    globalWarnings,
    cannotAutoApplyReasons: [],
  }
}

export function validateAdjustmentProposal(
  proposal: PlanAdjustmentProposal,
  input: PlanAdjustmentInput,
): string[] {
  return validateAdjustmentProposalChanges(proposal.changes, input)
}

export function getOriginalKm(changes: ProposedPlanChange[]) {
  return changes.reduce((total, change) => total + (change.originalDistanceKm ?? 0), 0)
}

export function getProposedKm(changes: ProposedPlanChange[]) {
  return changes.reduce((total, change) => total + (change.proposedDistanceKm ?? 0), 0)
}

export function getChangedRunDayCount(changes: ProposedPlanChange[]) {
  return changes.filter((change) => {
    if (change.originalDistanceKm === undefined) {
      return false
    }

    return (
      change.proposedChangeType !== 'keep' ||
      change.proposedDistanceKm !== change.originalDistanceKm ||
      change.proposedRunType !== change.originalRunType
    )
  }).length
}

function buildChangeForDay(dayPlan: DayPlan, input: PlanAdjustmentInput): ProposedPlanChange {
  const run = dayPlan.plannedRun
  const runChange = run
    ? getRunProposal(dayPlan, run, input)
    : getNonRunProposal(dayPlan, input)
  const strengthAdjustment = getStrengthAdjustment(dayPlan, input)
  const warnings = getDayWarnings(dayPlan, input, runChange)

  return {
    date: dayPlan.date,
    originalTitle: dayPlan.title,
    originalSummary: dayPlan.summary,
    originalDistanceKm: run?.plannedDistanceKm,
    originalRunType: run?.type,
    strengthAdjustment,
    nutritionNote: getNutritionNote(dayPlan, input),
    warnings,
    ...runChange,
  }
}

function getRunProposal(
  dayPlan: DayPlan,
  run: RunWorkout,
  input: PlanAdjustmentInput,
): Pick<
  ProposedPlanChange,
  | 'proposedTitle'
  | 'proposedSummary'
  | 'proposedDistanceKm'
  | 'proposedChangeType'
  | 'proposedRunType'
  | 'reason'
> {
  if (run.type === 'race') {
    return {
      proposedTitle: 'Race-day caution',
      proposedSummary: 'Do not automatically change race day in this preview. Decide close to race day based on symptoms.',
      proposedDistanceKm: run.plannedDistanceKm,
      proposedChangeType: 'race_caution',
      proposedRunType: run.type,
      reason: 'Race-day changes need a closer, human decision rather than an automatic rule.',
    }
  }

  if (input.runningTolerance === 'no_running' || input.adjustmentLevel === 'high') {
    return buildNoRunReplacement(dayPlan, run, input)
  }

  if (input.adjustmentLevel === 'medium_high') {
    if (input.canBike && input.issueType !== 'sickness') {
      return {
        proposedTitle: 'Easy bike replacement',
        proposedSummary: getBikeReplacementSummary(run),
        proposedChangeType: 'replace_with_bike',
        proposedRunType: 'bike',
        reason: 'Medium/high adjustment removes impact while preserving gentle aerobic work.',
      }
    }

    return {
      proposedTitle: 'Short easy only',
      proposedSummary: 'Replace with 20-40 minutes short easy running only if symptoms are calm; otherwise rest.',
      proposedDistanceKm: getReducedDistance(run.plannedDistanceKm, 0.35, 6),
      proposedChangeType: 'replace_with_easy_run',
      proposedRunType: 'easy',
      reason: 'Medium/high adjustment removes hard load and heavily limits impact.',
    }
  }

  if (input.adjustmentLevel === 'medium') {
    if (isHardRun(run)) {
      return {
        proposedTitle: 'Easy run replacement',
        proposedSummary: 'Remove intervals, threshold, marathon-pace, and progression work. Keep relaxed easy only if symptoms allow.',
        proposedDistanceKm: getReducedDistance(run.plannedDistanceKm, 0.55),
        proposedChangeType: 'replace_with_easy_run',
        proposedRunType: 'easy',
        reason: 'Medium adjustment removes hard running while preserving light aerobic rhythm.',
      }
    }

    if (run.type === 'long') {
      return {
        proposedTitle: 'Reduced long run',
        proposedSummary: 'Keep the long run easy and reduce duration by roughly 25-40%. No fast finish.',
        proposedDistanceKm: getReducedDistance(run.plannedDistanceKm, 0.65),
        proposedChangeType: 'reduce',
        proposedRunType: 'easy',
        reason: 'Long-run load is reduced during a medium adjustment window.',
      }
    }

    return {
      proposedTitle: 'Reduced easy run',
      proposedSummary: 'Run easy only, shorten the session, and stop if symptoms worsen.',
      proposedDistanceKm: getReducedDistance(run.plannedDistanceKm, 0.7),
      proposedChangeType: 'reduce',
      proposedRunType: 'easy',
      reason: 'Medium adjustment keeps only low-risk aerobic running.',
    }
  }

  if (input.adjustmentLevel === 'low_medium') {
    if (isHardRun(run)) {
      return {
        proposedTitle: 'Controlled aerobic replacement',
        proposedSummary: 'Convert quality work to easy/steady running. No interval or threshold pressure.',
        proposedDistanceKm: getReducedDistance(run.plannedDistanceKm, 0.8),
        proposedChangeType: 'replace_with_easy_run',
        proposedRunType: 'easy',
        reason: 'Low/medium adjustment avoids hard spikes while keeping rhythm.',
      }
    }

    return {
      proposedTitle: 'Shortened run',
      proposedSummary: 'Keep effort easy and reduce distance by roughly 10-20%.',
      proposedDistanceKm: getReducedDistance(run.plannedDistanceKm, run.type === 'long' ? 0.85 : 0.9),
      proposedChangeType: 'reduce',
      proposedRunType: run.type === 'long' ? 'easy' : run.type,
      reason: 'Low/medium adjustment trims load without fully interrupting the week.',
    }
  }

  if (isHardRun(run)) {
    return {
      proposedTitle: 'Trimmed quality session',
      proposedSummary: 'Keep the session controlled. Reduce reps/blocks and avoid chasing pace.',
      proposedDistanceKm: getReducedDistance(run.plannedDistanceKm, 0.9),
      proposedChangeType: 'reduce',
      proposedRunType: run.type,
      reason: 'Low adjustment only trims the sharpest part of the session.',
    }
  }

  return {
    proposedTitle: run.title,
    proposedSummary: run.type === 'long' ? 'Keep long run easy and remove any fast finish.' : 'Keep as planned, easy and controlled.',
    proposedDistanceKm: run.type === 'long' ? getReducedDistance(run.plannedDistanceKm, 0.95) : run.plannedDistanceKm,
    proposedChangeType: run.type === 'long' ? 'reduce' : 'keep',
    proposedRunType: run.type,
    reason: 'Low adjustment keeps low-risk running in place.',
  }
}

function getNonRunProposal(
  dayPlan: DayPlan,
  input: PlanAdjustmentInput,
): Pick<
  ProposedPlanChange,
  'proposedTitle' | 'proposedSummary' | 'proposedChangeType' | 'proposedRunType' | 'reason'
> {
  if (dayPlan.strengthSessionIds?.length && input.adjustmentLevel !== 'low') {
    return {
      proposedTitle: 'Strength adjusted',
      proposedSummary: 'No run planned. Adjust strength load according to the issue.',
      proposedChangeType: input.adjustmentLevel === 'high' ? 'remove_strength' : 'reduce_strength',
      reason: 'Strength is the main training stress on this day.',
    }
  }

  return {
    proposedTitle: dayPlan.title,
    proposedSummary: 'Keep rest, recovery, social, or mobility context as planned.',
    proposedChangeType: input.adjustmentLevel === 'high' ? 'replace_with_rest' : 'keep',
    reason: 'No planned run to reduce.',
  }
}

function buildNoRunReplacement(
  dayPlan: DayPlan,
  run: RunWorkout,
  input: PlanAdjustmentInput,
): Pick<
  ProposedPlanChange,
  | 'proposedTitle'
  | 'proposedSummary'
  | 'proposedDistanceKm'
  | 'proposedChangeType'
  | 'proposedRunType'
  | 'reason'
> {
  if (input.canBike && input.issueType !== 'sickness' && input.runningTolerance !== 'no_running') {
    return {
      proposedTitle: 'Easy bike replacement',
      proposedSummary: getBikeReplacementSummary(run),
      proposedChangeType: 'replace_with_bike',
      proposedRunType: 'bike',
      reason: 'Bike replacement keeps aerobic stimulus while removing impact.',
    }
  }

  return {
    proposedTitle: 'Rest / walk / mobility',
    proposedSummary: dayPlan.phase === 'race' ? 'Do not force training during race week symptoms.' : 'No running during this affected period.',
    proposedDistanceKm: 0,
    proposedChangeType: 'replace_with_rest',
    reason: input.issueType === 'sickness' ? 'Systemic symptoms favor rest over cross-training.' : 'High adjustment removes running load.',
  }
}

function getStrengthAdjustment(dayPlan: DayPlan, input: PlanAdjustmentInput): string | undefined {
  if (!dayPlan.strengthSessionIds?.length) {
    return undefined
  }

  if (input.issueType === 'sickness' || input.adjustmentLevel === 'high' || input.strengthTolerance === 'none') {
    return 'Remove gym work. Gentle mobility only if safe.'
  }

  if (input.strengthTolerance === 'mobility_only' || input.adjustmentLevel === 'medium_high') {
    return 'Mobility only. No heavy lifting.'
  }

  if (input.adjustmentLevel === 'medium' || input.strengthTolerance === 'upper_core_only') {
    return 'Replace heavy gym work with mini prehab, light core, or upper/core only.'
  }

  if (input.injuryArea && lowerLegAreas.includes(input.injuryArea)) {
    return 'Remove heavy calf/soleus loading and keep Achilles-friendly mobility.'
  }

  if (input.adjustmentLevel === 'low_medium' || input.strengthTolerance === 'reduced') {
    return 'Reduce sets/load by about 20-30%.'
  }

  return 'Keep strength but avoid maximal lifting.'
}

function getNutritionNote(dayPlan: DayPlan, input: PlanAdjustmentInput): string | undefined {
  if (input.issueType === 'sickness') {
    return 'Prioritize hydration, simple carbs, and normal eating before training resumes.'
  }

  if (input.issueType === 'party_social') {
    return 'Use proper meals, electrolytes, and easy recovery nutrition. Do not train hard dehydrated.'
  }

  if (dayPlan.plannedRun?.type === 'long') {
    return 'If the long run is reduced or canceled, keep normal meals but skip unnecessary during-run fuel.'
  }

  return undefined
}

function getDayWarnings(
  dayPlan: DayPlan,
  input: PlanAdjustmentInput,
  runChange: Pick<ProposedPlanChange, 'proposedChangeType'>,
): string[] {
  const warnings: string[] = []

  if (dayPlan.phase === 'taper' || dayPlan.phase === 'race') {
    warnings.push('Touches taper/race week. Do not add missed training back later.')
  }

  if (
    input.issueType === 'injury' &&
    input.injuryArea &&
    lowerLegAreas.includes(input.injuryArea) &&
    dayPlan.plannedRun &&
    hardRunTypes.includes(dayPlan.plannedRun.type) &&
    runChange.proposedChangeType === 'keep'
  ) {
    warnings.push('Lower-leg injury and hard running is a risky combination.')
  }

  if (dayPlan.plannedRun?.type === 'long' && input.adjustmentLevel !== 'low') {
    warnings.push('Long-run load is a key risk point in this window.')
  }

  return warnings
}

function validateAdjustmentProposalChanges(
  changes: ProposedPlanChange[],
  input: PlanAdjustmentInput,
): string[] {
  const warnings: string[] = []

  if (
    changes.some(
      (change) =>
        change.originalRunType &&
        hardRunTypes.includes(change.originalRunType) &&
        change.proposedChangeType === 'keep',
    ) &&
    ['medium', 'medium_high', 'high'].includes(input.adjustmentLevel)
  ) {
    warnings.push('Proposal keeps a hard workout during a medium-or-higher adjustment.')
  }

  if (
    input.issueType === 'injury' &&
    input.injuryArea &&
    lowerLegAreas.includes(input.injuryArea) &&
    input.severity > 3 &&
    changes.some((change) => change.originalRunType && hardRunTypes.includes(change.originalRunType))
  ) {
    warnings.push('Lower-leg injury above severity 3: hard workouts should stay removed or reduced.')
  }

  if (
    changes.some(
      (change) =>
        change.proposedDistanceKm !== undefined &&
        change.originalDistanceKm !== undefined &&
        change.proposedDistanceKm > change.originalDistanceKm,
    )
  ) {
    warnings.push('Proposal increases mileage inside the adjustment window.')
  }

  if (
    changes.some(
      (change) =>
        change.originalRunType === 'long' &&
        change.proposedChangeType === 'keep' &&
        ['medium', 'medium_high', 'high'].includes(input.adjustmentLevel),
    )
  ) {
    warnings.push('Long run remains unchanged during a medium/high adjustment.')
  }

  if (changes.some((change) => change.warnings.some((warning) => warning.includes('race week')))) {
    warnings.push('Adjustment touches race/taper context.')
  }

  if (
    ['medium', 'medium_high', 'high'].includes(input.adjustmentLevel) &&
    changes.length > 0 &&
    changes.every((change) => change.proposedChangeType === 'keep')
  ) {
    warnings.push('No meaningful changes were generated despite a medium/high adjustment level.')
  }

  return Array.from(new Set(warnings))
}

function isHardRun(run: RunWorkout) {
  return hardRunTypes.includes(run.type) || run.type === 'long'
}

function getReducedDistance(distanceKm: number, multiplier: number, capKm?: number) {
  const reduced = Math.round(distanceKm * multiplier * 10) / 10
  return capKm ? Math.min(reduced, capKm) : reduced
}

function getBikeReplacementSummary(run: RunWorkout) {
  if (run.plannedDistanceKm <= 8) {
    return '45-60 minutes easy bike, Z1-Z2, no intervals.'
  }

  if (run.plannedDistanceKm <= 16) {
    return '75-90 minutes easy bike, smooth cadence, no intensity.'
  }

  return '90-150 minutes easy bike only if symptoms and energy are stable.'
}
