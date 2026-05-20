import { useEffect, useState } from 'react'
import type { FuelingPreferences } from '../types/fueling'
import {
  fuelingPreferencesChangedEvent,
  loadFuelingPreferences,
  resetFuelingPreferences,
  saveFuelingPreferences,
} from '../utils/fuelingStorage'

export function useFuelingPreferences() {
  const [preferences, setPreferences] = useState<FuelingPreferences>(() =>
    loadFuelingPreferences(),
  )

  useEffect(() => {
    const refreshPreferences = () => {
      setPreferences(loadFuelingPreferences())
    }

    window.addEventListener('storage', refreshPreferences)
    window.addEventListener(fuelingPreferencesChangedEvent, refreshPreferences)

    return () => {
      window.removeEventListener('storage', refreshPreferences)
      window.removeEventListener(fuelingPreferencesChangedEvent, refreshPreferences)
    }
  }, [])

  const updatePreferences = (updates: Partial<FuelingPreferences>) => {
    const nextPreferences = {
      ...preferences,
      ...updates,
      preferredBrand: 'Maurten' as const,
    }
    saveFuelingPreferences(nextPreferences)
    setPreferences(nextPreferences)
  }

  const resetPreferences = () => {
    resetFuelingPreferences()
    setPreferences(loadFuelingPreferences())
  }

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  }
}
