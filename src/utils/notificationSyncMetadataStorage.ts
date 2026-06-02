import { NOTIFICATION_SYNC_METADATA_STORAGE_KEY } from './localStorageKeys'
import type { SyncedPushReminderInput } from './pushReminderBackendClient'

export type NotificationSyncMetadata = {
  lastSyncedAt?: string
  lastSyncedRangeStart?: string
  lastSyncedRangeEnd?: string
  lastSyncedHash?: string
  needsResync?: boolean
  needsResyncReason?: string
}

export const notificationSyncMetadataChangedEvent =
  'loic-marathon-notification-sync-metadata-changed'

const defaultMetadata: NotificationSyncMetadata = {
  needsResync: false,
}

export function loadNotificationSyncMetadata(): NotificationSyncMetadata {
  if (!canUseLocalStorage()) {
    return defaultMetadata
  }

  try {
    const storedValue = window.localStorage.getItem(NOTIFICATION_SYNC_METADATA_STORAGE_KEY)
    return normalizeNotificationSyncMetadata(storedValue ? JSON.parse(storedValue) : undefined)
  } catch {
    return defaultMetadata
  }
}

export function saveNotificationSyncMetadata(metadata: NotificationSyncMetadata): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(
      NOTIFICATION_SYNC_METADATA_STORAGE_KEY,
      JSON.stringify(normalizeNotificationSyncMetadata(metadata)),
    )
    window.dispatchEvent(new Event(notificationSyncMetadataChangedEvent))
  } catch {
    // Diagnostic metadata should never block core app behavior.
  }
}

export function markNotificationRemindersNeedResync(reason: string): void {
  const current = loadNotificationSyncMetadata()
  saveNotificationSyncMetadata({
    ...current,
    needsResync: true,
    needsResyncReason: reason,
  })
}

export function saveSuccessfulNotificationReminderSync({
  rangeEnd,
  rangeStart,
  reminders,
  syncedAt = new Date().toISOString(),
}: {
  rangeStart: string
  rangeEnd: string
  reminders: SyncedPushReminderInput[]
  syncedAt?: string
}): void {
  saveNotificationSyncMetadata({
    lastSyncedAt: syncedAt,
    lastSyncedRangeStart: rangeStart,
    lastSyncedRangeEnd: rangeEnd,
    lastSyncedHash: createReminderSyncHash(reminders),
    needsResync: false,
    needsResyncReason: undefined,
  })
}

export function createReminderSyncHash(reminders: SyncedPushReminderInput[]): string {
  const serialized = JSON.stringify(
    reminders.map((reminder) => ({
      key: reminder.reminderKey,
      sendAt: reminder.sendAt,
      eventTime: reminder.eventTime,
      title: reminder.title,
      body: reminder.body,
    })),
  )
  let hash = 2166136261

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16)
}

function normalizeNotificationSyncMetadata(value: unknown): NotificationSyncMetadata {
  if (!isRecord(value)) {
    return defaultMetadata
  }

  return {
    lastSyncedAt: optionalString(value.lastSyncedAt),
    lastSyncedRangeStart: optionalString(value.lastSyncedRangeStart),
    lastSyncedRangeEnd: optionalString(value.lastSyncedRangeEnd),
    lastSyncedHash: optionalString(value.lastSyncedHash),
    needsResync:
      typeof value.needsResync === 'boolean' ? value.needsResync : defaultMetadata.needsResync,
    needsResyncReason: optionalString(value.needsResyncReason),
  }
}

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

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}
