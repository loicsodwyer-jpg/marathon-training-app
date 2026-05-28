export type NotificationPermissionState =
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported'

export type NotificationReminderType =
  | 'run'
  | 'strength'
  | 'snack'
  | 'meal'
  | 'fueling'
  | 'recovery'
  | 'race'
  | 'custom'

export interface NotificationPreferences {
  enabled: boolean
  runReminders: boolean
  strengthReminders: boolean
  snackReminders: boolean
  mealReminders: boolean
  fuelingReminders: boolean
  recoveryReminders: boolean
  raceReminders: boolean
  oneHourBefore: boolean
  atEventTime: boolean
  includeFuelingInRunNotification: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  timezone: string
}

export interface NotificationSupportStatus {
  hasNotificationApi: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
  isSecureContext: boolean
  isStandalone: boolean
  isIosLike: boolean
  permission: NotificationPermissionState
  canRequestPermission: boolean
  canSubscribeToPush: boolean
  missingReasons: string[]
}

export interface LocalReminderPreview {
  id: string
  date: string
  sendAt: string
  eventTime: string
  reminderOffsetMinutes: number
  type: NotificationReminderType
  title: string
  body: string
  url: string
  sourceActivityId?: string
  quietHoursWarning?: string
}
