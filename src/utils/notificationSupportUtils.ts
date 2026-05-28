import type {
  NotificationPermissionState,
  NotificationSupportStatus,
} from '../types/notifications'

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  return Notification.permission
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(navigatorWithStandalone.standalone)
  )
}

export function isIosLikeDevice(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const platform = window.navigator.platform.toLowerCase()
  const userAgent = window.navigator.userAgent.toLowerCase()
  const maxTouchPoints = window.navigator.maxTouchPoints ?? 0

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === 'macintel' && maxTouchPoints > 1)
  )
}

export function getNotificationSupportStatus(): NotificationSupportStatus {
  const hasNotificationApi = typeof window !== 'undefined' && 'Notification' in window
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window
  const isSecureContext =
    typeof window !== 'undefined' ? window.isSecureContext : false
  const isStandalone = isStandalonePwa()
  const isIosLike = isIosLikeDevice()
  const permission = getNotificationPermissionState()
  const hasVapidPublicKey = Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY)
  const missingReasons: string[] = []

  if (!hasNotificationApi) {
    missingReasons.push('Notifications are not supported in this browser.')
  }

  if (!hasServiceWorker) {
    missingReasons.push('Service workers are not supported in this browser.')
  }

  if (!hasPushManager) {
    missingReasons.push('Push notifications are not supported in this browser.')
  }

  if (!isSecureContext) {
    missingReasons.push('Notifications require HTTPS or localhost.')
  }

  if (isIosLike && !isStandalone) {
    missingReasons.push('On iPhone, open the app from the Home Screen before enabling push notifications.')
  }

  if (permission === 'denied') {
    missingReasons.push('Notifications are blocked. Re-enable them in browser/iPhone settings.')
  }

  if (!hasVapidPublicKey) {
    missingReasons.push('Add VITE_VAPID_PUBLIC_KEY to enable push subscription creation.')
  }

  const canRequestPermission =
    hasNotificationApi && isSecureContext && permission === 'default' && (!isIosLike || isStandalone)
  const canSubscribeToPush =
    hasNotificationApi &&
    hasServiceWorker &&
    hasPushManager &&
    isSecureContext &&
    permission === 'granted' &&
    hasVapidPublicKey

  return {
    hasNotificationApi,
    hasServiceWorker,
    hasPushManager,
    isSecureContext,
    isStandalone,
    isIosLike,
    permission,
    canRequestPermission,
    canSubscribeToPush,
    missingReasons,
  }
}

export function getNotificationSupportMessage(status: NotificationSupportStatus): string {
  if (status.permission === 'granted' && status.canSubscribeToPush) {
    return 'This device is ready to create a push subscription.'
  }

  if (status.permission === 'granted') {
    return 'Local notifications are enabled. Save this device to test backend push.'
  }

  return status.missingReasons[0] ?? 'Enable notifications from a user action to continue.'
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Value = `${base64}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64Value)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}
