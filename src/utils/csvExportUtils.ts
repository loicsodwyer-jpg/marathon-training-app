import type { WorkoutLogEntry } from '../types/workoutLog'
import { formatDateKey } from './dateUtils'
import { loadWorkoutLogs } from './workoutLogStorage'

const workoutLogColumns = [
  'date',
  'completionStatus',
  'runCompleted',
  'strengthCompleted',
  'actualDistanceKm',
  'actualDurationMinutes',
  'actualPaceMinPerKm',
  'averageHr',
  'maxHr',
  'alcoholYesterday',
  'stravaUrl',
  'notes',
  'createdAt',
  'updatedAt',
] as const

function escapeCsvValue(value: string | number | boolean | undefined) {
  if (value === undefined) {
    return ''
  }

  const stringValue = String(value)

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }

  return stringValue
}

function getWorkoutLogValue(log: WorkoutLogEntry, column: (typeof workoutLogColumns)[number]) {
  return log[column]
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

export function workoutLogsToCsv(logs: Record<string, WorkoutLogEntry>): string {
  const headerRow = workoutLogColumns.join(',')
  const rows = Object.values(logs)
    .sort((firstLog, secondLog) => firstLog.date.localeCompare(secondLog.date))
    .map((log) =>
      workoutLogColumns
        .map((column) => escapeCsvValue(getWorkoutLogValue(log, column)))
        .join(','),
    )

  return [headerRow, ...rows].join('\n')
}

export function downloadWorkoutLogsCsv(): void {
  const dateKey = formatDateKey(new Date())
  downloadTextFile(
    `loic-marathon-workout-logs-${dateKey}.csv`,
    workoutLogsToCsv(loadWorkoutLogs()),
    'text/csv;charset=utf-8',
  )
}
