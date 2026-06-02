import type { NotificationPermissionState } from '../types/notifications'
import { LOCAL_PUSH_SUBSCRIPTION_STORAGE_KEY } from './localStorageKeys'
import { markNotificationRemindersNeedResync } from './notificationSyncMetadataStorage'
import { getNotificationPermissionState, urlBase64ToUint8Array } from './notificationSupportUtils'
import {
  removePushSubscriptionFromBackend,
  savePushSubscriptionToBackend,
  sendBackendTestPush,
  type PushBackendResult,
  type SavePushSubscriptionResult,
} from './pushBackendClient'
import type { NotificationPreferences } from '../types/notifications'

export type PushSubscriptionWorkflowResult = PushBackendResult & {
  backendSaved?: boolean
  browserSubscribed?: boolean
  endpoint?: string
  subscriptionId?: string
}

export function getVapidPublicKey(): string | undefined {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported on this device.')
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration()
  return existingRegistration ?? navigator.serviceWorker.ready
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) {
    return 'unsupported'
  }

  const permission = await Notification.requestPermission()
  return permission
}

export async function showLocalTestNotification(): Promise<void> {
  if (getNotificationPermissionState() !== 'granted') {
    throw new Error('Notification permission is not granted yet.')
  }

  const registration = await getServiceWorkerRegistration()

  if ('showNotification' in registration) {
    await registration.showNotification('Marathon 2:55 test', {
      body: 'Notifications are working on this device.',
      icon: '/icons/icon-192.png',
      badge: '/icons/maskable-icon-192.png',
      tag: 'marathon-255-test',
      data: {
        url: '/',
        type: 'test',
        reminderId: 'local-test',
      },
    })
    return
  }

  new Notification('Marathon 2:55 test', {
    body: 'Notifications are working on this device.',
    icon: '/icons/icon-192.png',
  })
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await getServiceWorkerRegistration()
    return registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const vapidPublicKey = getVapidPublicKey()

  if (!vapidPublicKey || getNotificationPermissionState() !== 'granted') {
    return null
  }

  const registration = await getServiceWorkerRegistration()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })

  saveLocalSerializedPushSubscription(serializePushSubscription(subscription))
  return subscription
}

export async function createAndSavePushSubscription(
  preferences: NotificationPreferences,
  deviceLabel: string,
): Promise<PushSubscriptionWorkflowResult> {
  const vapidPublicKey = getVapidPublicKey()

  if (!vapidPublicKey) {
    return {
      ok: false,
      message: 'Add VITE_VAPID_PUBLIC_KEY to enable push subscription creation.',
    }
  }

  let permission = getNotificationPermissionState()

  if (permission === 'default') {
    permission = await requestNotificationPermission()
  }

  if (permission !== 'granted') {
    return {
      ok: false,
      message: 'Notification permission is not granted yet.',
    }
  }

  const registration = await getServiceWorkerRegistration()
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }))
  const serializedSubscription = serializePushSubscription(subscription)
  saveLocalSerializedPushSubscription(serializedSubscription)

  const backendResult: SavePushSubscriptionResult = await savePushSubscriptionToBackend({
    subscription: serializedSubscription,
    preferences,
    timezone: preferences.timezone,
    deviceLabel,
  })

  return {
    ok: backendResult.ok,
    message: backendResult.ok
      ? 'This device is saved for backend push notifications.'
      : backendResult.message,
    backendSaved: backendResult.ok,
    browserSubscribed: true,
    endpoint: subscription.endpoint,
    subscriptionId: backendResult.subscriptionId,
  }
}

export async function removePushSubscriptionEverywhere(): Promise<PushSubscriptionWorkflowResult> {
  const subscription = await getExistingPushSubscription()
  let backendResult: PushBackendResult | undefined

  if (subscription?.endpoint) {
    backendResult = await removePushSubscriptionFromBackend(subscription.endpoint)
  }

  const browserUnsubscribed = subscription ? await subscription.unsubscribe() : false
  clearLocalSerializedPushSubscription()

  if (backendResult && !backendResult.ok) {
    return {
      ok: false,
      message: backendResult.message,
      browserSubscribed: !browserUnsubscribed,
      endpoint: subscription?.endpoint,
    }
  }

  return {
    ok: true,
    message: browserUnsubscribed
      ? 'Push subscription removed from this browser and backend.'
      : 'No browser push subscription was active.',
    backendSaved: false,
    browserSubscribed: false,
    endpoint: subscription?.endpoint,
  }
}

export async function sendBackendTestNotification(): Promise<PushBackendResult> {
  const subscription = await getExistingPushSubscription()

  if (!subscription?.endpoint) {
    return {
      ok: false,
      message: 'Create and save a push subscription first.',
    }
  }

  return sendBackendTestPush(subscription.endpoint)
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const subscription = await getExistingPushSubscription()

  if (!subscription) {
    clearLocalSerializedPushSubscription()
    return false
  }

  const result = await subscription.unsubscribe()
  clearLocalSerializedPushSubscription()
  return result
}

export function serializePushSubscription(subscription: PushSubscription): Record<string, unknown> {
  return subscription.toJSON() as Record<string, unknown>
}

export function loadLocalSerializedPushSubscription(): Record<string, unknown> | undefined {
  try {
    const storedValue = window.localStorage.getItem(LOCAL_PUSH_SUBSCRIPTION_STORAGE_KEY)
    const parsedValue = storedValue ? JSON.parse(storedValue) : undefined
    return typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)
      ? (parsedValue as Record<string, unknown>)
      : undefined
  } catch {
    return undefined
  }
}

function saveLocalSerializedPushSubscription(subscription: Record<string, unknown>): void {
  try {
    window.localStorage.setItem(
      LOCAL_PUSH_SUBSCRIPTION_STORAGE_KEY,
      JSON.stringify(subscription),
    )
    markNotificationRemindersNeedResync('Push subscription changed.')
  } catch {
    // Local subscription display is non-critical.
  }
}

function clearLocalSerializedPushSubscription(): void {
  try {
    window.localStorage.removeItem(LOCAL_PUSH_SUBSCRIPTION_STORAGE_KEY)
    markNotificationRemindersNeedResync('Push subscription changed.')
  } catch {
    // Keep unsubscribe actions from crashing if storage is unavailable.
  }
}
