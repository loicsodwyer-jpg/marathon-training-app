import type {
  DailyScheduleBlock,
  DailyScheduleOverrides,
  ScheduleBlockCategory,
  ScheduleBlockOverride,
  ScheduleBlockSource,
} from '../types/schedule'
import { SCHEDULE_OVERRIDES_STORAGE_KEY } from './localStorageKeys'
import { markNotificationRemindersNeedResync } from './notificationSyncMetadataStorage'

const scheduleBlockCategories: ScheduleBlockCategory[] = [
  'wake',
  'commute',
  'work',
  'meal',
  'run',
  'strength',
  'recovery',
  'social',
  'race',
  'rest',
  'custom',
]

const scheduleBlockSources: ScheduleBlockSource[] = ['planned', 'custom']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isScheduleBlockCategory(value: unknown): value is ScheduleBlockCategory {
  return isString(value) && scheduleBlockCategories.includes(value as ScheduleBlockCategory)
}

function isScheduleBlockSource(value: unknown): value is ScheduleBlockSource {
  return isString(value) && scheduleBlockSources.includes(value as ScheduleBlockSource)
}

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value)
}

function optionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || isBoolean(value)
}

function optionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || (Array.isArray(value) && value.every(isString))
}

function isDailyScheduleBlock(value: unknown): value is DailyScheduleBlock {
  if (!isRecord(value)) {
    return false
  }

  return (
    isString(value.id) &&
    isString(value.date) &&
    isString(value.title) &&
    isString(value.startTime) &&
    isString(value.endTime) &&
    isScheduleBlockCategory(value.category) &&
    isScheduleBlockSource(value.source) &&
    optionalString(value.description) &&
    optionalBoolean(value.isMovable) &&
    optionalBoolean(value.isEditable) &&
    optionalString(value.originalStartTime) &&
    optionalString(value.originalEndTime) &&
    optionalString(value.relatedPlanId) &&
    optionalBoolean(value.completed) &&
    optionalStringArray(value.legacyIds)
  )
}

function isScheduleBlockOverride(value: unknown): value is ScheduleBlockOverride {
  if (!isRecord(value)) {
    return false
  }

  return (
    isString(value.blockId) &&
    optionalString(value.startTime) &&
    optionalString(value.endTime) &&
    optionalString(value.title) &&
    optionalString(value.description) &&
    (value.category === undefined || isScheduleBlockCategory(value.category)) &&
    optionalBoolean(value.completed)
  )
}

function parseBlockOverrides(value: unknown): Record<string, ScheduleBlockOverride> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<Record<string, ScheduleBlockOverride>>(
    (result, [blockId, override]) => {
      if (isScheduleBlockOverride(override)) {
        result[blockId] = override
      }

      return result
    },
    {},
  )
}

function isDailyScheduleOverrides(value: unknown): value is DailyScheduleOverrides {
  if (!isRecord(value)) {
    return false
  }

  return (
    isString(value.date) &&
    isString(value.updatedAt) &&
    Array.isArray(value.customBlocks) &&
    value.customBlocks.every(isDailyScheduleBlock)
  )
}

function parseHiddenDefaultActivityIds(value: unknown): string[] {
  return Array.isArray(value) && value.every(isString) ? value : []
}

function normalizeOverrides(value: unknown): DailyScheduleOverrides | undefined {
  if (!isDailyScheduleOverrides(value)) {
    return undefined
  }

  return {
    date: value.date,
    blockOverrides: parseBlockOverrides(value.blockOverrides),
    customBlocks: value.customBlocks,
    hiddenDefaultActivityIds: parseHiddenDefaultActivityIds(value.hiddenDefaultActivityIds),
    updatedAt: value.updatedAt,
  }
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

export function normalizeScheduleOverridesRecord(
  value: unknown,
): Record<string, DailyScheduleOverrides> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<Record<string, DailyScheduleOverrides>>(
    (result, [date, overrideValue]) => {
      const overrides = normalizeOverrides(overrideValue)

      if (overrides) {
        result[date] = overrides
      }

      return result
    },
    {},
  )
}

export function getAllScheduleOverrides(): Record<string, DailyScheduleOverrides> {
  if (!canUseLocalStorage()) {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(SCHEDULE_OVERRIDES_STORAGE_KEY)

    if (!rawValue) {
      return {}
    }

    const parsedValue: unknown = JSON.parse(rawValue)

    return normalizeScheduleOverridesRecord(parsedValue)
  } catch {
    return {}
  }
}

export function getScheduleOverridesForDate(date: string): DailyScheduleOverrides | undefined {
  return getAllScheduleOverrides()[date]
}

export function saveScheduleOverridesForDate(overrides: DailyScheduleOverrides): void {
  if (!canUseLocalStorage()) {
    return
  }

  const allOverrides = getAllScheduleOverrides()
  allOverrides[overrides.date] = overrides
  saveAllScheduleOverrides(allOverrides)
}

export function clearScheduleOverridesForDate(date: string): void {
  if (!canUseLocalStorage()) {
    return
  }

  const allOverrides = getAllScheduleOverrides()
  delete allOverrides[date]
  saveAllScheduleOverrides(allOverrides)
}

export function saveAllScheduleOverrides(
  overrides: Record<string, DailyScheduleOverrides>,
): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(SCHEDULE_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides))
    markNotificationRemindersNeedResync('Calendar edits changed.')
  } catch {
    // Keep the app usable if browser storage is unavailable or full.
  }
}

export function clearAllScheduleOverrides(): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(SCHEDULE_OVERRIDES_STORAGE_KEY)
    markNotificationRemindersNeedResync('Calendar edits changed.')
  } catch {
    // Keep settings actions from crashing in restricted browser contexts.
  }
}

export function hasScheduleOverridesForDate(date: string): boolean {
  return Boolean(getScheduleOverridesForDate(date))
}
