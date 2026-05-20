import type { RunWorkout } from '../types/training'
import type { WorkoutLogEntry } from '../types/workoutLog'
import { paceStringToSeconds } from './timeFormatUtils'

export function calculateDistanceDelta(
  plannedKm?: number,
  actualKm?: number,
): number | undefined {
  if (plannedKm === undefined || actualKm === undefined) {
    return undefined
  }

  return Math.round((actualKm - plannedKm) * 10) / 10
}

export function getDistanceExecutionLabel(plannedKm?: number, actualKm?: number): string {
  const delta = calculateDistanceDelta(plannedKm, actualKm)

  if (delta === undefined) {
    return 'No distance logged'
  }

  if (Math.abs(delta) <= 0.5) {
    return 'On plan'
  }

  if (delta < -0.5 && delta >= -2) {
    return 'Slightly short'
  }

  if (delta < -2) {
    return 'Shorter than planned'
  }

  return 'Longer than planned'
}

export function getCompletionLabel(log: WorkoutLogEntry | undefined): string {
  if (!log) {
    return 'Not logged'
  }

  return log.completionStatus.replace('_', ' ')
}

export function getRecoveryRiskHint(log: WorkoutLogEntry | undefined): string {
  if (!log) {
    return 'Recovery not logged yet'
  }

  if (log.alcoholYesterday === 'heavy') {
    return 'Heavy alcohol - hydrate and resume carefully'
  }

  if (log.alcoholYesterday === 'moderate') {
    return 'Moderate alcohol - keep recovery simple'
  }

  if (log.averageHr !== undefined && log.averageHr >= 170) {
    return 'High average HR - note effort and recovery'
  }

  return 'Recovery looks okay'
}

export function getPaceExecutionLabel(
  plannedRun: RunWorkout | undefined,
  actualPace: string | undefined,
): string {
  if (!plannedRun?.targetPace) {
    return 'Pace target not available'
  }

  if (!actualPace) {
    return 'No pace logged'
  }

  const actualSeconds = paceStringToSeconds(actualPace)
  const fastEndSeconds = paceStringToSeconds(plannedRun.targetPace.minPerKmFrom)
  const slowEndSeconds = paceStringToSeconds(plannedRun.targetPace.minPerKmTo)

  if (
    actualSeconds === undefined ||
    fastEndSeconds === undefined ||
    slowEndSeconds === undefined
  ) {
    return 'Pace target not available'
  }

  if (actualSeconds >= fastEndSeconds && actualSeconds <= slowEndSeconds) {
    return 'Inside target range'
  }

  if (actualSeconds < fastEndSeconds) {
    return plannedRun.type === 'easy' || plannedRun.type === 'recovery'
      ? 'Faster than planned - be careful'
      : 'Faster than target'
  }

  return 'Slower than target, check effort and conditions'
}
