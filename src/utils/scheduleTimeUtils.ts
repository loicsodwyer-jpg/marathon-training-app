import type { DailyScheduleBlock } from '../types/schedule'

export function timeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const clampedMinutes = Math.min(Math.max(minutes, 0), 23 * 60 + 59)
  const hours = Math.floor(clampedMinutes / 60)
  const remainingMinutes = clampedMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
}

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  return Math.max(timeToMinutes(endTime) - timeToMinutes(startTime), 0)
}

export function addMinutesToTime(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes)
}

export function clampTimeToDay(time: string): string {
  return minutesToTime(timeToMinutes(time))
}

export function sortBlocksByTime<T extends Pick<DailyScheduleBlock, 'startTime' | 'endTime'>>(
  blocks: T[],
): T[] {
  return [...blocks].sort((firstBlock, secondBlock) => {
    const startDiff = timeToMinutes(firstBlock.startTime) - timeToMinutes(secondBlock.startTime)

    if (startDiff !== 0) {
      return startDiff
    }

    return timeToMinutes(firstBlock.endTime) - timeToMinutes(secondBlock.endTime)
  })
}

export function doBlocksOverlap(
  firstBlock: Pick<DailyScheduleBlock, 'startTime' | 'endTime'>,
  secondBlock: Pick<DailyScheduleBlock, 'startTime' | 'endTime'>,
): boolean {
  return (
    timeToMinutes(firstBlock.startTime) < timeToMinutes(secondBlock.endTime) &&
    timeToMinutes(secondBlock.startTime) < timeToMinutes(firstBlock.endTime)
  )
}

export function roundToNearestMinutes(time: string, interval: number): string {
  const roundedMinutes = Math.round(timeToMinutes(time) / interval) * interval
  return minutesToTime(roundedMinutes)
}
