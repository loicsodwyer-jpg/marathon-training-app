import type { FuelingPreferences } from '../types/fueling'
import type {
  LocalReminderPreview,
  NotificationPreferences,
  NotificationReminderType,
} from '../types/notifications'
import type { DailyScheduleBlock } from '../types/schedule'
import type { DayPlan } from '../types/training'
import { strengthSessionsById } from '../data/strengthSessions'
import { addDays, formatDateKey, getMondayOfWeek } from './dateUtils'
import { formatFuelingSummary } from './fuelingFormatUtils'
import { getFuelingRecommendationForDay } from './fuelingRules'
import type { SyncedPushReminderInput } from './pushReminderBackendClient'
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

type ReminderSyncPayloadArgs = ReminderPreviewArgs & {
  endpoint: string
  syncScope: string
  includePast?: boolean
}

export type ReminderSyncPayload = {
  endpoint: string
  syncScope: string
  rangeStart: string
  rangeEnd: string
  reminders: SyncedPushReminderInput[]
  quietHoursWarnings: LocalReminderPreview[]
}

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

export function buildReminderSyncPayload({
  effectiveDayPlans,
  endpoint,
  endDate,
  fuelingPreferences,
  includePast = false,
  preferences,
  startDate,
  syncScope,
}: ReminderSyncPayloadArgs): ReminderSyncPayload {
  const previews = buildLocalReminderPreviewForRange({
    startDate,
    endDate,
    preferences,
    effectiveDayPlans,
    fuelingPreferences,
  })
  const now = Date.now()
  const quietHoursWarnings: LocalReminderPreview[] = []
  const reminders = previews.flatMap((preview): SyncedPushReminderInput[] => {
    const sendTime = getPreviewSendTime(preview)
    const sendAt = toUtcIso(preview.date, sendTime, preferences.timezone)
    const eventTime = toUtcIso(preview.date, preview.eventTime, preferences.timezone)

    if (!includePast && Date.parse(sendAt) <= now) {
      return []
    }

    if (shouldSkipForQuietHours(preview, preferences)) {
      return []
    }

    if (preview.quietHoursWarning) {
      quietHoursWarnings.push(preview)
    }

    const reminderKey = createReminderKey(preview)

    return [
      {
        reminderKey,
        syncScope,
        sourceActivityId: preview.sourceActivityId,
        sourceDate: preview.date,
        type: preview.type,
        title: preview.title,
        body: preview.body,
        url: preview.url,
        sendAt,
        eventTime,
        reminderOffsetMinutes: preview.reminderOffsetMinutes,
        payload: {
          type: preview.type,
          title: preview.title,
          body: preview.body,
          url: preview.url,
          tag: reminderKey,
          reminderId: reminderKey,
          sourceActivityId: preview.sourceActivityId,
          sourceDate: preview.date,
          eventTimeLocal: preview.eventTime,
          sendTimeLocal: sendTime,
        },
      },
    ]
  })

  return {
    endpoint,
    syncScope,
    rangeStart: startDate,
    rangeEnd: endDate,
    reminders,
    quietHoursWarnings,
  }
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
    const session = block.relatedPlanId ? strengthSessionsById[block.relatedPlanId] : undefined
    const shortTitle = session?.shortTitle ?? block.title

    if (session?.loadCategory === 'optional') {
      return {
        title: isBefore ? `Mini prehab in 1 hour: ${shortTitle}` : `Mini prehab: ${shortTitle}`,
        body: 'Keep it easy and restorative.',
      }
    }

    if (session?.loadCategory === 'mobility') {
      return {
        title: isBefore ? `Mobility in 1 hour: ${shortTitle}` : `Start ${shortTitle}`,
        body: session.id === 'taper-mobility-activation'
          ? 'Taper mobility: activation only, no heavy lifting.'
          : 'Recovery mobility only, no heavy lifting.',
      }
    }

    return {
      title: isBefore ? `Strength in 1 hour: ${shortTitle}` : `Start ${shortTitle}`,
      body: isBefore
        ? `Keep it controlled so running quality stays high. ${session?.purpose ?? block.description ?? ''}`.trim()
        : `${session?.focus ?? block.title}. Duration ${session?.durationRange ?? 'planned session'}.`,
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

function shouldSkipForQuietHours(
  preview: LocalReminderPreview,
  preferences: NotificationPreferences,
) {
  return (
    preferences.quietHoursEnabled &&
    Boolean(preview.quietHoursWarning) &&
    ['snack', 'meal', 'recovery'].includes(preview.type)
  )
}

function createReminderKey(preview: LocalReminderPreview) {
  const source = slugify(preview.sourceActivityId ?? preview.title)
  return `${preview.date}:${preview.type}:${source}:${preview.eventTime}:minus${preview.reminderOffsetMinutes}`
}

function getPreviewSendTime(preview: LocalReminderPreview) {
  const [, time = preview.eventTime] = preview.sendAt.split(' ')
  return time
}

function toUtcIso(date: string, time: string, timeZone: string) {
  try {
    return zonedDateTimeToUtcIso(date, time, timeZone || 'Europe/Amsterdam')
  } catch {
    return new Date(`${date}T${time}:00`).toISOString()
  }
}

function zonedDateTimeToUtcIso(date: string, time: string, timeZone: string) {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  const desiredUtcTime = Date.UTC(year, month - 1, day, hours, minutes)
  const firstUtcTime =
    desiredUtcTime - getTimeZoneOffsetMilliseconds(new Date(desiredUtcTime), timeZone)
  const secondUtcTime =
    desiredUtcTime - getTimeZoneOffsetMilliseconds(new Date(firstUtcTime), timeZone)

  return new Date(secondUtcTime).toISOString()
}

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const values = parts.reduce<Record<string, string>>((result, part) => {
    if (part.type !== 'literal') {
      result[part.type] = part.value
    }

    return result
  }, {})
  const localAsUtcTime = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  )

  return localAsUtcTime - date.getTime()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}
