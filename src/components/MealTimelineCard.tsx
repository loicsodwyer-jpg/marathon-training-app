import { Apple, Droplets, Flame, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import type { FuelingRecommendation } from '../types/fueling'
import type { DayPlan, MealPlan } from '../types/training'
import {
  getCarbFocusColor,
  getCarbFocusLabel,
  getFuelingGuidanceForRun,
  getHydrationGuidanceForDay,
  getNutritionSummaryForDay,
} from '../utils/nutritionUtils'
import { formatFuelingSummary } from '../utils/fuelingFormatUtils'
import ActionButton from './ActionButton'
import ActivityCard from './ActivityCard'
import MealItemCard from './MealItemCard'
import StatusPill from './StatusPill'

type MealTimelineCardProps = {
  mealPlan: MealPlan
  dayPlan?: DayPlan
  fuelingRecommendation?: FuelingRecommendation
  onOpenNutrition?: () => void
}

function MealTimelineCard({
  dayPlan,
  fuelingRecommendation,
  mealPlan,
  onOpenNutrition,
}: MealTimelineCardProps) {
  const fuelingGuidance = fuelingRecommendation
    ? [
        formatFuelingSummary(fuelingRecommendation),
        ...fuelingRecommendation.practiceNotes.slice(0, 1),
      ]
    : getFuelingGuidanceForRun(dayPlan?.plannedRun).slice(0, 2)
  const hydrationGuidance = dayPlan
    ? getHydrationGuidanceForDay(dayPlan).slice(0, 2)
    : [mealPlan.hydrationFocus]

  return (
    <ActivityCard
      icon={Utensils}
      pill={mealPlan.carbFocus.replace('_', ' ')}
      subtitle="No breakfast in this plan"
      title="Meals"
      tone="success"
    >
      <div className="mb-4 rounded-[18px] border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-300/20 dark:bg-amber-300/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCarbFocusColor(mealPlan.carbFocus)}`}>
            {getCarbFocusLabel(mealPlan.carbFocus)}
          </span>
          {dayPlan ? <StatusPill tone="running">{getNutritionSummaryForDay(dayPlan)}</StatusPill> : null}
        </div>
        <p className="mt-2 text-sm leading-5 text-stone-700 dark:text-neutral-300">
          Protein: {mealPlan.proteinFocus}
        </p>
      </div>

      <div className="space-y-3">
        {mealPlan.meals.map((meal) => (
          <MealItemCard compact key={`${meal.time}-${meal.label}`} meal={meal} />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <GuidanceLine icon={<Flame className="h-4 w-4" aria-hidden="true" />} items={fuelingGuidance} title="Fuel" />
        <GuidanceLine icon={<Droplets className="h-4 w-4" aria-hidden="true" />} items={hydrationGuidance} title="Hydration" />
      </div>

      {onOpenNutrition ? (
        <ActionButton
          className="mt-4 w-full"
          icon={<Apple className="h-5 w-5" aria-hidden="true" />}
          onClick={onOpenNutrition}
          variant="secondary"
        >
          Open nutrition plan
        </ActionButton>
      ) : null}
    </ActivityCard>
  )
}

function GuidanceLine({
  icon,
  items,
  title,
}: {
  icon: ReactNode
  items: string[]
  title: string
}) {
  if (!items.length) {
    return null
  }

  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mb-2 flex items-center gap-2 text-stone-700 dark:text-neutral-200">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li className="text-sm leading-5 text-stone-600 dark:text-neutral-400" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MealTimelineCard
