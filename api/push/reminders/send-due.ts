import { applyCors, handleCorsPreflight } from '../../_lib/cors.js'
import { getRequiredEnv, isMissingEnvError } from '../../_lib/env.js'
import {
  getWebPushErrorMessage,
  getWebPushErrorStatus,
  sendPushNotification,
} from '../../_lib/pushServer.js'
import { readJsonBody } from '../../_lib/request.js'
import { errorResponse, jsonResponse, methodNotAllowed } from '../../_lib/responses.js'
import { createSupabaseAdminClient } from '../../_lib/supabaseServer.js'
import type { ApiRequest, ApiResponse, WebPushSubscription } from '../../_lib/types.js'
import { isRecord, validateSendDueRemindersPayload } from '../../_lib/validation.js'

type DueReminder = {
  id: string
  subscriptionEndpoint: string
  reminderKey: string
  type: string
  title: string
  body: string
  url: string
  attempts: number
  sourceActivityId?: string
  sourceDate?: string
  sendAt?: string
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  applyCors(request, response)

  if (handleCorsPreflight(request, response)) {
    return
  }

  if (request.method !== 'POST') {
    methodNotAllowed(response, ['POST'])
    return
  }

  try {
    const cronSecret = getRequiredEnv('CRON_SECRET')

    if (!isAuthorizedCronRequest(request, cronSecret)) {
      errorResponse(response, 'Unauthorized scheduler request.', 401)
      return
    }

    const payload = validateSendDueRemindersPayload(await readJsonBody(request))

    if (payload.ok === false) {
      errorResponse(response, payload.message, 400)
      return
    }

    const dryRun = payload.value.dryRun === true
    const limit = payload.value.limit ?? 50
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('push_reminders')
      .select(
        'id, subscription_endpoint, reminder_key, type, title, body, url, source_activity_id, source_date, attempts, send_at',
      )
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .lt('attempts', 5)
      .order('send_at', { ascending: true })
      .limit(limit)

    if (error) {
      errorResponse(response, 'Could not read due reminders.', 500, error.message)
      return
    }

    const reminders = Array.isArray(data)
      ? data.map(parseDueReminder).filter((reminder): reminder is DueReminder => Boolean(reminder))
      : []

    if (dryRun) {
      jsonResponse(response, 200, {
        ok: true,
        processed: reminders.length,
        sent: 0,
        failed: 0,
        dryRun: true,
        due: reminders.map((reminder) => ({
          id: reminder.id,
          reminderKey: reminder.reminderKey,
          type: reminder.type,
          title: reminder.title,
          sendAt: reminder.sendAt,
        })),
      })
      return
    }

    let sent = 0
    let failed = 0

    for (const reminder of reminders) {
      const result = await sendReminder(supabase, reminder)

      if (result === 'sent') {
        sent += 1
      } else {
        failed += 1
      }
    }

    jsonResponse(response, 200, {
      ok: true,
      processed: reminders.length,
      sent,
      failed,
      dryRun: false,
    })
  } catch (error) {
    if (isMissingEnvError(error)) {
      errorResponse(response, 'Scheduler environment variables are missing.', 500, error.message)
      return
    }

    errorResponse(response, 'Could not send due reminders.', 500)
  }
}

async function sendReminder(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  reminder: DueReminder,
): Promise<'sent' | 'failed'> {
  try {
    const subscription = await getActiveSubscription(supabase, reminder.subscriptionEndpoint)

    if (!subscription) {
      await markReminderFailed(supabase, reminder, 'Subscription inactive', true)
      return 'failed'
    }

    await sendPushNotification(subscription, {
      title: reminder.title,
      body: reminder.body,
      url: reminder.url,
      tag: reminder.reminderKey,
      type: reminder.type,
      reminderId: reminder.id,
      sourceActivityId: reminder.sourceActivityId,
      sourceDate: reminder.sourceDate,
    })

    await supabase
      .from('push_reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        attempts: reminder.attempts + 1,
        last_error: null,
      })
      .eq('id', reminder.id)

    return 'sent'
  } catch (error) {
    const statusCode = getWebPushErrorStatus(error)
    const isExpiredSubscription = statusCode === 404 || statusCode === 410

    if (isExpiredSubscription) {
      await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .eq('endpoint', reminder.subscriptionEndpoint)
    }

    await markReminderFailed(
      supabase,
      reminder,
      isExpiredSubscription ? 'Subscription expired' : getWebPushErrorMessage(error),
      isExpiredSubscription,
    )

    return 'failed'
  }
}

async function getActiveSubscription(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  endpoint: string,
): Promise<WebPushSubscription | undefined> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('endpoint', endpoint)
    .eq('active', true)
    .maybeSingle()

  if (error || !isRecord(data)) {
    return undefined
  }

  if (
    typeof data.endpoint !== 'string' ||
    typeof data.p256dh !== 'string' ||
    typeof data.auth !== 'string'
  ) {
    return undefined
  }

  return {
    endpoint: data.endpoint,
    keys: {
      p256dh: data.p256dh,
      auth: data.auth,
    },
  }
}

async function markReminderFailed(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  reminder: DueReminder,
  message: string,
  forceFailed: boolean,
) {
  const nextAttempts = reminder.attempts + 1
  await supabase
    .from('push_reminders')
    .update({
      attempts: nextAttempts,
      status: forceFailed || nextAttempts >= 5 ? 'failed' : 'pending',
      last_error: message.slice(0, 240),
    })
    .eq('id', reminder.id)
}

function parseDueReminder(row: unknown): DueReminder | undefined {
  if (!isRecord(row)) {
    return undefined
  }

  const id = getString(row.id)
  const subscriptionEndpoint = getString(row.subscription_endpoint)
  const reminderKey = getString(row.reminder_key)
  const type = getString(row.type)
  const title = getString(row.title)
  const body = getString(row.body)
  const url = getString(row.url)
  const attempts = typeof row.attempts === 'number' ? row.attempts : undefined

  if (
    !id ||
    !subscriptionEndpoint ||
    !reminderKey ||
    !type ||
    !title ||
    !body ||
    !url ||
    attempts === undefined
  ) {
    return undefined
  }

  return {
    id,
    subscriptionEndpoint,
    reminderKey,
    type,
    title,
    body,
    url,
    attempts,
    sourceActivityId: getString(row.source_activity_id),
    sourceDate: getString(row.source_date),
    sendAt: getString(row.send_at),
  }
}

function isAuthorizedCronRequest(request: ApiRequest, cronSecret: string) {
  const authorization = getHeaderValue(request.headers.authorization)
  const headerSecret = getHeaderValue(request.headers['x-cron-secret'])

  return authorization === `Bearer ${cronSecret}` || headerSecret === cronSecret
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
