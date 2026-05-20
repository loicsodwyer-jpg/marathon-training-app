import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import type { ChatGptAdjustmentContext } from '../types/chatGptAdjustment'
import type { PlanAdjustmentInput, PlanAdjustmentProposal, ProposedPlanChange } from '../types/planAdjustment'
import type { DayPlan } from '../types/training'
import type { WorkoutLogEntry } from '../types/workoutLog'
import { addDays } from './dateUtils'
import { buildWeeklyDashboardSummaries } from './dashboardAnalytics'
import { getStrengthSessionsByIds } from './strengthUtils'
import { getFullTrainingPlan, getSpecialEventsForDate } from './trainingPlanUtils'

type BuildChatGptAdjustmentPromptArgs = {
  adjustmentInput: PlanAdjustmentInput
  ruleBasedProposal: PlanAdjustmentProposal
  workoutLogs: Record<string, WorkoutLogEntry>
  activePlanOverrides?: ChatGptAdjustmentContext['activePlanOverrides']
}

export function getAffectedOriginalDayPlans(input: PlanAdjustmentInput): DayPlan[] {
  return getFullTrainingPlan().filter(
    (dayPlan) => dayPlan.date >= input.startDate && dayPlan.date <= input.endDate,
  )
}

export function buildChatGptAdjustmentContext({
  adjustmentInput,
  activePlanOverrides,
  ruleBasedProposal,
}: Omit<BuildChatGptAdjustmentPromptArgs, 'workoutLogs'>): ChatGptAdjustmentContext {
  return {
    adjustmentInput,
    ruleBasedProposal,
    affectedDayPlans: getAffectedOriginalDayPlans(adjustmentInput),
    activePlanOverrides,
  }
}

export function buildChatGptAdjustmentPrompt({
  adjustmentInput,
  activePlanOverrides,
  ruleBasedProposal,
  workoutLogs,
}: BuildChatGptAdjustmentPromptArgs): string {
  const affectedDayPlans = getAffectedOriginalDayPlans(adjustmentInput)
  const recentLogs = getRecentLogs(workoutLogs, adjustmentInput.startDate, adjustmentInput.endDate)
  const weeklySummaries = buildWeeklyDashboardSummaries(workoutLogs).filter(
    (week) =>
      week.endDate >= addDays(adjustmentInput.startDate, -14) &&
      week.startDate <= adjustmentInput.endDate,
  )
  const activeOverrides = Object.values(activePlanOverrides ?? {}).filter(
    (override) =>
      override.date >= addDays(adjustmentInput.startDate, -7) &&
      override.date <= addDays(adjustmentInput.endDate, 7),
  )

  return [
    'You are helping adjust a marathon training plan for a runner. Return valid JSON only.',
    '',
    'USER AND APP CONTEXT',
    '- Runner: Loïc.',
    '- App: Loïc Marathon 2:55, a private local-first marathon training PWA.',
    '- Goal race: Amsterdam Marathon 2026 on 2026-10-18.',
    '- Goal time: 2h50-2h55.',
    '- Training block: 2026-06-01 to 2026-10-18.',
    '- Recent context: roughly 1h23 half marathon fitness, Utrecht Half Marathon target around 1h20 before the block.',
    '- Recurrent injury history: especially Achilles-related issues.',
    '- Weekday runs are usually after work around 18:30.',
    '- Strength is normally before work or during weekends.',
    '- Nutrition pattern: no breakfast; 10:30 snack, 12:30 lunch, 17:15 pre-run snack when useful, 20:00 dinner.',
    '',
    'CURRENT ISSUE',
    formatIssueDetails(adjustmentInput),
    '',
    'RECENT WORKOUT LOGS',
    recentLogs.length ? recentLogs.map(formatWorkoutLog).join('\n') : '- No recent logs are available.',
    '',
    'RELEVANT WEEKLY CONTEXT',
    weeklySummaries.length
      ? weeklySummaries
          .map(
            (week) =>
              `- Week ${week.weekNumber} (${week.startDate} to ${week.endDate}, ${week.phase}): planned ${week.plannedKm} km, actual ${week.actualKm} km, runs ${week.completedRunCount}/${week.plannedRunCount}, strength ${week.completedStrengthCount}/${week.plannedStrengthCount}, alcohol flags ${week.alcoholFlags}.`,
          )
          .join('\n')
      : '- No weekly logged context is available.',
    '',
    'ORIGINAL PLAN FOR AFFECTED DATES',
    affectedDayPlans.length
      ? affectedDayPlans.map(formatDayPlanForPrompt).join('\n\n')
      : '- No original plan days were found inside the selected window.',
    '',
    'EXISTING ACTIVE LOCAL PLAN ADJUSTMENTS NEAR THIS WINDOW',
    activeOverrides.length
      ? activeOverrides
          .map(
            (override) =>
              `- ${override.date}: ${override.adjustedTitle} — ${override.adjustedSummary}. Source: ${override.source}. Reason: ${override.reason}`,
          )
          .join('\n')
      : '- No active local plan adjustments near this window.',
    '',
    'RULE-BASED PROPOSAL THE USER DID NOT APPROVE',
    formatRejectedProposal(ruleBasedProposal),
    '',
    'SAFETY AND TRAINING CONSTRAINTS',
    '- Do not increase mileage during the adjustment window.',
    '- Do not place hard sessions back-to-back.',
    '- Do not keep intervals/threshold work for Achilles/calf/shin/foot injury above mild severity.',
    '- Do not schedule hard training during fever, chest symptoms, GI illness, dehydration, or systemic sickness.',
    '- Do not make up missed mileage aggressively.',
    '- Race week should prioritize freshness.',
    '- If red flags exist, be conservative and recommend professional medical/physio advice.',
    '- This is coaching guidance, not a medical diagnosis.',
    '',
    'REQUIRED OUTPUT',
    '- Return valid JSON only.',
    '- Do not include markdown fences, comments, or prose outside JSON.',
    '- Use ISO date strings.',
    '- Only include affected dates inside the training plan.',
    '- Every change must include date, proposedTitle, proposedSummary, proposedChangeType, and reason.',
    '- proposedDistanceKm must not exceed the original planned distance unless there is a clear safety-neutral reason; generally do not increase it.',
    '- Use only the allowed proposedChangeType values listed in the schema.',
    '',
    'JSON SCHEMA TO RETURN',
    JSON.stringify(getPromptSchemaExample(), null, 2),
  ].join('\n')
}

function formatIssueDetails(input: PlanAdjustmentInput) {
  return [
    `- Issue type: ${input.issueType}`,
    input.injuryArea ? `- Injury area: ${input.injuryArea}` : undefined,
    input.sicknessType ? `- Sickness type: ${input.sicknessType}` : undefined,
    `- Severity: ${input.severity}/10`,
    `- Symptom trend: ${input.symptomTrend}`,
    `- Pain during run: ${input.painDuringRun ?? 'unknown'}`,
    `- Next morning response: ${input.nextMorningResponse ?? 'unknown'}`,
    `- Red flag selected: ${input.hasRedFlag ? 'yes' : 'no'}`,
    `- Description: ${input.description || 'No extra description provided.'}`,
    `- Selected adjustment window: ${input.startDate} to ${input.endDate}`,
    `- Selected adjustment level: ${input.adjustmentLevel}`,
    `- Running tolerance: ${input.runningTolerance}`,
    `- Can bike: ${input.canBike ? 'yes' : 'no'}`,
    `- Strength tolerance: ${input.strengthTolerance}`,
    `- Race goal still valid: ${input.raceGoalStillValid}`,
    `- Training plan bounds: ${trainingPlanStartDate} to ${trainingPlanEndDate}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

function getRecentLogs(
  logs: Record<string, WorkoutLogEntry>,
  startDate: string,
  endDate: string,
) {
  const fromDate = addDays(startDate, -28)
  return Object.values(logs)
    .filter((log) => log.date >= fromDate && log.date <= endDate)
    .sort((first, second) => first.date.localeCompare(second.date))
}

function formatWorkoutLog(log: WorkoutLogEntry) {
  return [
    `- ${log.date}: ${log.completionStatus}`,
    log.runCompleted ? 'run completed' : 'run not completed',
    log.strengthCompleted ? 'strength completed' : 'strength not completed',
    log.actualDistanceKm !== undefined ? `${log.actualDistanceKm} km` : undefined,
    log.actualDurationMinutes !== undefined ? `${log.actualDurationMinutes} min` : undefined,
    log.actualPaceMinPerKm ? log.actualPaceMinPerKm : undefined,
    log.averageHr !== undefined ? `avg HR ${log.averageHr}` : undefined,
    log.maxHr !== undefined ? `max HR ${log.maxHr}` : undefined,
    log.alcoholYesterday ? `alcohol ${log.alcoholYesterday}` : undefined,
    log.notes ? `notes: ${log.notes}` : undefined,
  ]
    .filter((part) => part !== undefined)
    .join(' · ')
}

function formatDayPlanForPrompt(dayPlan: DayPlan) {
  const run = dayPlan.plannedRun
  const strengthSessions = getStrengthSessionsByIds(dayPlan.strengthSessionIds)
  const specialEvents = getSpecialEventsForDate(dayPlan.date)

  return [
    `${dayPlan.date} (${dayPlan.dayOfWeek})`,
    `- Title: ${dayPlan.title}`,
    `- Phase/intensity: ${dayPlan.phase} / ${dayPlan.intensity}`,
    `- Summary: ${dayPlan.summary}`,
    run
      ? [
          `- Run: ${run.title}`,
          `  Type: ${run.type}`,
          `  Distance: ${run.plannedDistanceKm} km`,
          run.startTime ? `  Start time: ${run.startTime}` : undefined,
          run.targetPace
            ? `  Target pace: ${run.targetPace.minPerKmFrom}-${run.targetPace.minPerKmTo}/km (${run.targetPace.description})`
            : undefined,
          run.targetHrZone ? `  HR zone: ${run.targetHrZone}` : undefined,
          run.targetHrDescription ? `  HR description: ${run.targetHrDescription}` : undefined,
          run.intervals?.length
            ? `  Intervals: ${run.intervals
                .map((interval) => `${interval.repetitions} x ${interval.label}`)
                .join(', ')}`
            : undefined,
          run.instructions.length ? `  Instructions: ${run.instructions.join(' | ')}` : undefined,
          run.fuelNotes?.length ? `  Fuel: ${run.fuelNotes.join(' | ')}` : undefined,
          run.recoveryNotes?.length ? `  Recovery: ${run.recoveryNotes.join(' | ')}` : undefined,
        ]
          .filter((line) => line !== undefined)
          .join('\n')
      : '- Run: none',
    strengthSessions.length
      ? `- Strength: ${strengthSessions
          .map((session) => `${session.shortTitle} (${session.estimatedDurationMinutes} min, ${session.focus})`)
          .join(' | ')}`
      : '- Strength: none',
    specialEvents.length
      ? `- Special events: ${specialEvents
          .map((event) => `${event.title} (${event.category}, ${event.trainingImpact})`)
          .join(' | ')}`
      : '- Special events: none',
    dayPlan.notes.length ? `- Notes: ${dayPlan.notes.join(' | ')}` : undefined,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

function formatRejectedProposal(proposal: PlanAdjustmentProposal) {
  return [
    `- Title: ${proposal.title}`,
    `- Summary: ${proposal.summary}`,
    `- Level: ${proposal.adjustmentLevel}`,
    `- Dates: ${proposal.startDate} to ${proposal.endDate}`,
    proposal.globalWarnings.length
      ? `- Global warnings: ${proposal.globalWarnings.join(' | ')}`
      : '- Global warnings: none',
    '- Day changes:',
    ...proposal.changes.map(formatRejectedChange),
  ].join('\n')
}

function formatRejectedChange(change: ProposedPlanChange) {
  return `  - ${change.date}: original "${change.originalTitle}" (${change.originalDistanceKm ?? 0} km ${change.originalRunType ?? 'no run'}) -> ${change.proposedChangeType} "${change.proposedTitle}" (${change.proposedDistanceKm ?? 0} km). Reason: ${change.reason}`
}

function getPromptSchemaExample() {
  return {
    adjustmentTitle: 'Conservative Achilles adjustment',
    summary: 'Short summary of the adjusted week.',
    reason: 'Why this adjustment is safer than the rejected proposal.',
    affectedDates: ['2026-08-10'],
    adjustmentLevel: 'medium',
    globalWarnings: ['Optional warning'],
    assumptions: ['Optional assumption'],
    changes: [
      {
        date: '2026-08-10',
        originalSummary: 'Optional reference to original plan',
        proposedTitle: 'Reduced easy run',
        proposedSummary: 'Run easy only, no faster work.',
        proposedChangeType: 'reduce',
        proposedDistanceKm: 8,
        proposedRunType: 'easy',
        proposedStartTime: '18:30',
        targetPaceDescription: 'Easy conversational pace',
        targetHrZone: 'Z2',
        instructions: ['Keep this genuinely easy.', 'Stop if pain worsens.'],
        fuelNotes: ['Normal pre-run snack if hungry.'],
        recoveryNotes: ['Monitor next morning response.'],
        strengthAdjustment: 'Remove heavy calf loading.',
        removeStrength: false,
        nutritionNote: 'Hydrate normally and avoid under-fueling.',
        reason: 'Reduces tendon load while preserving rhythm.',
        warnings: ['Consider physio advice if symptoms persist.'],
      },
    ],
  }
}
