import type { StrengthExercise } from './training'

export type StrengthSessionCategory = 'gym' | 'prehab' | 'mobility'

export type StrengthExerciseGroupId =
  | 'warmup'
  | 'main_strength'
  | 'calf_achilles'
  | 'core_mobility'
  | 'accessory'

export interface StrengthExerciseGroup {
  id: StrengthExerciseGroupId
  title: string
  description: string
  exercises: StrengthExercise[]
}
