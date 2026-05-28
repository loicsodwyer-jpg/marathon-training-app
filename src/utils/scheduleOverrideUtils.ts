import type {
  DailyScheduleBlock,
  DailyScheduleOverrides,
  ScheduleBlockOverride,
} from '../types/schedule'

export function getScheduleBlockIdentityIds(block: Pick<DailyScheduleBlock, 'id' | 'legacyIds'>) {
  return [block.id, ...(block.legacyIds ?? [])]
}

export function isScheduleBlockHidden(
  block: DailyScheduleBlock,
  overrides: DailyScheduleOverrides | undefined,
) {
  if (!overrides?.hiddenDefaultActivityIds.length) {
    return false
  }

  const hiddenIds = new Set(overrides.hiddenDefaultActivityIds)
  return getScheduleBlockIdentityIds(block).some((blockId) => hiddenIds.has(blockId))
}

export function getScheduleOverrideForBlock(
  block: DailyScheduleBlock,
  overrides: DailyScheduleOverrides | undefined,
) {
  if (!overrides) {
    return undefined
  }

  return (
    overrides.blockOverrides[block.id] ??
    block.legacyIds
      ?.map((legacyId) => overrides.blockOverrides[legacyId])
      .find((override) => override !== undefined)
  )
}

export function applyScheduleOverrideToBlock(
  block: DailyScheduleBlock,
  override: ScheduleBlockOverride | undefined,
): DailyScheduleBlock {
  if (!override) {
    return block
  }

  return {
    ...block,
    title: override.title ?? block.title,
    startTime: override.startTime ?? block.startTime,
    endTime: override.endTime ?? block.endTime,
    description: override.description ?? block.description,
    category: override.category ?? block.category,
    completed: override.completed ?? block.completed ?? false,
  }
}

export function applyScheduleOverridesToGeneratedBlocks(
  blocks: DailyScheduleBlock[],
  overrides: DailyScheduleOverrides | undefined,
) {
  return blocks
    .filter((block) => !isScheduleBlockHidden(block, overrides))
    .map((block) => applyScheduleOverrideToBlock(block, getScheduleOverrideForBlock(block, overrides)))
}

export function hasDailyScheduleOverrideChanges(
  overrides: DailyScheduleOverrides | undefined,
) {
  return Boolean(
    overrides &&
      (Object.keys(overrides.blockOverrides).length > 0 ||
        overrides.customBlocks.length > 0 ||
        overrides.hiddenDefaultActivityIds.length > 0),
  )
}
