import {
  Bell,
  Activity,
  Clock,
  Cloud,
  Eye,
  ListChecks,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  Smartphone,
  TestTube2,
  Trash2,
  UploadCloud,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import PageCard from '../../components/PageCard'
import StatusPill, { type StatusTone } from '../../components/StatusPill'
import { useFuelingPreferences } from '../../hooks/useFuelingPreferences'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { useNotificationSyncMetadata } from '../../hooks/useNotificationSyncMetadata'
import type {
  LocalReminderPreview,
  NotificationSupportStatus,
} from '../../types/notifications'
import { trainingPlanEndDate } from '../../data/trainingPlan'
import { formatDateKey, formatDisplayDate } from '../../utils/dateUtils'
import { getEffectiveFullTrainingPlan } from '../../utils/effectiveTrainingPlanUtils'
import {
  buildLocalReminderPreviewForRange,
  buildReminderSyncPayload,
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
import {
  clearPushReminders,
  getReminderSyncRange,
  getPushReminderHealth,
  listPushReminders,
  syncPushReminders,
  type PushReminderHealthResult,
  type PushReminderListItem,
  type PushReminderStatus,
} from '../../utils/pushReminderBackendClient'
import {
  markNotificationRemindersNeedResync,
  saveSuccessfulNotificationReminderSync,
} from '../../utils/notificationSyncMetadataStorage'

type NotificationSettingsPageProps = {
  selectedDate: string
}

type PreviewRange = 'next_7_days' | 'next_30_days' | 'full_remaining_plan'
type ReminderHistoryFilter = PushReminderStatus

type Message = {
  tone: 'success' | 'error'
  text: string
}

const previewRangeLabels: Record<PreviewRange, string> = {
  next_7_days: 'Next 7 days',
  next_30_days: 'Next 30 days',
  full_remaining_plan: 'Full remaining plan',
}

const reminderHistoryLabels: Record<ReminderHistoryFilter, string> = {
  pending: 'Pending',
  sent: 'Sent',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

function NotificationSettingsPage({ selectedDate }: NotificationSettingsPageProps) {
  const { preferences, resetPreferences, updatePreferences } = useNotificationPreferences()
  const { preferences: fuelingPreferences } = useFuelingPreferences()
  const syncMetadata = useNotificationSyncMetadata()
  const [supportStatus, setSupportStatus] = useState<NotificationSupportStatus>(() =>
    getNotificationSupportStatus(),
  )
  const [hasPushSubscription, setHasPushSubscription] = useState(false)
  const [backendStatus, setBackendStatus] = useState<PushSubscriptionBackendStatusResult>()
  const [deviceLabel, setDeviceLabel] = useState(() => getDefaultDeviceLabel())
  const [isBackendBusy, setIsBackendBusy] = useState(false)
  const [message, setMessage] = useState<Message>()
  const [previewRange, setPreviewRange] = useState<PreviewRange>('next_30_days')
  const [hasPreviewedScheduledReminders, setHasPreviewedScheduledReminders] = useState(false)
  const [isReminderBackendBusy, setIsReminderBackendBusy] = useState(false)
  const [syncedReminders, setSyncedReminders] = useState<PushReminderListItem[]>([])
  const [reminderHealth, setReminderHealth] = useState<PushReminderHealthResult>()
  const [activeHistoryFilter, setActiveHistoryFilter] =
    useState<ReminderHistoryFilter>('pending')
  const [lastSyncSummary, setLastSyncSummary] = useState<{
    synced: number
    cancelled: number
    syncedAt: string
    rangeStart: string
    rangeEnd: string
  }>()
  const hasVapidPublicKey = Boolean(getVapidPublicKey())

  async function refreshReminderHealth(endpointOverride?: string) {
    const endpoint = endpointOverride ?? (await getExistingPushSubscription())?.endpoint
    const result = await getPushReminderHealth(endpoint)
    setReminderHealth(result)
  }

  const refreshStatus = async () => {
    const nextStatus = await readPushStatus()
    setSupportStatus(nextStatus.supportStatus)
    setHasPushSubscription(nextStatus.hasPushSubscription)
    setBackendStatus(nextStatus.backendStatus)
    await refreshReminderHealth(nextStatus.endpoint)
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
        void refreshReminderHealth(nextStatus.endpoint)
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

  const previewWindow = getSelectedReminderRange(previewRange, selectedDate)
  const syncScope = getReminderSyncScope(previewRange)
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
  const reminderStatusCounts = getReminderStatusCounts(syncedReminders)
  const reminderSyncBlocker = getReminderSyncBlocker({
    backendStatus,
    hasPushSubscription,
    preferencesEnabled: preferences.enabled,
    permission: supportStatus.permission,
  })
  const systemHealth = getNotificationSystemHealth({
    backendStatus,
    health: reminderHealth,
  })
  const displayedLastSync = lastSyncSummary
    ? `${lastSyncSummary.syncedAt} (${formatDisplayDate(lastSyncSummary.rangeStart)} - ${formatDisplayDate(lastSyncSummary.rangeEnd)})`
    : syncMetadata.lastSyncedAt
      ? `${formatReminderDateTime(syncMetadata.lastSyncedAt)} (${syncMetadata.lastSyncedRangeStart ?? '?'} - ${syncMetadata.lastSyncedRangeEnd ?? '?'})`
      : 'Not synced yet'

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

  const handleRepairNotificationSetup = async () => {
    const shouldRepair = window.confirm(
      'This will remove the current browser push subscription, create a fresh one, and save it to the backend. Your plan, logs, reminders preferences, and calendar edits stay untouched.',
    )

    if (!shouldRepair) {
      return
    }

    setIsBackendBusy(true)

    try {
      await removePushSubscriptionEverywhere()
      const result = await createAndSavePushSubscription(preferences, deviceLabel)
      setMessage({ tone: result.ok ? 'success' : 'error', text: result.message })
      await refreshStatus()
      await refreshSyncedReminders(result.endpoint, false)
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not repair notification setup.',
      })
    } finally {
      setIsBackendBusy(false)
    }
  }

  const handleSelectPreviewRange = (range: PreviewRange) => {
    setPreviewRange(range)
    setHasPreviewedScheduledReminders(false)
    setSyncedReminders([])

    if (syncMetadata.lastSyncedAt && getReminderSyncScope(range) !== syncScope) {
      markNotificationRemindersNeedResync('Reminder sync range changed.')
    }
  }

  const handlePreviewScheduledReminders = () => {
    setHasPreviewedScheduledReminders(true)
    setMessage({
      tone: 'success',
      text: `${reminders.length} reminders previewed for this range.`,
    })
  }

  const handleSyncScheduledReminders = async () => {
    if (reminderSyncBlocker) {
      setMessage({ tone: 'error', text: reminderSyncBlocker })
      return
    }

    setIsReminderBackendBusy(true)

    try {
      const subscription = await getExistingPushSubscription()

      if (!subscription?.endpoint) {
        setMessage({ tone: 'error', text: 'Create and save push subscription first.' })
        return
      }

      const payload = buildReminderSyncPayload({
        endpoint: subscription.endpoint,
        syncScope,
        startDate: previewWindow.startDate,
        endDate: previewWindow.endDate,
        preferences,
        effectiveDayPlans: getEffectiveFullTrainingPlan(),
        fuelingPreferences,
      })
      const result = await syncPushReminders({
        endpoint: payload.endpoint,
        syncScope: payload.syncScope,
        rangeStart: payload.rangeStart,
        rangeEnd: payload.rangeEnd,
        reminders: payload.reminders,
      })

      if (result.ok) {
        setLastSyncSummary({
          synced: result.synced ?? payload.reminders.length,
          cancelled: result.cancelled ?? 0,
          syncedAt: new Date().toLocaleString(),
          rangeStart: payload.rangeStart,
          rangeEnd: payload.rangeEnd,
        })
        saveSuccessfulNotificationReminderSync({
          rangeStart: payload.rangeStart,
          rangeEnd: payload.rangeEnd,
          reminders: payload.reminders,
        })
        setHasPreviewedScheduledReminders(true)
        setMessage({
          tone: 'success',
          text: `Synced ${result.synced ?? payload.reminders.length} reminders. Cancelled ${result.cancelled ?? 0}.`,
        })
        await refreshSyncedReminders(subscription.endpoint, false)
        await refreshReminderHealth(subscription.endpoint)
      } else {
        setMessage({ tone: 'error', text: result.message })
      }
    } finally {
      setIsReminderBackendBusy(false)
    }
  }

  const handleRefreshSyncedReminders = async () => {
    setIsReminderBackendBusy(true)

    try {
      await refreshSyncedReminders(undefined, true)
    } finally {
      setIsReminderBackendBusy(false)
    }
  }

  const handleClearSyncedReminders = async () => {
    setIsReminderBackendBusy(true)

    try {
      const subscription = await getExistingPushSubscription()

      if (!subscription?.endpoint) {
        setMessage({ tone: 'error', text: 'Create and save push subscription first.' })
        return
      }

      const result = await clearPushReminders({
        endpoint: subscription.endpoint,
        syncScope,
      })

      setMessage({
        tone: result.ok ? 'success' : 'error',
        text: result.ok ? `Cancelled ${result.cancelled ?? 0} pending reminders.` : result.message,
      })
      await refreshSyncedReminders(subscription.endpoint, false)
      await refreshReminderHealth(subscription.endpoint)
    } finally {
      setIsReminderBackendBusy(false)
    }
  }

  const handleCreateTestScheduledReminder = async () => {
    if (reminderSyncBlocker) {
      setMessage({ tone: 'error', text: reminderSyncBlocker })
      return
    }

    setIsReminderBackendBusy(true)

    try {
      const subscription = await getExistingPushSubscription()

      if (!subscription?.endpoint) {
        setMessage({ tone: 'error', text: 'Create and save push subscription first.' })
        return
      }

      const now = new Date()
      const sourceDate = formatDateKey(now)
      const existingTestResult = await listPushReminders({
        endpoint: subscription.endpoint,
        rangeStart: sourceDate,
        rangeEnd: sourceDate,
        status: 'pending',
      })
      const pendingTest = existingTestResult.reminders?.find((reminder) =>
        reminder.reminderKey?.startsWith('test:'),
      )

      if (pendingTest) {
        setMessage({
          tone: 'success',
          text: 'A pending scheduled test reminder already exists. Wait for the scheduler or run the GitHub workflow manually.',
        })
        return
      }

      const sendAtDate = new Date(Date.now() + 2 * 60 * 1000)
      const reminderKey = `test:${sendAtDate.getTime()}`
      const testReminder = {
        reminderKey,
        syncScope: 'test',
        sourceActivityId: reminderKey,
        sourceDate,
        type: 'custom',
        title: 'Scheduled reminder test',
        body: 'Your scheduled reminder pipeline is working.',
        url: `/?date=${sourceDate}`,
        sendAt: sendAtDate.toISOString(),
        eventTime: sendAtDate.toISOString(),
        reminderOffsetMinutes: 0,
        payload: {
          type: 'custom',
          title: 'Scheduled reminder test',
          body: 'Your scheduled reminder pipeline is working.',
          url: `/?date=${sourceDate}`,
          tag: reminderKey,
          reminderId: reminderKey,
          sourceActivityId: reminderKey,
          sourceDate,
        },
      }
      const result = await syncPushReminders({
        endpoint: subscription.endpoint,
        syncScope: 'test',
        rangeStart: sourceDate,
        rangeEnd: sourceDate,
        reminders: [testReminder],
      })

      setMessage({
        tone: result.ok ? 'success' : 'error',
        text: result.ok
          ? 'Test scheduled reminder created. Wait for the scheduler or run the GitHub workflow manually.'
          : result.message,
      })
      await refreshSyncedReminders(subscription.endpoint, false)
      await refreshReminderHealth(subscription.endpoint)
    } finally {
      setIsReminderBackendBusy(false)
    }
  }

  const handleRefreshHealth = async () => {
    setIsReminderBackendBusy(true)

    try {
      await refreshReminderHealth()
      setMessage({ tone: 'success', text: 'Notification system health refreshed.' })
    } finally {
      setIsReminderBackendBusy(false)
    }
  }

  const refreshSyncedReminders = async (
    endpointOverride?: string,
    showResultMessage = false,
  ) => {
    const endpoint =
      endpointOverride ?? (await getExistingPushSubscription())?.endpoint

    if (!endpoint) {
      setSyncedReminders([])

      if (showResultMessage) {
        setMessage({ tone: 'error', text: 'Create and save push subscription first.' })
      }

      return
    }

    const result = await listPushReminders({
      endpoint,
      rangeStart: previewWindow.startDate,
      rangeEnd: previewWindow.endDate,
    })

    if (result.ok) {
      setSyncedReminders(result.reminders ?? [])

      if (showResultMessage) {
        setMessage({ tone: 'success', text: 'Synced reminders refreshed.' })
      }
    } else if (showResultMessage) {
      setMessage({ tone: 'error', text: result.message })
    }
  }

  return (
    <div className="space-y-4">
      <SupportStatusCard status={supportStatus} />

      <PageCard className="space-y-4">
        <SectionTitle
          icon={Activity}
          title="Notification system health"
          subtitle={systemHealth.message}
        />
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={systemHealth.tone}>{systemHealth.label}</StatusPill>
          <StatusPill tone={backendStatusTone(backendStatus)}>
            {backendStatusLabel(backendStatus)}
          </StatusPill>
          <StatusPill tone={reminderHealth?.scheduler?.lastRunAt ? 'success' : 'warning'}>
            {reminderHealth?.scheduler?.lastRunAt ? 'Scheduler seen' : 'No scheduler run'}
          </StatusPill>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatusTile label="Permission" tone={permissionTone(supportStatus.permission)} value={supportStatus.permission} />
          <StatusTile
            label="Browser subscription"
            tone={hasPushSubscription ? 'success' : 'warning'}
            value={hasPushSubscription ? 'Yes' : 'No'}
          />
          <StatusTile
            label="Last scheduler run"
            tone={reminderHealth?.scheduler?.lastRunAt ? 'success' : 'warning'}
            value={formatReminderDateTime(reminderHealth?.scheduler?.lastRunAt ?? null)}
          />
          <StatusTile
            label="Recent sent"
            tone={(reminderHealth?.scheduler?.recentFailed ?? 0) > 0 ? 'warning' : 'success'}
            value={`${reminderHealth?.scheduler?.recentSent ?? 0} sent / ${reminderHealth?.scheduler?.recentFailed ?? 0} failed`}
          />
          <StatusTile
            label="Next reminder"
            tone={reminderHealth?.device?.nextPendingSendAt ? 'success' : 'neutral'}
            value={formatReminderDateTime(reminderHealth?.device?.nextPendingSendAt ?? null)}
          />
          <StatusTile label="Device label" tone="neutral" value={deviceLabel || 'This device'} />
        </div>
        {reminderHealth?.ok === false ? (
          <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
            {getDiagnosticMessage(reminderHealth)}
          </p>
        ) : null}
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
          disabled={isReminderBackendBusy}
          onClick={() => {
            void handleRefreshHealth()
          }}
          type="button"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh health
        </button>
      </PageCard>

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
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-amber-200 bg-white px-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-300/20 dark:bg-neutral-950/30 dark:text-amber-200 dark:hover:bg-amber-300/10 sm:col-span-2"
            disabled={isBackendBusy || !supportStatus.canSubscribeToPush}
            onClick={() => {
              void handleRepairNotificationSetup()
            }}
            type="button"
          >
            <Wrench className="h-4 w-4" aria-hidden="true" />
            Repair notification setup
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
          icon={ListChecks}
          title="Scheduled reminders"
          subtitle="Step 27 sends due reminders through the backend. Delivery is best-effort within a few minutes."
        />
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={hasPushSubscription ? 'success' : 'neutral'}>
            {hasPushSubscription ? 'Current browser subscribed' : 'No browser subscription'}
          </StatusPill>
          <StatusPill tone={backendStatusTone(backendStatus)}>
            {backendStatusLabel(backendStatus)}
          </StatusPill>
          <StatusPill tone={reminderSyncBlocker ? 'warning' : 'success'}>
            {reminderSyncBlocker ? 'Sync blocked' : 'Ready to sync'}
          </StatusPill>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(previewRangeLabels) as PreviewRange[]).map((range) => (
            <button
              className={`min-h-10 rounded-[14px] border px-2 text-xs font-semibold transition ${
                previewRange === range
                  ? 'border-stone-950 bg-stone-950 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]'
              }`}
              key={range}
              onClick={() => handleSelectPreviewRange(range)}
              type="button"
            >
              {previewRangeLabels[range]}
            </button>
          ))}
        </div>

        <p className="text-xs font-semibold text-stone-500 dark:text-neutral-500">
          {formatDisplayDate(previewWindow.startDate)} - {formatDisplayDate(previewWindow.endDate)}
        </p>
        <p className="text-sm leading-5 text-stone-600 dark:text-neutral-400">
          Sync reminders uploads this device&apos;s next schedule to the backend. Scheduled delivery
          runs every ~5 minutes. Changes to your plan/calendar require re-syncing.
        </p>

        <p className="text-xs font-semibold text-stone-500 dark:text-neutral-500">
          Last sync: {displayedLastSync}
        </p>

        {syncMetadata.needsResync ? (
          <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
            <p>Your reminders may be out of date. Re-sync after plan or calendar changes.</p>
            {syncMetadata.needsResyncReason ? (
              <p className="mt-1 text-xs">{syncMetadata.needsResyncReason}</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            onClick={handlePreviewScheduledReminders}
            type="button"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Preview reminders
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-stone-950 px-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white"
            disabled={Boolean(reminderSyncBlocker) || isReminderBackendBusy}
            onClick={() => {
              void handleSyncScheduledReminders()
            }}
            type="button"
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Sync reminders
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            disabled={!hasPushSubscription || isReminderBackendBusy}
            onClick={() => {
              void handleRefreshSyncedReminders()
            }}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh synced
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-300/20 dark:bg-neutral-950/30 dark:text-rose-200 dark:hover:bg-rose-300/10"
            disabled={!hasPushSubscription || isReminderBackendBusy}
            onClick={() => {
              void handleClearSyncedReminders()
            }}
            type="button"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear synced
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            disabled={Boolean(reminderSyncBlocker) || isReminderBackendBusy}
            onClick={() => {
              void handleCreateTestScheduledReminder()
            }}
            type="button"
          >
            <TestTube2 className="h-4 w-4" aria-hidden="true" />
            Create test reminder
          </button>
        </div>

        {reminderSyncBlocker ? (
          <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
            {reminderSyncBlocker}
          </p>
        ) : null}

        {lastSyncSummary ? (
          <p className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">
            Last sync: {lastSyncSummary.syncedAt}. Synced {lastSyncSummary.synced};
            cancelled {lastSyncSummary.cancelled}.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <CountTile label="Pending" value={reminderStatusCounts.pending} />
          <CountTile label="Sent" value={reminderStatusCounts.sent} />
          <CountTile label="Failed" value={reminderStatusCounts.failed} />
          <CountTile label="Cancelled" value={reminderStatusCounts.cancelled} />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(reminderHistoryLabels) as ReminderHistoryFilter[]).map((filter) => (
            <button
              className={`min-h-10 rounded-[14px] border px-2 text-xs font-semibold transition ${
                activeHistoryFilter === filter
                  ? 'border-stone-950 bg-stone-950 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                  : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]'
              }`}
              key={filter}
              onClick={() => setActiveHistoryFilter(filter)}
              type="button"
            >
              {reminderHistoryLabels[filter]}
            </button>
          ))}
        </div>

        {syncedReminders.length ? (
          <SyncedReminderList filter={activeHistoryFilter} reminders={syncedReminders} />
        ) : (
          <p className="rounded-[18px] border border-stone-100 bg-stone-50 p-4 text-sm font-semibold text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
            No synced reminders loaded for this range yet.
          </p>
        )}
      </PageCard>

      <PageCard className="space-y-4">
        <SectionTitle
          icon={Clock}
          title="Reminder preferences"
          subtitle="Choose which schedule items become local previews and backend reminders."
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
          subtitle="Built from your effective plan, calendar edits, and notification preferences."
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
              onClick={() => handleSelectPreviewRange(range)}
              type="button"
            >
              {previewRangeLabels[range]}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-stone-500 dark:text-neutral-500">
          {formatDisplayDate(previewWindow.startDate)} - {formatDisplayDate(previewWindow.endDate)}
        </p>
        {hasPreviewedScheduledReminders && visibleReminders.length ? (
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
        ) : hasPreviewedScheduledReminders ? (
          <p className="rounded-[18px] border border-stone-100 bg-stone-50 p-4 text-sm font-semibold text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
            No reminders in this preview range. Enable reminder types or choose a training week
            with planned events.
          </p>
        ) : (
          <p className="rounded-[18px] border border-stone-100 bg-stone-50 p-4 text-sm font-semibold text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
            Tap Preview reminders to inspect this range before syncing it to the backend.
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

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-stone-950 dark:text-white">{value}</p>
    </div>
  )
}

function SyncedReminderList({
  filter,
  reminders,
}: {
  filter: ReminderHistoryFilter
  reminders: PushReminderListItem[]
}) {
  const visibleReminders = reminders
    .filter((reminder) => reminder.status === filter)
    .sort((firstReminder, secondReminder) => sortReminderHistory(firstReminder, secondReminder, filter))
    .slice(0, filter === 'cancelled' ? 6 : 10)

  if (!visibleReminders.length) {
    return (
      <p className="rounded-[18px] border border-stone-100 bg-stone-50 p-4 text-sm font-semibold text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
        No {reminderHistoryLabels[filter].toLowerCase()} reminders loaded for this range.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {filter === 'failed' ? (
        <p className="rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
          Failed reminders show safe backend errors. Re-sync after fixing the issue, or clear
          pending reminders if the schedule changed.
        </p>
      ) : null}
      {visibleReminders.map((reminder) => (
        <SyncedReminderRow key={reminder.id ?? reminder.reminderKey} reminder={reminder} />
      ))}
    </div>
  )
}

function SyncedReminderRow({ reminder }: { reminder: PushReminderListItem }) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-950 dark:text-white">
            {reminder.title ?? 'Scheduled reminder'}
          </p>
          <p className="mt-1 text-xs font-semibold text-stone-500 dark:text-neutral-500">
            {reminder.status === 'sent' && reminder.sentAt
              ? `Sent ${formatReminderDateTime(reminder.sentAt)}`
              : `Send ${formatReminderDateTime(reminder.sendAt)}`}
          </p>
        </div>
        <StatusPill tone={syncedReminderTone(reminder.status)}>
          {reminder.status ?? 'unknown'}
        </StatusPill>
      </div>
      {reminder.body ? (
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-stone-600 dark:text-neutral-400">
          {reminder.body}
        </p>
      ) : null}
      {reminder.lastError ? (
        <p className="mt-2 rounded-[14px] border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
          {reminder.lastError}
        </p>
      ) : null}
    </div>
  )
}

function sortReminderHistory(
  firstReminder: PushReminderListItem,
  secondReminder: PushReminderListItem,
  filter: ReminderHistoryFilter,
) {
  const firstValue =
    filter === 'sent'
      ? firstReminder.sentAt ?? firstReminder.sendAt
      : firstReminder.sendAt ?? firstReminder.sentAt
  const secondValue =
    filter === 'sent'
      ? secondReminder.sentAt ?? secondReminder.sendAt
      : secondReminder.sendAt ?? secondReminder.sentAt
  const direction = filter === 'pending' ? 1 : -1

  return direction * (firstValue ?? '').localeCompare(secondValue ?? '')
}

function getSelectedReminderRange(range: PreviewRange, selectedDate: string) {
  if (range === 'full_remaining_plan') {
    return {
      startDate: selectedDate,
      endDate: trainingPlanEndDate >= selectedDate ? trainingPlanEndDate : selectedDate,
    }
  }

  const daysAhead = range === 'next_7_days' ? 7 : 30
  const syncRange = getReminderSyncRange(daysAhead, selectedDate)

  return {
    startDate: syncRange.rangeStart,
    endDate: syncRange.rangeEnd,
  }
}

function getReminderSyncScope(range: PreviewRange) {
  if (range === 'full_remaining_plan') {
    return 'current-device-full-remaining-plan'
  }

  return range === 'next_7_days'
    ? 'current-device-next-7-days'
    : 'current-device-next-30-days'
}

function getReminderStatusCounts(reminders: PushReminderListItem[]) {
  return reminders.reduce(
    (counts, reminder) => {
      if (reminder.status === 'pending') {
        counts.pending += 1
      } else if (reminder.status === 'sent') {
        counts.sent += 1
      } else if (reminder.status === 'failed') {
        counts.failed += 1
      } else if (reminder.status === 'cancelled') {
        counts.cancelled += 1
      }

      return counts
    },
    {
      pending: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
    },
  )
}

function getReminderSyncBlocker({
  backendStatus,
  hasPushSubscription,
  preferencesEnabled,
  permission,
}: {
  backendStatus: PushSubscriptionBackendStatusResult | undefined
  hasPushSubscription: boolean
  preferencesEnabled: boolean
  permission: string
}) {
  if (!preferencesEnabled) {
    return 'Enable reminders before syncing scheduled delivery.'
  }

  if (permission !== 'granted') {
    return 'Notification permission must be granted before syncing reminders.'
  }

  if (!hasPushSubscription) {
    return 'Create and save push subscription first.'
  }

  if (!backendStatus?.ok || !backendStatus.exists || !backendStatus.active) {
    return 'Save this device to backend before syncing reminders.'
  }

  return undefined
}

function getNotificationSystemHealth({
  backendStatus,
  health,
}: {
  backendStatus: PushSubscriptionBackendStatusResult | undefined
  health: PushReminderHealthResult | undefined
}): { label: string; message: string; tone: StatusTone } {
  if (health?.ok === false) {
    return {
      label: 'Needs attention',
      message: getDiagnosticMessage(health),
      tone: 'warning',
    }
  }

  if (!backendStatus?.ok || !backendStatus.exists || !backendStatus.active) {
    return {
      label: 'Needs attention',
      message: 'Device is not saved as an active backend subscription.',
      tone: 'warning',
    }
  }

  if (!health?.scheduler?.lastRunAt) {
    return {
      label: 'No scheduler run',
      message: 'Scheduler has not run yet. Run the GitHub workflow manually or wait for cron.',
      tone: 'warning',
    }
  }

  if (!hasRecentSchedulerRun(health.scheduler.lastRunAt)) {
    return {
      label: 'No recent scheduler run',
      message: 'Scheduler has not run recently. Check GitHub Actions and repository secrets.',
      tone: 'warning',
    }
  }

  if ((health.scheduler.recentFailed ?? 0) > 0 || (health.device?.failed ?? 0) > 0) {
    return {
      label: 'Some failures',
      message: 'Scheduler is running, but failed reminders need attention.',
      tone: 'warning',
    }
  }

  return {
    label: 'Healthy',
    message: 'Device, backend subscription, and scheduler checks look healthy.',
    tone: 'success',
  }
}

function getDiagnosticMessage(result: { message: string; code?: string; status?: number }) {
  if (result.code === 'MISSING_TABLE') {
    return result.message
  }

  if (result.code === 'UNAUTHORIZED' || result.status === 401) {
    return 'API returned 401. Check CRON_SECRET and GitHub scheduler secrets.'
  }

  if (result.code === 'NETWORK_ERROR') {
    return 'Network unavailable or backend route is not reachable.'
  }

  return result.message || 'Backend returned an unexpected response.'
}

function hasRecentSchedulerRun(value: string) {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    return false
  }

  return Date.now() - timestamp < 20 * 60 * 1000
}

function syncedReminderTone(status: string | null): StatusTone {
  if (status === 'pending') {
    return 'neutral'
  }

  if (status === 'sent') {
    return 'success'
  }

  if (status === 'failed') {
    return 'warning'
  }

  return 'neutral'
}

function formatReminderDateTime(value: string | null) {
  if (!value) {
    return 'pending'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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
  endpoint?: string
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
    endpoint: subscription?.endpoint,
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
