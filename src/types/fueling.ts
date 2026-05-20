export type FuelingProductType = 'gel' | 'drink_mix' | 'solid' | 'water' | 'electrolytes'

export interface FuelingProduct {
  id: string
  brand: 'Maurten' | 'Generic'
  name: string
  type: FuelingProductType
  carbsGrams: number
  caffeineMg?: number
  servingDescription: string
  notes?: string[]
}

export type FuelingSessionCategory =
  | 'none'
  | 'optional'
  | 'light'
  | 'moderate'
  | 'marathon_specific'
  | 'race'

export interface FuelingPreferences {
  preferredBrand: 'Maurten'
  caffeineEnabled: boolean
  caffeineForEveningRuns: boolean
  preferredGelSize: 'gel_100' | 'gel_160' | 'mixed'
  useDrinkMix: boolean
  targetCarbsPerHourLongRun: number
  targetCarbsPerHourRace: number
  stomachSensitive: boolean
}

export interface FuelingItem {
  productId: string
  productName: string
  quantity: number
  timing: string
  carbsGrams: number
  caffeineMg?: number
  instruction: string
}

export interface FuelingRecommendation {
  category: FuelingSessionCategory
  title: string
  summary: string
  estimatedDurationMinutes?: number
  targetCarbsPerHour?: number
  totalRecommendedCarbs?: number
  preRun: FuelingItem[]
  duringRun: FuelingItem[]
  postRun: FuelingItem[]
  hydrationNotes: string[]
  practiceNotes: string[]
  warnings: string[]
}
