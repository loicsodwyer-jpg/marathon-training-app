import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http'

export type ApiRequest = IncomingMessage & {
  body?: unknown
  headers: IncomingHttpHeaders
  method?: string
}

export type ApiResponse = ServerResponse & {
  status: (statusCode: number) => ApiResponse
  json: (body: unknown) => void
}

export type PushSubscriptionRecord = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  active: boolean
  last_seen_at?: string | null
  last_test_sent_at?: string | null
}

export type WebPushSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled'

export interface ReminderPayload {
  type: string
  title: string
  body: string
  url: string
  tag?: string
  reminderId?: string
  sourceActivityId?: string
  sourceDate?: string
}

export interface SyncedReminderInput {
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

export interface SyncRemindersPayload {
  endpoint: string
  syncScope: string
  rangeStart: string
  rangeEnd: string
  reminders: SyncedReminderInput[]
}

export interface ListRemindersPayload {
  endpoint: string
  rangeStart: string
  rangeEnd: string
  status?: ReminderStatus
}

export interface ClearRemindersPayload {
  endpoint: string
  syncScope: string
}

export interface SendDueRemindersPayload {
  dryRun?: boolean
  limit?: number
}

export interface ReminderHealthPayload {
  endpoint?: string
}
