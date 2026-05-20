import { specialEvents } from '../data/specialEvents'
import type {
  CalendarEventCategory,
  CalendarExportEvent,
  CalendarExportSettings,
} from '../types/calendarExport'
import type { FuelingPreferences } from '../types/fueling'
import type { DailyScheduleBlock, DailyScheduleOverrides, ScheduleBlockOverride } from '../types/schedule'
import type { DayPlan, RunWorkout, SpecialEvent, StrengthSession, WorkoutInterval } from '../types/training'
import { getDayAdjustmentInfo, getEffectiveFullTrainingPlan } from './effectiveTrainingPlanUtils'
import { formatFuelingItems, formatFuelingSummary } from './fuelingFormatUtils'
import { getFuelingRecommendationForDay } from './fuelingRules'
import { loadFuelingPreferences } from './fuelingStorage'
import { getScheduleOverridesForDate } from './scheduleStorage'
import { addMinutesToTime, sortBlocksByTime } from './scheduleTimeUtils'
import { getStrengthSessionsByIds } from './strengthUtils'
import { getDailyScheduleBlocks } from './todayScheduleUtils'
import { loadWorkoutLogs } from './workoutLogStorage'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const hardRunTypes = ['threshold', 'interval', 'marathon_pace', 'progression', 'race']

export function buildCalendarEvents(settings: CalendarExportSettings): CalendarExportEvent[] {
  const workoutLogs = loadWorkoutLogs()
  const fuelingPreferences = loadFuelingPreferences()
  const days = getEffectiveFullTrainingPlan().filter(
    (dayPlan) => dayPlan.date >= settings.startDate && dayPlan.date <= settings.endDate,
  )
  const events: CalendarExportEvent[] = []

  for (const dayPlan of days) {
    const log = workoutLogs[dayPlan.date]
    const isRunLogged =
      log?.runCompleted && (log.completionStatus === 'completed' || log.completionStatus === 'partial')

    if (settings.includeRuns && dayPlan.plannedRun?.type !== 'race') {
      if (settings.includeCompletedLoggedSessions || !isRunLogged) {
        const runEvent = buildRunEvent(dayPlan, fuelingPreferences)
        if (runEvent) {
          events.push(runEvent)
        }
      }
    }

    if (settings.includeRace && dayPlan.plannedRun?.type === 'race') {
      if (settings.includeCompletedLoggedSessions || !isRunLogged) {
        const raceEvent = buildRunEvent(dayPlan, fuelingPreferences)
        if (raceEvent) {
          events.push(raceEvent)
        }
      }
    }

    if (settings.includeRuns && !dayPlan.plannedRun) {
      const bikeEvent = buildBikeReplacementEvent(dayPlan)
      if (bikeEvent) {
        events.push(bikeEvent)
      }
    }

    if (settings.includeStrength && (settings.includeCompletedLoggedSessions || !log?.strengthCompleted)) {
      events.push(...buildStrengthEvents(dayPlan))
    }

    if (settings.includeMeals) {
      events.push(...buildFuelEvents(dayPlan, fuelingPreferences))
    }

    if (settings.includeRecoveryReminders) {
      const recoveryEvent = buildRecoveryReminder(dayPlan)
      if (recoveryEvent) {
        events.push(recoveryEvent)
      }
    }
  }

  if (settings.includeSpecialEvents) {
    events.push(...buildSpecialEventExports(settings))
  }

  return sortCalendarEvents(dedupeEvents(events))
}

function buildRunEvent(
  dayPlan: DayPlan,
  fuelingPreferences: FuelingPreferences,
): CalendarExportEvent | undefined {
  const run = dayPlan.plannedRun

  if (!run) {
    return undefined
  }

  const scheduleBlock = getScheduleBlock(dayPlan, run.type === 'race' ? 'race' : 'run')
  const startTime = scheduleBlock?.startTime ?? run.startTime ?? getRunFallbackStartTime(dayPlan, run)
  const endTime =
    scheduleBlock?.endTime ?? addMinutesToTime(startTime, getRunDurationMinutes(run))
  const isRace = run.type === 'race'
  const prefix = isRace ? 'Race' : run.type === 'long' ? 'Long run' : 'Run'

  return {
    id: `${isRace ? 'race' : 'run'}-${dayPlan.date}`,
    date: dayPlan.date,
    title: `${prefix}: ${run.plannedDistanceKm} km ${run.type.replaceAll('_', ' ')}`,
    description: buildRunDescription(dayPlan, run, fuelingPreferences),
    startTime,
    endTime,
    category: isRace ? 'race' : 'run',
  }
}

function buildBikeReplacementEvent(dayPlan: DayPlan): CalendarExportEvent | undefined {
  const adjustment = getDayAdjustmentInfo(dayPlan.date)

  if (adjustment?.proposalChangeType !== 'replace_with_bike') {
    return undefined
  }

  const isWeekday = weekdays.includes(dayPlan.dayOfWeek)
  const startTime = isWeekday ? '18:30' : '09:00'
  const durationMinutes = getBikeDurationMinutes(adjustment.originalDistanceKm)

  return {
    id: `bike-adjusted-${dayPlan.date}`,
    date: dayPlan.date,
    title: `Bike: ${adjustment.adjustedTitle}`,
    description: [
      dayPlan.summary,
      adjustment.adjustedSummary,
      `Adjusted plan: ${adjustment.reason}`,
      ...adjustment.warnings,
    ].join('\n'),
    startTime,
    endTime: addMinutesToTime(startTime, durationMinutes),
    category: 'recovery',
  }
}

function buildStrengthEvents(dayPlan: DayPlan): CalendarExportEvent[] {
  const sessions = getStrengthSessionsByIds(dayPlan.strengthSessionIds)
  const adjustment = getDayAdjustmentInfo(dayPlan.date)
  const scheduleBlocks = getEffectiveScheduleBlocks(dayPlan)

  return sessions.map((session) => {
    const scheduleBlock = scheduleBlocks.find(
      (block) => block.category === 'strength' && block.relatedPlanId === session.id,
    )
    const startTime =
      scheduleBlock?.startTime ?? session.startTime ?? (weekdays.includes(dayPlan.dayOfWeek) ? '06:45' : '10:00')
    const endTime =
      scheduleBlock?.endTime ?? addMinutesToTime(startTime, session.estimatedDurationMinutes)
    const isPrehab = session.title.toLowerCase().includes('prehab') || session.shortTitle.toLowerCase().includes('mini')

    return {
      id: `strength-${session.id}-${dayPlan.date}`,
      date: dayPlan.date,
      title: `${isPrehab ? 'Prehab' : 'Strength'}: ${session.shortTitle}`,
      description: buildStrengthDescription(session, adjustment?.strengthAdjustment),
      startTime,
      endTime,
      category: 'strength' as CalendarEventCategory,
    }
  })
}

function buildFuelEvents(
  dayPlan: DayPlan,
  fuelingPreferences: FuelingPreferences,
): CalendarExportEvent[] {
  const run = dayPlan.plannedRun

  if (!run) {
    return []
  }

  const events: CalendarExportEvent[] = []
  const fuelingRecommendation = getFuelingRecommendationForDay(dayPlan, fuelingPreferences)
  const runStartTime = getScheduleBlock(dayPlan, run.type === 'race' ? 'race' : 'run')?.startTime ?? run.startTime ?? getRunFallbackStartTime(dayPlan, run)
  const preRunMeal = dayPlan.mealPlan.meals.find((meal) =>
    meal.label.toLowerCase().includes('pre-run') || meal.label.toLowerCase().includes('pre-run fuel'),
  )

  if (preRunMeal) {
    events.push({
      id: `fuel-pre-run-${dayPlan.date}`,
      date: dayPlan.date,
      title: 'Fuel: pre-run snack',
      description: `${preRunMeal.description}\nPurpose: ${preRunMeal.purpose}`,
      startTime: preRunMeal.time,
      endTime: addMinutesToTime(preRunMeal.time, 15),
      category: 'meal',
    })
  }

  const preRunMaurten = fuelingRecommendation.preRun.find((item) =>
    item.productName.toLowerCase().includes('maurten') ||
    item.productName.toLowerCase().includes('gel') ||
    item.productName.toLowerCase().includes('drink mix'),
  )

  if (preRunMaurten) {
    events.push({
      id: `fuel-maurten-pre-run-${dayPlan.date}`,
      date: dayPlan.date,
      title: `Fuel: ${preRunMaurten.productName}`,
      description: `${preRunMaurten.instruction}\nTiming: ${preRunMaurten.timing}`,
      startTime: addMinutesToTime(runStartTime, -15),
      endTime: runStartTime,
      category: 'meal',
    })
  }

  if (fuelingRecommendation.duringRun.length) {
    events.push({
      id: `fuel-during-run-${dayPlan.date}`,
      date: dayPlan.date,
      title: `Fuel: ${formatFuelingItems(fuelingRecommendation.duringRun)}`,
      description: [
        fuelingRecommendation.summary,
        `Timing: ${fuelingRecommendation.duringRun.map((item) => `${item.productName} - ${item.timing}`).join(' | ')}`,
        `Total: ${fuelingRecommendation.totalRecommendedCarbs ?? 0} g carbs`,
        ...fuelingRecommendation.practiceNotes,
        ...fuelingRecommendation.warnings,
      ].join('\n'),
      startTime: runStartTime,
      endTime: addMinutesToTime(runStartTime, 20),
      category: 'meal',
    })
  }

  if (hardRunTypes.includes(run.type) || run.type === 'long') {
    const runEndTime = addMinutesToTime(runStartTime, getRunDurationMinutes(run))
    events.push({
      id: `fuel-recovery-${dayPlan.date}`,
      date: dayPlan.date,
      title: 'Recovery: carbs + protein',
      description: 'Take an easy recovery option if dinner is delayed: chocolate milk, yoghurt with granola, protein shake plus fruit, or a sandwich.',
      startTime: addMinutesToTime(runEndTime, 10),
      endTime: addMinutesToTime(runEndTime, 30),
      category: 'meal',
    })
  }

  return events
}

function buildRecoveryReminder(dayPlan: DayPlan): CalendarExportEvent | undefined {
  const run = dayPlan.plannedRun
  const adjustment = getDayAdjustmentInfo(dayPlan.date)
  const specialEvents = specialEventsForDate(dayPlan.date)
  const shouldRemind =
    adjustment ||
    specialEvents.some((event) => event.category === 'festival' || event.alcoholRisk === 'high') ||
    (run && (run.type === 'long' || hardRunTypes.includes(run.type)))

  if (!shouldRemind) {
    return undefined
  }

  return {
    id: `recovery-reminder-${dayPlan.date}`,
    date: dayPlan.date,
    title: 'Recovery: check legs and hydration',
    description: [
      'Check Achilles/calf response, hydration, and sleep setup.',
      adjustment ? `Adjusted plan: ${adjustment.reason}` : undefined,
      ...specialEvents.map((event) => `${event.title}: ${event.trainingImpact}`),
    ]
      .filter((line) => line !== undefined)
      .join('\n'),
    startTime: '21:00',
    endTime: '21:15',
    category: 'recovery',
  }
}

function buildSpecialEventExports(settings: CalendarExportSettings): CalendarExportEvent[] {
  return specialEvents
    .filter((event) => event.endDate >= settings.startDate && event.startDate <= settings.endDate)
    .filter((event) => event.category !== 'recovery')
    .filter((event) => !(event.category === 'race' && settings.includeRace))
    .map((event) => ({
      id: `special-${event.id}`,
      date: event.startDate,
      title: getSpecialEventTitle(event),
      description: [
        event.trainingImpact,
        event.alcoholRisk ? `Alcohol risk: ${event.alcoholRisk}` : undefined,
      ]
        .filter((line) => line !== undefined)
        .join('\n'),
      startTime: '',
      endTime: event.endDate,
      category: 'special' as CalendarEventCategory,
      allDay: true,
    }))
}

function buildRunDescription(
  dayPlan: DayPlan,
  run: RunWorkout,
  fuelingPreferences: FuelingPreferences,
) {
  const adjustment = getDayAdjustmentInfo(dayPlan.date)
  const fuelingRecommendation = getFuelingRecommendationForDay(dayPlan, fuelingPreferences)
  const pace = run.targetPace
    ? `Target pace: ${run.targetPace.minPerKmFrom}-${run.targetPace.minPerKmTo}/km (${run.targetPace.description})`
    : undefined
  const intervals = run.intervals?.length
    ? `Intervals: ${run.intervals.map(formatInterval).join('; ')}`
    : undefined

  return [
    `${dayPlan.date} - ${dayPlan.phase} phase`,
    dayPlan.summary,
    `Distance: ${run.plannedDistanceKm} km`,
    `Run type: ${run.type}`,
    pace,
    run.targetHrZone ? `HR zone: ${run.targetHrZone}` : undefined,
    run.targetHrDescription ? `HR: ${run.targetHrDescription}` : undefined,
    intervals,
    run.instructions.length ? `Instructions: ${run.instructions.join(' | ')}` : undefined,
    run.fuelNotes?.length ? `Fuel: ${run.fuelNotes.join(' | ')}` : undefined,
    `Maurten fuelling: ${formatFuelingSummary(fuelingRecommendation)}`,
    fuelingRecommendation.preRun.length
      ? `Pre-run fuel: ${fuelingRecommendation.preRun.map((item) => `${item.productName} (${item.timing})`).join(' | ')}`
      : undefined,
    fuelingRecommendation.duringRun.length
      ? `During-run fuel: ${fuelingRecommendation.duringRun.map((item) => `${item.quantity} x ${item.productName} (${item.timing})`).join(' | ')}`
      : undefined,
    fuelingRecommendation.targetCarbsPerHour
      ? `Fuel target: ${fuelingRecommendation.targetCarbsPerHour} g carbs/hour`
      : undefined,
    fuelingRecommendation.hydrationNotes.length
      ? `Hydration: ${fuelingRecommendation.hydrationNotes.join(' | ')}`
      : undefined,
    fuelingRecommendation.practiceNotes.length
      ? `Fuel practice: ${fuelingRecommendation.practiceNotes.join(' | ')}`
      : undefined,
    fuelingRecommendation.warnings.length
      ? `Fuel warnings: ${fuelingRecommendation.warnings.join(' | ')}`
      : undefined,
    run.recoveryNotes?.length ? `Recovery: ${run.recoveryNotes.join(' | ')}` : undefined,
    adjustment ? `Adjusted plan: ${adjustment.reason}` : undefined,
    adjustment?.warnings.length ? `Warnings: ${adjustment.warnings.join(' | ')}` : undefined,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

function buildStrengthDescription(session: StrengthSession, strengthAdjustment: string | undefined) {
  return [
    session.title,
    `Focus: ${session.focus}`,
    `Duration: ${session.estimatedDurationMinutes} minutes`,
    `Main exercises: ${session.exercises
      .slice(0, 6)
      .map((exercise) => `${exercise.name} (${exercise.sets} x ${exercise.reps})`)
      .join(' | ')}`,
    session.progressionNotes?.length
      ? `Progression: ${session.progressionNotes.join(' | ')}`
      : undefined,
    strengthAdjustment ? `Adjusted strength: ${strengthAdjustment}` : undefined,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
}

function getRunFallbackStartTime(dayPlan: DayPlan, run: RunWorkout) {
  if (run.type === 'race') {
    return run.startTime ?? '09:00'
  }

  return run.startTime ?? (weekdays.includes(dayPlan.dayOfWeek) ? '18:30' : '09:00')
}

function getRunDurationMinutes(run: RunWorkout) {
  if (run.estimatedDurationMinutes) {
    return run.estimatedDurationMinutes
  }

  if (run.type === 'race') {
    return 180
  }

  if (run.type === 'long') {
    return Math.round(run.plannedDistanceKm * 5)
  }

  if (hardRunTypes.includes(run.type)) {
    return Math.round(run.plannedDistanceKm * 4.75)
  }

  return Math.round(run.plannedDistanceKm * 5.25)
}

function getBikeDurationMinutes(originalDistanceKm: number | undefined) {
  if (originalDistanceKm === undefined || originalDistanceKm <= 8) {
    return 60
  }

  if (originalDistanceKm <= 16) {
    return 90
  }

  return 120
}

function getScheduleBlock(dayPlan: DayPlan, category: 'run' | 'race') {
  return getEffectiveScheduleBlocks(dayPlan).find((block) => block.category === category)
}

function getEffectiveScheduleBlocks(dayPlan: DayPlan): DailyScheduleBlock[] {
  const generatedBlocks = getDailyScheduleBlocks(dayPlan)
  const overrides = getScheduleOverridesForDate(dayPlan.date)
  const generatedWithOverrides = generatedBlocks.map((block) =>
    applyScheduleOverride(block, getOverrideForBlock(block, overrides)),
  )

  return sortBlocksByTime(generatedWithOverrides)
}

function applyScheduleOverride(
  block: DailyScheduleBlock,
  override: ScheduleBlockOverride | undefined,
): DailyScheduleBlock {
  if (!override) {
    return block
  }

  return {
    ...block,
    title: override.title ?? block.title,
    startTime: override.startTime ?? block.startTime,
    endTime: override.endTime ?? block.endTime,
    description: override.description ?? block.description,
    category: override.category ?? block.category,
    completed: override.completed ?? block.completed,
  }
}

function getOverrideForBlock(
  block: DailyScheduleBlock,
  overrides: DailyScheduleOverrides | undefined,
) {
  if (!overrides) {
    return undefined
  }

  return (
    overrides.blockOverrides[block.id] ??
    block.legacyIds
      ?.map((legacyId) => overrides.blockOverrides[legacyId])
      .find((override) => override !== undefined)
  )
}

function formatInterval(interval: WorkoutInterval) {
  const repTarget = interval.distanceKm
    ? `${interval.distanceKm} km`
    : `${interval.durationMinutes ?? 0} min`
  const pace = interval.targetPace
    ? ` at ${interval.targetPace.minPerKmFrom}-${interval.targetPace.minPerKmTo}/km`
    : ''
  const recovery = interval.recoveryDistanceKm
    ? `, ${interval.recoveryDistanceKm} km easy recovery`
    : interval.recoveryDurationMinutes
      ? `, ${interval.recoveryDurationMinutes} min easy recovery`
      : ''

  return `${interval.repetitions} x ${repTarget}${pace}${recovery}`
}

function specialEventsForDate(date: string) {
  return specialEvents.filter((event) => event.startDate <= date && event.endDate >= date)
}

function getSpecialEventTitle(event: SpecialEvent) {
  if (event.category === 'festival') {
    return `${event.title} - no running planned`
  }

  if (event.category === 'birthday') {
    return 'Birthday / social weekend'
  }

  return event.title
}

function dedupeEvents(events: CalendarExportEvent[]) {
  const seenIds = new Set<string>()
  return events.filter((event) => {
    if (seenIds.has(event.id)) {
      return false
    }

    seenIds.add(event.id)
    return true
  })
}

function sortCalendarEvents(events: CalendarExportEvent[]) {
  return [...events].sort((first, second) => {
    const dateDiff = first.date.localeCompare(second.date)

    if (dateDiff !== 0) {
      return dateDiff
    }

    return first.startTime.localeCompare(second.startTime)
  })
}
