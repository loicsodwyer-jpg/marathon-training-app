import type { MealTemplateId } from '../data/mealTemplates'
import type { DayPlan, MealItem, MealPlan, RunWorkout } from '../types/training'
import type { MealCategory } from '../types/nutrition'
import { formatFuelingItems } from './fuelingFormatUtils'
import { getFuelingRecommendationForRun } from './fuelingRules'

const hardRunTypes = ['threshold', 'interval', 'marathon_pace', 'progression', 'race']

export function getCarbFocusLabel(carbFocus: MealPlan['carbFocus']): string {
  const labels: Record<MealPlan['carbFocus'], string> = {
    low: 'Low carb focus',
    moderate: 'Moderate carbs',
    high: 'High carbs',
    very_high: 'Very high carbs',
  }

  return labels[carbFocus]
}

export function getCarbFocusDescription(carbFocus: MealPlan['carbFocus']): string {
  const descriptions: Record<MealPlan['carbFocus'], string> = {
    low: 'Keep meals balanced and recovery-focused without forcing extra carbohydrate.',
    moderate: 'Normal training-day carbs through snack, lunch, and dinner.',
    high: 'Prioritize carbohydrate before and after quality running.',
    very_high: 'Long-run or race-week fueling with deliberate carbs across the day.',
  }

  return descriptions[carbFocus]
}

export function getCarbFocusColor(carbFocus: MealPlan['carbFocus']): string {
  const classNames: Record<MealPlan['carbFocus'], string> = {
    low: 'border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-neutral-200',
    moderate:
      'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200',
    high: 'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-300/25 dark:bg-orange-300/10 dark:text-orange-200',
    very_high:
      'border-yellow-100 bg-yellow-50 text-yellow-700 dark:border-yellow-300/25 dark:bg-yellow-300/10 dark:text-yellow-200',
  }

  return classNames[carbFocus]
}

export function getMealCategory(meal: MealItem): MealCategory {
  const text = `${meal.label} ${meal.description} ${meal.purpose}`.toLowerCase()

  if (text.includes('pre-run')) {
    return 'pre_run'
  }

  if (text.includes('during-run') || text.includes('gel') || text.includes('drink mix')) {
    return 'fuel'
  }

  if (text.includes('recovery')) {
    return 'recovery'
  }

  if (text.includes('lunch')) {
    return 'lunch'
  }

  if (text.includes('dinner')) {
    return 'dinner'
  }

  return 'snack'
}

export function getMealIcon(meal: MealItem): MealCategory {
  return getMealCategory(meal)
}

export function getNutritionSummaryForDay(dayPlan: DayPlan): string {
  const carbLabel = getCarbFocusLabel(dayPlan.mealPlan.carbFocus)
  const run = dayPlan.plannedRun

  if (!run) {
    return `${carbLabel} - steady hydration and normal protein.`
  }

  if (run.type === 'race') {
    return `${carbLabel} - familiar race fuel and electrolytes.`
  }

  if (isLongRunNutritionDay(dayPlan)) {
    return `${carbLabel} - pre-run fuel, during-run carbs, and recovery meal.`
  }

  if (hardRunTypes.includes(run.type)) {
    return `${carbLabel} - pre-run snack plus recovery carbs/protein.`
  }

  if (shouldShowPreRunSnack(dayPlan)) {
    return `${carbLabel} - small pre-run snack if needed.`
  }

  return `${carbLabel} - normal meals support the easy run.`
}

export function getFuelingGuidanceForRun(plannedRun: RunWorkout | undefined): string[] {
  const recommendation = getFuelingRecommendationForRun(plannedRun)
  const duringRun = formatFuelingItems(recommendation.duringRun)
  const preRun = formatFuelingItems(recommendation.preRun)

  return [
    recommendation.summary,
    preRun ? `Pre-run: ${preRun}.` : undefined,
    duringRun ? `During: ${duringRun}.` : undefined,
    ...recommendation.hydrationNotes.slice(0, 1),
    ...recommendation.practiceNotes.slice(0, 1),
  ].filter((item) => item !== undefined)
}

export function getHydrationGuidanceForDay(dayPlan: DayPlan): string[] {
  const guidance = [dayPlan.mealPlan.hydrationFocus]

  if (dayPlan.mealPlan.templateId === 'social_festival') {
    guidance.push('Alternate alcohol with water where possible and use electrolytes before sleep.')
  }

  if (dayPlan.mealPlan.templateId === 'post_alcohol_recovery') {
    guidance.push('Start with water plus electrolytes, then return to steady fluids through the day.')
  }

  if (dayPlan.plannedRun?.type === 'long' || dayPlan.plannedRun?.type === 'race') {
    guidance.push('Use sodium and fluid practice as part of the run, not only afterward.')
  }

  return Array.from(new Set(guidance))
}

export function getRecoveryNutritionNotes(dayPlan: DayPlan): string[] {
  const notes: string[] = []

  if (dayPlan.plannedRun?.type === 'race') {
    notes.push('After the race, eat and drink what goes down easily first, then return to a real meal.')
  } else if (isLongRunNutritionDay(dayPlan)) {
    notes.push('Use a recovery snack or meal soon after the long run, then keep carbs steady through dinner.')
  } else if (dayPlan.plannedRun && hardRunTypes.includes(dayPlan.plannedRun.type)) {
    notes.push('Pair carbohydrate with protein after the session, especially if dinner slips later.')
  } else if (dayPlan.plannedRun && getRunDurationMinutes(dayPlan.plannedRun) > 60) {
    notes.push('Add a simple carb/protein recovery option if appetite is high or dinner is delayed.')
  }

  if (dayPlan.mealPlan.templateId === 'post_alcohol_recovery') {
    notes.push('Keep food digestion-friendly and avoid hard training until hydration feels normal.')
  }

  if (dayPlan.mealPlan.notes.length) {
    notes.push(...dayPlan.mealPlan.notes)
  }

  return Array.from(new Set(notes))
}

export function shouldShowPreRunSnack(dayPlan: DayPlan): boolean {
  const run = dayPlan.plannedRun

  if (!run) {
    return false
  }

  return (
    dayPlan.mealPlan.meals.some((meal) => getMealCategory(meal) === 'pre_run') ||
    getRunDurationMinutes(run) > 45
  )
}

export function shouldShowDuringRunFuel(dayPlan: DayPlan): boolean {
  const run = dayPlan.plannedRun

  if (!run) {
    return false
  }

  return run.type === 'race' || run.type === 'long' || run.plannedDistanceKm >= 18
}

export function isLongRunNutritionDay(dayPlan: DayPlan): boolean {
  return Boolean(
    dayPlan.plannedRun &&
      (dayPlan.plannedRun.type === 'long' || dayPlan.plannedRun.plannedDistanceKm >= 18),
  )
}

export function getNutritionTemplateTitle(templateId: string): string {
  const titles: Record<MealTemplateId, string> = {
    rest_day: 'Rest day',
    easy_run: 'Easy run day',
    workout_day: 'Workout day',
    long_run: 'Long run day',
    race_week: 'Race week',
    social_festival: 'Social/festival day',
    post_alcohol_recovery: 'Post-alcohol recovery day',
  }

  return titles[templateId as MealTemplateId] ?? templateId.replaceAll('_', ' ')
}

export function getMealPlanPreview(mealPlan: MealPlan): string {
  const labels = mealPlan.meals
    .filter((meal) => ['10:30', '12:30', '17:15', '20:00'].includes(meal.time))
    .map((meal) => meal.label)

  return labels.join(' - ')
}

function getRunDurationMinutes(run: RunWorkout): number {
  return run.estimatedDurationMinutes ?? Math.round(run.plannedDistanceKm * 5)
}
