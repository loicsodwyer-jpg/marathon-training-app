import { useState } from 'react'
import type { WorkoutLogEntry, WorkoutLogInput } from '../types/workoutLog'
import {
  deleteWorkoutLog,
  loadWorkoutLogs,
  saveWorkoutLog,
} from '../utils/workoutLogStorage'

export function useWorkoutLogs() {
  const [logs, setLogs] = useState<Record<string, WorkoutLogEntry>>(() => loadWorkoutLogs())

  const refreshLogs = () => {
    setLogs(loadWorkoutLogs())
  }

  const saveLog = (date: string, input: WorkoutLogInput) => {
    const savedLog = saveWorkoutLog(date, input)
    setLogs((currentLogs) => ({
      ...currentLogs,
      [date]: savedLog,
    }))
    return savedLog
  }

  const deleteLog = (date: string) => {
    deleteWorkoutLog(date)
    setLogs((currentLogs) => {
      const nextLogs = { ...currentLogs }
      delete nextLogs[date]
      return nextLogs
    })
  }

  const getLogForDate = (date: string) => logs[date]
  const hasLogForDate = (date: string) => Boolean(logs[date])

  return {
    logs,
    getLogForDate,
    saveLog,
    deleteLog,
    hasLogForDate,
    refreshLogs,
  }
}
