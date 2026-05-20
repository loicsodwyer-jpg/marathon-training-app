export type ISODateString = string
export type TimeString = string

export type TrainingPhase =
  | 'recovery'
  | 'base'
  | 'build'
  | 'specific'
  | 'peak'
  | 'taper'
  | 'race'

export type RunType =
  | 'recovery'
  | 'easy'
  | 'steady'
  | 'medium_long'
  | 'long'
  | 'threshold'
  | 'interval'
  | 'marathon_pace'
  | 'progression'
  | 'race'
  | 'rest'

export type DayType =
  | 'run'
  | 'strength'
  | 'run_strength'
  | 'rest'
  | 'social'
  | 'race'
  | 'travel'
  | 'recovery'

export type IntensityLevel = 'rest' | 'low' | 'moderate' | 'high' | 'race'

export type HRZone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'

export type PaceRange = {
  minPerKmFrom: string
  minPerKmTo: string
  description: string
}

export type WorkoutInterval = {
  label: string
  repetitions: number
  distanceKm?: number
  durationMinutes?: number
  targetPace?: PaceRange
  targetHrZone?: HRZone
  recoveryDistanceKm?: number
  recoveryDurationMinutes?: number
  recoveryInstruction?: string
}

export type RunWorkout = {
  id: string
  type: RunType
  title: string
  startTime?: TimeString
  plannedDistanceKm: number
  estimatedDurationMinutes?: number
  targetPace?: PaceRange
  targetHrZone?: HRZone
  targetHrDescription?: string
  warmupKm?: number
  cooldownKm?: number
  intervals?: WorkoutInterval[]
  instructions: string[]
  fuelNotes?: string[]
  recoveryNotes?: string[]
}

export type StrengthExercise = {
  name: string
  sets: string
  reps: string
  rest: string
  intensity?: string
  notes?: string
}

export type StrengthSession = {
  id: string
  title: string
  shortTitle: string
  startTime?: TimeString
  estimatedDurationMinutes: number
  focus: string
  exercises: StrengthExercise[]
  warmup?: string[]
  cooldown?: string[]
  progressionNotes?: string[]
}

export type MealItem = {
  time: TimeString
  label: string
  description: string
  purpose: string
}

export type MealPlan = {
  templateId: string
  carbFocus: 'low' | 'moderate' | 'high' | 'very_high'
  proteinFocus: string
  hydrationFocus: string
  meals: MealItem[]
  notes: string[]
}

export type SpecialEvent = {
  id: string
  title: string
  startDate: ISODateString
  endDate: ISODateString
  category: 'race' | 'birthday' | 'festival' | 'wedding' | 'recovery' | 'social'
  trainingImpact: string
  alcoholRisk?: 'none' | 'low' | 'moderate' | 'high'
}

export type DayPlan = {
  date: ISODateString
  weekNumber: number
  dayOfWeek: string
  phase: TrainingPhase
  dayType: DayType
  intensity: IntensityLevel
  title: string
  summary: string
  plannedRun?: RunWorkout
  strengthSessionIds?: string[]
  mealPlan: MealPlan
  specialEventIds?: string[]
  sleepTargetHours: number
  notes: string[]
  completed?: boolean
}

export type WeekPlan = {
  weekNumber: number
  startDate: ISODateString
  endDate: ISODateString
  phase: TrainingPhase
  targetMileageKm: number
  focus: string
  days: DayPlan[]
}

export type TrainingPlanStats = {
  startDate: ISODateString
  endDate: ISODateString
  totalDays: number
  totalWeeks: number
  totalPlannedKm: number
  peakWeekKm: number
  peakWeekNumber: number
  numberOfRuns: number
  numberOfStrengthSessions: number
  numberOfRestDays: number
}
