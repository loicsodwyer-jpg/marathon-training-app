import type { DailyScheduleBlock } from '../types/schedule'
import { calculateDurationMinutes, timeToMinutes } from './scheduleTimeUtils'

export type CalendarPositionedBlock = DailyScheduleBlock & {
  topPx: number
  heightPx: number
  columnIndex: number
  columnCount: number
  leftPercent: number
  widthPercent: number
}

export type CalendarLayoutOptions = {
  dayStartHour: number
  dayEndHour: number
  hourHeightPx: number
  minimumBlockHeightPx: number
}

function blocksOverlap(firstBlock: DailyScheduleBlock, secondBlock: DailyScheduleBlock) {
  return (
    timeToMinutes(firstBlock.startTime) < timeToMinutes(secondBlock.endTime) &&
    timeToMinutes(secondBlock.startTime) < timeToMinutes(firstBlock.endTime)
  )
}

function getOverlapGroups(blocks: DailyScheduleBlock[]) {
  const sortedBlocks = [...blocks].sort((firstBlock, secondBlock) => {
    const startDiff = timeToMinutes(firstBlock.startTime) - timeToMinutes(secondBlock.startTime)

    if (startDiff !== 0) {
      return startDiff
    }

    return timeToMinutes(secondBlock.endTime) - timeToMinutes(firstBlock.endTime)
  })
  const groups: DailyScheduleBlock[][] = []

  for (const block of sortedBlocks) {
    const group = groups.find((candidateGroup) =>
      candidateGroup.some((candidateBlock) => blocksOverlap(block, candidateBlock)),
    )

    if (group) {
      group.push(block)
    } else {
      groups.push([block])
    }
  }

  let merged = true

  while (merged) {
    merged = false

    for (let index = 0; index < groups.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < groups.length; compareIndex += 1) {
        const groupsOverlap = groups[index].some((firstBlock) =>
          groups[compareIndex].some((secondBlock) => blocksOverlap(firstBlock, secondBlock)),
        )

        if (groupsOverlap) {
          groups[index] = [...groups[index], ...groups[compareIndex]]
          groups.splice(compareIndex, 1)
          merged = true
          break
        }
      }

      if (merged) {
        break
      }
    }
  }

  return groups
}

function assignColumns(blocks: DailyScheduleBlock[]) {
  const sortedBlocks = [...blocks].sort((firstBlock, secondBlock) => {
    const startDiff = timeToMinutes(firstBlock.startTime) - timeToMinutes(secondBlock.startTime)

    if (startDiff !== 0) {
      return startDiff
    }

    return calculateDurationMinutes(secondBlock.startTime, secondBlock.endTime) -
      calculateDurationMinutes(firstBlock.startTime, firstBlock.endTime)
  })
  const columnEndTimes: number[] = []
  const columnAssignments = new Map<string, number>()

  for (const block of sortedBlocks) {
    const blockStart = timeToMinutes(block.startTime)
    const openColumnIndex = columnEndTimes.findIndex((endTime) => endTime <= blockStart)
    const columnIndex = openColumnIndex >= 0 ? openColumnIndex : columnEndTimes.length

    columnEndTimes[columnIndex] = timeToMinutes(block.endTime)
    columnAssignments.set(block.id, columnIndex)
  }

  return {
    columnAssignments,
    columnCount: Math.max(columnEndTimes.length, 1),
  }
}

export function getPositionedScheduleBlocks(
  blocks: DailyScheduleBlock[],
  options: CalendarLayoutOptions,
): CalendarPositionedBlock[] {
  const pixelsPerMinute = options.hourHeightPx / 60
  const dayStartMinutes = options.dayStartHour * 60
  const dayEndMinutes = options.dayEndHour * 60
  const positionedBlocks = new Map<string, CalendarPositionedBlock>()

  for (const group of getOverlapGroups(blocks)) {
    const { columnAssignments, columnCount } = assignColumns(group)

    for (const block of group) {
      const startMinutes = Math.max(timeToMinutes(block.startTime), dayStartMinutes)
      const endMinutes = Math.min(timeToMinutes(block.endTime), dayEndMinutes)
      const durationMinutes = Math.max(endMinutes - startMinutes, 1)
      const columnIndex = columnAssignments.get(block.id) ?? 0
      const widthPercent = 100 / columnCount
      const leftPercent = columnIndex * widthPercent

      positionedBlocks.set(block.id, {
        ...block,
        topPx: (startMinutes - dayStartMinutes) * pixelsPerMinute,
        heightPx: Math.max(durationMinutes * pixelsPerMinute, options.minimumBlockHeightPx),
        columnIndex,
        columnCount,
        leftPercent,
        widthPercent,
      })
    }
  }

  return [...positionedBlocks.values()].sort((firstBlock, secondBlock) => {
    const startDiff = timeToMinutes(firstBlock.startTime) - timeToMinutes(secondBlock.startTime)

    if (startDiff !== 0) {
      return startDiff
    }

    return firstBlock.columnIndex - secondBlock.columnIndex
  })
}
