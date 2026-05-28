export type GroceryCategory =
  | 'carbs'
  | 'protein'
  | 'fruit_veg'
  | 'dairy'
  | 'snacks'
  | 'fueling'
  | 'hydration'
  | 'breakfast_optional'
  | 'misc'

export type GroceryPriority = 'essential' | 'recommended' | 'optional'

export interface GroceryItem {
  id: string
  name: string
  quantity: string
  category: GroceryCategory
  reason: string
  priority: GroceryPriority
  relatedDays?: string[]
}

export interface WeeklyGroceryList {
  weekNumber: number
  startDate: string
  endDate: string
  title: string
  summary: string
  items: GroceryItem[]
}

export type GroceryChecksState = Record<string, Record<string, boolean>>
