import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import type { CalendarExportRange, CalendarExportSettings } from '../types/calendarExport'
import { addDays, getMondayOfWeek } from './dateUtils'

export const defaultCalendarTimezone = 'Europe/Amsterdam'

export function getDefaultCalendarExportSettings(selectedDate: string): CalendarExportSettings {
  const { startDate, endDate } = getCurrentWeekRange(selectedDate)

  return {
    range: 'current_week',
    startDate,
    endDate,
    includeRuns: true,
    includeStrength: true,
    includeRace: true,
    includeSpecialEvents: true,
    includeMeals: false,
    includeRecoveryReminders: false,
    includeCompletedLoggedSessions: true,
    calendarName: 'Loïc Marathon 2:55',
    timezone: defaultCalendarTimezone,
  }
}

export function updateCalendarExportRange(
  settings: CalendarExportSettings,
  range: CalendarExportRange,
  selectedDate: string,
): CalendarExportSettings {
  const resolvedRange =
    range === 'current_week'
      ? getCurrentWeekRange(selectedDate)
      : range === 'next_4_weeks'
        ? getNextFourWeeksRange(selectedDate)
        : range === 'full_plan'
          ? getFullPlanRange()
          : { startDate: settings.startDate, endDate: settings.endDate }

  return {
    ...settings,
    range,
    startDate: resolvedRange.startDate,
    endDate: resolvedRange.endDate,
  }
}

export function resolveCalendarExportRange(settings: CalendarExportSettings) {
  if (settings.range === 'full_plan') {
    return getFullPlanRange()
  }

  return {
    startDate: settings.startDate,
    endDate: settings.endDate,
  }
}

export function getCurrentWeekRange(selectedDate: string) {
  const clampedDate = clampDateToPlan(selectedDate)
  const monday = getMondayOfWeek(clampedDate)
  const sunday = addDays(monday, 6)

  return {
    startDate: monday < trainingPlanStartDate ? trainingPlanStartDate : monday,
    endDate: sunday > trainingPlanEndDate ? trainingPlanEndDate : sunday,
  }
}

export function getNextFourWeeksRange(selectedDate: string) {
  const startDate = clampDateToPlan(selectedDate)
  const endDate = addDays(startDate, 27)

  return {
    startDate,
    endDate: endDate > trainingPlanEndDate ? trainingPlanEndDate : endDate,
  }
}

export function getFullPlanRange() {
  return {
    startDate: trainingPlanStartDate,
    endDate: trainingPlanEndDate,
  }
}

export function validateCalendarExportSettings(settings: CalendarExportSettings): string[] {
  const errors: string[] = []

  if (!settings.startDate) {
    errors.push('Start date is required.')
  }

  if (!settings.endDate) {
    errors.push('End date is required.')
  }

  if (settings.startDate && settings.endDate && settings.endDate < settings.startDate) {
    errors.push('End date must be on or after start date.')
  }

  if (settings.endDate < trainingPlanStartDate || settings.startDate > trainingPlanEndDate) {
    errors.push('Date range should overlap the marathon plan.')
  }

  if (
    !settings.includeRuns &&
    !settings.includeStrength &&
    !settings.includeRace &&
    !settings.includeSpecialEvents &&
    !settings.includeMeals &&
    !settings.includeRecoveryReminders
  ) {
    errors.push('Select at least one event type to export.')
  }

  if (!settings.calendarName.trim()) {
    errors.push('Calendar name is required.')
  }

  if (!settings.timezone.trim()) {
    errors.push('Timezone is required.')
  }

  return errors
}

export function getCalendarExportFilename(settings: CalendarExportSettings) {
  const { startDate, endDate } = resolveCalendarExportRange(settings)
  return `loic-marathon-calendar-${startDate}-to-${endDate}.ics`
}

function clampDateToPlan(date: string) {
  if (date < trainingPlanStartDate) {
    return trainingPlanStartDate
  }

  if (date > trainingPlanEndDate) {
    return trainingPlanEndDate
  }

  return date
}
