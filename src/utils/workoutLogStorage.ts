import type {
  AlcoholLevel,
  CompletionStatus,
  WorkoutLogEntry,
  WorkoutLogInput,
} from '../types/workoutLog'
import { WORKOUT_LOGS_STORAGE_KEY } from './localStorageKeys'
import { calculatePaceMinPerKm } from './timeFormatUtils'

const completionStatuses: CompletionStatus[] = ['completed', 'partial', 'missed', 'rest', 'skipped']
const alcoholLevels: AlcoholLevel[] = ['none', 'light', 'moderate', 'heavy']

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

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isCompletionStatus(value: unknown): value is CompletionStatus {
  return isString(value) && completionStatuses.includes(value as CompletionStatus)
}

function isAlcoholLevel(value: unknown): value is AlcoholLevel {
  return isString(value) && alcoholLevels.includes(value as AlcoholLevel)
}

function optionalNumber(value: unknown): number | undefined {
  return isNumber(value) ? value : undefined
}

function optionalString(value: unknown): string | undefined {
  return isString(value) ? value : undefined
}

function sanitizeLogEntry(value: unknown): WorkoutLogEntry | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  if (
    !isString(value.date) ||
    !isCompletionStatus(value.completionStatus) ||
    !isBoolean(value.runCompleted) ||
    !isBoolean(value.strengthCompleted) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt)
  ) {
    return undefined
  }

  return {
    date: value.date,
    completionStatus: value.completionStatus,
    runCompleted: value.runCompleted,
    strengthCompleted: value.strengthCompleted,
    actualDistanceKm: optionalNumber(value.actualDistanceKm),
    actualDurationMinutes: optionalNumber(value.actualDurationMinutes),
    actualPaceMinPerKm: optionalString(value.actualPaceMinPerKm),
    averageHr: optionalNumber(value.averageHr),
    maxHr: optionalNumber(value.maxHr),
    alcoholYesterday: isAlcoholLevel(value.alcoholYesterday) ? value.alcoholYesterday : undefined,
    notes: optionalString(value.notes),
    stravaUrl: optionalString(value.stravaUrl),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function removeEmptyText(value: string | undefined) {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : undefined
}

export function normalizeWorkoutLogRecord(value: unknown): Record<string, WorkoutLogEntry> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<Record<string, WorkoutLogEntry>>(
    (result, [date, logValue]) => {
      const logEntry = sanitizeLogEntry(logValue)

      if (logEntry) {
        result[date] = logEntry
      }

      return result
    },
    {},
  )
}

export function loadWorkoutLogs(): Record<string, WorkoutLogEntry> {
  if (!canUseLocalStorage()) {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(WORKOUT_LOGS_STORAGE_KEY)

    if (!rawValue) {
      return {}
    }

    const parsedValue: unknown = JSON.parse(rawValue)

    return normalizeWorkoutLogRecord(parsedValue)
  } catch {
    return {}
  }
}

export function saveWorkoutLogs(logs: Record<string, WorkoutLogEntry>): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(WORKOUT_LOGS_STORAGE_KEY, JSON.stringify(logs))
  } catch {
    // Keep the app usable if browser storage is unavailable or full.
  }
}

export function getWorkoutLog(date: string): WorkoutLogEntry | undefined {
  return loadWorkoutLogs()[date]
}

export function saveWorkoutLog(date: string, input: WorkoutLogInput): WorkoutLogEntry {
  const logs = loadWorkoutLogs()
  const existingLog = logs[date]
  const now = new Date().toISOString()
  const actualPaceMinPerKm =
    input.actualDistanceKm !== undefined &&
    input.actualDurationMinutes !== undefined &&
    input.actualDistanceKm > 0 &&
    input.actualDurationMinutes > 0
      ? calculatePaceMinPerKm(input.actualDistanceKm, input.actualDurationMinutes)
      : undefined
  const logEntry: WorkoutLogEntry = {
    date,
    completionStatus: input.completionStatus,
    runCompleted: input.runCompleted,
    strengthCompleted: input.strengthCompleted,
    actualDistanceKm: input.actualDistanceKm,
    actualDurationMinutes: input.actualDurationMinutes,
    actualPaceMinPerKm,
    averageHr: input.averageHr,
    maxHr: input.maxHr,
    alcoholYesterday: input.alcoholYesterday,
    notes: removeEmptyText(input.notes),
    stravaUrl: removeEmptyText(input.stravaUrl),
    createdAt: existingLog?.createdAt ?? now,
    updatedAt: now,
  }

  logs[date] = logEntry
  saveWorkoutLogs(logs)

  return logEntry
}

export function deleteWorkoutLog(date: string): void {
  const logs = loadWorkoutLogs()
  delete logs[date]
  saveWorkoutLogs(logs)
}

export function clearAllWorkoutLogs(): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(WORKOUT_LOGS_STORAGE_KEY)
  } catch {
    // Keep settings actions from crashing in restricted browser contexts.
  }
}
