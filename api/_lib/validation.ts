import type {
  ClearRemindersPayload,
  ListRemindersPayload,
  ReminderHealthPayload,
  ReminderStatus,
  SendDueRemindersPayload,
  SyncedReminderInput,
  SyncRemindersPayload,
  WebPushSubscription,
} from './types.js'

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

const reminderTypes = [
  'run',
  'strength',
  'snack',
  'meal',
  'fueling',
  'recovery',
  'race',
  'custom',
]

const reminderStatuses: ReminderStatus[] = ['pending', 'sent', 'failed', 'cancelled']

export type ValidationSuccess<T> = {
  ok: true
  value: T
}

export type ValidationFailure = {
  ok: false
  message: string
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

export function isValidationFailure<T>(result: ValidationResult<T>): result is ValidationFailure {
  return result.ok === false
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateSubscribePayload(payload: unknown): ValidationResult<SubscribePayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  const subscriptionResult = validatePushSubscriptionPayload(payload.subscription)

  if (subscriptionResult.ok === false) {
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

  if (subscriptionResult.ok === true) {
    return {
      ok: true,
      value: { subscription: subscriptionResult.value },
    }
  }

  return invalid('A valid endpoint or subscription is required.')
}

export function validateSyncRemindersPayload(
  payload: unknown,
): ValidationResult<SyncRemindersPayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  const endpoint = validateEndpoint(payload.endpoint)
  const syncScope = validateSafeText(payload.syncScope, 120)
  const rangeStart = validateIsoDate(payload.rangeStart)
  const rangeEnd = validateIsoDate(payload.rangeEnd)

  if (!endpoint) {
    return invalid('A valid endpoint is required.')
  }

  if (!syncScope) {
    return invalid('A valid syncScope is required.')
  }

  if (!rangeStart || !rangeEnd) {
    return invalid('A valid reminder date range is required.')
  }

  if (rangeEnd < rangeStart) {
    return invalid('rangeEnd must be on or after rangeStart.')
  }

  if (!Array.isArray(payload.reminders)) {
    return invalid('reminders must be an array.')
  }

  if (payload.reminders.length > 500) {
    return invalid('A maximum of 500 reminders can be synced at once.')
  }

  const reminders: SyncedReminderInput[] = []

  for (const reminder of payload.reminders) {
    const result = validateSyncedReminderInput(reminder)

    if (result.ok === false) {
      return invalid(result.message)
    }

    if (result.value.syncScope !== syncScope) {
      return invalid('Reminder syncScope must match the sync request.')
    }

    reminders.push(result.value)
  }

  return {
    ok: true,
    value: {
      endpoint,
      syncScope,
      rangeStart,
      rangeEnd,
      reminders,
    },
  }
}

export function validateSyncedReminderInput(
  value: unknown,
): ValidationResult<SyncedReminderInput> {
  if (!isRecord(value)) {
    return invalid('Each reminder must be a JSON object.')
  }

  const reminderKey = validateSafeText(value.reminderKey, 240)
  const syncScope = validateSafeText(value.syncScope, 120)
  const sourceActivityId = optionalText(value.sourceActivityId, 240)
  const sourceDate = validateIsoDate(value.sourceDate)
  const type = validateReminderType(value.type)
  const title = requiredText(value.title, 160)
  const body = requiredText(value.body, 1000)
  const url = validateReminderUrl(value.url)
  const sendAt = validateIsoDateTime(value.sendAt)
  const eventTime = validateIsoDateTime(value.eventTime)
  const reminderOffsetMinutes = validateNumber(value.reminderOffsetMinutes)

  if (!reminderKey) {
    return invalid('reminderKey is required.')
  }

  if (!syncScope) {
    return invalid('syncScope is required.')
  }

  if (!sourceDate) {
    return invalid('sourceDate must be YYYY-MM-DD.')
  }

  if (!type) {
    return invalid('Reminder type is invalid.')
  }

  if (!title || !body || !url) {
    return invalid('Reminder title, body, and url are required.')
  }

  if (!sendAt || !eventTime) {
    return invalid('sendAt and eventTime must be valid ISO date-times.')
  }

  if (reminderOffsetMinutes === undefined) {
    return invalid('reminderOffsetMinutes must be a number.')
  }

  return {
    ok: true,
    value: {
      reminderKey,
      syncScope,
      sourceActivityId,
      sourceDate,
      type,
      title,
      body,
      url,
      sendAt,
      eventTime,
      reminderOffsetMinutes,
      payload: isRecord(value.payload) ? value.payload : {},
    },
  }
}

export function validateListRemindersPayload(
  payload: unknown,
): ValidationResult<ListRemindersPayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  const endpoint = validateEndpoint(payload.endpoint)
  const rangeStart = validateIsoDate(payload.rangeStart)
  const rangeEnd = validateIsoDate(payload.rangeEnd)
  const status =
    payload.status === undefined ? undefined : validateReminderStatus(payload.status)

  if (!endpoint) {
    return invalid('A valid endpoint is required.')
  }

  if (!rangeStart || !rangeEnd) {
    return invalid('A valid reminder date range is required.')
  }

  if (rangeEnd < rangeStart) {
    return invalid('rangeEnd must be on or after rangeStart.')
  }

  if (payload.status !== undefined && !status) {
    return invalid('Reminder status is invalid.')
  }

  return {
    ok: true,
    value: {
      endpoint,
      rangeStart,
      rangeEnd,
      ...(status ? { status } : {}),
    },
  }
}

export function validateClearRemindersPayload(
  payload: unknown,
): ValidationResult<ClearRemindersPayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  const endpoint = validateEndpoint(payload.endpoint)
  const syncScope = validateSafeText(payload.syncScope, 120)

  if (!endpoint) {
    return invalid('A valid endpoint is required.')
  }

  if (!syncScope) {
    return invalid('A valid syncScope is required.')
  }

  return {
    ok: true,
    value: {
      endpoint,
      syncScope,
    },
  }
}

export function validateSendDueRemindersPayload(
  payload: unknown,
): ValidationResult<SendDueRemindersPayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  if (payload.dryRun !== undefined && typeof payload.dryRun !== 'boolean') {
    return invalid('dryRun must be a boolean.')
  }

  if (payload.limit !== undefined) {
    const limit = validateNumber(payload.limit)

    if (limit === undefined || limit < 1 || limit > 200) {
      return invalid('limit must be between 1 and 200.')
    }
  }

  return {
    ok: true,
    value: {
      dryRun: typeof payload.dryRun === 'boolean' ? payload.dryRun : undefined,
      limit: validateNumber(payload.limit),
    },
  }
}

export function validateReminderHealthPayload(
  payload: unknown,
): ValidationResult<ReminderHealthPayload> {
  if (!isRecord(payload)) {
    return invalid('Expected a JSON object.')
  }

  if (payload.endpoint === undefined || payload.endpoint === null || payload.endpoint === '') {
    return {
      ok: true,
      value: {},
    }
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

export function validateIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
    ? value
    : undefined
}

export function validateIsoDateTime(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.includes('T')) {
    return undefined
  }

  const time = Date.parse(value)
  return Number.isNaN(time) ? undefined : value
}

export function validateReminderType(value: unknown): string | undefined {
  return typeof value === 'string' && reminderTypes.includes(value) ? value : undefined
}

export function validateReminderStatus(value: unknown): ReminderStatus | undefined {
  return typeof value === 'string' && reminderStatuses.includes(value as ReminderStatus)
    ? (value as ReminderStatus)
    : undefined
}

export function validateTimezone(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Europe/Amsterdam'
  }

  return /^[A-Za-z0-9_+./-]{1,80}$/.test(value) ? value : 'Europe/Amsterdam'
}

function requiredText(value: unknown, maxLength = 1000): string | undefined {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : undefined
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  const text = requiredText(value)
  return text ? text.slice(0, maxLength) : undefined
}

function validateNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined
}

function validateSafeText(value: unknown, maxLength: number): string | undefined {
  const text = requiredText(value, maxLength)

  if (!text || !/^[A-Za-z0-9_:.+/-]+$/.test(text)) {
    return undefined
  }

  return text
}

function validateReminderUrl(value: unknown): string | undefined {
  const url = requiredText(value, 500)

  if (!url || (!url.startsWith('/') && !url.startsWith('https://'))) {
    return undefined
  }

  return url
}

function invalid(message: string): ValidationFailure {
  return {
    ok: false,
    message,
  }
}
