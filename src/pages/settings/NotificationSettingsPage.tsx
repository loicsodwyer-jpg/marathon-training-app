import {
  Bell,
  Clock,
  Cloud,
  Eye,
  RotateCcw,
  Send,
  ShieldAlert,
  Smartphone,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import PageCard from '../../components/PageCard'
import StatusPill, { type StatusTone } from '../../components/StatusPill'
import { useFuelingPreferences } from '../../hooks/useFuelingPreferences'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import type {
  LocalReminderPreview,
  NotificationSupportStatus,
} from '../../types/notifications'
import { formatDisplayDate } from '../../utils/dateUtils'
import { getEffectiveFullTrainingPlan } from '../../utils/effectiveTrainingPlanUtils'
import {
  buildLocalReminderPreviewForRange,
  getNotificationPreviewRange,
} from '../../utils/notificationReminderPreviewUtils'
import {
  getNotificationSupportMessage,
  getNotificationSupportStatus,
} from '../../utils/notificationSupportUtils'
import {
  createAndSavePushSubscription,
  getExistingPushSubscription,
  getVapidPublicKey,
  removePushSubscriptionEverywhere,
  requestNotificationPermission,
  sendBackendTestNotification,
  showLocalTestNotification,
} from '../../utils/pushSubscriptionUtils'
import {
  getPushSubscriptionBackendStatus,
  type PushSubscriptionBackendStatusResult,
} from '../../utils/pushBackendClient'

type NotificationSettingsPageProps = {
  selectedDate: string
}

type PreviewRange = 'next_7_days' | 'current_week' | 'next_4_weeks'

type Message = {
  tone: 'success' | 'error'
  text: string
}

const previewRangeLabels: Record<PreviewRange, string> = {
  next_7_days: 'Next 7 days',
  current_week: 'Current week',
  next_4_weeks: 'Next 4 weeks',
}

function NotificationSettingsPage({ selectedDate }: NotificationSettingsPageProps) {
  const { preferences, resetPreferences, updatePreferences } = useNotificationPreferences()
  const { preferences: fuelingPreferences } = useFuelingPreferences()
  const [supportStatus, setSupportStatus] = useState<NotificationSupportStatus>(() =>
    getNotificationSupportStatus(),
  )
  const [hasPushSubscription, setHasPushSubscription] = useState(false)
  const [backendStatus, setBackendStatus] = useState<PushSubscriptionBackendStatusResult>()
  const [deviceLabel, setDeviceLabel] = useState(() => getDefaultDeviceLabel())
  const [isBackendBusy, setIsBackendBusy] = useState(false)
  const [message, setMessage] = useState<Message>()
  const [previewRange, setPreviewRange] = useState<PreviewRange>('next_7_days')
  const hasVapidPublicKey = Boolean(getVapidPublicKey())

  const refreshStatus = async () => {
    const nextStatus = await readPushStatus()
    setSupportStatus(nextStatus.supportStatus)
    setHasPushSubscription(nextStatus.hasPushSubscription)
    setBackendStatus(nextStatus.backendStatus)
  }

  useEffect(() => {
    let isMounted = true

    void readPushStatus()
      .then((nextStatus) => {
        if (!isMounted) {
          return
        }

        setHasPushSubscription(nextStatus.hasPushSubscription)
        setSupportStatus(nextStatus.supportStatus)
        setBackendStatus(nextStatus.backendStatus)
      })
      .catch(() => {
        if (isMounted) {
          setSupportStatus(getNotificationSupportStatus())
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const previewWindow = getNotificationPreviewRange(previewRange, selectedDate)
  const reminders = useMemo(
    () =>
      buildLocalReminderPreviewForRange({
        startDate: previewWindow.startDate,
        endDate: previewWindow.endDate,
        preferences,
        effectiveDayPlans: getEffectiveFullTrainingPlan(),
        fuelingPreferences,
      }),
    [fuelingPreferences, preferences, previewWindow.endDate, previewWindow.startDate],
  )
  const visibleReminders = reminders.slice(0, 20)

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission()
    updatePreferences({ enabled: permission === 'granted' })
    setMessage({
      tone: permission === 'granted' ? 'success' : 'error',
      text:
        permission === 'granted'
          ? 'Notifications enabled on this device.'
          : 'Notification permission was not granted.',
    })
    await refreshStatus()
  }

  const handleTestNotification = async () => {
    try {
      await showLocalTestNotification()
      setMessage({ tone: 'success', text: 'Test notification sent.' })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not send test notification.',
      })
    }
  }

  const handleCreateAndSaveSubscription = async () => {
    setIsBackendBusy(true)

    try {
      const result = await createAndSavePushSubscription(preferences, deviceLabel)
      setMessage({ tone: result.ok ? 'success' : 'error', text: result.message })
      await refreshStatus()
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not save push subscription.',
      })
    } finally {
      setIsBackendBusy(false)
    }
  }

  const handleCheckBackendStatus = async () => {
    setIsBackendBusy(true)

    try {
      const subscription = await getExistingPushSubscription()

      if (!subscription?.endpoint) {
        setBackendStatus(undefined)
        setMessage({ tone: 'error', text: 'Create a push subscription first.' })
        return
      }

      const result = await getPushSubscriptionBackendStatus(subscription.endpoint)
      setBackendStatus(result)
      setMessage({
        tone: result.ok ? 'success' : 'error',
        text: result.ok ? 'Backend status checked.' : result.message,
      })
      await refreshStatus()
    } finally {
      setIsBackendBusy(false)
    }
  }

  const handleBackendTest = async () => {
    setIsBackendBusy(true)

    try {
      const result = await sendBackendTestNotification()
      setMessage({ tone: result.ok ? 'success' : 'error', text: result.message })
      await refreshStatus()
    } finally {
      setIsBackendBusy(false)
    }
  }

  const handleRemoveSubscription = async () => {
    setIsBackendBusy(true)

    try {
      const result = await removePushSubscriptionEverywhere()
      setMessage({ tone: result.ok ? 'success' : 'error', text: result.message })
      await refreshStatus()
    } finally {
      setIsBackendBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <SupportStatusCard status={supportStatus} />

      {message ? (
        <p
          className={`rounded-[18px] border px-3 py-2 text-sm font-semibold ${
            message.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <PageCard className="space-y-3">
        <SectionTitle
          icon={Bell}
          title="Enable notifications"
          subtitle="Permission is requested only when you tap the button."
        />
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white"
          disabled={!supportStatus.canRequestPermission && supportStatus.permission !== 'default'}
          onClick={() => {
            void handleEnableNotifications()
          }}
          type="button"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {supportStatus.permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
        </button>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
          disabled={supportStatus.permission !== 'granted'}
          onClick={() => {
            void handleTestNotification()
          }}
          type="button"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Send test notification
        </button>
      </PageCard>

      <PageCard className="space-y-3">
        <SectionTitle
          icon={Cloud}
          title="Backend push connection"
          subtitle="Step 26 saves this device and sends backend test pushes. Scheduled reminders come in Step 27."
        />
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={hasVapidPublicKey ? 'success' : 'warning'}>
            {hasVapidPublicKey ? 'VAPID public key found' : 'VAPID pending'}
          </StatusPill>
          <StatusPill tone={hasPushSubscription ? 'success' : 'neutral'}>
            {hasPushSubscription ? 'Browser subscribed' : 'No browser subscription'}
          </StatusPill>
          <StatusPill tone={backendStatusTone(backendStatus)}>
            {backendStatusLabel(backendStatus)}
          </StatusPill>
        </div>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
            Device label
          </span>
          <input
            className="h-11 w-full rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-stone-400 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:focus:border-neutral-400"
            onChange={(event) => setDeviceLabel(event.target.value)}
            value={deviceLabel}
          />
        </label>
        <p className="text-sm leading-5 text-stone-600 dark:text-neutral-400">
          A push subscription is technical device data, not a paid subscription. It is saved to
          Supabase through a Vercel API route, never directly from the browser.
        </p>
        {backendStatus?.lastTestSentAt ? (
          <p className="text-xs font-semibold text-stone-500 dark:text-neutral-500">
            Last backend test: {backendStatus.lastTestSentAt}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            className="min-h-11 rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            disabled={!supportStatus.canSubscribeToPush || isBackendBusy}
            onClick={() => {
              void handleCreateAndSaveSubscription()
            }}
            type="button"
          >
            Create and save subscription
          </button>
          <button
            className="min-h-11 rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            onClick={() => {
              void handleCheckBackendStatus()
            }}
            type="button"
          >
            Check backend status
          </button>
          <button
            className="min-h-11 rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            disabled={!hasPushSubscription || isBackendBusy}
            onClick={() => {
              void handleBackendTest()
            }}
            type="button"
          >
            Send backend test push
          </button>
          <button
            className="min-h-11 rounded-[16px] border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-300/20 dark:bg-neutral-950/30 dark:text-rose-200 dark:hover:bg-rose-300/10"
            disabled={isBackendBusy}
            onClick={() => {
              void handleRemoveSubscription()
            }}
            type="button"
          >
            Remove push subscription
          </button>
        </div>
        {!hasVapidPublicKey ? (
          <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
            Add VITE_VAPID_PUBLIC_KEY to enable push subscription creation.
          </p>
        ) : null}
        {backendStatus?.ok === false ? (
          <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
            {backendStatus.message}
          </p>
        ) : null}
      </PageCard>

      <PageCard className="space-y-4">
        <SectionTitle
          icon={Clock}
          title="Reminder preferences"
          subtitle="These create a local preview only. Scheduled delivery comes later."
        />
        <div className="space-y-2">
          <ToggleRow
            checked={preferences.enabled}
            label="Enable reminder system"
            onChange={(enabled) => updatePreferences({ enabled })}
          />
          <ToggleRow
            checked={preferences.runReminders}
            label="Runs"
            onChange={(runReminders) => updatePreferences({ runReminders })}
          />
          <ToggleRow
            checked={preferences.strengthReminders}
            label="Strength sessions"
            onChange={(strengthReminders) => updatePreferences({ strengthReminders })}
          />
          <ToggleRow
            checked={preferences.snackReminders}
            label="Snacks"
            onChange={(snackReminders) => updatePreferences({ snackReminders })}
          />
          <ToggleRow
            checked={preferences.mealReminders}
            label="Meals"
            onChange={(mealReminders) => updatePreferences({ mealReminders })}
          />
          <ToggleRow
            checked={preferences.fuelingReminders}
            label="Fuelling"
            onChange={(fuelingReminders) => updatePreferences({ fuelingReminders })}
          />
          <ToggleRow
            checked={preferences.recoveryReminders}
            label="Recovery"
            onChange={(recoveryReminders) => updatePreferences({ recoveryReminders })}
          />
          <ToggleRow
            checked={preferences.raceReminders}
            label="Race day"
            onChange={(raceReminders) => updatePreferences({ raceReminders })}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ToggleRow
            checked={preferences.oneHourBefore}
            label="1 hour before"
            onChange={(oneHourBefore) => updatePreferences({ oneHourBefore })}
          />
          <ToggleRow
            checked={preferences.atEventTime}
            label="At event time"
            onChange={(atEventTime) => updatePreferences({ atEventTime })}
          />
        </div>

        <ToggleRow
          checked={preferences.includeFuelingInRunNotification}
          label="Include fuelling guidance in run notifications"
          onChange={(includeFuelingInRunNotification) =>
            updatePreferences({ includeFuelingInRunNotification })
          }
        />

        <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
          <ToggleRow
            checked={preferences.quietHoursEnabled}
            label="Quiet hours"
            onChange={(quietHoursEnabled) => updatePreferences({ quietHoursEnabled })}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <TimeInput
              label="Start"
              onChange={(quietHoursStart) => updatePreferences({ quietHoursStart })}
              value={preferences.quietHoursStart}
            />
            <TimeInput
              label="End"
              onChange={(quietHoursEnd) => updatePreferences({ quietHoursEnd })}
              value={preferences.quietHoursEnd}
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-neutral-500">
            Timezone: {preferences.timezone}
          </p>
        </div>

        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
          onClick={resetPreferences}
          type="button"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset notification preferences
        </button>
      </PageCard>

      <PageCard className="space-y-4">
        <SectionTitle
          icon={Eye}
          title="Reminder preview"
          subtitle="Preview only. Scheduled backend delivery comes in Step 27."
        />
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(previewRangeLabels) as PreviewRange[]).map((range) => (
            <button
              className={`min-h-10 rounded-[14px] border px-2 text-xs font-semibold transition ${
                previewRange === range
                  ? 'border-stone-950 bg-stone-950 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]'
              }`}
              key={range}
              onClick={() => setPreviewRange(range)}
              type="button"
            >
              {previewRangeLabels[range]}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-stone-500 dark:text-neutral-500">
          {formatDisplayDate(previewWindow.startDate)} - {formatDisplayDate(previewWindow.endDate)}
        </p>
        {visibleReminders.length ? (
          <div className="space-y-2">
            {visibleReminders.map((reminder) => (
              <ReminderPreviewRow key={reminder.id} reminder={reminder} />
            ))}
            {reminders.length > visibleReminders.length ? (
              <p className="text-center text-xs font-semibold text-stone-500 dark:text-neutral-500">
                Showing first {visibleReminders.length} of {reminders.length} reminders.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-[18px] border border-stone-100 bg-stone-50 p-4 text-sm font-semibold text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
            No reminders in this preview range. Enable reminder types or choose a training week
            with planned events.
          </p>
        )}
      </PageCard>
    </div>
  )
}

function SupportStatusCard({ status }: { status: NotificationSupportStatus }) {
  return (
    <PageCard className="space-y-4">
      <SectionTitle
        icon={Smartphone}
        title="Support status"
        subtitle={getNotificationSupportMessage(status)}
      />
      <div className="grid grid-cols-2 gap-2">
        <StatusTile label="Notification API" ok={status.hasNotificationApi} />
        <StatusTile label="Service worker" ok={status.hasServiceWorker} />
        <StatusTile label="PushManager" ok={status.hasPushManager} />
        <StatusTile label="Secure context" ok={status.isSecureContext} />
        <StatusTile label="Home Screen app" ok={status.isStandalone} />
        <StatusTile label="Permission" tone={permissionTone(status.permission)} value={status.permission} />
      </div>
      {status.isIosLike ? (
        <p className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
          On iPhone, enable notifications from the Home Screen app, not just Safari.
        </p>
      ) : null}
      {status.missingReasons.length ? (
        <div className="space-y-2">
          {status.missingReasons.slice(0, 4).map((reason) => (
            <div
              className="flex gap-2 rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200"
              key={reason}
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      ) : null}
    </PageCard>
  )
}

function SectionTitle({
  icon: Icon,
  subtitle,
  title,
}: {
  icon: typeof Bell
  subtitle: string
  title: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-neutral-200">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-stone-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function StatusTile({
  label,
  ok,
  tone,
  value,
}: {
  label: string
  ok?: boolean
  tone?: StatusTone
  value?: string
}) {
  const statusTone = tone ?? (ok ? 'success' : 'warning')
  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
        {label}
      </p>
      <div className="mt-2">
        <StatusPill tone={statusTone}>
          {value ?? (ok ? 'Ready' : 'Missing')}
        </StatusPill>
      </div>
    </div>
  )
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-[16px] border border-stone-100 bg-white px-3 py-2 text-sm font-semibold text-stone-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200">
      <span>{label}</span>
      <input
        checked={checked}
        className="h-5 w-5 accent-stone-950 dark:accent-neutral-100"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

function TimeInput({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-stone-400 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:focus:border-neutral-400"
        onChange={(event) => onChange(event.target.value)}
        type="time"
        value={value}
      />
    </label>
  )
}

function ReminderPreviewRow({ reminder }: { reminder: LocalReminderPreview }) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-950 dark:text-white">
            {reminder.title}
          </p>
          <p className="mt-1 text-xs font-semibold text-stone-500 dark:text-neutral-500">
            Send {reminder.sendAt} - event {reminder.eventTime}
          </p>
        </div>
        <StatusPill tone={reminder.type === 'race' ? 'race' : 'neutral'}>
          {reminder.type}
        </StatusPill>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-stone-600 dark:text-neutral-400">
        {reminder.body}
      </p>
      {reminder.quietHoursWarning ? (
        <p className="mt-2 rounded-[14px] border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
          {reminder.quietHoursWarning}
        </p>
      ) : null}
    </div>
  )
}

function permissionTone(permission: string): StatusTone {
  if (permission === 'granted') {
    return 'success'
  }

  if (permission === 'denied') {
    return 'warning'
  }

  return 'neutral'
}

async function readPushStatus(): Promise<{
  supportStatus: NotificationSupportStatus
  hasPushSubscription: boolean
  backendStatus?: PushSubscriptionBackendStatusResult
}> {
  const supportStatus = getNotificationSupportStatus()
  const subscription = await getExistingPushSubscription()
  const backendStatus = subscription?.endpoint
    ? await getPushSubscriptionBackendStatus(subscription.endpoint)
    : undefined

  return {
    supportStatus,
    hasPushSubscription: Boolean(subscription),
    backendStatus,
  }
}

function backendStatusTone(status: PushSubscriptionBackendStatusResult | undefined): StatusTone {
  if (!status) {
    return 'neutral'
  }

  if (!status.ok) {
    return 'warning'
  }

  return status.exists && status.active ? 'success' : 'neutral'
}

function backendStatusLabel(status: PushSubscriptionBackendStatusResult | undefined): string {
  if (!status) {
    return 'Backend unknown'
  }

  if (!status.ok) {
    return 'Backend error'
  }

  if (status.exists && status.active) {
    return 'Backend saved'
  }

  if (status.exists) {
    return 'Backend inactive'
  }

  return 'Not saved'
}

function getDefaultDeviceLabel(): string {
  if (typeof navigator === 'undefined') {
    return 'This device'
  }

  if (/iphone/i.test(navigator.userAgent)) {
    return 'Loic iPhone'
  }

  if (/ipad/i.test(navigator.userAgent)) {
    return 'Loic iPad'
  }

  return 'This browser'
}

export default NotificationSettingsPage
