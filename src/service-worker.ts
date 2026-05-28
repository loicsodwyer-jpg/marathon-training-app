/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

type PushPayload = {
  title?: string
  body?: string
  url?: string
  tag?: string
  type?: string
  reminderId?: string
}

type ExtendedNotificationOptions = NotificationOptions & {
  renotify?: boolean
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

void self.skipWaiting()
clientsClaim()

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event.data)
  const title = payload.title ?? 'Marathon 2:55'
  const options: ExtendedNotificationOptions = {
    body: payload.body ?? 'Training reminder.',
    icon: '/icons/icon-192.png',
    badge: '/icons/maskable-icon-192.png',
    tag: payload.tag,
    data: {
      url: payload.url ?? '/',
      type: payload.type ?? 'reminder',
      reminderId: payload.reminderId,
    },
    renotify: false,
    requireInteraction: false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const notificationData = event.notification.data as { url?: string } | undefined
  const targetUrl = new URL(notificationData?.url ?? '/', self.location.origin).href

  event.waitUntil(focusOrOpenClient(targetUrl))
})

self.addEventListener('notificationclose', () => {
  // Reserved for future local/backend analytics. No network work in Step 25.
})

function parsePushPayload(data: PushMessageData | null): PushPayload {
  if (!data) {
    return {}
  }

  try {
    const parsedValue = data.json() as unknown
    return isPushPayload(parsedValue) ? parsedValue : {}
  } catch {
    return {
      body: data.text(),
    }
  }
}

function isPushPayload(value: unknown): value is PushPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function focusOrOpenClient(targetUrl: string) {
  const clientList = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })

  const matchingClient = clientList.find((client) => {
    const clientUrl = new URL(client.url)
    return clientUrl.origin === self.location.origin
  })

  if (matchingClient) {
    await matchingClient.focus()
    matchingClient.postMessage({
      type: 'notification-click',
      url: targetUrl,
    })
    return
  }

  await self.clients.openWindow(targetUrl)
}
