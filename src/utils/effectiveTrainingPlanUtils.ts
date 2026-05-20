import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import type {
  DayPlan,
  DayType,
  IntensityLevel,
  RunType,
  RunWorkout,
  TrainingPlanStats,
  WeekPlan,
} from '../types/training'
import type { DayPlanOverride } from '../types/planOverride'
import { getAllActiveDayOverrides, getPlanOverrideForDate } from './planOverrideStorage'
import {
  getAllWeekPlans,
  getDayPlan,
  getFullTrainingPlan,
  getWeekPlanByDate,
  getWeekPlanByNumber,
} from './trainingPlanUtils'

const dayTypes: DayType[] = ['run', 'strength', 'run_strength', 'rest', 'social', 'race', 'travel', 'recovery']
const intensityLevels: IntensityLevel[] = ['rest', 'low', 'moderate', 'high', 'race']
const runTypes: RunType[] = [
  'recovery',
  'easy',
  'steady',
  'medium_long',
  'long',
  'threshold',
  'interval',
  'marathon_pace',
  'progression',
  'race',
  'rest',
]

function roundKm(value: number) {
  return Math.round(value * 10) / 10
}

export function getEffectiveDayPlan(date: string): DayPlan | undefined {
  const dayPlan = getDayPlan(date)
  const override = getPlanOverrideForDate(date)

  if (!dayPlan || !override) {
    return dayPlan
  }

  return applyDayOverrideToDayPlan(dayPlan, override)
}

export function getEffectiveFullTrainingPlan(): DayPlan[] {
  return getFullTrainingPlan().map((dayPlan) => {
    const override = getPlanOverrideForDate(dayPlan.date)
    return override ? applyDayOverrideToDayPlan(dayPlan, override) : dayPlan
  })
}

export function getEffectiveWeekPlanByDate(date: string): WeekPlan | undefined {
  const originalWeek = getWeekPlanByDate(date)
  return originalWeek ? applyOverridesToWeek(originalWeek) : undefined
}

export function getEffectiveWeekPlanByNumber(weekNumber: number): WeekPlan | undefined {
  const originalWeek = getWeekPlanByNumber(weekNumber)
  return originalWeek ? applyOverridesToWeek(originalWeek) : undefined
}

export function getEffectiveWeekPlans(): WeekPlan[] {
  return getAllWeekPlans().map(applyOverridesToWeek)
}

export function getEffectivePlanStats(): TrainingPlanStats {
  const fullPlan = getEffectiveFullTrainingPlan()
  const weekPlans = getEffectiveWeekPlans()
  const weeklyKm = weekPlans.map((week) => ({
    weekNumber: week.weekNumber,
    km: roundKm(
      week.days.reduce((total, day) => total + (day.plannedRun?.plannedDistanceKm ?? 0), 0),
    ),
  }))
  const peakWeek = weeklyKm.reduce(
    (peak, week) => (week.km > peak.km ? week : peak),
    weeklyKm[0],
  )

  return {
    startDate: trainingPlanStartDate,
    endDate: trainingPlanEndDate,
    totalDays: fullPlan.length,
    totalWeeks: weekPlans.length,
    totalPlannedKm: roundKm(
      fullPlan.reduce((total, day) => total + (day.plannedRun?.plannedDistanceKm ?? 0), 0),
    ),
    peakWeekKm: peakWeek?.km ?? 0,
    peakWeekNumber: peakWeek?.weekNumber ?? 0,
    numberOfRuns: fullPlan.filter((day) => day.plannedRun).length,
    numberOfStrengthSessions: fullPlan.reduce(
      (total, day) => total + (day.strengthSessionIds?.length ?? 0),
      0,
    ),
    numberOfRestDays: fullPlan.filter((day) => !day.plannedRun).length,
  }
}

export function applyDayOverrideToDayPlan(
  dayPlan: DayPlan,
  override: DayPlanOverride,
): DayPlan {
  const adjustedRun = getAdjustedRun(dayPlan, override)
  const notes = [
    ...dayPlan.notes,
    'Adjusted plan.',
    override.reason,
    ...override.warnings,
    ...(override.strengthAdjustment ? [`Strength: ${override.strengthAdjustment}`] : []),
    ...(override.nutritionNote ? [`Nutrition: ${override.nutritionNote}`] : []),
  ]

  return {
    ...dayPlan,
    title: override.adjustedTitle || dayPlan.title,
    summary: override.adjustedSummary || dayPlan.summary,
    dayType: getValidDayType(override.adjustedDayType) ?? inferDayType(dayPlan, override, adjustedRun),
    intensity:
      getValidIntensity(override.adjustedIntensity) ?? inferIntensity(dayPlan, override, adjustedRun),
    plannedRun: adjustedRun,
    strengthSessionIds: getAdjustedStrengthSessionIds(dayPlan, override),
    notes: Array.from(new Set(notes)),
  }
}

export function isDayAdjusted(date: string): boolean {
  return Boolean(getDayAdjustmentInfo(date))
}

export function getDayAdjustmentInfo(date: string): DayPlanOverride | undefined {
  return getPlanOverrideForDate(date)
}

export function getActivePlanAdjustmentCount(): number {
  return new Set(Object.values(getAllActiveDayOverrides()).map((override) => override.adjustmentId)).size
}

function applyOverridesToWeek(week: WeekPlan): WeekPlan {
  const days = week.days.map((dayPlan) => {
    const override = getPlanOverrideForDate(dayPlan.date)
    return override ? applyDayOverrideToDayPlan(dayPlan, override) : dayPlan
  })

  return {
    ...week,
    days,
    targetMileageKm: roundKm(
      days.reduce((total, day) => total + (day.plannedRun?.plannedDistanceKm ?? 0), 0),
    ),
  }
}

function getAdjustedRun(dayPlan: DayPlan, override: DayPlanOverride): RunWorkout | undefined {
  if (override.removeRun) {
    return undefined
  }

  if (!override.adjustedRun) {
    return dayPlan.plannedRun
  }

  if (override.adjustedRun.replacementType !== 'run') {
    return undefined
  }

  const runType = getValidRunType(override.adjustedRun.type) ?? 'easy'

  return {
    id: override.adjustedRun.id,
    type: runType,
    title: override.adjustedRun.title,
    startTime: override.adjustedRun.startTime ?? dayPlan.plannedRun?.startTime,
    plannedDistanceKm: override.adjustedRun.plannedDistanceKm,
    estimatedDurationMinutes: override.adjustedRun.estimatedDurationMinutes,
    targetHrDescription:
      override.adjustedRun.targetHrDescription ?? override.adjustedRun.targetPaceDescription,
    instructions: override.adjustedRun.instructions,
    fuelNotes: override.adjustedRun.fuelNotes,
    recoveryNotes: override.adjustedRun.recoveryNotes,
  }
}

function getAdjustedStrengthSessionIds(dayPlan: DayPlan, override: DayPlanOverride) {
  if (override.removeStrength) {
    return []
  }

  if (override.adjustedStrengthSessionIds) {
    return override.adjustedStrengthSessionIds
  }

  return dayPlan.strengthSessionIds
}

function inferDayType(
  dayPlan: DayPlan,
  override: DayPlanOverride,
  adjustedRun: RunWorkout | undefined,
): DayType {
  if (adjustedRun) {
    return dayPlan.strengthSessionIds?.length && !override.removeStrength ? 'run_strength' : 'run'
  }

  if (override.removeRun || override.proposalChangeType.includes('rest')) {
    return 'recovery'
  }

  return dayPlan.dayType
}

function inferIntensity(
  dayPlan: DayPlan,
  override: DayPlanOverride,
  adjustedRun: RunWorkout | undefined,
): IntensityLevel {
  if (!adjustedRun) {
    return override.proposalChangeType.includes('rest') ? 'rest' : 'low'
  }

  if (adjustedRun.type === 'race') {
    return 'race'
  }

  return adjustedRun.type === 'easy' || adjustedRun.type === 'recovery' ? 'low' : dayPlan.intensity
}

function getValidDayType(value: string | undefined): DayType | undefined {
  return value && dayTypes.includes(value as DayType) ? (value as DayType) : undefined
}

function getValidIntensity(value: string | undefined): IntensityLevel | undefined {
  return value && intensityLevels.includes(value as IntensityLevel)
    ? (value as IntensityLevel)
    : undefined
}

function getValidRunType(value: string | undefined): RunType | undefined {
  return value && runTypes.includes(value as RunType) ? (value as RunType) : undefined
}
