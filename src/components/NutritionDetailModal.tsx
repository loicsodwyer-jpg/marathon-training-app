import { Apple, X } from 'lucide-react'
import type { FuelingRecommendation } from '../types/fueling'
import type { DayPlan, MealPlan } from '../types/training'
import { formatDisplayDate } from '../utils/dateUtils'
import {
  getCarbFocusColor,
  getCarbFocusDescription,
  getCarbFocusLabel,
  getFuelingGuidanceForRun,
  getHydrationGuidanceForDay,
  getNutritionTemplateTitle,
  getRecoveryNutritionNotes,
  shouldShowDuringRunFuel,
} from '../utils/nutritionUtils'
import FuelingGuidanceCard from './FuelingGuidanceCard'
import FuelingRecommendationCard from './FuelingRecommendationCard'
import HydrationGuidanceCard from './HydrationGuidanceCard'
import MealItemCard from './MealItemCard'

type NutritionDetailModalProps = {
  open: boolean
  dayPlan?: DayPlan
  fuelingRecommendation?: FuelingRecommendation
  mealPlan?: MealPlan
  title?: string
  onClose: () => void
}

function NutritionDetailModal({
  open,
  dayPlan,
  fuelingRecommendation,
  mealPlan,
  title,
  onClose,
}: NutritionDetailModalProps) {
  const effectiveMealPlan = dayPlan?.mealPlan ?? mealPlan

  if (!open || !effectiveMealPlan) {
    return null
  }

  const fuelingGuidance = dayPlan ? getFuelingGuidanceForRun(dayPlan.plannedRun) : []
  const hydrationGuidance = dayPlan ? getHydrationGuidanceForDay(dayPlan) : [effectiveMealPlan.hydrationFocus]
  const recoveryNotes = dayPlan ? getRecoveryNutritionNotes(dayPlan) : effectiveMealPlan.notes
  const displayTitle =
    title ?? (dayPlan ? `${formatDisplayDate(dayPlan.date)} - ${dayPlan.title}` : getNutritionTemplateTitle(effectiveMealPlan.templateId))

  return (
    <div
      aria-label="Nutrition plan"
      aria-modal="true"
      className="modal-overlay z-[100] items-end justify-center bg-slate-950/70 px-3 backdrop-blur-sm sm:items-center"
      role="dialog"
    >
      <div className="modal-panel w-full max-w-[480px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:bg-neutral-900">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-200">
              Nutrition plan
            </p>
            <h2 className="truncate text-base font-semibold text-stone-950 dark:text-white">
              {displayTitle}
            </h2>
          </div>
          <button
            aria-label="Close nutrition plan"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-scroll space-y-5 p-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
          <header className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-300/20 dark:bg-amber-300/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4 text-amber-700 dark:text-amber-200" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-200">
                    {getNutritionTemplateTitle(effectiveMealPlan.templateId)}
                  </p>
                </div>
                <h3 className="mt-2 text-xl font-semibold text-stone-950 dark:text-white">
                  {getCarbFocusLabel(effectiveMealPlan.carbFocus)}
                </h3>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getCarbFocusColor(effectiveMealPlan.carbFocus)}`}>
                {effectiveMealPlan.carbFocus.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-neutral-300">
              {getCarbFocusDescription(effectiveMealPlan.carbFocus)}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-neutral-300">
              Protein: {effectiveMealPlan.proteinFocus}
            </p>
          </header>

          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-stone-950 dark:text-white">
                Meal timeline
              </h3>
              <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
                No default morning meal; fuel starts with Loïc's planned snack rhythm.
              </p>
            </div>
            <div className="space-y-3">
              {effectiveMealPlan.meals.map((meal) => (
                <MealItemCard meal={meal} key={`${meal.time}-${meal.label}`} />
              ))}
            </div>
          </section>

          {fuelingRecommendation ? (
            <FuelingRecommendationCard recommendation={fuelingRecommendation} />
          ) : (
            <FuelingGuidanceCard items={fuelingGuidance} />
          )}

          {dayPlan && shouldShowDuringRunFuel(dayPlan) ? (
            <FuelingGuidanceCard
              items={[
                'Use long runs to rehearse gels, drink mix, and stomach tolerance.',
                'Keep the plan familiar on race week: no new flavors, brands, or timing experiments.',
              ]}
              title="During-run fuel"
            />
          ) : null}

          <HydrationGuidanceCard items={hydrationGuidance} />

          {recoveryNotes.length ? (
            <section className="rounded-[20px] border border-emerald-100 bg-emerald-50/75 p-4 dark:border-emerald-300/25 dark:bg-emerald-300/10">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">
                Recovery and practical notes
              </h3>
              <ul className="mt-3 space-y-2">
                {recoveryNotes.map((note) => (
                  <li className="text-sm leading-5 text-emerald-800/80 dark:text-emerald-100/80" key={note}>
                    {note}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default NutritionDetailModal
