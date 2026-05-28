import type { WebPushSubscription } from './types.js'

export type SubscribePayload = {
  subscription: WebPushSubscription
  preferences: Record<string, unknown>
  timezone: string
  deviceLabel?: string
  userAgent?: string
}

export type EndpointPayload = {
  endpoint: string
}

export type TestPushPayload =
  | {
      endpoint: string
      subscription?: undefined
    }
  | {
      endpoint?: undefined
      subscription: WebPushSubscription
    }

type ValidationResult<T> =
  | {
      ok: true
      value: T
    }
  | {
      ok: false
      message: string
    }

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateSubscribePayload(payload: unknown): ValidationResult<SubscribePayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  const subscriptionResult = validatePushSubscriptionPayload(payload.subscription)

  if (!subscriptionResult.ok) {
    return invalid(subscriptionResult.message)
  }

  return {
    ok: true,
    value: {
      subscription: subscriptionResult.value,
      preferences: validateNotificationPreferences(payload.preferences),
      timezone: validateTimezone(payload.timezone),
      deviceLabel: optionalText(payload.deviceLabel, 120),
      userAgent: optionalText(payload.userAgent, 500),
    },
  }
}

export function validateEndpointPayload(payload: unknown): ValidationResult<EndpointPayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  const endpoint = validateEndpoint(payload.endpoint)

  if (!endpoint) {
    return invalid('A valid endpoint is required.')
  }

  return {
    ok: true,
    value: { endpoint },
  }
}

export function validateTestPushPayload(payload: unknown): ValidationResult<TestPushPayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  const endpoint = validateEndpoint(payload.endpoint)

  if (endpoint) {
    return {
      ok: true,
      value: { endpoint },
    }
  }

  const subscriptionResult = validatePushSubscriptionPayload(payload.subscription)

  if (subscriptionResult.ok) {
    return {
      ok: true,
      value: { subscription: subscriptionResult.value },
    }
  }

  return invalid('A valid endpoint or subscription is required.')
}

export function validatePushSubscriptionPayload(
  value: unknown,
): ValidationResult<WebPushSubscription> {
  if (!isRecord(value) || !isRecord(value.keys)) {
    return invalid('A valid push subscription is required.')
  }

  const endpoint = validateEndpoint(value.endpoint)
  const p256dh = requiredText(value.keys.p256dh)
  const auth = requiredText(value.keys.auth)

  if (!endpoint || !p256dh || !auth) {
    return invalid('Subscription endpoint, p256dh, and auth keys are required.')
  }

  return {
    ok: true,
    value: {
      endpoint,
      keys: {
        p256dh,
        auth,
      },
    },
  }
}

export function validateNotificationPreferences(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

export function validateEndpoint(value: unknown): string | undefined {
  const endpoint = requiredText(value)

  if (!endpoint || !endpoint.startsWith('https://')) {
    return undefined
  }

  return endpoint
}

export function validateTimezone(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Europe/Amsterdam'
  }

  return /^[A-Za-z0-9_+./-]{1,80}$/.test(value) ? value : 'Europe/Amsterdam'
}

function requiredText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  const text = requiredText(value)
  return text ? text.slice(0, maxLength) : undefined
}

function invalid(message: string): ValidationResult<never> {
  return {
    ok: false,
    message,
  }
}
