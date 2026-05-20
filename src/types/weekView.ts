import type { DailyScheduleBlock } from './schedule'
import type { DayPlanOverride } from './planOverride'
import type { DayPlan, SpecialEvent } from './training'
import type { WorkoutLogEntry } from './workoutLog'

export interface WeekViewDay {
  date: string
  dayName: string
  dayShort: string
  displayDate: string
  dayPlan?: DayPlan
  blocks: DailyScheduleBlock[]
  keyBlocks: DailyScheduleBlock[]
  workoutLog?: WorkoutLogEntry
  specialEvents: SpecialEvent[]
  adjustment?: DayPlanOverride
  isInsidePlan: boolean
  isToday: boolean
  isSelected: boolean
}

export interface WeekViewSummary {
  weekNumber?: number
  startDate: string
  endDate: string
  phase?: string
  focus?: string
  plannedKm: number
  completedKm: number
  plannedRuns: number
  completedRuns: number
  plannedStrengthSessions: number
  completedStrengthSessions: number
  completionPercent: number
  specialEventLabels: string[]
}
