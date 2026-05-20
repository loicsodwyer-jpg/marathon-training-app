export type CalendarExportRange = 'current_week' | 'next_4_weeks' | 'full_plan' | 'custom'

export interface CalendarExportSettings {
  range: CalendarExportRange
  startDate: string
  endDate: string
  includeRuns: boolean
  includeStrength: boolean
  includeRace: boolean
  includeSpecialEvents: boolean
  includeMeals: boolean
  includeRecoveryReminders: boolean
  includeCompletedLoggedSessions: boolean
  calendarName: string
  timezone: string
}

export type CalendarEventCategory =
  | 'run'
  | 'strength'
  | 'race'
  | 'meal'
  | 'special'
  | 'recovery'
  | 'custom'

export interface CalendarExportEvent {
  id: string
  date: string
  title: string
  description: string
  startTime: string
  endTime: string
  category: CalendarEventCategory
  location?: string
  allDay?: boolean
}
