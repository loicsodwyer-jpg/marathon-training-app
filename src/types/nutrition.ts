import type { MealPlan } from './training'

export type NutritionTemplateId =
  | 'rest_day'
  | 'easy_run'
  | 'workout_day'
  | 'long_run'
  | 'race_week'
  | 'social_festival'
  | 'post_alcohol_recovery'

export type NutritionAccent = 'carbs' | 'protein' | 'hydration' | 'fuel' | 'recovery' | 'social'

export type MealCategory = 'snack' | 'lunch' | 'pre_run' | 'dinner' | 'recovery' | 'fuel'

export interface NutritionFocus {
  carbFocus: MealPlan['carbFocus']
  proteinFocus: string
  hydrationFocus: string
}

export interface NutritionDisplaySection {
  title: string
  items: string[]
  accent: NutritionAccent
}
