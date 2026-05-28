import { useEffect, useState } from 'react'
import type { NotificationPreferences } from '../types/notifications'
import {
  loadNotificationPreferences,
  notificationPreferencesChangedEvent,
  resetNotificationPreferences,
  saveNotificationPreferences,
} from '../utils/notificationPreferencesStorage'

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    loadNotificationPreferences(),
  )

  useEffect(() => {
    const refreshPreferences = () => {
      setPreferences(loadNotificationPreferences())
    }

    window.addEventListener('storage', refreshPreferences)
    window.addEventListener(notificationPreferencesChangedEvent, refreshPreferences)

    return () => {
      window.removeEventListener('storage', refreshPreferences)
      window.removeEventListener(notificationPreferencesChangedEvent, refreshPreferences)
    }
  }, [])

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    const nextPreferences = {
      ...preferences,
      ...updates,
    }
    saveNotificationPreferences(nextPreferences)
    setPreferences(loadNotificationPreferences())
  }

  const resetPreferences = () => {
    resetNotificationPreferences()
    setPreferences(loadNotificationPreferences())
  }

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  }
}
