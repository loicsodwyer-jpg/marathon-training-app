import { getFuelingProductById } from '../data/fuelingProducts'
import type { FuelingPreferences } from '../types/fueling'
import type {
  GroceryCategory,
  GroceryItem,
  GroceryPriority,
  WeeklyGroceryList,
} from '../types/grocery'
import type { DayPlan } from '../types/training'
import type { WeekViewSummary } from '../types/weekView'
import { formatDisplayDate } from './dateUtils'
import { getFuelingRecommendationForDay } from './fuelingRules'

type GroceryItemDraft = Omit<GroceryItem, 'relatedDays'> & {
  relatedDays?: string[]
}

const categoryOrder: GroceryCategory[] = [
  'carbs',
  'breakfast_optional',
  'protein',
  'fruit_veg',
  'dairy',
  'snacks',
  'fueling',
  'hydration',
  'misc',
]

const priorityRank: Record<GroceryPriority, number> = {
  essential: 3,
  recommended: 2,
  optional: 1,
}

export function buildWeeklyGroceryList(
  weekPlan: WeekViewSummary,
  preferences: FuelingPreferences,
  effectiveDayPlans: DayPlan[],
): WeeklyGroceryList {
  const loadLabel = getWeekTrainingLoadLabel(weekPlan)
  const context = getWeekGroceryContext(weekPlan, effectiveDayPlans)
  const items = mergeGroceryItems([
    ...getBaseMealPrepItems(context),
    ...getWeeklyFuelingNeeds(effectiveDayPlans, preferences),
    ...getContextItems(context),
  ]).sort(sortGroceryItems)

  return {
    weekNumber: weekPlan.weekNumber ?? 0,
    startDate: weekPlan.startDate,
    endDate: weekPlan.endDate,
    title: weekPlan.weekNumber ? `Week ${weekPlan.weekNumber} grocery list` : 'Weekly grocery list',
    summary: `${loadLabel}. ${items.length} practical items for meals, snacks, hydration, and fuelling.`,
    items,
  }
}

export function getGroceryCategoryLabel(category: GroceryCategory): string {
  const labels: Record<GroceryCategory, string> = {
    carbs: 'Carbs',
    protein: 'Protein',
    fruit_veg: 'Fruit & veg',
    dairy: 'Dairy / recovery',
    snacks: 'Snacks',
    fueling: 'Fuelling',
    hydration: 'Hydration',
    breakfast_optional: 'Pre-run fuel',
    misc: 'Misc',
  }

  return labels[category]
}

export function getGroceryCategoryIcon(category: GroceryCategory): string {
  const icons: Record<GroceryCategory, string> = {
    carbs: 'wheat',
    protein: 'drumstick',
    fruit_veg: 'apple',
    dairy: 'milk',
    snacks: 'cookie',
    fueling: 'zap',
    hydration: 'droplets',
    breakfast_optional: 'sunrise',
    misc: 'shopping-basket',
  }

  return icons[category]
}

export function getGroceryCategoryOrder(): GroceryCategory[] {
  return categoryOrder
}

export function groupGroceryItemsByCategory(items: GroceryItem[]): Array<{
  category: GroceryCategory
  items: GroceryItem[]
}> {
  return categoryOrder
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0)
}

export function mergeGroceryItems(items: GroceryItem[]): GroceryItem[] {
  const mergedItems = new Map<string, GroceryItem>()

  items.forEach((item) => {
    const existingItem = mergedItems.get(item.id)

    if (!existingItem) {
      mergedItems.set(item.id, {
        ...item,
        relatedDays: item.relatedDays ? Array.from(new Set(item.relatedDays)) : undefined,
      })
      return
    }

    mergedItems.set(item.id, {
      ...existingItem,
      priority:
        priorityRank[item.priority] > priorityRank[existingItem.priority]
          ? item.priority
          : existingItem.priority,
      relatedDays: Array.from(
        new Set([...(existingItem.relatedDays ?? []), ...(item.relatedDays ?? [])]),
      ),
    })
  })

  return Array.from(mergedItems.values())
}

export function getWeekTrainingLoadLabel(weekPlan: WeekViewSummary): string {
  const phase = weekPlan.phase ?? ''
  const hasRace = weekPlan.specialEventLabels.some((label) => label.toLowerCase().includes('marathon'))
  const hasSocial = weekPlan.specialEventLabels.some((label) =>
    /festival|wedding|birthday|social/i.test(label),
  )

  if (phase === 'race' || hasRace) {
    return 'Race week'
  }

  if (hasSocial) {
    return 'Protected social week'
  }

  if (phase === 'taper') {
    return 'Taper week'
  }

  if (phase === 'peak' || weekPlan.plannedKm >= 110) {
    return 'Peak week'
  }

  if (weekPlan.plannedKm >= 95) {
    return 'High-volume build week'
  }

  if (weekPlan.plannedKm >= 70) {
    return 'Build week'
  }

  return 'Recovery / cutback week'
}

export function getWeeklyFuelingNeeds(
  dayPlans: DayPlan[],
  fuelingPreferences: FuelingPreferences,
): GroceryItem[] {
  const productTotals = new Map<
    string,
    {
      quantity: number
      relatedDays: string[]
      priority: GroceryPriority
      hasRace: boolean
      hasMarathonSpecific: boolean
    }
  >()

  dayPlans.forEach((dayPlan) => {
    const recommendation = getFuelingRecommendationForDay(dayPlan, fuelingPreferences)

    if (recommendation.category === 'none' || recommendation.category === 'optional') {
      return
    }

    const relevantItems = [...recommendation.preRun, ...recommendation.duringRun].filter((item) =>
      item.productId.startsWith('maurten_'),
    )

    relevantItems.forEach((item) => {
      const current = productTotals.get(item.productId) ?? {
        quantity: 0,
        relatedDays: [],
        priority: 'recommended' as GroceryPriority,
        hasRace: false,
        hasMarathonSpecific: false,
      }
      const isPrioritySession =
        recommendation.category === 'race' || recommendation.category === 'marathon_specific'
      const itemPriority: GroceryPriority = isPrioritySession ? 'essential' : 'recommended'

      productTotals.set(item.productId, {
        quantity: current.quantity + item.quantity,
        relatedDays: [...current.relatedDays, dayPlan.date],
        priority:
          priorityRank[itemPriority] > priorityRank[current.priority]
            ? itemPriority
            : current.priority,
        hasRace: current.hasRace || recommendation.category === 'race',
        hasMarathonSpecific:
          current.hasMarathonSpecific || recommendation.category === 'marathon_specific',
      })
    })
  })

  return Array.from(productTotals.entries()).map(([productId, total]) => {
    const product = getFuelingProductById(productId)
    const productName = product
      ? product.brand === 'Maurten'
        ? `Maurten ${product.name}`
        : product.name
      : productId
    const roundedQuantity = Math.ceil(total.quantity)
    const unit =
      product?.type === 'drink_mix'
        ? roundedQuantity === 1
          ? 'sachet'
          : 'sachets'
        : roundedQuantity === 1
          ? 'gel'
          : 'gels'
    const quantity = `${roundedQuantity} ${unit}`
    const reason = total.hasRace
      ? 'Race-day fuelling plan; keep it familiar.'
      : total.hasMarathonSpecific
        ? 'Long-run or marathon-specific fuelling practice.'
        : 'Workout and longer-run fuelling options for the week.'

    return createItem({
      id: `fueling-${productId}`,
      name: productName,
      quantity,
      category: 'fueling',
      reason,
      priority: total.priority,
      relatedDays: Array.from(new Set(total.relatedDays)),
    })
  })
}

export function formatGroceryListForClipboard(list: WeeklyGroceryList): string {
  const dateRange = `${formatDisplayDate(list.startDate)} - ${formatDisplayDate(list.endDate)}`
  const categoryText = groupGroceryItemsByCategory(list.items)
    .map((group) => {
      const itemLines = group.items.map((item) => `- ${item.name}: ${item.quantity}`)
      return `${getGroceryCategoryLabel(group.category)}\n${itemLines.join('\n')}`
    })
    .join('\n\n')

  return `${list.title} (${dateRange})\n${list.summary}\n\n${categoryText}`
}

function getWeekGroceryContext(weekPlan: WeekViewSummary, dayPlans: DayPlan[]) {
  const plannedRuns = dayPlans.filter((dayPlan) => dayPlan.plannedRun)
  const hardRuns = plannedRuns.filter((dayPlan) =>
    ['threshold', 'interval', 'marathon_pace', 'progression', 'race'].includes(
      dayPlan.plannedRun?.type ?? '',
    ),
  )
  const longRuns = plannedRuns.filter((dayPlan) => {
    const run = dayPlan.plannedRun
    return Boolean(run && (run.type === 'long' || run.plannedDistanceKm >= 20))
  })
  const hasRace = plannedRuns.some((dayPlan) => dayPlan.plannedRun?.type === 'race')
  const hasSocial = dayPlans.some((dayPlan) =>
    ['social_festival', 'post_alcohol_recovery'].includes(dayPlan.mealPlan.templateId) ||
    /festival|wedding|birthday|social/i.test(dayPlan.title),
  )
  const highCarbDays = dayPlans.filter((dayPlan) =>
    ['high', 'very_high'].includes(dayPlan.mealPlan.carbFocus),
  )
  const loadLabel = getWeekTrainingLoadLabel(weekPlan)

  return {
    weekPlan,
    plannedRuns,
    hardRuns,
    longRuns,
    hasRace,
    hasSocial,
    highCarbDays,
    loadLabel,
    isPeak: loadLabel.includes('Peak') || weekPlan.plannedKm >= 110,
    isHigh: weekPlan.plannedKm >= 95,
    isLow: weekPlan.plannedKm < 70,
  }
}

function getBaseMealPrepItems(context: ReturnType<typeof getWeekGroceryContext>): GroceryItem[] {
  const carbMeals = context.hasRace
    ? 'enough for 6-7 familiar meals'
    : context.isPeak || context.isHigh
      ? 'enough for 5-6 meals'
      : context.isLow
        ? 'enough for 3-4 meals'
        : 'enough for 4-5 meals'
  const bananaCount = context.hasRace
    ? '8-10'
    : context.isPeak || context.longRuns.length
      ? '8-12'
      : context.isLow
        ? '5-7'
        : '6-8'
  const snackCount = context.hardRuns.length + context.longRuns.length >= 3 ? '8-10' : '5-7'
  const proteinServings = context.isPeak || context.isHigh ? '6-8 servings' : '5-6 servings'

  return [
    createItem({
      id: 'carbs-rice-pasta-potatoes',
      name: 'Rice, pasta, potatoes, or noodles',
      quantity: carbMeals,
      category: 'carbs',
      reason: 'Main lunch and dinner carbohydrate base.',
      priority: 'essential',
    }),
    createItem({
      id: 'carbs-bread-wraps',
      name: 'Bread, wraps, or bagels',
      quantity: context.hasRace || context.longRuns.length ? '1-2 packs' : '1 pack',
      category: context.longRuns.length || context.hasRace ? 'breakfast_optional' : 'carbs',
      reason: context.longRuns.length || context.hasRace
        ? 'Familiar pre-run fuel and simple lunches.'
        : 'Simple workday lunches and snack backup.',
      priority: 'recommended',
    }),
    createItem({
      id: 'carbs-honey-jam',
      name: 'Honey or jam',
      quantity: '1 jar',
      category: 'breakfast_optional',
      reason: 'Low-risk pre-run carbs for long runs, workouts, or race week.',
      priority: context.longRuns.length || context.hasRace ? 'recommended' : 'optional',
    }),
    createItem({
      id: 'protein-main-servings',
      name: 'Chicken, fish, tofu, eggs, or tuna',
      quantity: proteinServings,
      category: 'protein',
      reason: 'Protein for lunch, dinner, and recovery.',
      priority: 'essential',
    }),
    createItem({
      id: 'fruit-veg-bananas',
      name: 'Bananas',
      quantity: bananaCount,
      category: 'fruit_veg',
      reason: '10:30 snacks, pre-run top-ups, and recovery.',
      priority: 'essential',
    }),
    createItem({
      id: 'fruit-veg-easy',
      name: 'Easy vegetables and salad mix',
      quantity: context.isPeak ? '5-6 portions' : '4-5 portions',
      category: 'fruit_veg',
      reason: 'Keep meals normal without making prep complicated.',
      priority: 'recommended',
    }),
    createItem({
      id: 'dairy-greek-yoghurt',
      name: 'Greek yoghurt or quark',
      quantity: context.isPeak || context.isHigh ? '2 tubs' : '1-2 tubs',
      category: 'dairy',
      reason: '10:30 snack and post-run recovery option.',
      priority: 'recommended',
    }),
    createItem({
      id: 'dairy-chocolate-milk',
      name: 'Chocolate milk or recovery drink',
      quantity: context.hardRuns.length || context.longRuns.length ? '2-4 servings' : '1-2 servings',
      category: 'dairy',
      reason: 'Quick carbs plus protein after hard or long sessions.',
      priority: context.hardRuns.length || context.longRuns.length ? 'recommended' : 'optional',
    }),
    createItem({
      id: 'snacks-cereal-bars-rice-cakes',
      name: 'Cereal bars, rice cakes, or crackers',
      quantity: `${snackCount} snack portions`,
      category: 'snacks',
      reason: 'Pre-run snacks and shop/office backup.',
      priority: 'recommended',
    }),
  ]
}

function getContextItems(context: ReturnType<typeof getWeekGroceryContext>): GroceryItem[] {
  const items: GroceryItem[] = []

  if (context.longRuns.length || context.hardRuns.length || context.hasRace || context.hasSocial) {
    items.push(
      createItem({
        id: 'hydration-electrolytes',
        name: 'Electrolytes',
        quantity: context.isPeak || context.hasRace ? '4-6 servings' : '2-4 servings',
        category: 'hydration',
        reason: context.hasSocial
          ? 'Hydration support around social load and recovery.'
          : 'Hydration support for quality, long-run, or race-week stress.',
        priority: 'recommended',
      }),
    )
  }

  if (context.hasSocial) {
    items.push(
      createItem({
        id: 'misc-easy-meals',
        name: 'Easy salty/carby meals',
        quantity: '2-3 low-effort options',
        category: 'misc',
        reason: 'Festival/social week: keep recovery practical, not strict.',
        priority: 'recommended',
      }),
      createItem({
        id: 'snacks-pretzels-crackers',
        name: 'Pretzels or salty crackers',
        quantity: '1 bag',
        category: 'snacks',
        reason: 'Simple sodium and carbs after late nights or travel.',
        priority: 'optional',
      }),
    )
  }

  if (context.hasRace) {
    items.push(
      createItem({
        id: 'carbs-race-familiar',
        name: 'Familiar race-week carbs',
        quantity: 'Thu-Sat meals only',
        category: 'carbs',
        reason: 'Simple, low-risk foods; avoid experiments before Amsterdam.',
        priority: 'essential',
      }),
    )
  }

  if (context.isPeak) {
    items.push(
      createItem({
        id: 'snacks-extra-peak',
        name: 'Extra carb snacks',
        quantity: '3-5 extra portions',
        category: 'snacks',
        reason: 'Peak week needs more easy energy between meals.',
        priority: 'recommended',
      }),
    )
  }

  return items
}

function createItem(item: GroceryItemDraft): GroceryItem {
  return item
}

function sortGroceryItems(firstItem: GroceryItem, secondItem: GroceryItem) {
  const categoryDifference =
    categoryOrder.indexOf(firstItem.category) - categoryOrder.indexOf(secondItem.category)

  if (categoryDifference !== 0) {
    return categoryDifference
  }

  return priorityRank[secondItem.priority] - priorityRank[firstItem.priority]
}
