export type CompletionStatus = 'completed' | 'partial' | 'missed' | 'rest' | 'skipped'

export type AlcoholLevel = 'none' | 'light' | 'moderate' | 'heavy'

export type WorkoutFeeling = 'very_good' | 'good' | 'okay' | 'tired' | 'bad'

export interface WorkoutLogEntry {
  date: string
  completionStatus: CompletionStatus
  runCompleted: boolean
  strengthCompleted: boolean
  actualDistanceKm?: number
  actualDurationMinutes?: number
  actualPaceMinPerKm?: string
  averageHr?: number
  maxHr?: number
  alcoholYesterday?: AlcoholLevel
  notes?: string
  stravaUrl?: string
  createdAt: string
  updatedAt: string
}

export interface WorkoutLogInput {
  completionStatus: CompletionStatus
  runCompleted: boolean
  strengthCompleted: boolean
  actualDistanceKm?: number
  actualDurationMinutes?: number
  averageHr?: number
  maxHr?: number
  alcoholYesterday?: AlcoholLevel
  notes?: string
  stravaUrl?: string
}
