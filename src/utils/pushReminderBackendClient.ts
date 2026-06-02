import { addDays, formatDateKey } from './dateUtils'

export type PushReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled'

export type SyncedPushReminderInput = {
  reminderKey: string
  syncScope: string
  sourceActivityId?: string
  sourceDate: string
  type: string
  title: string
  body: string
  url: string
  sendAt: string
  eventTime: string
  reminderOffsetMinutes: number
  payload?: Record<string, unknown>
}

export type PushReminderListItem = {
  id: string | null
  reminderKey: string | null
  type: string | null
  title: string | null
  body: string | null
  url: string | null
  sendAt: string | null
  eventTime: string | null
  reminderOffsetMinutes: number | null
  sourceActivityId: string | null
  sourceDate: string | null
  status: PushReminderStatus | string | null
  sentAt: string | null
  lastError: string | null
}

export type ReminderSyncRange = {
  rangeStart: string
  rangeEnd: string
}

export type ReminderBackendResult = {
  ok: boolean
  message: string
  code?: string
  status?: number
  details?: string
}

export type SyncPushRemindersArgs = ReminderSyncRange & {
  endpoint: string
  syncScope: string
  reminders: SyncedPushReminderInput[]
}

export type SyncPushRemindersResult = ReminderBackendResult & {
  synced?: number
  cancelled?: number
  rangeStart?: string
  rangeEnd?: string
}

export type ListPushRemindersArgs = ReminderSyncRange & {
  endpoint: string
  status?: PushReminderStatus
}

export type ListPushRemindersResult = ReminderBackendResult & {
  reminders?: PushReminderListItem[]
}

export type ClearPushRemindersResult = ReminderBackendResult & {
  cancelled?: number
}

export type PushReminderSchedulerHealth = {
  lastRunAt: string | null
  lastStatus: string | null
  lastSuccessfulRunAt: string | null
  lastFailedRunAt: string | null
  recentRuns: number
  recentSent: number
  recentFailed: number
}

export type PushReminderDeviceHealth = {
  pending: number
  sent: number
  failed: number
  cancelled: number
  nextPendingSendAt: string | null
  lastSentAt: string | null
}

export type PushReminderHealthResult = ReminderBackendResult & {
  scheduler?: PushReminderSchedulerHealth
  device?: PushReminderDeviceHealth
}

export function getReminderSyncRange(
  daysAhead: number,
  startDate = formatDateKey(new Date()),
): ReminderSyncRange {
  return {
    rangeStart: startDate,
    rangeEnd: addDays(startDate, Math.max(daysAhead - 1, 0)),
  }
}

export async function syncPushReminders(
  args: SyncPushRemindersArgs,
): Promise<SyncPushRemindersResult> {
  return postJson<SyncPushRemindersResult>('/api/push/reminders/sync', args)
}

export async function listPushReminders(
  args: ListPushRemindersArgs,
): Promise<ListPushRemindersResult> {
  return postJson<ListPushRemindersResult>('/api/push/reminders/list', args)
}

export async function clearPushReminders(args: {
  endpoint: string
  syncScope: string
}): Promise<ClearPushRemindersResult> {
  return postJson<ClearPushRemindersResult>('/api/push/reminders/clear', args)
}

export async function getPushReminderHealth(
  endpoint?: string,
): Promise<PushReminderHealthResult> {
  return postJson<PushReminderHealthResult>('/api/push/reminders/health', {
    ...(endpoint ? { endpoint } : {}),
  })
}

async function postJson<T extends ReminderBackendResult>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      ok: false,
      message: 'You are offline. Reconnect before syncing scheduled reminders.',
    } as T
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const payload = await parseJsonResponse(response)

    if (!response.ok) {
      return {
        ok: false,
        message: getResponseMessage(payload, response.statusText),
        code: getResponseCode(payload),
        details: getResponseDetails(payload),
        status: response.status,
      } as T
    }

    if (isRecord(payload)) {
      return {
        message: getResponseMessage(payload, 'Request completed.'),
        ...payload,
        ok: payload.ok === true,
      } as T
    }

    return {
      ok: false,
      message: 'Unexpected scheduled reminder backend response.',
    } as T
  } catch {
    return {
      ok: false,
      message:
        'Scheduled reminder backend is not reachable. Use Vercel dev locally or test after deployment.',
      code: 'NETWORK_ERROR',
    } as T
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function getResponseMessage(payload: unknown, fallback: string) {
  if (isRecord(payload) && typeof payload.message === 'string') {
    return payload.message
  }

  if (isRecord(payload) && typeof payload.error === 'string') {
    return payload.error
  }

  return fallback
}

function getResponseCode(payload: unknown) {
  return isRecord(payload) && typeof payload.code === 'string' ? payload.code : undefined
}

function getResponseDetails(payload: unknown) {
  return isRecord(payload) && typeof payload.details === 'string' ? payload.details : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
