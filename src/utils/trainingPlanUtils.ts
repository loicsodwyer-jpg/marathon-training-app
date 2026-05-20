import { specialEvents } from '../data/specialEvents'
import { trainingPlan, weekPlans } from '../data/trainingPlan'
import { isDateBetween } from './dateUtils'
import type { DayPlan, ISODateString, SpecialEvent, TrainingPlanStats, WeekPlan } from '../types/training'

function roundKm(value: number) {
  return Math.round(value * 10) / 10
}

export function getFullTrainingPlan(): DayPlan[] {
  return trainingPlan
}

export function getDayPlan(dateString: ISODateString): DayPlan | undefined {
  return trainingPlan.find((day) => day.date === dateString)
}

export function getWeekPlanByDate(dateString: ISODateString): WeekPlan | undefined {
  const dayPlan = getDayPlan(dateString)
  return dayPlan ? getWeekPlanByNumber(dayPlan.weekNumber) : undefined
}

export function getWeekPlanByNumber(weekNumber: number): WeekPlan | undefined {
  return weekPlans.find((week) => week.weekNumber === weekNumber)
}

export function getAllWeekPlans(): WeekPlan[] {
  return weekPlans
}

export function getSpecialEventsForDate(dateString: ISODateString): SpecialEvent[] {
  return specialEvents.filter((event) => isDateBetween(dateString, event.startDate, event.endDate))
}

export function getWeeklyPlannedKm(weekNumber: number): number {
  const week = getWeekPlanByNumber(weekNumber)

  if (!week) {
    return 0
  }

  return roundKm(
    week.days.reduce((total, day) => total + (day.plannedRun?.plannedDistanceKm ?? 0), 0),
  )
}

export function getWeeklyRunCount(weekNumber: number): number {
  const week = getWeekPlanByNumber(weekNumber)
  return week?.days.filter((day) => day.plannedRun).length ?? 0
}

export function getKeyWorkouts(): DayPlan[] {
  const keyRunTypes = ['threshold', 'interval', 'marathon_pace', 'progression', 'race']
  return trainingPlan.filter(
    (day) => day.plannedRun && keyRunTypes.includes(day.plannedRun.type),
  )
}

export function getLongRuns(): DayPlan[] {
  return trainingPlan.filter((day) => {
    if (!day.plannedRun) {
      return false
    }

    return (
      day.plannedRun.type === 'long' ||
      (day.dayOfWeek === 'Sunday' && day.plannedRun.plannedDistanceKm >= 16) ||
      day.title.toLowerCase().includes('long')
    )
  })
}

export function getRaceDay(): DayPlan | undefined {
  return trainingPlan.find((day) => day.plannedRun?.type === 'race')
}

export function getPlanStats(): TrainingPlanStats {
  const weeklyKm = weekPlans.map((week) => ({
    weekNumber: week.weekNumber,
    km: getWeeklyPlannedKm(week.weekNumber),
  }))
  const peakWeek = weeklyKm.reduce(
    (peak, week) => (week.km > peak.km ? week : peak),
    weeklyKm[0],
  )

  return {
    startDate: trainingPlan[0]?.date ?? '',
    endDate: trainingPlan[trainingPlan.length - 1]?.date ?? '',
    totalDays: trainingPlan.length,
    totalWeeks: weekPlans.length,
    totalPlannedKm: roundKm(
      trainingPlan.reduce((total, day) => total + (day.plannedRun?.plannedDistanceKm ?? 0), 0),
    ),
    peakWeekKm: peakWeek?.km ?? 0,
    peakWeekNumber: peakWeek?.weekNumber ?? 0,
    numberOfRuns: trainingPlan.filter((day) => day.plannedRun).length,
    numberOfStrengthSessions: trainingPlan.reduce(
      (total, day) => total + (day.strengthSessionIds?.length ?? 0),
      0,
    ),
    numberOfRestDays: trainingPlan.filter((day) => !day.plannedRun).length,
  }
}
