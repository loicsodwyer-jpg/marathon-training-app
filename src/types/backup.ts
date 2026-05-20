import type { DailyScheduleOverrides } from './schedule'
import type { WorkoutLogEntry } from './workoutLog'
import type { PlanOverridesState } from './planOverride'
import type { FuelingPreferences } from './fueling'

export type BackupTheme = 'dark' | 'light'

export interface AppBackupFile {
  appName: 'Loïc Marathon 2:55'
  schemaVersion: 1
  exportedAt: string
  source: 'local-device'
  data: {
    workoutLogs: Record<string, WorkoutLogEntry>
    scheduleOverrides: Record<string, DailyScheduleOverrides>
    planOverrides?: PlanOverridesState
    fuelingPreferences?: FuelingPreferences
    settings: {
      theme?: BackupTheme
    }
  }
  metadata: {
    workoutLogCount: number
    scheduleOverrideDayCount: number
    planAdjustmentCount?: number
    adjustedDayCount?: number
    latestWorkoutLogDate?: string
  }
}

export interface BackupImportResult {
  success: boolean
  message: string
  importedWorkoutLogCount?: number
  importedScheduleOverrideDayCount?: number
  importedPlanAdjustmentCount?: number
  importedAdjustedDayCount?: number
}

export interface LocalDataSummary {
  workoutLogCount: number
  scheduleOverrideDayCount: number
  planAdjustmentCount: number
  adjustedDayCount: number
  latestWorkoutLogDate?: string
  theme?: BackupTheme
  storageMode: 'Local only'
}
