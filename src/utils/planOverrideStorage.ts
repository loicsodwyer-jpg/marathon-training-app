import type {
  AdjustedRunOverride,
  AdjustedRunReplacementType,
  DayPlanOverride,
  PlanAdjustmentRecord,
  PlanOverrideSource,
  PlanOverrideStatus,
  PlanOverridesState,
} from '../types/planOverride'
import { PLAN_OVERRIDES_STORAGE_KEY } from './localStorageKeys'
import { markNotificationRemindersNeedResync } from './notificationSyncMetadataStorage'

const emptyPlanOverridesState: PlanOverridesState = {
  schemaVersion: 1,
  records: {},
  dayOverrides: {},
}

const overrideSources: PlanOverrideSource[] = ['rule_engine', 'manual_chatgpt', 'manual_user']
const overrideStatuses: PlanOverrideStatus[] = ['active', 'archived']
const replacementTypes: AdjustedRunReplacementType[] = [
  'run',
  'bike',
  'rest',
  'mobility',
  'reduced_strength',
  'none',
]

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

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value)
}

function optionalNumber(value: unknown): value is number | undefined {
  return value === undefined || isNumber(value)
}

function optionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || isBoolean(value)
}

function optionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || isStringArray(value)
}

function isPlanOverrideSource(value: unknown): value is PlanOverrideSource {
  return isString(value) && overrideSources.includes(value as PlanOverrideSource)
}

function isPlanOverrideStatus(value: unknown): value is PlanOverrideStatus {
  return isString(value) && overrideStatuses.includes(value as PlanOverrideStatus)
}

function isReplacementType(value: unknown): value is AdjustedRunReplacementType {
  return isString(value) && replacementTypes.includes(value as AdjustedRunReplacementType)
}

function normalizeAdjustedRunOverride(value: unknown): AdjustedRunOverride | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  if (
    !isString(value.id) ||
    !isString(value.type) ||
    !isString(value.title) ||
    !isNumber(value.plannedDistanceKm) ||
    !isStringArray(value.instructions) ||
    !isReplacementType(value.replacementType)
  ) {
    return undefined
  }

  if (
    !optionalString(value.startTime) ||
    !optionalNumber(value.estimatedDurationMinutes) ||
    !optionalString(value.targetPaceDescription) ||
    !optionalString(value.targetHrZone) ||
    !optionalString(value.targetHrDescription) ||
    !optionalStringArray(value.fuelNotes) ||
    !optionalStringArray(value.recoveryNotes)
  ) {
    return undefined
  }

  return {
    id: value.id,
    type: value.type,
    title: value.title,
    startTime: value.startTime,
    plannedDistanceKm: value.plannedDistanceKm,
    estimatedDurationMinutes: value.estimatedDurationMinutes,
    targetPaceDescription: value.targetPaceDescription,
    targetHrZone: value.targetHrZone,
    targetHrDescription: value.targetHrDescription,
    instructions: value.instructions,
    fuelNotes: value.fuelNotes,
    recoveryNotes: value.recoveryNotes,
    replacementType: value.replacementType,
  }
}

function normalizeDayPlanOverride(value: unknown): DayPlanOverride | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  if (
    !isString(value.date) ||
    !isString(value.adjustmentId) ||
    !isPlanOverrideSource(value.source) ||
    !isPlanOverrideStatus(value.status) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt) ||
    !isString(value.originalTitle) ||
    !isString(value.originalSummary) ||
    !isString(value.adjustedTitle) ||
    !isString(value.adjustedSummary) ||
    !isString(value.reason) ||
    !isStringArray(value.warnings) ||
    !isString(value.proposalChangeType)
  ) {
    return undefined
  }

  if (
    !optionalNumber(value.originalDistanceKm) ||
    !optionalString(value.originalRunType) ||
    !optionalString(value.adjustedDayType) ||
    !optionalString(value.adjustedIntensity) ||
    !optionalBoolean(value.removeRun) ||
    !optionalString(value.strengthAdjustment) ||
    !optionalBoolean(value.removeStrength) ||
    !optionalStringArray(value.adjustedStrengthSessionIds) ||
    !optionalString(value.nutritionNote)
  ) {
    return undefined
  }

  const adjustedRun = value.adjustedRun
    ? normalizeAdjustedRunOverride(value.adjustedRun)
    : undefined

  if (value.adjustedRun && !adjustedRun) {
    return undefined
  }

  return {
    date: value.date,
    adjustmentId: value.adjustmentId,
    source: value.source,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    originalTitle: value.originalTitle,
    originalSummary: value.originalSummary,
    originalDistanceKm: value.originalDistanceKm,
    originalRunType: value.originalRunType,
    adjustedTitle: value.adjustedTitle,
    adjustedSummary: value.adjustedSummary,
    adjustedDayType: value.adjustedDayType,
    adjustedIntensity: value.adjustedIntensity,
    removeRun: value.removeRun,
    adjustedRun,
    strengthAdjustment: value.strengthAdjustment,
    removeStrength: value.removeStrength,
    adjustedStrengthSessionIds: value.adjustedStrengthSessionIds,
    nutritionNote: value.nutritionNote,
    reason: value.reason,
    warnings: value.warnings,
    proposalChangeType: value.proposalChangeType,
  }
}

function normalizePlanAdjustmentRecord(value: unknown): PlanAdjustmentRecord | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  if (
    !isString(value.id) ||
    !isString(value.title) ||
    !isString(value.summary) ||
    !isPlanOverrideSource(value.source) ||
    !isPlanOverrideStatus(value.status) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt) ||
    !isString(value.issueType) ||
    !isString(value.adjustmentLevel) ||
    !isString(value.startDate) ||
    !isString(value.endDate) ||
    !isStringArray(value.affectedDates) ||
    !isStringArray(value.globalWarnings)
  ) {
    return undefined
  }

  return {
    id: value.id,
    title: value.title,
    summary: value.summary,
    source: value.source,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    issueType: value.issueType,
    adjustmentLevel: value.adjustmentLevel,
    startDate: value.startDate,
    endDate: value.endDate,
    affectedDates: value.affectedDates,
    globalWarnings: value.globalWarnings,
  }
}

export function normalizePlanOverridesState(value: unknown): PlanOverridesState {
  if (!isRecord(value)) {
    return emptyPlanOverridesState
  }

  const recordsSource = isRecord(value.records) ? value.records : {}
  const dayOverridesSource = isRecord(value.dayOverrides) ? value.dayOverrides : {}
  const records = Object.entries(recordsSource).reduce<Record<string, PlanAdjustmentRecord>>(
    (result, [id, recordValue]) => {
      const record = normalizePlanAdjustmentRecord(recordValue)
      if (record) {
        result[id] = record
      }
      return result
    },
    {},
  )
  const dayOverrides = Object.entries(dayOverridesSource).reduce<Record<string, DayPlanOverride>>(
    (result, [date, overrideValue]) => {
      const override = normalizeDayPlanOverride(overrideValue)
      if (override) {
        result[date] = override
      }
      return result
    },
    {},
  )

  return {
    schemaVersion: 1,
    records,
    dayOverrides,
  }
}

export function loadPlanOverrides(): PlanOverridesState {
  if (!canUseLocalStorage()) {
    return emptyPlanOverridesState
  }

  try {
    const rawValue = window.localStorage.getItem(PLAN_OVERRIDES_STORAGE_KEY)
    if (!rawValue) {
      return emptyPlanOverridesState
    }
    const parsedValue: unknown = JSON.parse(rawValue)
    return normalizePlanOverridesState(parsedValue)
  } catch {
    return emptyPlanOverridesState
  }
}

export function savePlanOverrides(state: PlanOverridesState): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(PLAN_OVERRIDES_STORAGE_KEY, JSON.stringify(state))
    markNotificationRemindersNeedResync('Plan adjustments changed.')
  } catch {
    // Keep the app usable if browser storage is unavailable or full.
  }
}

export function getPlanOverrideForDate(date: string): DayPlanOverride | undefined {
  const override = loadPlanOverrides().dayOverrides[date]
  return override?.status === 'active' ? override : undefined
}

export function getAllActiveDayOverrides(): Record<string, DayPlanOverride> {
  const state = loadPlanOverrides()
  return Object.entries(state.dayOverrides).reduce<Record<string, DayPlanOverride>>(
    (result, [date, override]) => {
      if (override.status === 'active') {
        result[date] = override
      }
      return result
    },
    {},
  )
}

export function getAllAdjustmentRecords(): PlanAdjustmentRecord[] {
  return Object.values(loadPlanOverrides().records)
    .filter((record) => record.status === 'active')
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
}

export function savePlanAdjustment(
  record: PlanAdjustmentRecord,
  dayOverrides: DayPlanOverride[],
): void {
  const state = loadPlanOverrides()
  const nextDayOverrides = { ...state.dayOverrides }

  dayOverrides.forEach((override) => {
    nextDayOverrides[override.date] = override
  })

  savePlanOverrides({
    schemaVersion: 1,
    records: {
      ...state.records,
      [record.id]: record,
    },
    dayOverrides: nextDayOverrides,
  })
}

export function clearPlanOverrideForDate(date: string): void {
  const state = loadPlanOverrides()
  const nextDayOverrides = { ...state.dayOverrides }
  delete nextDayOverrides[date]

  savePlanOverrides({
    ...state,
    dayOverrides: nextDayOverrides,
  })
}

export function clearPlanAdjustment(adjustmentId: string): void {
  const state = loadPlanOverrides()
  const nextRecords = { ...state.records }
  const nextDayOverrides = { ...state.dayOverrides }
  delete nextRecords[adjustmentId]

  Object.entries(nextDayOverrides).forEach(([date, override]) => {
    if (override.adjustmentId === adjustmentId) {
      delete nextDayOverrides[date]
    }
  })

  savePlanOverrides({
    schemaVersion: 1,
    records: nextRecords,
    dayOverrides: nextDayOverrides,
  })
}

export function clearAllPlanOverrides(): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(PLAN_OVERRIDES_STORAGE_KEY)
    markNotificationRemindersNeedResync('Plan adjustments changed.')
  } catch {
    // Keep settings actions from crashing in restricted browser contexts.
  }
}

export function hasPlanOverrides(): boolean {
  return Object.keys(getAllActiveDayOverrides()).length > 0
}
