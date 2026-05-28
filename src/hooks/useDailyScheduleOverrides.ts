import { useMemo, useState } from 'react'
import type {
  DailyScheduleBlock,
  DailyScheduleOverrides,
  EditableScheduleBlockInput,
  EditableScheduleBlockPatch,
} from '../types/schedule'
import {
  applyScheduleOverridesToGeneratedBlocks,
  getScheduleBlockIdentityIds,
  hasDailyScheduleOverrideChanges,
} from '../utils/scheduleOverrideUtils'
import {
  clearScheduleOverridesForDate,
  getScheduleOverridesForDate,
  saveScheduleOverridesForDate,
} from '../utils/scheduleStorage'
import {
  addMinutesToTime,
  calculateDurationMinutes,
  clampTimeToDay,
  sortBlocksByTime,
} from '../utils/scheduleTimeUtils'

function createEmptyOverrides(date: string): DailyScheduleOverrides {
  return {
    date,
    blockOverrides: {},
    customBlocks: [],
    hiddenDefaultActivityIds: [],
    updatedAt: new Date().toISOString(),
  }
}

function createCustomBlockId(date: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `custom-${date}-${crypto.randomUUID()}`
  }

  return `custom-${date}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function normalizeNextOverrides(overrides: DailyScheduleOverrides) {
  return {
    ...overrides,
    hiddenDefaultActivityIds: overrides.hiddenDefaultActivityIds ?? [],
    updatedAt: new Date().toISOString(),
  }
}

export function useDailyScheduleOverrides(date: string, generatedBlocks: DailyScheduleBlock[]) {
  const [overrideState, setOverrideState] = useState<{
    date: string
    overrides: DailyScheduleOverrides | undefined
  }>(() => ({
    date,
    overrides: getScheduleOverridesForDate(date),
  }))
  const overrides =
    overrideState.date === date ? overrideState.overrides : getScheduleOverridesForDate(date)

  const effectiveBlocks = useMemo(() => {
    const generatedWithOverrides = applyScheduleOverridesToGeneratedBlocks(generatedBlocks, overrides)
    return sortBlocksByTime([...(generatedWithOverrides ?? []), ...(overrides?.customBlocks ?? [])])
  }, [generatedBlocks, overrides])

  const persistOverrides = (nextOverrides: DailyScheduleOverrides) => {
    const normalizedOverrides = normalizeNextOverrides(nextOverrides)

    if (!hasDailyScheduleOverrideChanges(normalizedOverrides)) {
      clearScheduleOverridesForDate(date)
      setOverrideState({ date, overrides: undefined })
      return
    }

    saveScheduleOverridesForDate(normalizedOverrides)
    setOverrideState({ date, overrides: normalizedOverrides })
  }

  const addCustomBlock = (input: EditableScheduleBlockInput) => {
    const currentOverrides = overrides ?? createEmptyOverrides(date)
    const customBlock: DailyScheduleBlock = {
      id: createCustomBlockId(date),
      date,
      title: input.title.trim(),
      startTime: clampTimeToDay(input.startTime),
      endTime: clampTimeToDay(input.endTime),
      category: input.category,
      source: 'custom',
      description: input.description?.trim() || undefined,
      isEditable: true,
      isMovable: true,
    }

    persistOverrides({
      ...currentOverrides,
      customBlocks: [...currentOverrides.customBlocks, customBlock],
    })
  }

  const updateBlock = (blockId: string, updates: EditableScheduleBlockPatch) => {
    const currentBlock = effectiveBlocks.find((block) => block.id === blockId)

    if (!currentBlock) {
      return
    }

    const currentOverrides = overrides ?? createEmptyOverrides(date)
    const sanitizedUpdates: EditableScheduleBlockPatch = {}

    if (updates.title !== undefined) {
      sanitizedUpdates.title = updates.title.trim()
    }

    if (updates.description !== undefined) {
      sanitizedUpdates.description = updates.description.trim() || undefined
    }

    if (updates.category !== undefined) {
      sanitizedUpdates.category = updates.category
    }

    if (updates.startTime !== undefined) {
      sanitizedUpdates.startTime = clampTimeToDay(updates.startTime)
    }

    if (updates.endTime !== undefined) {
      sanitizedUpdates.endTime = clampTimeToDay(updates.endTime)
    }

    if (updates.completed !== undefined) {
      sanitizedUpdates.completed = updates.completed
    }

    if (currentBlock.source === 'custom') {
      persistOverrides({
        ...currentOverrides,
        customBlocks: currentOverrides.customBlocks.map((block) =>
          block.id === blockId ? { ...block, ...sanitizedUpdates } : block,
        ),
      })
      return
    }

    persistOverrides({
      ...currentOverrides,
      blockOverrides: {
        ...currentOverrides.blockOverrides,
        [blockId]: {
          ...currentOverrides.blockOverrides[blockId],
          blockId,
          ...sanitizedUpdates,
        },
      },
    })
  }

  const moveBlock = (blockId: string, newStartTime: string) => {
    const currentBlock = effectiveBlocks.find((block) => block.id === blockId)

    if (!currentBlock || currentBlock.isMovable === false) {
      return
    }

    const duration = calculateDurationMinutes(currentBlock.startTime, currentBlock.endTime)
    const startTime = clampTimeToDay(newStartTime)
    const endTime = addMinutesToTime(startTime, duration)
    updateBlock(blockId, { startTime, endTime })
  }

  const deleteBlock = (blockId: string) => {
    const currentBlock = effectiveBlocks.find((block) => block.id === blockId)
    const currentOverrides = overrides ?? createEmptyOverrides(date)

    if (currentBlock?.source === 'custom') {
      persistOverrides({
        ...currentOverrides,
        customBlocks: currentOverrides.customBlocks.filter((block) => block.id !== blockId),
      })
      return
    }

    if (!currentBlock) {
      return
    }

    const nextBlockOverrides = { ...currentOverrides.blockOverrides }
    for (const currentBlockId of getScheduleBlockIdentityIds(currentBlock)) {
      delete nextBlockOverrides[currentBlockId]
    }

    persistOverrides({
      ...currentOverrides,
      blockOverrides: nextBlockOverrides,
      hiddenDefaultActivityIds: Array.from(
        new Set([...currentOverrides.hiddenDefaultActivityIds, currentBlock.id]),
      ),
    })
  }

  const resetPlannedBlock = (blockId: string) => {
    const currentOverrides = overrides ?? createEmptyOverrides(date)
    const nextBlockOverrides = { ...currentOverrides.blockOverrides }
    const currentBlock = generatedBlocks.find((block) => block.id === blockId)
    const blockIds = [blockId, ...(currentBlock?.legacyIds ?? [])]

    for (const currentBlockId of blockIds) {
      const currentOverride = nextBlockOverrides[currentBlockId]

      if (!currentOverride) {
        continue
      }

      const remainingOverride = { ...currentOverride }
      delete remainingOverride.startTime
      delete remainingOverride.endTime

      if (
        remainingOverride.title === undefined &&
        remainingOverride.description === undefined &&
        remainingOverride.category === undefined &&
        remainingOverride.completed === undefined
      ) {
        delete nextBlockOverrides[currentBlockId]
      } else {
        nextBlockOverrides[currentBlockId] = remainingOverride
      }
    }

    persistOverrides({
      ...currentOverrides,
      blockOverrides: nextBlockOverrides,
    })
  }

  const resetDay = () => {
    clearScheduleOverridesForDate(date)
    setOverrideState({ date, overrides: undefined })
  }

  const toggleBlockCompleted = (blockId: string) => {
    const currentBlock = effectiveBlocks.find((block) => block.id === blockId)

    if (!currentBlock) {
      return
    }

    updateBlock(blockId, {
      completed: !currentBlock.completed,
    })
  }

  return {
    overrides,
    effectiveBlocks,
    addCustomBlock,
    updateBlock,
    moveBlock,
    deleteCustomBlock: deleteBlock,
    deleteBlock,
    resetPlannedBlock,
    resetDay,
    toggleBlockCompleted,
    hasChanges: hasDailyScheduleOverrideChanges(overrides),
  }
}
