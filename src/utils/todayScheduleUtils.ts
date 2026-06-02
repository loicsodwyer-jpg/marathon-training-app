import { strengthSessionsById } from '../data/strengthSessions'
import type { DailyScheduleBlock, ScheduleBlockCategory } from '../types/schedule'
import type { FuelingPreferences } from '../types/fueling'
import type { DayPlan, RunWorkout, StrengthSession, TimeString, WorkoutInterval } from '../types/training'
import { formatFuelingSummary } from './fuelingFormatUtils'
import { getFuelingRecommendationForDay } from './fuelingRules'
import { loadFuelingPreferences } from './fuelingStorage'
import { addMinutesToTime, sortBlocksByTime, timeToMinutes } from './scheduleTimeUtils'
import { getStrengthSessionLoadLabel } from './strengthUtils'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function categoryIsMovable(category: ScheduleBlockCategory) {
  return [
    'wake',
    'commute',
    'work',
    'meal',
    'run',
    'strength',
    'recovery',
    'social',
    'race',
    'rest',
    'custom',
  ].includes(category)
}

function createPlannedBlock(
  block: Omit<
    DailyScheduleBlock,
    'date' | 'source' | 'isEditable' | 'isMovable' | 'originalStartTime' | 'originalEndTime'
  >,
  date: string,
): DailyScheduleBlock {
  return {
    ...block,
    date,
    source: 'planned',
    isEditable: true,
    isMovable: categoryIsMovable(block.category),
    originalStartTime: block.startTime,
    originalEndTime: block.endTime,
  }
}

function getMealDurationMinutes(label: string) {
  const normalizedLabel = label.toLowerCase()

  if (normalizedLabel.includes('lunch')) {
    return 45
  }

  if (normalizedLabel.includes('dinner')) {
    return 60
  }

  if (normalizedLabel.includes('recovery')) {
    return 20
  }

  return 15
}

function getRunDurationMinutes(dayPlan: DayPlan) {
  if (!dayPlan.plannedRun) {
    return 0
  }

  return (
    dayPlan.plannedRun.estimatedDurationMinutes ??
    Math.round(dayPlan.plannedRun.plannedDistanceKm * 5)
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

function getRunDescription(dayPlan: DayPlan, run: RunWorkout, preferences: FuelingPreferences) {
  const pace = run.targetPace
    ? `${run.targetPace.minPerKmFrom}-${run.targetPace.minPerKmTo}/km`
    : undefined
  const hr = run.targetHrDescription ?? run.targetHrZone
  const conciseParts = [
    `${run.plannedDistanceKm} km ${run.type.replaceAll('_', ' ')}`,
    pace,
    hr,
    run.instructions[0],
  ].filter(Boolean)

  const intervalSummary = run.intervals?.length
    ? ` Main set: ${run.intervals.map(formatInterval).join('; ')}.`
    : ''
  const warmup = run.warmupKm ? ` Warm-up: ${run.warmupKm} km.` : ''
  const cooldown = run.cooldownKm ? ` Cool-down: ${run.cooldownKm} km.` : ''
  const fuelingRecommendation = getFuelingRecommendationForDay(dayPlan, preferences)
  const fuel =
    fuelingRecommendation.category !== 'none'
      ? ` Fuel: ${formatFuelingSummary(fuelingRecommendation)}.`
      : run.fuelNotes?.[0]
        ? ` Fuel: ${run.fuelNotes[0]}`
        : ''

  return `${conciseParts.join(' - ')}.${warmup}${intervalSummary}${cooldown}${fuel}`
}

function getStrengthDescription(session: StrengthSession) {
  return [
    session.purpose ?? session.focus,
    `Duration: ${session.durationRange ?? `${session.estimatedDurationMinutes} min`}.`,
    session.intensity ? `Intensity: ${session.intensity}` : undefined,
    `Load: ${getStrengthSessionLoadLabel(session)}.`,
  ]
    .filter((line) => line !== undefined)
    .join(' ')
}

export function getDailyScheduleBlocks(
  dayPlan: DayPlan,
  preferences: FuelingPreferences = loadFuelingPreferences(),
): DailyScheduleBlock[] {
  const isWeekday = weekdays.includes(dayPlan.dayOfWeek)
  const blocks: DailyScheduleBlock[] = [
    createPlannedBlock(
      {
          id: `wake-${dayPlan.date}`,
          title: 'Wake up',
        startTime: '06:30',
        endTime: '07:00',
        category: 'wake',
        description: 'Easy start and readiness check.',
        legacyIds: ['wake'],
      },
      dayPlan.date,
    ),
  ]

  if (isWeekday) {
    blocks.push(
      createPlannedBlock(
        {
          id: `commute-am-${dayPlan.date}`,
          title: 'Commute to work',
          startTime: '08:15',
          endTime: '09:00',
          category: 'commute',
          legacyIds: ['commute-am'],
        },
        dayPlan.date,
      ),
      createPlannedBlock(
        {
          id: `work-${dayPlan.date}`,
          title: 'Work',
          startTime: '09:00',
          endTime: '18:00',
          category: 'work',
          legacyIds: ['work'],
        },
        dayPlan.date,
      ),
    )
  }

  for (const meal of dayPlan.mealPlan.meals) {
    const duration = getMealDurationMinutes(meal.label)
    const mealSlug = slugify(`${meal.time}-${meal.label}`)
    blocks.push(
      createPlannedBlock(
        {
          id: `meal-${mealSlug}-${dayPlan.date}`,
          title: meal.label,
            startTime: meal.time,
            endTime: addMinutesToTime(meal.time, duration),
            category: 'meal',
            description: `${meal.description} Purpose: ${meal.purpose}`,
            legacyIds: [`meal-${meal.time}-${meal.label}`],
          },
        dayPlan.date,
      ),
    )
  }

  for (const strengthSessionId of dayPlan.strengthSessionIds ?? []) {
    const session = strengthSessionsById[strengthSessionId]

    if (session) {
      const fallbackStartTime = isWeekday ? '06:45' : '10:00'
      const startTime = session.startTime ?? fallbackStartTime
      blocks.push(
        createPlannedBlock(
          {
            id: `strength-${session.id}-${dayPlan.date}`,
            title: session.shortTitle,
            startTime,
            endTime: addMinutesToTime(startTime, session.estimatedDurationMinutes),
            category: 'strength',
            description: getStrengthDescription(session),
            relatedPlanId: session.id,
            legacyIds: [`strength-${session.id}`],
          },
          dayPlan.date,
        ),
      )
    }
  }

  if (dayPlan.plannedRun) {
    const startTime = dayPlan.plannedRun.startTime ?? (isWeekday ? '18:30' : '09:00')
    const duration = getRunDurationMinutes(dayPlan)
    const isRace = dayPlan.plannedRun.type === 'race'

    blocks.push(
      createPlannedBlock(
        {
          id: `run-${dayPlan.date}`,
          title: dayPlan.plannedRun.title,
          startTime,
          endTime: addMinutesToTime(startTime, duration),
          category: isRace ? 'race' : 'run',
          description: getRunDescription(dayPlan, dayPlan.plannedRun, preferences),
          relatedPlanId: dayPlan.plannedRun.id,
          legacyIds: [`run-${dayPlan.plannedRun.id}`],
        },
        dayPlan.date,
      ),
    )

    if (!isRace) {
      const recoveryStart = addMinutesToTime(startTime, duration + 15)
      blocks.push(
        createPlannedBlock(
          {
            id: `recovery-post-run-${dayPlan.date}`,
            title: 'Post-run recovery',
            startTime: recoveryStart,
            endTime: addMinutesToTime(recoveryStart, 25),
            category: 'recovery',
            description: 'Food, fluids, shower, and Achilles check.',
            legacyIds: ['post-run-recovery'],
          },
          dayPlan.date,
        ),
      )
    }
  } else if (!dayPlan.strengthSessionIds?.length) {
    const isAdjustedDay = dayPlan.notes.includes('Adjusted plan.')
    blocks.push(
      createPlannedBlock(
        {
          id: `recovery-rest-${dayPlan.date}`,
          title: isAdjustedDay
            ? dayPlan.title
            : dayPlan.dayType === 'social'
              ? 'Protected no-run day'
              : 'Recovery routine',
          startTime: '20:45',
          endTime: '21:15',
          category: dayPlan.dayType === 'social' ? 'rest' : 'recovery',
          description: isAdjustedDay ? dayPlan.summary : 'Mobility, hydration, and sleep prep.',
          legacyIds: ['rest-recovery'],
        },
        dayPlan.date,
      ),
    )
  }

  return sortBlocksByTime(blocks)
}

export function getScheduleHour(block: Pick<DailyScheduleBlock, 'startTime'>) {
  return Math.floor(timeToMinutes(block.startTime as TimeString) / 60)
}
