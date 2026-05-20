/// <reference types="node" />

import process from 'node:process'
import { specialEvents } from '../data/specialEvents'
import { strengthSessions, strengthSessionsById } from '../data/strengthSessions'
import { trainingPlanStartDate, trainingPlanEndDate } from '../data/trainingPlan'
import { addDays } from '../utils/dateUtils'
import {
  getAllWeekPlans,
  getDayPlan,
  getFullTrainingPlan,
  getPlanStats,
  getWeeklyRunCount,
  getWeeklyPlannedKm,
} from '../utils/trainingPlanUtils'
import type { DayPlan, ISODateString, RunType, TimeString } from '../types/training'

const errors: string[] = []

const hardRunTypes: RunType[] = ['threshold', 'interval', 'marathon_pace', 'progression', 'race']
const firstWeekForbiddenRunTypes: RunType[] = ['threshold', 'interval', 'marathon_pace', 'race']
const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function assertCondition(condition: boolean, message: string) {
  if (!condition) {
    errors.push(message)
  }
}

function minutesFromTime(time?: TimeString) {
  if (!time) {
    return undefined
  }

  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function hasMealLabel(day: DayPlan, matcher: (label: string, time: string) => boolean) {
  return day.mealPlan.meals.some((meal) =>
    matcher(meal.label.toLowerCase(), meal.time.toLowerCase()),
  )
}

function validatePlanRange() {
  const plan = getFullTrainingPlan()
  const stats = getPlanStats()

  assertCondition(stats.startDate === trainingPlanStartDate, 'Plan must start on 2026-06-01.')
  assertCondition(stats.endDate === trainingPlanEndDate, 'Plan must end on 2026-10-18.')
  assertCondition(stats.totalDays === 140, `Plan must have exactly 140 days; found ${stats.totalDays}.`)

  const uniqueDates = new Set(plan.map((day) => day.date))
  assertCondition(uniqueDates.size === plan.length, 'Plan dates must be unique.')

  for (let index = 1; index < plan.length; index += 1) {
    const expectedDate = addDays(plan[index - 1].date, 1)
    assertCondition(
      plan[index].date === expectedDate,
      `Plan has a date gap: expected ${expectedDate}, found ${plan[index].date}.`,
    )
  }
}

function validateMeals() {
  for (const day of getFullTrainingPlan()) {
    assertCondition(Boolean(day.mealPlan), `${day.date} must have a meal plan.`)

    const containsBreakfast = day.mealPlan.meals.some((meal) => {
      const text = `${meal.label} ${meal.description}`.toLowerCase()
      return text.includes('breakfast')
    })

    assertCondition(!containsBreakfast, `${day.date} meal plan must not include breakfast.`)
    assertCondition(
      hasMealLabel(day, (label, time) => time === '10:30' && label.includes('snack')),
      `${day.date} meal plan must include a 10:30 snack.`,
    )
    assertCondition(
      hasMealLabel(day, (label) => label.includes('lunch')),
      `${day.date} meal plan must include lunch.`,
    )
    assertCondition(
      hasMealLabel(day, (label, time) => label.includes('dinner') && time.startsWith('20:')),
      `${day.date} meal plan must include dinner around 20:00.`,
    )
  }
}

function validateSpecialDates() {
  const firstWeek = getAllWeekPlans()[0]
  assertCondition(getWeeklyRunCount(1) === 4, `First week must have exactly 4 planned runs.`)
  assertCondition(
    firstWeek.days.every(
      (day) => !day.plannedRun || !firstWeekForbiddenRunTypes.includes(day.plannedRun.type),
    ),
    'First week must not include threshold, interval, marathon-pace, or race workouts.',
  )

  for (const date of ['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19']) {
    const day = getRequiredDay(date)
    assertCondition(
      day.specialEventIds?.includes('july_festival') ?? false,
      `${date} must include the July festival special event.`,
    )
    assertCondition(
      !day.plannedRun || !hardRunTypes.includes(day.plannedRun.type),
      `${date} must not have hard running during July festival.`,
    )
  }

  assertCondition(!getRequiredDay('2026-07-17').plannedRun, '2026-07-17 must be rest during July festival.')
  assertCondition(!getRequiredDay('2026-07-18').plannedRun, '2026-07-18 must be rest during July festival.')

  const augustFestival = getRequiredDay('2026-08-01')
  assertCondition(
    !augustFestival.plannedRun || augustFestival.plannedRun.type === 'recovery',
    '2026-08-01 must be rest or recovery shakeout only.',
  )
  assertCondition(
    augustFestival.specialEventIds?.includes('august_festival') ?? false,
    '2026-08-01 must include the August festival special event.',
  )

  for (const date of ['2026-10-03', '2026-10-04']) {
    const day = getRequiredDay(date)
    assertCondition(
      day.specialEventIds?.includes('october_wedding') ?? false,
      `${date} must include the wedding special event.`,
    )
  }

  const raceDay = getRequiredDay('2026-10-18')
  assertCondition(raceDay.plannedRun?.type === 'race', '2026-10-18 must have a race workout.')
  assertCondition(
    raceDay.plannedRun?.plannedDistanceKm === 42.2,
    '2026-10-18 race workout must be 42.2 km.',
  )
}

function validateRunAndStrengthTiming() {
  for (const day of getFullTrainingPlan()) {
    if (day.plannedRun && weekdayNames.includes(day.dayOfWeek)) {
      const startMinutes = minutesFromTime(day.plannedRun.startTime)
      assertCondition(
        startMinutes !== undefined && startMinutes > 18 * 60,
        `${day.date} weekday run should generally start after 18:00; found ${day.plannedRun.startTime ?? 'missing'}.`,
      )
    }

    for (const strengthSessionId of day.strengthSessionIds ?? []) {
      const session = strengthSessionsById[strengthSessionId]
      assertCondition(Boolean(session), `${day.date} references missing strength session ${strengthSessionId}.`)

      if (session && weekdayNames.includes(day.dayOfWeek)) {
        const startMinutes = minutesFromTime(session.startTime)
        assertCondition(
          startMinutes !== undefined && startMinutes < 8 * 60 + 15,
          `${day.date} weekday strength session ${strengthSessionId} should start before 08:15; found ${session.startTime ?? 'missing'}.`,
        )
      }
    }
  }

  for (const session of strengthSessions) {
    assertCondition(session.exercises.length > 0, `${session.id} must include exercises.`)
  }
}

function validatePlanShape() {
  const weeks = getAllWeekPlans()
  const stats = getPlanStats()

  assertCondition(weeks.length === 20, `Total weeks should equal 20; found ${weeks.length}.`)
  assertCondition(
    weeks.every((week) => week.days.length === 7),
    'Every week must contain exactly 7 days.',
  )
  assertCondition(
    stats.peakWeekKm === 116,
    `Peak weekly mileage should equal 116 km; found ${stats.peakWeekKm} km in week ${stats.peakWeekNumber}.`,
  )
}

function validateRevisedMileage() {
  const expectedWeeklyKm: Record<number, number> = {
    1: 30,
    2: 80,
    3: 86,
    4: 92,
    5: 76,
    6: 98,
    7: 32,
    8: 74,
    9: 82,
    10: 105,
    11: 110,
    12: 88,
    13: 112,
    14: 116,
    15: 116,
    16: 82,
    17: 115,
    18: 65,
    19: 76,
    20: 71.2,
  }

  for (const [weekNumberText, expectedKm] of Object.entries(expectedWeeklyKm)) {
    const weekNumber = Number(weekNumberText)
    const actualKm = getWeeklyPlannedKm(weekNumber)
    const week = getAllWeekPlans().find((candidate) => candidate.weekNumber === weekNumber)

    assertCondition(
      Math.abs(actualKm - expectedKm) < 0.01,
      `Week ${weekNumber} planned mileage should be ${expectedKm} km; found ${actualKm} km.`,
    )
    assertCondition(
      week?.targetMileageKm === expectedKm,
      `Week ${weekNumber} target mileage should be ${expectedKm} km; found ${week?.targetMileageKm ?? 'missing'}.`,
    )
  }
}

function validateLongRunProgression() {
  const expectedLongRuns: Record<number, number> = {
    1: 8,
    2: 22,
    3: 24,
    4: 25,
    5: 21,
    6: 26,
    7: 6,
    8: 22,
    9: 24,
    10: 30,
    11: 32,
    12: 25,
    13: 34,
    14: 36,
    15: 35,
    16: 21,
    17: 38,
    18: 12,
    19: 20,
    20: 42.2,
  }

  for (const [weekNumberText, expectedKm] of Object.entries(expectedLongRuns)) {
    const weekNumber = Number(weekNumberText)
    const week = getAllWeekPlans().find((candidate) => candidate.weekNumber === weekNumber)
    const sundayRun = week?.days.find((day) => day.dayOfWeek === 'Sunday')?.plannedRun
    const longRunKm = sundayRun?.plannedDistanceKm ?? 0

    assertCondition(
      Math.abs(longRunKm - expectedKm) < 0.01,
      `Week ${weekNumber} long-run progression should be ${expectedKm} km; found ${longRunKm} km.`,
    )
  }

  const week17Sunday = getRequiredDay('2026-09-27')
  assertCondition(
    week17Sunday.plannedRun?.plannedDistanceKm === 38,
    'Week 17 Sunday must be the 38 km marathon simulation.',
  )
}

function validateStrengthTaper() {
  for (const day of getFullTrainingPlan()) {
    if (day.date >= '2026-09-28') {
      for (const sessionId of day.strengthSessionIds ?? []) {
        assertCondition(
          sessionId !== 'gym_a_lower_body_calves' && sessionId !== 'gym_b_posterior_chain_core',
          `${day.date} must not schedule heavy Strength A/B after 2026-09-28.`,
        )
      }
    }
  }
}

function validateTuesdayQualityDistances() {
  for (const day of getFullTrainingPlan()) {
    if (day.dayOfWeek === 'Tuesday' && day.plannedRun && hardRunTypes.includes(day.plannedRun.type)) {
      assertCondition(
        day.plannedRun.plannedDistanceKm > 0,
        `${day.date} Tuesday quality session must include a total distance.`,
      )
    }
  }
}

function validateFestivalRecovery() {
  const festivalEvents = specialEvents.filter((event) =>
    ['july_festival', 'august_festival'].includes(event.id),
  )

  for (const event of festivalEvents) {
    for (let daysAfter = 1; daysAfter <= 2; daysAfter += 1) {
      const date = addDays(event.endDate, daysAfter)
      const day = getDayPlan(date)

      if (day?.plannedRun) {
        assertCondition(
          !hardRunTypes.includes(day.plannedRun.type),
          `${date} must not have a hard workout immediately after ${event.id}.`,
        )
      }
    }
  }
}

function getRequiredDay(date: ISODateString) {
  const day = getDayPlan(date)
  assertCondition(Boolean(day), `${date} must exist in the training plan.`)

  if (!day) {
    throw new Error(`${date} missing from plan.`)
  }

  return day
}

validatePlanRange()
validateMeals()
validateSpecialDates()
validateRunAndStrengthTiming()
validatePlanShape()
validateRevisedMileage()
validateLongRunProgression()
validateStrengthTaper()
validateTuesdayQualityDistances()
validateFestivalRecovery()

if (errors.length > 0) {
  console.error('Training plan validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
} else {
  console.log('Training plan validation passed.')
}
