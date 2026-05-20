export type LiveStrengthSessionStatus =
  | 'not_started'
  | 'active'
  | 'paused'
  | 'resting'
  | 'completed'
  | 'ended_early'

export type LiveStrengthExerciseStatus = 'pending' | 'active' | 'completed' | 'skipped'

export type StrengthSessionFeeling = 'very_good' | 'good' | 'okay' | 'hard' | 'bad'

export type LiveStrengthExerciseSection =
  | 'warmup'
  | 'main'
  | 'calf_achilles'
  | 'core_mobility'
  | 'cooldown'

export interface LiveStrengthExerciseStep {
  id: string
  exerciseName: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  section: LiveStrengthExerciseSection
  visualType: string
  status: LiveStrengthExerciseStatus
  completedSets: number
}

export interface LiveStrengthSessionState {
  sessionId: string
  sessionTitle: string
  date: string
  status: LiveStrengthSessionStatus
  startedAt?: string
  endedAt?: string
  currentExerciseIndex: number
  currentRestSecondsRemaining: number
  isTimerRunning: boolean
  steps: LiveStrengthExerciseStep[]
  skippedExerciseIds: string[]
  completedExerciseIds: string[]
}

export interface LiveStrengthProgress {
  completedSets: number
  totalSets: number
  completedExercises: number
  skippedExercises: number
  totalExercises: number
  completionPercent: number
}

export interface LiveStrengthSessionResult {
  sessionId: string
  sessionTitle: string
  date: string
  completed: boolean
  completionPercent: number
  completedExercises: number
  totalExercises: number
  skippedExercises: number
  feeling?: StrengthSessionFeeling
  notes?: string
  startedAt?: string
  endedAt?: string
}
