import type { DailyScheduleBlock } from '../types/schedule'
import type { DayPlan } from '../types/training'
import type { WeekViewDay, WeekViewSummary } from '../types/weekView'
import type { WorkoutLogEntry } from '../types/workoutLog'
import {
  addDays,
  formatDateKey,
  formatDisplayDate,
  getDayOfWeek,
  getMondayOfWeek,
  parseLocalDate,
} from './dateUtils'
import {
  getDayAdjustmentInfo,
  getEffectiveDayPlan,
  getEffectiveWeekPlanByNumber,
} from './effectiveTrainingPlanUtils'
import { getScheduleOverridesForDate } from './scheduleStorage'
import { applyScheduleOverridesToGeneratedBlocks } from './scheduleOverrideUtils'
import { sortBlocksByTime } from './scheduleTimeUtils'
import { getStrengthSessionLoadCategory, getStrengthSessionsByIds } from './strengthUtils'
import { getDailyScheduleBlocks } from './todayScheduleUtils'
import { getSpecialEventsForDate } from './trainingPlanUtils'

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}

function isCompletedRunLog(log: WorkoutLogEntry | undefined) {
  return Boolean(
    log &&
      log.runCompleted &&
      (log.completionStatus === 'completed' || log.completionStatus === 'partial'),
  )
}

function getEffectiveScheduleBlocks(dayPlan: DayPlan, log: WorkoutLogEntry | undefined) {
  const overrides = getScheduleOverridesForDate(dayPlan.date)
  const plannedBlocks = applyScheduleOverridesToGeneratedBlocks(
    getDailyScheduleBlocks(dayPlan),
    overrides,
  )
  const allBlocks = sortBlocksByTime([
    ...plannedBlocks,
    ...(overrides?.customBlocks ?? []),
  ])

  return mergeBlockCompletionWithWorkoutLog(allBlocks, log)
}

export function mergeBlockCompletionWithWorkoutLog(
  blocks: DailyScheduleBlock[],
  workoutLog: WorkoutLogEntry | undefined,
): DailyScheduleBlock[] {
  const runCompleted = isCompletedRunLog(workoutLog)
  const strengthCompleted = Boolean(workoutLog?.strengthCompleted)

  return blocks.map((block) => {
    const completedFromLog =
      ((block.category === 'run' || block.category === 'race') && runCompleted) ||
      (block.category === 'strength' && strengthCompleted)

    return {
      ...block,
      completed: Boolean(block.completed || completedFromLog),
    }
  })
}

export function getKeyBlocksForWeekDay(blocks: DailyScheduleBlock[]): DailyScheduleBlock[] {
  const filteredBlocks = blocks.filter((block) => !isWeekContextBlock(block))
  const primaryBlocks = filteredBlocks.filter((block) =>
    ['custom', 'race', 'run', 'strength', 'social'].includes(block.category),
  )
  const workBlock = filteredBlocks.find((block) => block.category === 'work')
  const mealBlocks = filteredBlocks
    .filter((block) => block.category === 'meal')
    .filter((block) => {
      const title = block.title.toLowerCase()
      return (
        title.includes('lunch') ||
        title.includes('dinner') ||
        title.includes('snack') ||
        title.includes('recovery')
      )
    })
    .slice(0, 3)
  const recoveryBlock = primaryBlocks.length
    ? undefined
    : filteredBlocks.find((block) => block.category === 'recovery' || block.category === 'rest')

  const keyBlocks = [
    ...(workBlock ? [workBlock] : []),
    ...primaryBlocks,
    ...mealBlocks,
    ...(recoveryBlock ? [recoveryBlock] : []),
  ]

  return sortBlocksByTime(keyBlocks).slice(0, 8)
}

function isWeekContextBlock(block: DailyScheduleBlock) {
  if (block.source === 'custom') {
    return false
  }

  const normalizedTitle = block.title.toLowerCase().trim()
  const broadContextTitles = [
    'utrecht half marathon recovery week',
    'half marathon recovery week',
    'birthday weekend',
    'festival week',
    'wedding weekend',
  ]

  return (
    broadContextTitles.includes(normalizedTitle) ||
    ((block.category === 'social' || block.category === 'recovery') &&
      broadContextTitles.some((title) => normalizedTitle.includes(title)))
  )
}

export function buildWeekViewDays(
  selectedDate: string,
  workoutLogs: Record<string, WorkoutLogEntry>,
): WeekViewDay[] {
  const startDate = getMondayOfWeek(selectedDate)
  const today = formatDateKey(new Date())

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(startDate, index)
    const dayPlan = getEffectiveDayPlan(date)
    const workoutLog = workoutLogs[date]
    const blocks = dayPlan ? getEffectiveScheduleBlocks(dayPlan, workoutLog) : []
    const dayName = getDayOfWeek(date)

    return {
      date,
      dayName,
      dayShort: dayName.slice(0, 3),
      displayDate: formatDayMonth(date),
      dayPlan,
      blocks,
      keyBlocks: getKeyBlocksForWeekDay(blocks),
      workoutLog,
      specialEvents: getSpecialEventsForDate(date),
      adjustment: getDayAdjustmentInfo(date),
      isInsidePlan: Boolean(dayPlan),
      isToday: date === today,
      isSelected: date === selectedDate,
    }
  })
}

export function buildWeekViewSummary(days: WeekViewDay[]): WeekViewSummary {
  const startDate = days[0]?.date ?? ''
  const endDate = days[days.length - 1]?.date ?? ''
  const plannedDays = days.filter((day) => day.dayPlan)
  const firstDayPlan = plannedDays[0]?.dayPlan
  const weekPlan = firstDayPlan ? getEffectiveWeekPlanByNumber(firstDayPlan.weekNumber) : undefined
  const completedKm = days.reduce(
    (total, day) => total + (day.workoutLog?.actualDistanceKm ?? 0),
    0,
  )
  const plannedKm = days.reduce(
    (total, day) => total + (day.dayPlan?.plannedRun?.plannedDistanceKm ?? 0),
    0,
  )
  const plannedRuns = days.filter((day) => day.dayPlan?.plannedRun).length
  const completedRuns = days.filter((day) => isCompletedRunLog(day.workoutLog)).length
  const plannedStrengthSessions = days.reduce(
    (total, day) => total + (day.dayPlan?.strengthSessionIds?.length ?? 0),
    0,
  )
  const plannedStrengthByLoad = days
    .flatMap((day) => getStrengthSessionsByIds(day.dayPlan?.strengthSessionIds))
    .reduce(
      (totals, session) => {
        const load = getStrengthSessionLoadCategory(session)

        if (load === 'heavy') {
          totals.big += 1
        } else if (load === 'optional') {
          totals.optional += 1
        } else {
          totals.lightOrMobility += 1
        }

        return totals
      },
      { big: 0, lightOrMobility: 0, optional: 0 },
    )
  const completedStrengthSessions = days.filter((day) => day.workoutLog?.strengthCompleted).length
  const specialEventLabels = Array.from(
    new Set(days.flatMap((day) => day.specialEvents.map((event) => event.title))),
  )

  return {
    weekNumber: firstDayPlan?.weekNumber,
    startDate,
    endDate,
    phase: weekPlan?.phase ?? firstDayPlan?.phase,
    focus: weekPlan?.focus,
    plannedKm: roundOneDecimal(plannedKm),
    completedKm: roundOneDecimal(completedKm),
    plannedRuns,
    completedRuns,
    plannedStrengthSessions,
    plannedBigStrengthSessions: plannedStrengthByLoad.big,
    plannedLightOrMobilitySessions: plannedStrengthByLoad.lightOrMobility,
    plannedOptionalMiniSessions: plannedStrengthByLoad.optional,
    completedStrengthSessions,
    completionPercent:
      plannedRuns > 0 ? Math.round((completedRuns / plannedRuns) * 100) : 0,
    specialEventLabels,
  }
}

export function formatWeekDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) {
    return ''
  }

  return `${formatDayMonth(startDate)} - ${formatDayMonth(endDate)}`
}

function formatDayMonth(dateString: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(parseLocalDate(dateString))
}

export function formatWeekDisplayDate(dateString: string) {
  return formatDisplayDate(dateString)
}
