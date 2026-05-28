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
