import { useEffect, useState } from 'react'
import {
  loadNotificationSyncMetadata,
  notificationSyncMetadataChangedEvent,
  type NotificationSyncMetadata,
} from '../utils/notificationSyncMetadataStorage'

export function useNotificationSyncMetadata() {
  const [metadata, setMetadata] = useState<NotificationSyncMetadata>(() =>
    loadNotificationSyncMetadata(),
  )

  useEffect(() => {
    const refreshMetadata = () => setMetadata(loadNotificationSyncMetadata())

    window.addEventListener(notificationSyncMetadataChangedEvent, refreshMetadata)
    window.addEventListener('storage', refreshMetadata)

    return () => {
      window.removeEventListener(notificationSyncMetadataChangedEvent, refreshMetadata)
      window.removeEventListener('storage', refreshMetadata)
    }
  }, [])

  return metadata
}
