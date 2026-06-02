import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import type {
  DashboardTotals,
  MarathonReadiness,
  PaceHeartRateTrendPoint,
  RiskSignal,
  WeeklyDashboardSummary,
} from '../types/dashboard'
import type { DayPlan } from '../types/training'
import type { WorkoutLogEntry } from '../types/workoutLog'
import { formatDateKey } from './dateUtils'
import { roundOneDecimal, roundWhole } from './chartFormatUtils'
import { getEffectiveFullTrainingPlan, getEffectiveWeekPlans } from './effectiveTrainingPlanUtils'
import { getStrengthSessionLoadCategory, getStrengthSessionsByIds } from './strengthUtils'

function isPositiveNumber(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0
}

function isRunCompleted(log: WorkoutLogEntry | undefined) {
  return Boolean(
    log &&
      log.runCompleted &&
      (log.completionStatus === 'completed' || log.completionStatus === 'partial'),
  )
}

function getLogPaceSeconds(log: WorkoutLogEntry) {
  if (!isPositiveNumber(log.actualDistanceKm) || !isPositiveNumber(log.actualDurationMinutes)) {
    return undefined
  }

  return (log.actualDurationMinutes * 60) / log.actualDistanceKm
}

function average(values: number[]) {
  if (!values.length) {
    return undefined
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function getLogsForDays(days: DayPlan[], logs: Record<string, WorkoutLogEntry>) {
  return days.map((day) => logs[day.date]).filter((log) => log !== undefined)
}

function getLatestLogDate(logs: Record<string, WorkoutLogEntry>) {
  const sortedDates = Object.keys(logs).sort()
  return sortedDates[sortedDates.length - 1]
}

function getDashboardReferenceDate(logs: Record<string, WorkoutLogEntry>) {
  const latestLogDate = getLatestLogDate(logs)

  if (latestLogDate) {
    return latestLogDate
  }

  const today = formatDateKey(new Date())

  if (today < trainingPlanStartDate) {
    return trainingPlanStartDate
  }

  if (today > trainingPlanEndDate) {
    return trainingPlanEndDate
  }

  return today
}

export function getCurrentPlanWeekNumber(referenceDate: string): number | undefined {
  const weeks = getEffectiveWeekPlans()

  if (!weeks.length) {
    return undefined
  }

  if (referenceDate < trainingPlanStartDate) {
    return weeks[0]?.weekNumber
  }

  if (referenceDate > trainingPlanEndDate) {
    return weeks[weeks.length - 1]?.weekNumber
  }

  return weeks.find(
    (week) => referenceDate >= week.startDate && referenceDate <= week.endDate,
  )?.weekNumber
}

export function buildWeeklyDashboardSummaries(
  logs: Record<string, WorkoutLogEntry>,
): WeeklyDashboardSummary[] {
  return getEffectiveWeekPlans().map((week) => {
    const weekLogs = getLogsForDays(week.days, logs)
    const plannedKm = week.days.reduce(
      (total, day) => total + (day.plannedRun?.plannedDistanceKm ?? 0),
      0,
    )
    const actualKm = weekLogs.reduce(
      (total, log) => total + (isPositiveNumber(log.actualDistanceKm) ? log.actualDistanceKm : 0),
      0,
    )
    const plannedRunCount = week.days.filter((day) => day.plannedRun).length
    const completedRunCount = weekLogs.filter(isRunCompleted).length
    const plannedStrengthCount = week.days.reduce(
      (total, day) => total + (day.strengthSessionIds?.length ?? 0),
      0,
    )
    const plannedStrengthByLoad = week.days
      .flatMap((day) => getStrengthSessionsByIds(day.strengthSessionIds))
      .reduce(
        (totals, session) => {
          const load = getStrengthSessionLoadCategory(session)

          if (load === 'heavy') {
            totals.heavy += 1
          } else if (load === 'optional') {
            totals.optional += 1
          } else {
            totals.lightOrMobility += 1
          }

          return totals
        },
        { heavy: 0, lightOrMobility: 0, optional: 0 },
      )
    // The current log model stores one strength completion flag per day, not per session.
    const completedStrengthCount = weekLogs.filter((log) => log.strengthCompleted).length
    const averageHr = average(
      weekLogs
        .map((log) => log.averageHr)
        .filter((value): value is number => isPositiveNumber(value)),
    )
    const averagePaceSecondsPerKm = average(
      weekLogs
        .map(getLogPaceSeconds)
        .filter((value): value is number => isPositiveNumber(value)),
    )
    const plannedLongRunKm = Math.max(
      0,
      ...week.days.map((day) => day.plannedRun?.plannedDistanceKm ?? 0),
    )
    const actualDistances = weekLogs
      .map((log) => log.actualDistanceKm)
      .filter((value): value is number => isPositiveNumber(value))
    const longestRunKm = actualDistances.length ? Math.max(...actualDistances) : undefined
    const alcoholFlags = weekLogs.filter(
      (log) => log.alcoholYesterday === 'moderate' || log.alcoholYesterday === 'heavy',
    ).length

    return {
      weekNumber: week.weekNumber,
      startDate: week.startDate,
      endDate: week.endDate,
      phase: week.phase,
      focus: week.focus,
      plannedKm: roundOneDecimal(plannedKm),
      actualKm: roundOneDecimal(actualKm),
      plannedRunCount,
      completedRunCount,
      plannedStrengthCount,
      plannedHeavyStrengthCount: plannedStrengthByLoad.heavy,
      plannedLightOrMobilityStrengthCount: plannedStrengthByLoad.lightOrMobility,
      plannedOptionalStrengthCount: plannedStrengthByLoad.optional,
      completedStrengthCount,
      completionPercent:
        plannedRunCount > 0 ? roundWhole((completedRunCount / plannedRunCount) * 100) : 0,
      averageHr: averageHr === undefined ? undefined : roundWhole(averageHr),
      averagePaceSecondsPerKm,
      plannedLongRunKm: plannedLongRunKm > 0 ? roundOneDecimal(plannedLongRunKm) : undefined,
      longestRunKm: longestRunKm === undefined ? undefined : roundOneDecimal(longestRunKm),
      alcoholFlags,
    }
  })
}

export function buildDashboardTotals(
  logs: Record<string, WorkoutLogEntry>,
): DashboardTotals {
  const referenceDate = getDashboardReferenceDate(logs)
  const planToDate = getEffectiveFullTrainingPlan().filter((day) => day.date <= referenceDate)
  const logsToDate = Object.values(logs).filter((log) => log.date <= referenceDate)
  const averageHr = average(
    logsToDate
      .map((log) => log.averageHr)
      .filter((value): value is number => isPositiveNumber(value)),
  )
  const plannedRuns = planToDate.filter((day) => day.plannedRun).length
  const completedRuns = logsToDate.filter(isRunCompleted).length
  const plannedStrengthSessions = planToDate.reduce(
    (total, day) => total + (day.strengthSessionIds?.length ?? 0),
    0,
  )
  const completedStrengthSessions = logsToDate.filter((log) => log.strengthCompleted).length

  return {
    plannedKmToDate: roundOneDecimal(
      planToDate.reduce((total, day) => total + (day.plannedRun?.plannedDistanceKm ?? 0), 0),
    ),
    actualKmToDate: roundOneDecimal(
      logsToDate.reduce(
        (total, log) => total + (isPositiveNumber(log.actualDistanceKm) ? log.actualDistanceKm : 0),
        0,
      ),
    ),
    completedRuns,
    plannedRuns,
    completedStrengthSessions,
    plannedStrengthSessions,
    completionPercent: plannedRuns > 0 ? roundWhole((completedRuns / plannedRuns) * 100) : 0,
    averageHr: averageHr === undefined ? undefined : roundWhole(averageHr),
    latestLogDate: getLatestLogDate(logs),
    currentWeekNumber: getCurrentPlanWeekNumber(referenceDate),
  }
}

export function buildRiskSignals(
  logs: Record<string, WorkoutLogEntry>,
  weeklySummaries: WeeklyDashboardSummary[],
): RiskSignal[] {
  const signals: RiskSignal[] = []
  const loggedRunCount = Object.values(logs).filter(isRunCompleted).length

  for (const week of weeklySummaries) {
    if (week.actualKm > 0 && week.plannedKm > 0 && week.actualKm > week.plannedKm * 1.15) {
      signals.push({
        id: `week-${week.weekNumber}-over-plan`,
        label: `Week ${week.weekNumber} mileage above plan`,
        severity: 'high',
        description: `${week.actualKm} km logged vs ${week.plannedKm} km planned.`,
      })
    }

    if (
      week.actualKm > 0 &&
      week.plannedKm > 0 &&
      week.actualKm < week.plannedKm * 0.7 &&
      (week.phase === 'build' || week.phase === 'peak' || week.phase === 'specific')
    ) {
      signals.push({
        id: `week-${week.weekNumber}-low-mileage`,
        label: `Week ${week.weekNumber} below planned volume`,
        severity: 'medium',
        description: `${week.actualKm} km logged in a ${week.phase} week planned for ${week.plannedKm} km.`,
      })
    }

    if (week.alcoholFlags >= 2) {
      signals.push({
        id: `week-${week.weekNumber}-alcohol`,
        label: `Week ${week.weekNumber} has repeated alcohol flags`,
        severity: week.alcoholFlags >= 3 ? 'high' : 'medium',
        description: `${week.alcoholFlags} moderate/heavy alcohol logs in the week.`,
      })
    }

    if (week.averageHr !== undefined && week.averageHr >= 170) {
      signals.push({
        id: `week-${week.weekNumber}-high-hr`,
        label: `Week ${week.weekNumber} average HR is high`,
        severity: 'medium',
        description: `Logged average HR is ${week.averageHr}. Check effort, heat, fatigue, or terrain context.`,
      })
    }
  }

  const recentLoggedWeeks = weeklySummaries
    .filter((week) => week.actualKm > 0)
    .slice(-4)
  const recentMissedRuns = recentLoggedWeeks.reduce(
    (total, week) => total + Math.max(0, week.plannedRunCount - week.completedRunCount),
    0,
  )

  if (loggedRunCount >= 5 && recentMissedRuns >= 4) {
    signals.push({
      id: 'recent-missed-runs',
      label: 'Several planned runs missed recently',
      severity: 'medium',
      description: `${recentMissedRuns} planned runs were not logged as completed in the recent logged weeks.`,
    })
  }

  return signals.slice(0, 6)
}

export function calculateMarathonReadiness(
  logs: Record<string, WorkoutLogEntry>,
  weeklySummaries: WeeklyDashboardSummary[],
): MarathonReadiness {
  const loggedRuns = Object.values(logs).filter(isRunCompleted)

  if (loggedRuns.length < 5) {
    return {
      score: 0,
      label: 'Not enough data',
      description: 'Log at least five runs before this becomes meaningful.',
      positives: ['The full Amsterdam plan is loaded and ready.'],
      concerns: ['Not enough workout logs yet to judge trend or readiness.'],
    }
  }

  const loggedWeeks = weeklySummaries.filter((week) => week.actualKm > 0)
  const recentWeeks = loggedWeeks.slice(-4)
  const totalPlannedKm = loggedWeeks.reduce((total, week) => total + week.plannedKm, 0)
  const totalActualKm = loggedWeeks.reduce((total, week) => total + week.actualKm, 0)
  const completedRuns = loggedWeeks.reduce((total, week) => total + week.completedRunCount, 0)
  const plannedRuns = loggedWeeks.reduce((total, week) => total + week.plannedRunCount, 0)
  const completedStrength = loggedWeeks.reduce(
    (total, week) => total + week.completedStrengthCount,
    0,
  )
  const plannedStrength = loggedWeeks.reduce(
    (total, week) => total + week.plannedStrengthCount,
    0,
  )
  const longestRunKm = Math.max(0, ...loggedWeeks.map((week) => week.longestRunKm ?? 0))
  const alcoholFlags = recentWeeks.reduce((total, week) => total + week.alcoholFlags, 0)
  const completion = plannedRuns > 0 ? completedRuns / plannedRuns : 0
  const mileageRatio = totalPlannedKm > 0 ? totalActualKm / totalPlannedKm : 0
  const strengthRatio = plannedStrength > 0 ? completedStrength / plannedStrength : 0

  let score = 50
  const positives: string[] = []
  const concerns: string[] = []

  if (completion >= 0.85) {
    score += 15
    positives.push('Run completion is consistently high.')
  } else if (completion < 0.65) {
    score -= 15
    concerns.push('Run completion is below the target rhythm.')
  }

  if (mileageRatio >= 0.85 && mileageRatio <= 1.1) {
    score += 15
    positives.push('Logged mileage is close to planned mileage.')
  } else if (mileageRatio > 1.15) {
    score -= 12
    concerns.push('Mileage is running above plan; watch load spikes.')
  } else if (mileageRatio < 0.7) {
    score -= 12
    concerns.push('Logged mileage is well below planned volume.')
  }

  if (longestRunKm >= 30) {
    score += 12
    positives.push('Long-run progression has reached marathon-specific territory.')
  } else if (longestRunKm >= 20) {
    score += 6
    positives.push('Long runs are building into a useful range.')
  } else {
    concerns.push('Long-run progression is still early in the logged data.')
  }

  if (strengthRatio >= 0.6) {
    score += 8
    positives.push('Strength consistency is supporting durability.')
  } else {
    score -= 5
    concerns.push('Strength consistency is below the plan target.')
  }

  if (alcoholFlags >= 3) {
    score -= 8
    concerns.push('Recent alcohol flags may affect recovery quality.')
  }

  const clampedScore = Math.min(100, Math.max(0, Math.round(score)))
  const label: MarathonReadiness['label'] =
    clampedScore >= 82
      ? 'Strong'
      : clampedScore >= 68
        ? 'On track'
        : clampedScore >= 50
          ? 'Building'
          : 'At risk'

  return {
    score: clampedScore,
    label,
    description:
      label === 'Strong'
        ? 'Logged training is aligning well with the marathon goal.'
        : label === 'On track'
          ? 'The trend is positive, with a few signals to keep tidy.'
          : label === 'Building'
            ? 'The base is forming; keep logging to sharpen the picture.'
            : 'Recent logged data suggests the plan needs careful management.',
    positives: positives.length ? positives : ['Workout logs are building a useful picture.'],
    concerns: concerns.length ? concerns : ['No major concerns from the logged data.'],
  }
}

export function getPaceHeartRateTrendPoints(
  logs: Record<string, WorkoutLogEntry>,
): PaceHeartRateTrendPoint[] {
  return Object.values(logs)
    .filter((log) => isRunCompleted(log))
    .sort((firstLog, secondLog) => firstLog.date.localeCompare(secondLog.date))
    .map((log) => ({
      date: log.date,
      paceSecondsPerKm: getLogPaceSeconds(log),
      averageHr: log.averageHr,
    }))
}

export function getLatestLoggedWeekSummary(
  logs: Record<string, WorkoutLogEntry>,
  weeklySummaries: WeeklyDashboardSummary[],
): WeeklyDashboardSummary | undefined {
  const latestLogDate = getLatestLogDate(logs)

  if (!latestLogDate) {
    const currentWeekNumber = getCurrentPlanWeekNumber(getDashboardReferenceDate(logs))
    return weeklySummaries.find((week) => week.weekNumber === currentWeekNumber)
  }

  return weeklySummaries.find(
    (week) => latestLogDate >= week.startDate && latestLogDate <= week.endDate,
  )
}
