import { useState } from 'react'
import type { DayPlanOverride, PlanAdjustmentRecord } from '../types/planOverride'
import {
  clearAllPlanOverrides,
  clearPlanAdjustment,
  clearPlanOverrideForDate,
  getAllActiveDayOverrides,
  getAllAdjustmentRecords,
  getPlanOverrideForDate,
  loadPlanOverrides,
  savePlanAdjustment,
} from '../utils/planOverrideStorage'

export function usePlanOverrides() {
  const [overridesState, setOverridesState] = useState(() => loadPlanOverrides())

  const refreshOverrides = () => {
    setOverridesState(loadPlanOverrides())
  }

  const saveAdjustment = (
    record: PlanAdjustmentRecord,
    dayOverrides: DayPlanOverride[],
  ) => {
    savePlanAdjustment(record, dayOverrides)
    refreshOverrides()
  }

  const clearDayOverride = (date: string) => {
    clearPlanOverrideForDate(date)
    refreshOverrides()
  }

  const clearAdjustment = (adjustmentId: string) => {
    clearPlanAdjustment(adjustmentId)
    refreshOverrides()
  }

  const clearAllOverrides = () => {
    clearAllPlanOverrides()
    refreshOverrides()
  }

  const activeDayOverrides = getAllActiveDayOverrides()
  const adjustmentRecords = getAllAdjustmentRecords()

  return {
    overridesState,
    getOverrideForDate: getPlanOverrideForDate,
    activeDayOverrides,
    adjustmentRecords,
    saveAdjustment,
    clearDayOverride,
    clearAdjustment,
    clearAllOverrides,
    hasOverrides: Object.keys(activeDayOverrides).length > 0,
    refreshOverrides,
  }
}
