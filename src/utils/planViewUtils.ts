import { strengthSessionsById } from '../data/strengthSessions'
import type { PlanBadge, PlanFilter, PlanPhaseSegment, PlanStats, PlanWeekViewSection } from '../types/planView'
import type { DayPlan, RunWorkout, SpecialEvent, WeekPlan } from '../types/training'
import {
  getEffectiveFullTrainingPlan,
  getEffectivePlanStats,
  getEffectiveWeekPlans,
} from './effectiveTrainingPlanUtils'
import { formatFuelingSummary } from './fuelingFormatUtils'
import { getFuelingRecommendationForDay } from './fuelingRules'
import { getSpecialEventsForDate } from './trainingPlanUtils'

const keyWorkoutTypes = ['threshold', 'interval', 'marathon_pace', 'progression', 'race']

export function isLongRun(dayPlan: DayPlan): boolean {
  return Boolean(
    dayPlan.plannedRun &&
      (dayPlan.plannedRun.type === 'long' ||
        dayPlan.plannedRun.plannedDistanceKm >= 18 ||
        dayPlan.title.toLowerCase().includes('long')),
  )
}

export function isKeyWorkout(dayPlan: DayPlan): boolean {
  const run = dayPlan.plannedRun

  if (!run) {
    return false
  }

  return (
    keyWorkoutTypes.includes(run.type) ||
    Boolean(
      run.intervals?.some((interval) =>
        interval.targetPace?.description.toLowerCase().includes('marathon'),
      ),
    ) ||
    run.title.toLowerCase().includes('marathon pace')
  )
}

export function isRaceDay(dayPlan: DayPlan): boolean {
  return dayPlan.plannedRun?.type === 'race' || dayPlan.dayType === 'race'
}

export function isRestOrSocialDay(dayPlan: DayPlan): boolean {
  return (
    !dayPlan.plannedRun ||
    dayPlan.dayType === 'rest' ||
    dayPlan.dayType === 'social' ||
    dayPlan.dayType === 'recovery'
  )
}

export function getIntervalSummary(run: RunWorkout | undefined): string | undefined {
  if (!run?.intervals?.length) {
    return undefined
  }

  return run.intervals
    .map((interval) => {
      const repTarget = interval.distanceKm
        ? `${interval.distanceKm} km`
        : `${interval.durationMinutes ?? 0} min`
      const recovery = interval.recoveryDistanceKm
        ? `${interval.recoveryDistanceKm} km easy`
        : interval.recoveryDurationMinutes
          ? `${interval.recoveryDurationMinutes} min easy`
          : interval.recoveryInstruction
      const recoveryText = recovery ? ` - ${recovery}` : ''
      return `${interval.repetitions} x ${repTarget}${recoveryText}`
    })
    .join(' - ')
}

export function getDayBadges(dayPlan: DayPlan): PlanBadge[] {
  const badges: PlanBadge[] = []

  if (isRaceDay(dayPlan)) {
    badges.push({ label: 'Race', tone: 'race' })
  }

  if (isKeyWorkout(dayPlan) && !isRaceDay(dayPlan)) {
    badges.push({ label: 'Key workout', tone: 'warning' })
  }

  if (isLongRun(dayPlan) && !isRaceDay(dayPlan)) {
    badges.push({ label: 'Long run', tone: 'running' })
  }

  if (dayPlan.strengthSessionIds?.length) {
    badges.push({ label: 'Strength', tone: 'strength' })
  }

  if (dayPlan.dayType === 'social') {
    badges.push({ label: 'Social', tone: 'neutral' })
  }

  if (!dayPlan.plannedRun && dayPlan.dayType !== 'social') {
    badges.push({ label: 'Rest', tone: 'neutral' })
  }

  if (dayPlan.phase === 'taper') {
    badges.push({ label: 'Taper', tone: 'neutral' })
  }

  return badges
}

export function getDaySearchText(dayPlan: DayPlan, specialEvents: SpecialEvent[]): string {
  const strengthText = (dayPlan.strengthSessionIds ?? [])
    .map((sessionId) => strengthSessionsById[sessionId]?.title ?? sessionId)
    .join(' ')
  const run = dayPlan.plannedRun
  const runText = run
    ? [
        run.title,
        run.type,
        run.targetPace?.description,
        run.targetHrDescription,
        run.instructions.join(' '),
        run.fuelNotes?.join(' '),
      ].join(' ')
    : ''
  const mealText = [
    dayPlan.mealPlan.carbFocus,
    dayPlan.mealPlan.proteinFocus,
    dayPlan.mealPlan.hydrationFocus,
    dayPlan.mealPlan.notes.join(' '),
    dayPlan.mealPlan.meals
      .map((meal) => `${meal.time} ${meal.label} ${meal.description} ${meal.purpose}`)
      .join(' '),
  ].join(' ')
  const fuelingRecommendation = getFuelingRecommendationForDay(dayPlan)
  const fuelingText = [
    'fuel',
    'fuelling',
    'Maurten',
    fuelingRecommendation.title,
    fuelingRecommendation.summary,
    formatFuelingSummary(fuelingRecommendation),
    ...fuelingRecommendation.preRun.map((item) => item.productName),
    ...fuelingRecommendation.duringRun.map((item) => item.productName),
  ].join(' ')

  return [
    dayPlan.date,
    dayPlan.dayOfWeek,
    dayPlan.phase,
    dayPlan.dayType,
    dayPlan.intensity,
    dayPlan.title,
    dayPlan.summary,
    dayPlan.notes.join(' '),
    runText,
    strengthText,
    mealText,
    fuelingText,
    specialEvents.map((event) => `${event.title} ${event.category} ${event.trainingImpact}`).join(' '),
  ]
    .join(' ')
    .toLowerCase()
}

export function dayMatchesFilter(dayPlan: DayPlan, filter: PlanFilter): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'runs') {
    return Boolean(dayPlan.plannedRun)
  }

  if (filter === 'key_workouts') {
    return isKeyWorkout(dayPlan)
  }

  if (filter === 'long_runs') {
    return isLongRun(dayPlan) || isRaceDay(dayPlan)
  }

  if (filter === 'strength') {
    return Boolean(dayPlan.strengthSessionIds?.length)
  }

  if (filter === 'rest_social') {
    return isRestOrSocialDay(dayPlan) && !isKeyWorkout(dayPlan)
  }

  if (filter === 'race_week') {
    return dayPlan.phase === 'race' || isRaceDay(dayPlan)
  }

  return true
}

export function filterPlanDays(
  days: DayPlan[],
  filter: PlanFilter,
  searchTerm: string,
): DayPlan[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  return days.filter((dayPlan) => {
    const specialEvents = getSpecialEventsForDate(dayPlan.date)
    const matchesFilter = dayMatchesFilter(dayPlan, filter)
    const matchesSearch =
      !normalizedSearchTerm ||
      getDaySearchText(dayPlan, specialEvents).includes(normalizedSearchTerm)

    return matchesFilter && matchesSearch
  })
}

export function groupDaysByWeek(days: DayPlan[]): PlanWeekViewSection[] {
  const daysByWeek = days.reduce<Record<number, DayPlan[]>>((result, day) => {
    result[day.weekNumber] = [...(result[day.weekNumber] ?? []), day]
    return result
  }, {})

  return getEffectiveWeekPlans()
    .map((week) => ({
      week,
      matchingDays: daysByWeek[week.weekNumber] ?? [],
      specialEventLabels: getWeekSpecialEventLabels(week),
      plannedRunCount: week.days.filter((day) => day.plannedRun).length,
      keyWorkoutCount: getKeyWorkoutCountForWeek(week),
      longRunDistanceKm: getLongRunDistanceForWeek(week),
    }))
    .filter((section) => section.matchingDays.length > 0)
}

export function buildPlanStats(): PlanStats {
  const stats = getEffectivePlanStats()
  const allDays = getEffectiveFullTrainingPlan()
  const raceDay = allDays.find(isRaceDay)

  return {
    totalPlannedKm: stats.totalPlannedKm,
    totalWeeks: stats.totalWeeks,
    peakWeekNumber: stats.peakWeekNumber,
    peakWeekKm: stats.peakWeekKm,
    plannedRuns: stats.numberOfRuns,
    strengthSessions: stats.numberOfStrengthSessions,
    longRuns: allDays.filter(isLongRun).length,
    keyWorkouts: allDays.filter(isKeyWorkout).length,
    raceDate: raceDay?.date,
  }
}

export function buildPhaseTimeline(): PlanPhaseSegment[] {
  const segments: PlanPhaseSegment[] = []

  for (const week of getEffectiveWeekPlans()) {
    const lastSegment = segments[segments.length - 1]

    if (lastSegment?.phase === week.phase) {
      lastSegment.endWeek = week.weekNumber
      lastSegment.weekCount += 1
      lastSegment.minMileageKm = Math.min(lastSegment.minMileageKm, week.targetMileageKm)
      lastSegment.maxMileageKm = Math.max(lastSegment.maxMileageKm, week.targetMileageKm)
    } else {
      segments.push({
        phase: week.phase,
        startWeek: week.weekNumber,
        endWeek: week.weekNumber,
        weekCount: 1,
        minMileageKm: week.targetMileageKm,
        maxMileageKm: week.targetMileageKm,
      })
    }
  }

  return segments
}

export function getWeekSpecialEventLabels(weekPlan: WeekPlan): string[] {
  return Array.from(
    new Set(
      weekPlan.days.flatMap((day) => getSpecialEventsForDate(day.date).map((event) => event.title)),
    ),
  )
}

export function getLongRunDistanceForWeek(weekPlan: WeekPlan): number | undefined {
  const longRunDistances = weekPlan.days
    .filter((day) => isLongRun(day) || isRaceDay(day))
    .map((day) => day.plannedRun?.plannedDistanceKm ?? 0)

  if (!longRunDistances.length) {
    return undefined
  }

  return Math.max(...longRunDistances)
}

export function getKeyWorkoutCountForWeek(weekPlan: WeekPlan): number {
  return weekPlan.days.filter(isKeyWorkout).length
}
