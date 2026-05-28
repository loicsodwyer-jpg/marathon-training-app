import type { NotificationPreferences } from '../types/notifications'
import { NOTIFICATION_PREFERENCES_STORAGE_KEY } from './localStorageKeys'

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false,
  runReminders: true,
  strengthReminders: true,
  snackReminders: true,
  mealReminders: true,
  fuelingReminders: true,
  recoveryReminders: false,
  raceReminders: true,
  oneHourBefore: true,
  atEventTime: true,
  includeFuelingInRunNotification: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  timezone: 'Europe/Amsterdam',
}

export const notificationPreferencesChangedEvent =
  'loic-marathon-notification-preferences-changed'

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

function normalizeTime(value: unknown, fallback: string) {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : fallback
}

export function normalizeNotificationPreferences(
  value: unknown,
): NotificationPreferences {
  if (!isRecord(value)) {
    return defaultNotificationPreferences
  }

  return {
    enabled: isBoolean(value.enabled) ? value.enabled : defaultNotificationPreferences.enabled,
    runReminders: isBoolean(value.runReminders)
      ? value.runReminders
      : defaultNotificationPreferences.runReminders,
    strengthReminders: isBoolean(value.strengthReminders)
      ? value.strengthReminders
      : defaultNotificationPreferences.strengthReminders,
    snackReminders: isBoolean(value.snackReminders)
      ? value.snackReminders
      : defaultNotificationPreferences.snackReminders,
    mealReminders: isBoolean(value.mealReminders)
      ? value.mealReminders
      : defaultNotificationPreferences.mealReminders,
    fuelingReminders: isBoolean(value.fuelingReminders)
      ? value.fuelingReminders
      : defaultNotificationPreferences.fuelingReminders,
    recoveryReminders: isBoolean(value.recoveryReminders)
      ? value.recoveryReminders
      : defaultNotificationPreferences.recoveryReminders,
    raceReminders: isBoolean(value.raceReminders)
      ? value.raceReminders
      : defaultNotificationPreferences.raceReminders,
    oneHourBefore: isBoolean(value.oneHourBefore)
      ? value.oneHourBefore
      : defaultNotificationPreferences.oneHourBefore,
    atEventTime: isBoolean(value.atEventTime)
      ? value.atEventTime
      : defaultNotificationPreferences.atEventTime,
    includeFuelingInRunNotification: isBoolean(value.includeFuelingInRunNotification)
      ? value.includeFuelingInRunNotification
      : defaultNotificationPreferences.includeFuelingInRunNotification,
    quietHoursEnabled: isBoolean(value.quietHoursEnabled)
      ? value.quietHoursEnabled
      : defaultNotificationPreferences.quietHoursEnabled,
    quietHoursStart: normalizeTime(
      value.quietHoursStart,
      defaultNotificationPreferences.quietHoursStart,
    ),
    quietHoursEnd: normalizeTime(
      value.quietHoursEnd,
      defaultNotificationPreferences.quietHoursEnd,
    ),
    timezone:
      typeof value.timezone === 'string' && value.timezone.trim()
        ? value.timezone
        : defaultNotificationPreferences.timezone,
  }
}

export function loadNotificationPreferences(): NotificationPreferences {
  if (!canUseLocalStorage()) {
    return defaultNotificationPreferences
  }

  try {
    const storedValue = window.localStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY)
    return normalizeNotificationPreferences(storedValue ? JSON.parse(storedValue) : undefined)
  } catch {
    return defaultNotificationPreferences
  }
}

export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(
      NOTIFICATION_PREFERENCES_STORAGE_KEY,
      JSON.stringify(normalizeNotificationPreferences(preferences)),
    )
    window.dispatchEvent(new Event(notificationPreferencesChangedEvent))
  } catch {
    // Keep preferences non-critical if storage is unavailable.
  }
}

export function updateNotificationPreferences(
  updates: Partial<NotificationPreferences>,
): NotificationPreferences {
  const nextPreferences = normalizeNotificationPreferences({
    ...loadNotificationPreferences(),
    ...updates,
  })
  saveNotificationPreferences(nextPreferences)
  return nextPreferences
}

export function resetNotificationPreferences(): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(NOTIFICATION_PREFERENCES_STORAGE_KEY)
    window.dispatchEvent(new Event(notificationPreferencesChangedEvent))
  } catch {
    // Keep reset actions from crashing in restricted browser contexts.
  }
}

export function clearNotificationPreferences(): void {
  resetNotificationPreferences()
}
