import type { NotificationPreferences } from '../types/notifications'

export type BackendStatus = 'unknown' | 'saved' | 'missing' | 'inactive' | 'error'

export type PushBackendResult = {
  ok: boolean
  message: string
}

export type SavePushSubscriptionArgs = {
  subscription: Record<string, unknown>
  preferences: NotificationPreferences
  timezone: string
  deviceLabel: string
}

export type SavePushSubscriptionResult = PushBackendResult & {
  subscriptionId?: string
  active?: boolean
}

export type PushSubscriptionBackendStatusResult = PushBackendResult & {
  exists?: boolean
  active?: boolean
  lastSeenAt?: string
  lastTestSentAt?: string
}

export async function savePushSubscriptionToBackend({
  deviceLabel,
  preferences,
  subscription,
  timezone,
}: SavePushSubscriptionArgs): Promise<SavePushSubscriptionResult> {
  return postJson<SavePushSubscriptionResult>('/api/push/subscribe', {
    subscription,
    preferences,
    timezone,
    deviceLabel,
    userAgent: getUserAgent(),
  })
}

export async function removePushSubscriptionFromBackend(
  endpoint: string,
): Promise<PushBackendResult> {
  return postJson<PushBackendResult>('/api/push/unsubscribe', { endpoint })
}

export async function sendBackendTestPush(endpoint: string): Promise<PushBackendResult> {
  return postJson<PushBackendResult>('/api/push/test', { endpoint })
}

export async function getPushSubscriptionBackendStatus(
  endpoint: string,
): Promise<PushSubscriptionBackendStatusResult> {
  return postJson<PushSubscriptionBackendStatusResult>('/api/push/status', { endpoint })
}

async function postJson<T extends PushBackendResult>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
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
      message: 'Unexpected backend response.',
    } as T
  } catch {
    return {
      ok: false,
      message:
        'Push backend is not reachable. Use Vercel dev locally or test after deployment.',
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

function getUserAgent() {
  return typeof navigator !== 'undefined' ? navigator.userAgent : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
