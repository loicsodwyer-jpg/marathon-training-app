import { useEffect, useState } from 'react'
import type { GroceryChecksState } from '../types/grocery'
import {
  clearGroceryChecksForWeek,
  groceryChecksChangedEvent,
  loadGroceryChecks,
  toggleGroceryItem,
} from '../utils/groceryListStorage'

export function useGroceryListChecks(weekKey: string) {
  const [checks, setChecks] = useState<GroceryChecksState>(() => loadGroceryChecks())

  useEffect(() => {
    const refreshChecks = () => {
      setChecks(loadGroceryChecks())
    }

    window.addEventListener('storage', refreshChecks)
    window.addEventListener(groceryChecksChangedEvent, refreshChecks)

    return () => {
      window.removeEventListener('storage', refreshChecks)
      window.removeEventListener(groceryChecksChangedEvent, refreshChecks)
    }
  }, [])

  const toggleItem = (itemId: string) => {
    setChecks(toggleGroceryItem(weekKey, itemId))
  }

  const clearWeek = () => {
    setChecks(clearGroceryChecksForWeek(weekKey))
  }

  return {
    checkedItems: checks[weekKey] ?? {},
    toggleItem,
    clearWeek,
  }
}
