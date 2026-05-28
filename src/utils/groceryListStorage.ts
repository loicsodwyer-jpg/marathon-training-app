import type { GroceryChecksState } from '../types/grocery'
import { GROCERY_CHECKS_STORAGE_KEY } from './localStorageKeys'

export const groceryChecksChangedEvent = 'loic-marathon-grocery-checks-changed'

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeGroceryChecks(value: unknown): GroceryChecksState {
  if (!isRecord(value)) {
    return {}
  }

  return Object.entries(value).reduce<GroceryChecksState>((state, [weekKey, weekValue]) => {
    if (!isRecord(weekValue)) {
      return state
    }

    const checkedItems = Object.entries(weekValue).reduce<Record<string, boolean>>(
      (items, [itemId, checked]) => {
      if (checked === true) {
        return {
          ...items,
          [itemId]: true,
        }
      }

        return items
      },
      {},
    )

    if (Object.keys(checkedItems).length > 0) {
      return {
        ...state,
        [weekKey]: checkedItems,
      }
    }

    return state
  }, {})
}

export function loadGroceryChecks(): GroceryChecksState {
  if (!canUseLocalStorage()) {
    return {}
  }

  try {
    const storedValue = window.localStorage.getItem(GROCERY_CHECKS_STORAGE_KEY)
    return normalizeGroceryChecks(storedValue ? JSON.parse(storedValue) : undefined)
  } catch {
    return {}
  }
}

export function saveGroceryChecks(state: GroceryChecksState): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(
      GROCERY_CHECKS_STORAGE_KEY,
      JSON.stringify(normalizeGroceryChecks(state)),
    )
    window.dispatchEvent(new Event(groceryChecksChangedEvent))
  } catch {
    // Keep shopping checkmarks non-critical if storage is unavailable.
  }
}

export function toggleGroceryItem(weekKey: string, itemId: string): GroceryChecksState {
  const state = loadGroceryChecks()
  const weekChecks = state[weekKey] ?? {}
  const nextWeekChecks = { ...weekChecks }

  if (nextWeekChecks[itemId]) {
    delete nextWeekChecks[itemId]
  } else {
    nextWeekChecks[itemId] = true
  }

  const nextState = { ...state }

  if (Object.keys(nextWeekChecks).length > 0) {
    nextState[weekKey] = nextWeekChecks
  } else {
    delete nextState[weekKey]
  }

  saveGroceryChecks(nextState)
  return nextState
}

export function clearGroceryChecksForWeek(weekKey: string): GroceryChecksState {
  const state = loadGroceryChecks()
  const nextState = { ...state }
  delete nextState[weekKey]
  saveGroceryChecks(nextState)
  return nextState
}

export function clearAllGroceryChecks(): void {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.removeItem(GROCERY_CHECKS_STORAGE_KEY)
    window.dispatchEvent(new Event(groceryChecksChangedEvent))
  } catch {
    // Keep clear actions from crashing in restricted browser contexts.
  }
}
