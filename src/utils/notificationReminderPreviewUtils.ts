import type { FuelingPreferences } from '../types/fueling'
import type {
  LocalReminderPreview,
  NotificationPreferences,
  NotificationReminderType,
} from '../types/notifications'
import type { DailyScheduleBlock } from '../types/schedule'
import type { DayPlan } from '../types/training'
import { addDays, formatDateKey, getMondayOfWeek } from './dateUtils'
import { formatFuelingSummary } from './fuelingFormatUtils'
import { getFuelingRecommendationForDay } from './fuelingRules'
import { getScheduleOverridesForDate } from './scheduleStorage'
import { applyScheduleOverridesToGeneratedBlocks } from './scheduleOverrideUtils'
import { addMinutesToTime, sortBlocksByTime, timeToMinutes } from './scheduleTimeUtils'
import { getDailyScheduleBlocks } from './todayScheduleUtils'

type ReminderPreviewArgs = {
  startDate: string
  endDate: string
  preferences: NotificationPreferences
  effectiveDayPlans: DayPlan[]
  fuelingPreferences: FuelingPreferences
}

type ReminderPreviewRange = 'next_7_days' | 'current_week' | 'next_4_weeks'

export function getNotificationPreviewRange(
  range: ReminderPreviewRange,
  selectedDate = formatDateKey(new Date()),
) {
  if (range === 'current_week') {
    const startDate = getMondayOfWeek(selectedDate)
    return {
      startDate,
      endDate: addDays(startDate, 6),
    }
  }

  if (range === 'next_4_weeks') {
    return {
      startDate: selectedDate,
      endDate: addDays(selectedDate, 27),
    }
  }

  return {
    startDate: selectedDate,
    endDate: addDays(selectedDate, 6),
  }
}

export function buildLocalReminderPreviewForRange({
  startDate,
  endDate,
  preferences,
  effectiveDayPlans,
  fuelingPreferences,
}: ReminderPreviewArgs): LocalReminderPreview[] {
  if (!preferences.enabled) {
    return []
  }

  return effectiveDayPlans
    .filter((dayPlan) => dayPlan.date >= startDate && dayPlan.date <= endDate)
    .flatMap((dayPlan) => buildDayReminderPreview(dayPlan, preferences, fuelingPreferences))
    .sort((firstReminder, secondReminder) => firstReminder.sendAt.localeCompare(secondReminder.sendAt))
}

function buildDayReminderPreview(
  dayPlan: DayPlan,
  preferences: NotificationPreferences,
  fuelingPreferences: FuelingPreferences,
): LocalReminderPreview[] {
  const blocks = getEffectiveScheduleBlocks(dayPlan, fuelingPreferences)

  return blocks.flatMap((block) => {
    const type = getReminderType(block)

    if (!type || !isReminderTypeEnabled(type, preferences)) {
      return []
    }

    return createReminderPreviews(dayPlan, block, type, preferences, fuelingPreferences)
  })
}

function getEffectiveScheduleBlocks(
  dayPlan: DayPlan,
  fuelingPreferences: FuelingPreferences,
) {
  const overrides = getScheduleOverridesForDate(dayPlan.date)
  const plannedBlocks = applyScheduleOverridesToGeneratedBlocks(
    getDailyScheduleBlocks(dayPlan, fuelingPreferences),
    overrides,
  )

  return sortBlocksByTime([...plannedBlocks, ...(overrides?.customBlocks ?? [])])
}

function getReminderType(block: DailyScheduleBlock): NotificationReminderType | undefined {
  if (block.category === 'race') {
    return 'race'
  }

  if (block.category === 'run') {
    return 'run'
  }

  if (block.category === 'strength') {
    return 'strength'
  }

  if (block.category === 'meal') {
    const title = block.title.toLowerCase()

    if (title.includes('pre-run') || title.includes('fuel')) {
      return 'fueling'
    }

    if (title.includes('snack')) {
      return 'snack'
    }

    return 'meal'
  }

  if (block.category === 'recovery') {
    return 'recovery'
  }

  if (block.category === 'custom') {
    return 'custom'
  }

  return undefined
}

function isReminderTypeEnabled(
  type: NotificationReminderType,
  preferences: NotificationPreferences,
) {
  if (type === 'run') {
    return preferences.runReminders
  }

  if (type === 'strength') {
    return preferences.strengthReminders
  }

  if (type === 'snack') {
    return preferences.snackReminders
  }

  if (type === 'meal') {
    return preferences.mealReminders
  }

  if (type === 'fueling') {
    return preferences.fuelingReminders
  }

  if (type === 'recovery') {
    return preferences.recoveryReminders
  }

  if (type === 'race') {
    return preferences.raceReminders
  }

  return true
}

function createReminderPreviews(
  dayPlan: DayPlan,
  block: DailyScheduleBlock,
  type: NotificationReminderType,
  preferences: NotificationPreferences,
  fuelingPreferences: FuelingPreferences,
) {
  const offsets = [
    ...(preferences.oneHourBefore ? [60] : []),
    ...(preferences.atEventTime ? [0] : []),
  ]

  return offsets.map((offset) =>
    createReminderPreview(dayPlan, block, type, offset, preferences, fuelingPreferences),
  )
}

function createReminderPreview(
  dayPlan: DayPlan,
  block: DailyScheduleBlock,
  type: NotificationReminderType,
  offsetMinutes: number,
  preferences: NotificationPreferences,
  fuelingPreferences: FuelingPreferences,
): LocalReminderPreview {
  const sendTime = addMinutesToTime(block.startTime, -offsetMinutes)
  const isBefore = offsetMinutes > 0
  const { title, body } = getReminderCopy(
    dayPlan,
    block,
    type,
    isBefore,
    preferences,
    fuelingPreferences,
  )
  const quietHoursWarning =
    preferences.quietHoursEnabled && isInsideQuietHours(sendTime, preferences)
      ? 'Falls inside quiet hours.'
      : undefined

  return {
    id: `${block.id}-${offsetMinutes}`,
    date: block.date,
    sendAt: `${block.date} ${sendTime}`,
    eventTime: block.startTime,
    reminderOffsetMinutes: offsetMinutes,
    type,
    title,
    body,
    url: `/?date=${block.date}`,
    sourceActivityId: block.id,
    quietHoursWarning,
  }
}

function getReminderCopy(
  dayPlan: DayPlan,
  block: DailyScheduleBlock,
  type: NotificationReminderType,
  isBefore: boolean,
  preferences: NotificationPreferences,
  fuelingPreferences: FuelingPreferences,
) {
  if (type === 'race') {
    return {
      title: isBefore ? 'Race in 1 hour' : 'Amsterdam Marathon',
      body: isBefore
        ? 'Final kit, shoes, gels, and calm start routine.'
        : 'Start controlled. Follow the practised Maurten fuelling plan.',
    }
  }

  if (type === 'run') {
    const recommendation = getFuelingRecommendationForDay(dayPlan, fuelingPreferences)
    const fuelText =
      preferences.includeFuelingInRunNotification && recommendation.category !== 'none'
        ? ` Fuel: ${formatFuelingSummary(recommendation)}.`
        : ''

    return {
      title: isBefore ? 'Run in 1 hour' : 'Run now',
      body: isBefore
        ? `${block.title}. Get changed, check shoes, prep snack.${fuelText}`
        : `${block.title}.${fuelText}`,
    }
  }

  if (type === 'strength') {
    return {
      title: isBefore ? 'Strength in 1 hour' : 'Strength session now',
      body: `${block.title}. Keep it controlled and repeatable.`,
    }
  }

  if (type === 'fueling') {
    return {
      title: isBefore ? 'Fuelling soon' : block.title,
      body: block.description || 'Take the planned pre-run fuel.',
    }
  }

  if (type === 'snack') {
    return {
      title: isBefore ? 'Snack in 1 hour' : 'Snack time',
      body: block.description || 'Keep energy steady for the training day.',
    }
  }

  if (type === 'meal') {
    return {
      title: isBefore ? `${block.title} in 1 hour` : block.title,
      body: block.description || 'Simple meal support for training.',
    }
  }

  if (type === 'recovery') {
    return {
      title: isBefore ? 'Recovery soon' : 'Recovery check',
      body: block.description || 'Hydration, food, and legs check.',
    }
  }

  return {
    title: isBefore ? `${block.title} in 1 hour` : block.title,
    body: block.description || 'Scheduled activity.',
  }
}

function isInsideQuietHours(time: string, preferences: NotificationPreferences) {
  const current = timeToMinutes(time)
  const start = timeToMinutes(preferences.quietHoursStart)
  const end = timeToMinutes(preferences.quietHoursEnd)

  if (start <= end) {
    return current >= start && current < end
  }

  return current >= start || current < end
}
