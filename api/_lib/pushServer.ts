import * as webPush from 'web-push'
import { readPushEnv } from './env.js'
import type { WebPushSubscription } from './types.js'

export type PushPayload = {
  title: string
  body: string
  url: string
  tag: string
  type: string
  reminderId?: string
}

let isConfigured = false

export function configureWebPush(): void {
  if (isConfigured) {
    return
  }

  const env = readPushEnv()
  webPush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey)
  isConfigured = true
}

export async function sendPushNotification(
  subscription: WebPushSubscription,
  payload: PushPayload,
): Promise<void> {
  configureWebPush()
  await webPush.sendNotification(subscription, JSON.stringify(payload))
}

export function getWebPushErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode
  }

  return undefined
}

export function getWebPushErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Push notification failed.'
}
