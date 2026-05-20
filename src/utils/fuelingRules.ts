import { MAURTEN_PRODUCT_IDS, getFuelingProductById } from '../data/fuelingProducts'
import type {
  FuelingItem,
  FuelingPreferences,
  FuelingRecommendation,
  FuelingSessionCategory,
} from '../types/fueling'
import type { DayPlan, RunType, RunWorkout } from '../types/training'
import { loadFuelingPreferences } from './fuelingStorage'
import { timeToMinutes } from './scheduleTimeUtils'

const hardRunTypes: RunType[] = ['threshold', 'interval', 'marathon_pace', 'progression', 'race']

export function getFuelingRecommendationForDay(
  dayPlan: DayPlan,
  preferences: FuelingPreferences = loadFuelingPreferences(),
): FuelingRecommendation {
  return getFuelingRecommendationForRun(dayPlan.plannedRun, dayPlan, preferences)
}

export function getFuelingRecommendationForRun(
  plannedRun: RunWorkout | undefined,
  dayPlan?: DayPlan,
  preferences: FuelingPreferences = loadFuelingPreferences(),
): FuelingRecommendation {
  if (!plannedRun) {
    const socialHydration =
      dayPlan?.mealPlan.templateId === 'social_festival' ||
      dayPlan?.mealPlan.templateId === 'post_alcohol_recovery'

    return {
      category: 'none',
      title: socialHydration ? 'Hydration day' : 'No run fuel needed',
      summary: socialHydration
        ? 'No gel needed. Prioritize food, water, and electrolytes around the social load.'
        : 'No gel needed. Normal meals and steady hydration are enough.',
      preRun: [],
      duringRun: [],
      postRun: [],
      hydrationNotes: socialHydration
        ? ['Use electrolytes if alcohol, heat, or poor sleep are in the mix.']
        : ['Keep fluids steady through the day.'],
      practiceNotes: [],
      warnings: [],
    }
  }

  const duration = estimateRunDurationMinutes(plannedRun)
  const category = getFuelingSessionCategory(plannedRun, duration)
  const canUseCaffeine = canRecommendCaffeine(plannedRun, dayPlan, preferences)

  if (category === 'race') {
    return buildRaceFueling(plannedRun, duration, preferences, canUseCaffeine)
  }

  if (category === 'none') {
    return {
      category,
      title: 'Normal meals are enough',
      summary: 'No Maurten needed unless you start hungry. Keep the usual pre-run snack rhythm.',
      estimatedDurationMinutes: duration,
      preRun: [],
      duringRun: [],
      postRun: [],
      hydrationNotes: ['Water as needed, especially if the office day was dry or warm.'],
      practiceNotes: ['Save gels and Drink Mix for longer or more specific sessions.'],
      warnings: [],
    }
  }

  if (category === 'optional') {
    const optionalProduct = preferences.useDrinkMix
      ? createFuelingItem(MAURTEN_PRODUCT_IDS.drinkMix160, 1, 'Sip pre-run or during run', 'Use if lunch was light or the run starts hungry.')
      : createFuelingItem(getPreferredGelId(preferences, false), 1, 'Optional during run', 'Use only if energy feels low.')

    return {
      category,
      title: 'Optional Maurten top-up',
      summary: 'Usually normal meals are enough; keep one small fuel option available if lunch was light.',
      estimatedDurationMinutes: duration,
      targetCarbsPerHour: 25,
      totalRecommendedCarbs: optionalProduct.carbsGrams,
      preRun: [],
      duringRun: [optionalProduct],
      postRun: [],
      hydrationNotes: ['Water as needed.'],
      practiceNotes: ['Use this as a low-stakes stomach check, not a forced fueling target.'],
      warnings: [],
    }
  }

  const targetCarbsPerHour = getTargetCarbsPerHour(category, preferences)
  const totalRecommendedCarbs = Math.round((duration / 60) * targetCarbsPerHour)
  const duringRun = buildDuringRunFuel(category, duration, preferences, canUseCaffeine)
  const postRun = hardRunTypes.includes(plannedRun.type) || duration >= 90
    ? [createFuelingItem('solid_recovery', 1, 'Within 30-60 min after', 'Carbs plus protein if dinner is delayed.', 'Recovery carbs + protein', 30)]
    : []
  const warnings = buildWarnings(category, preferences, targetCarbsPerHour, canUseCaffeine)

  return {
    category,
    title:
      category === 'marathon_specific'
        ? 'Practise marathon fuelling'
        : category === 'moderate'
          ? 'Fuel the workout'
          : 'Light during-run fuel',
    summary: buildSummary(category, duringRun),
    estimatedDurationMinutes: duration,
    targetCarbsPerHour,
    totalRecommendedCarbs: duringRun.reduce((total, item) => total + item.carbsGrams, 0) || totalRecommendedCarbs,
    preRun: buildPreRunFuel(plannedRun, category, preferences),
    duringRun,
    postRun,
    hydrationNotes: buildHydrationNotes(category, preferences),
    practiceNotes: buildPracticeNotes(category, preferences),
    warnings,
  }
}

export function estimateRunDurationMinutes(run: RunWorkout): number {
  if (run.estimatedDurationMinutes) {
    return run.estimatedDurationMinutes
  }

  if (run.type === 'race') {
    return 175
  }

  const paceFactor: Record<RunType, number> = {
    recovery: 5.2,
    easy: 5.2,
    steady: 4.8,
    medium_long: 4.8,
    long: 5,
    threshold: 4.7,
    interval: 4.7,
    marathon_pace: 4.6,
    progression: 4.6,
    race: 4.15,
    rest: 0,
  }

  return Math.max(0, Math.round(run.plannedDistanceKm * paceFactor[run.type]))
}

export function getFuelingSessionCategory(
  run: RunWorkout,
  durationMinutes = estimateRunDurationMinutes(run),
): FuelingSessionCategory {
  if (run.type === 'race') {
    return 'race'
  }

  const isHard = hardRunTypes.includes(run.type)
  const isLong = run.type === 'long' || run.plannedDistanceKm >= 18
  const isMarathonSpecific =
    run.type === 'marathon_pace' ||
    run.title.toLowerCase().includes('marathon') ||
    Boolean(run.intervals?.some((interval) => interval.targetPace?.description.toLowerCase().includes('marathon')))

  if ((isLong && durationMinutes >= 120) || (isMarathonSpecific && durationMinutes >= 90)) {
    return 'marathon_specific'
  }

  if (isHard || durationMinutes >= 90) {
    return 'moderate'
  }

  if (durationMinutes >= 75) {
    return 'light'
  }

  if (durationMinutes >= 50) {
    return 'optional'
  }

  return 'none'
}

function buildRaceFueling(
  run: RunWorkout,
  duration: number,
  preferences: FuelingPreferences,
  canUseCaffeine: boolean,
): FuelingRecommendation {
  const targetCarbsPerHour = preferences.targetCarbsPerHourRace
  const targetTotal = Math.round((duration / 60) * targetCarbsPerHour)
  const duringRun = buildRaceDuringFuel(preferences, canUseCaffeine)

  return {
    category: 'race',
    title: 'Amsterdam race fuelling strategy',
    summary: 'Practised Maurten strategy: regular gels, optional Drink Mix, and careful caffeine.',
    estimatedDurationMinutes: duration,
    targetCarbsPerHour,
    totalRecommendedCarbs: duringRun.reduce((total, item) => total + item.carbsGrams, 0),
    preRun: [
      createFuelingItem(MAURTEN_PRODUCT_IDS.drinkMix160, 1, '2-3 hours before start', 'Sip with familiar pre-race food if tolerated.'),
      createFuelingItem(getPreferredGelId(preferences, false), 1, '10-15 min before start', 'Small top-up before the gun.'),
    ],
    duringRun,
    postRun: [
      createFuelingItem('solid_recovery', 1, 'After finish', 'Eat and drink what goes down easily first, then return to a real meal.', 'Recovery carbs + protein', 30),
    ],
    hydrationNotes: [
      'Use aid stations for water with gels as needed.',
      'Adjust fluid and sodium for heat, but keep the product strategy familiar.',
    ],
    practiceNotes: [
      `${run.title}: rehearse this before race day, especially caffeine timing.`,
      `Target range: about ${targetTotal} g carbs total for a 2:50-2:55 marathon.`,
    ],
    warnings: [
      'Do not introduce caffeine for the first time on race day.',
      preferences.stomachSensitive && targetCarbsPerHour > 70
        ? 'Stomach-sensitive setting is on: build gradually before trying this race target.'
        : undefined,
    ].filter((warning) => warning !== undefined),
  }
}

function buildPreRunFuel(
  run: RunWorkout,
  category: FuelingSessionCategory,
  preferences: FuelingPreferences,
) {
  if (category === 'light' || category === 'moderate' || category === 'marathon_specific') {
    if (preferences.useDrinkMix && (category === 'marathon_specific' || run.type === 'long')) {
      return [
        createFuelingItem(MAURTEN_PRODUCT_IDS.drinkMix160, 1, '60-90 min before', 'Use as a familiar carb top-up before the session.'),
      ]
    }

    return [
      createFuelingItem('solid_pre_run', 1, '60-90 min before', 'Banana, toast with honey, cereal bar, or another familiar carb snack.', 'Pre-run carb snack', 30),
    ]
  }

  return []
}

function buildDuringRunFuel(
  category: FuelingSessionCategory,
  duration: number,
  preferences: FuelingPreferences,
  canUseCaffeine: boolean,
): FuelingItem[] {
  if (category === 'light') {
    return [
      preferences.useDrinkMix
        ? createFuelingItem(MAURTEN_PRODUCT_IDS.drinkMix160, 1, 'Sip during run', 'Use Drink Mix 160 or one gel if carrying fluid is awkward.')
        : createFuelingItem(getPreferredGelId(preferences, false), 1, 'Around 35-45 min', 'Take with water if needed.'),
    ]
  }

  if (category === 'moderate') {
    return preferences.useDrinkMix
      ? [
          createFuelingItem(MAURTEN_PRODUCT_IDS.drinkMix160, 1, 'Sip during warm-up and main set', 'Covers the controlled workout without overcomplicating it.'),
          createFuelingItem(getPreferredGelId(preferences, false), 1, 'Around 60-75 min if needed', 'Use if the session runs long or lunch was light.'),
        ]
      : [
          createFuelingItem(getPreferredGelId(preferences, false), 1, 'Around 35-45 min', 'First carb hit.'),
          createFuelingItem(getPreferredGelId(preferences, false), 1, 'Around 75-90 min if needed', 'Second gel for longer sessions.'),
        ]
  }

  if (category === 'marathon_specific') {
    const items: FuelingItem[] = preferences.useDrinkMix
      ? [
          createFuelingItem(MAURTEN_PRODUCT_IDS.drinkMix320, 1, 'Before/during first half', 'Use this as marathon fueling rehearsal.'),
          createFuelingItem(getPreferredGelId(preferences, false), duration >= 150 ? 3 : 2, 'Every 30-40 min', 'Practise regular gel timing.'),
        ]
      : [
          createFuelingItem(getPreferredGelId(preferences, false), duration >= 150 ? 4 : 3, 'Every 30-40 min', 'Practise regular gel timing.'),
        ]

    if (canUseCaffeine && duration >= 150) {
      items.push(
        createFuelingItem(MAURTEN_PRODUCT_IDS.gel100Caf100, 1, 'Late run if practised', 'Caffeine rehearsal only, not a new experiment.'),
      )
    }

    return items
  }

  return []
}

function buildRaceDuringFuel(
  preferences: FuelingPreferences,
  canUseCaffeine: boolean,
): FuelingItem[] {
  const baseGelId =
    preferences.preferredGelSize === 'gel_160'
      ? MAURTEN_PRODUCT_IDS.gel160
      : MAURTEN_PRODUCT_IDS.gel100
  const items: FuelingItem[] = preferences.useDrinkMix
    ? [
        createFuelingItem(MAURTEN_PRODUCT_IDS.drinkMix320, 1, 'Pre-race / first hour if available', 'Use only if already practised.'),
        createFuelingItem(baseGelId, 4, 'Every 30-35 min', 'Keep intake steady through the race.'),
      ]
    : [
        createFuelingItem(baseGelId, preferences.preferredGelSize === 'gel_160' ? 5 : 7, 'Every 25-35 min', 'Carry the practised gel plan.'),
      ]

  if (canUseCaffeine) {
    items.push(
      createFuelingItem(MAURTEN_PRODUCT_IDS.gel100Caf100, 1, 'Final 45-60 min if practised', 'Caffeine only if it has worked in long runs.'),
    )
  }

  return items
}

function getTargetCarbsPerHour(
  category: FuelingSessionCategory,
  preferences: FuelingPreferences,
) {
  if (category === 'marathon_specific') {
    return preferences.targetCarbsPerHourLongRun
  }

  if (category === 'moderate') {
    return 45
  }

  if (category === 'light') {
    return 30
  }

  return 25
}

function getPreferredGelId(preferences: FuelingPreferences, preferLargeForLongRun: boolean) {
  if (preferences.preferredGelSize === 'gel_160' || (preferences.preferredGelSize === 'mixed' && preferLargeForLongRun)) {
    return MAURTEN_PRODUCT_IDS.gel160
  }

  return MAURTEN_PRODUCT_IDS.gel100
}

function createFuelingItem(
  productId: string,
  quantity: number,
  timing: string,
  instruction: string,
  fallbackName?: string,
  fallbackCarbs = 0,
): FuelingItem {
  const product = getFuelingProductById(productId)
  const productName = product?.name ?? fallbackName ?? productId
  const carbsPerServing = product?.carbsGrams ?? fallbackCarbs
  const caffeinePerServing = product?.caffeineMg

  return {
    productId,
    productName,
    quantity,
    timing,
    carbsGrams: carbsPerServing * quantity,
    caffeineMg: caffeinePerServing ? caffeinePerServing * quantity : undefined,
    instruction,
  }
}

function canRecommendCaffeine(
  run: RunWorkout,
  dayPlan: DayPlan | undefined,
  preferences: FuelingPreferences,
) {
  if (!preferences.caffeineEnabled) {
    return false
  }

  const startTime = run.startTime ?? (dayPlan?.dayOfWeek && ['Saturday', 'Sunday'].includes(dayPlan.dayOfWeek) ? '09:00' : '18:30')

  if (timeToMinutes(startTime) >= 16 * 60 && !preferences.caffeineForEveningRuns) {
    return false
  }

  return true
}

function buildSummary(category: FuelingSessionCategory, duringRun: FuelingItem[]) {
  const productText = duringRun
    .map((item) => `${item.quantity > 1 ? `${item.quantity} x ` : ''}${item.productName}`)
    .join(' + ')

  if (!productText) {
    return 'Use normal meals and water unless the session runs long.'
  }

  if (category === 'marathon_specific') {
    return `${productText}. Practise marathon fuelling.`
  }

  if (category === 'moderate') {
    return `${productText}. Keep the quality session fuelled.`
  }

  return `${productText}.`
}

function buildHydrationNotes(
  category: FuelingSessionCategory,
  preferences: FuelingPreferences,
) {
  const notes = ['Use water with gels if needed.']

  if (category === 'marathon_specific') {
    notes.push('Practise fluid and sodium timing, especially in warm conditions.')
  }

  if (preferences.useDrinkMix) {
    notes.push('Drink Mix counts as both fluid and carbohydrate.')
  }

  return notes
}

function buildPracticeNotes(
  category: FuelingSessionCategory,
  preferences: FuelingPreferences,
) {
  const notes = ['Practise fuelling during training, not for the first time on race day.']

  if (category === 'marathon_specific') {
    notes.push(`Build toward ${preferences.targetCarbsPerHourLongRun} g carbs/hour only if the stomach is calm.`)
  }

  if (preferences.stomachSensitive) {
    notes.push('Stomach-sensitive mode: increase carbs gradually and keep products familiar.')
  }

  return notes
}

function buildWarnings(
  category: FuelingSessionCategory,
  preferences: FuelingPreferences,
  targetCarbsPerHour: number,
  canUseCaffeine: boolean,
) {
  const warnings: string[] = []

  if (preferences.caffeineEnabled && !canUseCaffeine) {
    warnings.push('Caffeine products skipped by preference for evening runs.')
  }

  if (preferences.stomachSensitive && targetCarbsPerHour > 70) {
    warnings.push('High carb target: build gradually because stomach-sensitive mode is on.')
  }

  if (category === 'marathon_specific') {
    warnings.push('Do not introduce caffeine or a new Drink Mix strategy for the first time on race day.')
  }

  return warnings
}
