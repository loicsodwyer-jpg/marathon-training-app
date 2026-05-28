import {
  Coffee,
  Droplets,
  GlassWater,
  Sandwich,
  Soup,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MealItem } from '../types/training'
import type { MealCategory } from '../types/nutrition'
import { getMealCategory } from '../utils/nutritionUtils'

type MealItemCardProps = {
  meal: MealItem
  compact?: boolean
}

const categoryStyles = {
  snack:
    'border-amber-100 bg-amber-50/75 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200',
  lunch:
    'border-emerald-100 bg-emerald-50/75 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
  pre_run:
    'border-orange-100 bg-orange-50/75 text-orange-700 dark:border-orange-300/20 dark:bg-orange-300/10 dark:text-orange-200',
  dinner:
    'border-green-100 bg-green-50/75 text-green-700 dark:border-green-300/20 dark:bg-green-300/10 dark:text-green-200',
  recovery:
    'border-cyan-100 bg-cyan-50/75 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200',
  fuel:
    'border-yellow-100 bg-yellow-50/75 text-yellow-700 dark:border-yellow-300/20 dark:bg-yellow-300/10 dark:text-yellow-200',
}

const categoryIcons: Record<MealCategory, LucideIcon> = {
  snack: Coffee,
  lunch: Sandwich,
  pre_run: GlassWater,
  dinner: Utensils,
  recovery: Droplets,
  fuel: Soup,
}

function MealItemCard({ meal, compact = false }: MealItemCardProps) {
  const category = getMealCategory(meal)
  const Icon = categoryIcons[category]

  return (
    <div className="flex gap-3">
      <div className="w-12 shrink-0 pt-0.5 text-xs font-semibold text-stone-500 dark:text-neutral-500">
        {meal.time}
      </div>
      <div className={`flex-1 rounded-[18px] border p-3 ${categoryStyles[category]}`}>
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-950 dark:text-white">{meal.label}</p>
            <p className="mt-1 text-sm leading-5 text-stone-700 dark:text-neutral-200">
              {meal.description}
            </p>
            {!compact ? (
              <p className="mt-1 text-xs leading-5 text-stone-600 dark:text-neutral-400">
                {meal.purpose}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MealItemCard
