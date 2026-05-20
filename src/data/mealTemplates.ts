import type { MealPlan } from '../types/training'

export type MealTemplateId =
  | 'rest_day'
  | 'easy_run'
  | 'workout_day'
  | 'long_run'
  | 'race_week'
  | 'social_festival'
  | 'post_alcohol_recovery'

export const restDayMeal: MealPlan = {
  templateId: 'rest_day',
  carbFocus: 'moderate',
  proteinFocus: 'Protein at lunch and dinner to support repair without making the day feel strict.',
  hydrationFocus: 'Steady water intake through the workday; no need to force extra carbs.',
  meals: [
    {
      time: '10:30',
      label: '10:30 snack',
      description: 'Greek yoghurt with fruit, a banana with nuts, or a simple cheese/chicken sandwich.',
      purpose: 'Start fueling calmly without forcing an early meal.',
    },
    {
      time: '12:30',
      label: 'Lunch',
      description: 'Wholegrain wrap, bread bowl, or rice bowl with eggs, chicken, tofu, or tuna plus vegetables.',
      purpose: 'Balanced energy for the afternoon and tissue repair.',
    },
    {
      time: '20:00',
      label: 'Dinner',
      description: 'Potatoes, rice, or pasta with fish, chicken, tofu, or eggs and a normal serving of vegetables.',
      purpose: 'Recovery and baseline carbohydrate availability for the next training day.',
    },
  ],
  notes: [
    'Keep it flexible. A rest day should feel normal, not restrictive.',
    'If appetite is low, prioritize protein, fluids, and a normal dinner.',
  ],
}

export const easyRunMeal: MealPlan = {
  templateId: 'easy_run',
  carbFocus: 'moderate',
  proteinFocus: 'Protein at lunch and dinner, plus an easy recovery option if appetite is high.',
  hydrationFocus: 'Drink steadily and add electrolytes if it is warm.',
  meals: [
    {
      time: '10:30',
      label: '10:30 snack',
      description: 'Banana with yoghurt, fruit with a small handful of nuts, or a small sandwich.',
      purpose: 'Top up energy gently.',
    },
    {
      time: '12:30',
      label: 'Lunch',
      description: 'Rice bowl, pasta salad, wrap, or bread with lean protein and vegetables.',
      purpose: 'Main workday fuel.',
    },
    {
      time: '17:15',
      label: 'Pre-run snack',
      description: 'Banana, cereal bar, toast with honey, or isotonic drink.',
      purpose: 'Avoid starting the 18:30 run under-fueled.',
    },
    {
      time: '20:00',
      label: 'Dinner',
      description: 'Rice, potatoes, or pasta with chicken, fish, tofu, or eggs and vegetables.',
      purpose: 'Refuel and support sleep.',
    },
  ],
  notes: [
    'Keep the pre-run snack small and familiar.',
    'Add a quick protein-and-carb option after runs longer than 60 minutes if dinner is delayed.',
  ],
}

export const workoutDayMeal: MealPlan = {
  templateId: 'workout_day',
  carbFocus: 'high',
  proteinFocus: 'Protein at lunch and dinner, with a quick post-run option if dinner is delayed.',
  hydrationFocus: 'Prioritize fluids from lunch onward; add electrolytes for harder sessions.',
  meals: [
    {
      time: '10:30',
      label: '10:30 snack',
      description: 'Banana plus yoghurt, fruit with granola, or a sandwich with jam or honey.',
      purpose: 'Add carbohydrate early enough for the evening workout.',
    },
    {
      time: '12:30',
      label: 'Lunch',
      description: 'Rice, pasta, noodles, or a wrap bowl with lean protein and a moderate amount of vegetables.',
      purpose: 'Primary workout fuel.',
    },
    {
      time: '17:15',
      label: 'Pre-run snack',
      description: 'Toast with honey, banana, cereal bar, or isotonic drink.',
      purpose: 'Top up glycogen before quality running.',
    },
    {
      time: '19:45',
      label: 'Recovery snack',
      description: 'Chocolate milk, yoghurt with granola, protein shake plus fruit, or a simple sandwich.',
      purpose: 'Bridge the gap if dinner is not immediate.',
    },
    {
      time: '20:00',
      label: 'Dinner',
      description: 'Pasta, rice, or potatoes with chicken, fish, tofu, or eggs and low-risk vegetables.',
      purpose: 'Refuel after intensity.',
    },
  ],
  notes: [
    'Do not experiment with unfamiliar foods before threshold or marathon-pace work.',
    'If the session runs late, take the recovery snack first and keep dinner simple.',
  ],
}

export const longRunMeal: MealPlan = {
  templateId: 'long_run',
  carbFocus: 'very_high',
  proteinFocus: 'Protein after the run and again at dinner.',
  hydrationFocus: 'Start hydrated, carry fluid for longer efforts, and replace sodium afterward.',
  meals: [
    {
      time: '07:30',
      label: 'Pre-run fuel',
      description: 'Banana plus toast with honey, a bagel with jam, an energy bar, or a sports drink.',
      purpose: 'Top up carbohydrate 60-90 minutes before the morning long run.',
    },
    {
      time: '10:30',
      label: '10:30 snack',
      description: 'Recovery yoghurt with granola and fruit, chocolate milk, or a sandwich if the run finished early.',
      purpose: 'Early post-run refuel.',
    },
    {
      time: '12:30',
      label: 'Lunch',
      description: 'Large rice, pasta, potatoes, or bread bowl with lean protein and vegetables.',
      purpose: 'Restore carbohydrate after the long run.',
    },
    {
      time: '17:15',
      label: 'Recovery snack',
      description: 'Fruit, chocolate milk, protein shake with fruit, yoghurt with granola, or a simple sandwich.',
      purpose: 'Keep recovery moving before dinner.',
    },
    {
      time: '20:00',
      label: 'Dinner',
      description: 'Carb-rich dinner with potatoes, rice, or pasta plus protein and vegetables.',
      purpose: 'Complete long-run refueling.',
    },
  ],
  notes: [
    'Practice gels and drink mix on long runs with marathon-pace blocks.',
    'Start around 30-60 g carbs/hour, then build toward 60-90 g/hour when the gut tolerates it.',
    'Do not wait until you feel empty before fueling.',
  ],
}

export const raceWeekMeal: MealPlan = {
  templateId: 'race_week',
  carbFocus: 'very_high',
  proteinFocus: 'Normal protein portions, nothing extreme.',
  hydrationFocus: 'Consistent water and electrolytes; avoid last-minute over-drinking.',
  meals: [
    {
      time: '10:30',
      label: '10:30 snack',
      description: 'Banana, yoghurt, bread with jam, rice cakes, or a familiar cereal bar.',
      purpose: 'Keep energy stable.',
    },
    {
      time: '12:30',
      label: 'Lunch',
      description: 'Simple rice, pasta, wrap, potatoes, or bread-based lunch with familiar protein.',
      purpose: 'Carbohydrate availability without digestive risk.',
    },
    {
      time: '17:15',
      label: 'Pre-run snack',
      description: 'Small familiar carbohydrate snack when running in the evening.',
      purpose: 'Support short tune-up sessions.',
    },
    {
      time: '20:00',
      label: 'Dinner',
      description: 'Simple pasta, rice, potatoes, or bread with lean protein and familiar sides.',
      purpose: 'Calm race-week fueling.',
    },
  ],
  notes: [
    'In the final 2-3 days, bias toward familiar carbohydrate-rich meals.',
    'Keep fiber, heavy fats, spicy food, and new foods conservative from Friday onward.',
    'Hydrate steadily with electrolytes, but avoid panic-drinking.',
  ],
}

export const socialFestivalMeal: MealPlan = {
  templateId: 'social_festival',
  carbFocus: 'moderate',
  proteinFocus: 'Fit in simple protein when possible; do not arrive under-fed.',
  hydrationFocus: 'Alternate alcohol with water and add electrolytes before sleep.',
  meals: [
    {
      time: '10:30',
      label: '10:30 snack',
      description: 'Banana, yoghurt, sandwich, or fruit and nuts before the day gets chaotic.',
      purpose: 'Avoid running on empty socially.',
    },
    {
      time: '12:30',
      label: 'Lunch',
      description: 'Bread, wrap, rice bowl, pasta, or potatoes with a protein source.',
      purpose: 'Anchor the day with real food.',
    },
    {
      time: '20:00',
      label: 'Dinner',
      description: 'The most normal available meal: rice, pasta, potatoes, bread, or salty/carby food plus protein.',
      purpose: 'Limit recovery damage from the social block.',
    },
  ],
  notes: [
    'No strict rules here; the win is hydration, sodium, and getting enough food.',
    'A proper meal before drinking is more useful than trying to compensate afterward.',
    'Electrolytes before sleep make the next morning less messy.',
  ],
}

export const postAlcoholRecoveryMeal: MealPlan = {
  templateId: 'post_alcohol_recovery',
  carbFocus: 'moderate',
  proteinFocus: 'Protein at lunch and dinner to restart recovery.',
  hydrationFocus: 'Water plus electrolytes early, then steady fluids through the day.',
  meals: [
    {
      time: '10:30',
      label: '10:30 snack',
      description: 'Banana, yoghurt with granola, toast with honey, or a sports drink if solid food is hard.',
      purpose: 'Gentle carbohydrate and fluid after a late night.',
    },
    {
      time: '12:30',
      label: 'Lunch',
      description: 'Rice bowl, wrap, soup with bread, eggs on toast, or potatoes with a simple protein.',
      purpose: 'Restore normal eating before training resumes.',
    },
    {
      time: '20:00',
      label: 'Dinner',
      description: 'Simple potatoes, pasta, or rice with chicken, fish, tofu, or eggs.',
      purpose: 'Support sleep and recovery.',
    },
  ],
  notes: [
    'Resume running only when hydration, sleep, and Achilles feel acceptable.',
    'Keep food digestion-friendly and avoid turning the day into another stressor.',
  ],
}

export const mealTemplatesById: Record<MealTemplateId, MealPlan> = {
  rest_day: restDayMeal,
  easy_run: easyRunMeal,
  workout_day: workoutDayMeal,
  long_run: longRunMeal,
  race_week: raceWeekMeal,
  social_festival: socialFestivalMeal,
  post_alcohol_recovery: postAlcoholRecoveryMeal,
}

export function getMealTemplate(templateId: MealTemplateId): MealPlan {
  const template = mealTemplatesById[templateId]

  return {
    ...template,
    meals: template.meals.map((meal) => ({ ...meal })),
    notes: [...template.notes],
  }
}
