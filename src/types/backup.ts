import type { DailyScheduleOverrides } from './schedule'
import type { WorkoutLogEntry } from './workoutLog'
import type { PlanOverridesState } from './planOverride'
import type { FuelingPreferences } from './fueling'
import type { GroceryChecksState } from './grocery'
import type { NotificationPreferences } from './notifications'

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
    groceryChecks?: GroceryChecksState
    notificationPreferences?: NotificationPreferences
    settings: {
      theme?: BackupTheme
    }
  }
  metadata: {
    workoutLogCount: number
    scheduleOverrideDayCount: number
    planAdjustmentCount?: number
    adjustedDayCount?: number
    groceryCheckedWeekCount?: number
    hasNotificationPreferences?: boolean
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
  importedGroceryCheckedWeekCount?: number
  importedNotificationPreferences?: boolean
}

export interface LocalDataSummary {
  workoutLogCount: number
  scheduleOverrideDayCount: number
  planAdjustmentCount: number
  adjustedDayCount: number
  groceryCheckedWeekCount: number
  hasNotificationPreferences: boolean
  latestWorkoutLogDate?: string
  theme?: BackupTheme
  storageMode: 'Local only'
}
