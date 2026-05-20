import { Apple } from 'lucide-react'
import type { MealPlan } from '../types/training'
import {
  getCarbFocusColor,
  getMealPlanPreview,
  getNutritionTemplateTitle,
} from '../utils/nutritionUtils'

type NutritionTemplateCardProps = {
  mealPlan: MealPlan
  onOpen: (mealPlan: MealPlan) => void
}

function NutritionTemplateCard({ mealPlan, onOpen }: NutritionTemplateCardProps) {
  return (
    <button
      aria-label={`Open ${getNutritionTemplateTitle(mealPlan.templateId)} nutrition template`}
      className="w-full rounded-[20px] border border-amber-100 bg-amber-50/70 p-3 text-left transition hover:-translate-y-0.5 hover:bg-amber-50 dark:border-amber-300/20 dark:bg-amber-300/10 dark:hover:bg-amber-300/15"
      onClick={() => onOpen(mealPlan)}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-white text-amber-700 ring-1 ring-amber-100 dark:bg-slate-950/45 dark:text-amber-200 dark:ring-amber-300/20">
          <Apple className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-stone-950 dark:text-white">
              {getNutritionTemplateTitle(mealPlan.templateId)}
            </p>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getCarbFocusColor(mealPlan.carbFocus)}`}>
              {mealPlan.carbFocus.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-stone-600 dark:text-slate-300">
            {mealPlan.hydrationFocus}
          </p>
          <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-slate-400">
            {getMealPlanPreview(mealPlan)}
          </p>
        </div>
      </div>
    </button>
  )
}

export default NutritionTemplateCard
