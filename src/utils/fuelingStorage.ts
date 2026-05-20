import type { FuelingPreferences } from '../types/fueling'
import { FUELING_PREFERENCES_STORAGE_KEY } from './localStorageKeys'

export const defaultFuelingPreferences: FuelingPreferences = {
  preferredBrand: 'Maurten',
  caffeineEnabled: true,
  caffeineForEveningRuns: false,
  preferredGelSize: 'gel_100',
  useDrinkMix: true,
  targetCarbsPerHourLongRun: 60,
  targetCarbsPerHourRace: 70,
  stomachSensitive: true,
}

export const fuelingPreferencesChangedEvent = 'loic-marathon-fueling-preferences-changed'

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

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function normalizeTargetCarbs(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 30 && value <= 100
    ? Math.round(value)
    : fallback
}

export function normalizeFuelingPreferences(value: unknown): FuelingPreferences {
  if (!isRecord(value)) {
    return defaultFuelingPreferences
  }

  const preferredGelSize =
    value.preferredGelSize === 'gel_100' ||
    value.preferredGelSize === 'gel_160' ||
    value.preferredGelSize === 'mixed'
      ? value.preferredGelSize
      : defaultFuelingPreferences.preferredGelSize

  return {
    preferredBrand: 'Maurten',
    caffeineEnabled: isBoolean(value.caffeineEnabled)
      ? value.caffeineEnabled
      : defaultFuelingPreferences.caffeineEnabled,
    caffeineForEveningRuns: isBoolean(value.caffeineForEveningRuns)
      ? value.caffeineForEveningRuns
      : defaultFuelingPreferences.caffeineForEveningRuns,
    preferredGelSize,
    useDrinkMix: isBoolean(value.useDrinkMix)
      ? value.useDrinkMix
      : defaultFuelingPreferences.useDrinkMix,
    targetCarbsPerHourLongRun: normalizeTargetCarbs(
      value.targetCarbsPerHourLongRun,
      defaultFuelingPreferences.targetCarbsPerHourLongRun,
    ),
    targetCarbsPerHourRace: normalizeTargetCarbs(
      value.targetCarbsPerHourRace,
      defaultFuelingPreferences.targetCarbsPerHourRace,
    ),
    stomachSensitive: isBoolean(value.stomachSensitive)
      ? value.stomachSensitive
      : defaultFuelingPreferences.stomachSensitive,
  }
}

export function loadFuelingPreferences(): FuelingPreferences {
  if (!canUseLocalStorage()) {
    return defaultFuelingPreferences
  }

  try {
    const storedValue = window.localStorage.getItem(FUELING_PREFERENCES_STORAGE_KEY)
    return normalizeFuelingPreferences(storedValue ? JSON.parse(storedValue) : undefined)
  } catch {
    return defaultFuelingPreferences
  }
}

export function saveFuelingPreferences(preferences: FuelingPreferences): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(
      FUELING_PREFERENCES_STORAGE_KEY,
      JSON.stringify(normalizeFuelingPreferences(preferences)),
    )
    window.dispatchEvent(new Event(fuelingPreferencesChangedEvent))
  } catch {
    // Keep the app usable if localStorage is unavailable or full.
  }
}

export function resetFuelingPreferences(): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(FUELING_PREFERENCES_STORAGE_KEY)
    window.dispatchEvent(new Event(fuelingPreferencesChangedEvent))
  } catch {
    // Keep reset actions from crashing in restricted browser contexts.
  }
}

export function clearFuelingPreferences(): void {
  resetFuelingPreferences()
}
