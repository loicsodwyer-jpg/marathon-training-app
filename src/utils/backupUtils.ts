import type {
  AppBackupFile,
  BackupImportResult,
  BackupTheme,
  LocalDataSummary,
} from '../types/backup'
import { formatDateKey } from './dateUtils'
import {
  clearFuelingPreferences,
  loadFuelingPreferences,
  normalizeFuelingPreferences,
  saveFuelingPreferences,
} from './fuelingStorage'
import {
  clearAllGroceryChecks,
  loadGroceryChecks,
  normalizeGroceryChecks,
  saveGroceryChecks,
} from './groceryListStorage'
import { NOTIFICATION_PREFERENCES_STORAGE_KEY, THEME_STORAGE_KEY } from './localStorageKeys'
import {
  clearNotificationPreferences,
  loadNotificationPreferences,
  normalizeNotificationPreferences,
  saveNotificationPreferences,
} from './notificationPreferencesStorage'
import {
  clearAllPlanOverrides,
  loadPlanOverrides,
  normalizePlanOverridesState,
  savePlanOverrides,
} from './planOverrideStorage'
import {
  clearAllScheduleOverrides,
  getAllScheduleOverrides,
  normalizeScheduleOverridesRecord,
  saveAllScheduleOverrides,
} from './scheduleStorage'
import {
  clearAllWorkoutLogs,
  loadWorkoutLogs,
  normalizeWorkoutLogRecord,
  saveWorkoutLogs,
} from './workoutLogStorage'

const appName = 'Loïc Marathon 2:55' as const
const schemaVersion = 1 as const

type ImportOptions = {
  merge?: boolean
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isBackupTheme(value: unknown): value is BackupTheme {
  return value === 'dark' || value === 'light'
}

function getStoredTheme(): BackupTheme | undefined {
  if (!canUseLocalStorage()) {
    return undefined
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isBackupTheme(storedTheme) ? storedTheme : undefined
  } catch {
    return undefined
  }
}

function saveStoredTheme(theme: BackupTheme | undefined) {
  if (!theme || !canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Keep import usable if browser storage is unavailable or full.
  }
}

function clearStoredTheme() {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    // Keep clear actions from crashing in restricted browser contexts.
  }
}

function hasStoredNotificationPreferences() {
  if (!canUseLocalStorage()) {
    return false
  }

  try {
    return window.localStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY) !== null
  } catch {
    return false
  }
}

function getLatestWorkoutLogDate(workoutLogs: Record<string, unknown>) {
  const sortedDates = Object.keys(workoutLogs).sort()
  return sortedDates[sortedDates.length - 1]
}

function downloadTextFile(filename: string, content: string, type: string) {
  if (typeof document === 'undefined') {
    return
  }

  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function createFullBackup(): AppBackupFile {
  const workoutLogs = loadWorkoutLogs()
  const scheduleOverrides = getAllScheduleOverrides()
  const planOverrides = loadPlanOverrides()
  const groceryChecks = loadGroceryChecks()
  const planAdjustmentCount = Object.keys(planOverrides.records).length
  const adjustedDayCount = Object.keys(planOverrides.dayOverrides).length

  return {
    appName,
    schemaVersion,
    exportedAt: new Date().toISOString(),
    source: 'local-device',
    data: {
      workoutLogs,
      scheduleOverrides,
      planOverrides,
      fuelingPreferences: loadFuelingPreferences(),
      groceryChecks,
      notificationPreferences: loadNotificationPreferences(),
      settings: {
        theme: getStoredTheme(),
      },
    },
    metadata: {
      workoutLogCount: Object.keys(workoutLogs).length,
      scheduleOverrideDayCount: Object.keys(scheduleOverrides).length,
      planAdjustmentCount,
      adjustedDayCount,
      groceryCheckedWeekCount: Object.keys(groceryChecks).length,
      hasNotificationPreferences: true,
      latestWorkoutLogDate: getLatestWorkoutLogDate(workoutLogs),
    },
  }
}

export function downloadFullBackup(): void {
  const backup = createFullBackup()
  const dateKey = formatDateKey(new Date())
  downloadTextFile(
    `loic-marathon-backup-${dateKey}.json`,
    JSON.stringify(backup, null, 2),
    'application/json',
  )
}

export function validateBackupFile(value: unknown): value is AppBackupFile {
  if (!isRecord(value)) {
    return false
  }

  if (
    value.appName !== appName ||
    value.schemaVersion !== schemaVersion ||
    value.source !== 'local-device' ||
    !isString(value.exportedAt) ||
    !isRecord(value.data) ||
    !isRecord(value.metadata)
  ) {
    return false
  }

  const { data, metadata } = value

  if (!isRecord(data.workoutLogs) || !isRecord(data.scheduleOverrides)) {
    return false
  }

  const settings = data.settings
  const validSettings =
    isRecord(settings) && (settings.theme === undefined || isBackupTheme(settings.theme))

  if (!validSettings) {
    return false
  }

  const validMetadata =
    isNumber(metadata.workoutLogCount) &&
    isNumber(metadata.scheduleOverrideDayCount) &&
    (metadata.planAdjustmentCount === undefined || isNumber(metadata.planAdjustmentCount)) &&
    (metadata.adjustedDayCount === undefined || isNumber(metadata.adjustedDayCount)) &&
    (metadata.groceryCheckedWeekCount === undefined ||
      isNumber(metadata.groceryCheckedWeekCount)) &&
    (metadata.hasNotificationPreferences === undefined ||
      typeof metadata.hasNotificationPreferences === 'boolean') &&
    (metadata.latestWorkoutLogDate === undefined || isString(metadata.latestWorkoutLogDate))

  if (!validMetadata) {
    return false
  }

  const workoutLogKeys = Object.keys(data.workoutLogs)
  const scheduleOverrideKeys = Object.keys(data.scheduleOverrides)
  const planOverrides = data.planOverrides
  const normalizedPlanOverrides = normalizePlanOverridesState(planOverrides)
  const groceryChecks = data.groceryChecks

  return (
    Object.keys(normalizeWorkoutLogRecord(data.workoutLogs)).length === workoutLogKeys.length &&
    Object.keys(normalizeScheduleOverridesRecord(data.scheduleOverrides)).length ===
      scheduleOverrideKeys.length &&
    (planOverrides === undefined ||
      Object.keys(normalizedPlanOverrides.records).length + Object.keys(normalizedPlanOverrides.dayOverrides).length >
        0 ||
      (isRecord(planOverrides) &&
        Object.keys(isRecord(planOverrides.records) ? planOverrides.records : {}).length === 0 &&
        Object.keys(isRecord(planOverrides.dayOverrides) ? planOverrides.dayOverrides : {}).length === 0)) &&
    (groceryChecks === undefined || isRecord(groceryChecks))
  )
}

export function importFullBackup(
  backup: AppBackupFile,
  options: ImportOptions = {},
): BackupImportResult {
  if (!validateBackupFile(backup)) {
    return {
      success: false,
      message: 'Invalid backup file. No local data was changed.',
    }
  }

  try {
    const backupWorkoutLogs = normalizeWorkoutLogRecord(backup.data.workoutLogs)
    const backupScheduleOverrides = normalizeScheduleOverridesRecord(
      backup.data.scheduleOverrides,
    )
    const backupPlanOverrides = normalizePlanOverridesState(backup.data.planOverrides)
    const backupFuelingPreferences =
      backup.data.fuelingPreferences === undefined && options.merge
        ? loadFuelingPreferences()
        : normalizeFuelingPreferences(backup.data.fuelingPreferences)
    const backupGroceryChecks = normalizeGroceryChecks(backup.data.groceryChecks)
    const backupNotificationPreferences =
      backup.data.notificationPreferences === undefined && options.merge
        ? loadNotificationPreferences()
        : normalizeNotificationPreferences(backup.data.notificationPreferences)
    const workoutLogs = options.merge
      ? { ...loadWorkoutLogs(), ...backupWorkoutLogs }
      : backupWorkoutLogs
    const scheduleOverrides = options.merge
      ? { ...getAllScheduleOverrides(), ...backupScheduleOverrides }
      : backupScheduleOverrides
    const existingPlanOverrides = loadPlanOverrides()
    const planOverrides = options.merge
      ? {
          schemaVersion: 1 as const,
          records: {
            ...existingPlanOverrides.records,
            ...backupPlanOverrides.records,
          },
          dayOverrides: {
            ...existingPlanOverrides.dayOverrides,
            ...backupPlanOverrides.dayOverrides,
          },
        }
      : backupPlanOverrides
    const groceryChecks = options.merge
      ? {
          ...loadGroceryChecks(),
          ...backupGroceryChecks,
        }
      : backupGroceryChecks

    saveWorkoutLogs(workoutLogs)
    saveAllScheduleOverrides(scheduleOverrides)
    savePlanOverrides(planOverrides)
    saveFuelingPreferences(backupFuelingPreferences)
    saveGroceryChecks(groceryChecks)
    saveNotificationPreferences(backupNotificationPreferences)
    saveStoredTheme(backup.data.settings.theme)

    return {
      success: true,
      message: options.merge ? 'Backup merged successfully.' : 'Backup restored successfully.',
      importedWorkoutLogCount: Object.keys(backupWorkoutLogs).length,
      importedScheduleOverrideDayCount: Object.keys(backupScheduleOverrides).length,
      importedPlanAdjustmentCount: Object.keys(backupPlanOverrides.records).length,
      importedAdjustedDayCount: Object.keys(backupPlanOverrides.dayOverrides).length,
      importedGroceryCheckedWeekCount: Object.keys(backupGroceryChecks).length,
      importedNotificationPreferences: backup.data.notificationPreferences !== undefined,
    }
  } catch {
    return {
      success: false,
      message: 'Import failed. No local data was changed.',
    }
  }
}

export function getLocalDataSummary(): LocalDataSummary {
  const workoutLogs = loadWorkoutLogs()
  const scheduleOverrides = getAllScheduleOverrides()
  const planOverrides = loadPlanOverrides()
  const groceryChecks = loadGroceryChecks()

  return {
    workoutLogCount: Object.keys(workoutLogs).length,
    scheduleOverrideDayCount: Object.keys(scheduleOverrides).length,
    planAdjustmentCount: Object.keys(planOverrides.records).length,
    adjustedDayCount: Object.keys(planOverrides.dayOverrides).length,
    groceryCheckedWeekCount: Object.keys(groceryChecks).length,
    hasNotificationPreferences: hasStoredNotificationPreferences(),
    latestWorkoutLogDate: getLatestWorkoutLogDate(workoutLogs),
    theme: getStoredTheme(),
    storageMode: 'Local only',
  }
}

export function clearWorkoutLogsOnly(): void {
  clearAllWorkoutLogs()
}

export function clearScheduleOverridesOnly(): void {
  clearAllScheduleOverrides()
}

export function clearPlanOverridesOnly(): void {
  clearAllPlanOverrides()
}

export function clearGroceryChecksOnly(): void {
  clearAllGroceryChecks()
}

export function clearAllLocalAppData(): void {
  clearAllWorkoutLogs()
  clearAllScheduleOverrides()
  clearAllPlanOverrides()
  clearFuelingPreferences()
  clearAllGroceryChecks()
  clearNotificationPreferences()
  clearStoredTheme()
}
