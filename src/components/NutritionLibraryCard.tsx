import { useState } from 'react'
import { Apple } from 'lucide-react'
import {
  easyRunMeal,
  longRunMeal,
  postAlcoholRecoveryMeal,
  raceWeekMeal,
  restDayMeal,
  socialFestivalMeal,
  workoutDayMeal,
} from '../data/mealTemplates'
import type { MealPlan } from '../types/training'
import NutritionDetailModal from './NutritionDetailModal'
import NutritionTemplateCard from './NutritionTemplateCard'
import PageCard from './PageCard'

const nutritionTemplates = [
  restDayMeal,
  easyRunMeal,
  workoutDayMeal,
  longRunMeal,
  raceWeekMeal,
  socialFestivalMeal,
  postAlcoholRecoveryMeal,
]

function NutritionLibraryCard() {
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan>()

  return (
    <>
      <PageCard className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-300/10 dark:text-amber-200 dark:ring-amber-300/20">
            <Apple className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
              Nutrition library
            </h2>
            <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
              Meal templates for different marathon training days. Practical guidance, not calorie tracking.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {nutritionTemplates.map((mealPlan) => (
            <NutritionTemplateCard
              key={mealPlan.templateId}
              mealPlan={mealPlan}
              onOpen={setSelectedMealPlan}
            />
          ))}
        </div>
      </PageCard>

      <NutritionDetailModal
        mealPlan={selectedMealPlan}
        onClose={() => setSelectedMealPlan(undefined)}
        open={Boolean(selectedMealPlan)}
      />
    </>
  )
}

export default NutritionLibraryCard
