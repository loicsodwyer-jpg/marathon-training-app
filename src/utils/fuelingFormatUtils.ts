import type { FuelingItem, FuelingRecommendation, FuelingSessionCategory } from '../types/fueling'

export function formatCarbs(grams: number | undefined): string {
  return grams === undefined ? '-' : `${Math.round(grams)} g carbs`
}

export function formatCaffeine(mg: number | undefined): string {
  return mg === undefined || mg <= 0 ? 'No caffeine' : `${Math.round(mg)} mg caffeine`
}

export function formatFuelingItems(items: FuelingItem[]): string {
  return items
    .map((item) => {
      const quantity = item.quantity > 1 ? `${item.quantity} x ` : ''
      return `${quantity}${item.productName}`
    })
    .join(' + ')
}

export function formatFuelingSummary(recommendation: FuelingRecommendation): string {
  if (recommendation.category === 'none') {
    return recommendation.summary
  }

  const during = formatFuelingItems(recommendation.duringRun)

  if (during) {
    return `${during} - ${formatCarbs(recommendation.totalRecommendedCarbs)}`
  }

  const preRun = formatFuelingItems(recommendation.preRun)
  return preRun || recommendation.summary
}

export function getFuelingCategoryLabel(category: FuelingSessionCategory): string {
  const labels: Record<FuelingSessionCategory, string> = {
    none: 'No gel needed',
    optional: 'Optional fuel',
    light: 'Light fuel',
    moderate: 'Workout fuel',
    marathon_specific: 'Marathon fuel practice',
    race: 'Race fuel strategy',
  }

  return labels[category]
}

export function getFuelingCategoryAccent(category: FuelingSessionCategory): string {
  const accents: Record<FuelingSessionCategory, string> = {
    none: 'border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-neutral-200',
    optional:
      'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200',
    light:
      'border-yellow-100 bg-yellow-50 text-yellow-700 dark:border-yellow-300/25 dark:bg-yellow-300/10 dark:text-yellow-200',
    moderate:
      'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-300/25 dark:bg-orange-300/10 dark:text-orange-200',
    marathon_specific:
      'border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-200',
    race: 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-300/25 dark:bg-rose-300/10 dark:text-rose-200',
  }

  return accents[category]
}
