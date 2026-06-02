import { applyCors, handleCorsPreflight } from '../../_lib/cors.js'
import { isMissingEnvError } from '../../_lib/env.js'
import { readJsonBody } from '../../_lib/request.js'
import { errorResponse, jsonResponse, methodNotAllowed } from '../../_lib/responses.js'
import { createSupabaseAdminClient } from '../../_lib/supabaseServer.js'
import type { ApiRequest, ApiResponse, SyncedReminderInput } from '../../_lib/types.js'
import { isRecord, validateSyncRemindersPayload } from '../../_lib/validation.js'

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
    const payload = validateSyncRemindersPayload(await readJsonBody(request))

    if (payload.ok === false) {
      errorResponse(response, payload.message, 400, undefined, 'VALIDATION_ERROR')
      return
    }

    const supabase = createSupabaseAdminClient()
    const { endpoint, rangeEnd, rangeStart, reminders, syncScope } = payload.value
    const { data: subscription, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, active')
      .eq('endpoint', endpoint)
      .maybeSingle()

    if (subscriptionError) {
      errorResponse(
        response,
        'Could not verify push subscription.',
        500,
        subscriptionError.message,
        'SUPABASE_ERROR',
      )
      return
    }

    if (!isRecord(subscription) || subscription.active !== true) {
      errorResponse(
        response,
        'Save this device to backend before syncing reminders.',
        404,
        undefined,
        'SUBSCRIPTION_NOT_FOUND',
      )
      return
    }

    const incomingKeys = reminders.map((reminder) => reminder.reminderKey)
    const sentKeys = incomingKeys.length
      ? await getSentReminderKeys(supabase, endpoint, syncScope, incomingKeys)
      : new Set<string>()
    const upsertRows = reminders
      .filter((reminder) => !sentKeys.has(reminder.reminderKey))
      .map((reminder) => toReminderRow(endpoint, reminder))

    if (upsertRows.length) {
      const { error } = await supabase
        .from('push_reminders')
        .upsert(upsertRows, { onConflict: 'subscription_endpoint,reminder_key' })

      if (error) {
        errorResponse(response, 'Could not sync push reminders.', 500, error.message, 'SUPABASE_ERROR')
        return
      }
    }

    const cancelled = await cancelStalePendingReminders(
      supabase,
      endpoint,
      syncScope,
      rangeStart,
      rangeEnd,
      new Set(incomingKeys),
    )

    jsonResponse(response, 200, {
      ok: true,
      message: 'Push reminders synced.',
      synced: upsertRows.length,
      cancelled,
      rangeStart,
      rangeEnd,
    })
  } catch (error) {
    if (isMissingEnvError(error)) {
      errorResponse(
        response,
        'Push backend environment variables are missing.',
        500,
        error.message,
        'INVALID_ENV',
      )
      return
    }

    errorResponse(response, 'Could not sync push reminders.', 500, undefined, 'SUPABASE_ERROR')
  }
}

function toReminderRow(subscriptionEndpoint: string, reminder: SyncedReminderInput) {
  return {
    subscription_endpoint: subscriptionEndpoint,
    reminder_key: reminder.reminderKey,
    sync_scope: reminder.syncScope,
    source_activity_id: reminder.sourceActivityId ?? null,
    source_date: reminder.sourceDate,
    type: reminder.type,
    title: reminder.title,
    body: reminder.body,
    url: reminder.url,
    send_at: reminder.sendAt,
    event_time: reminder.eventTime,
    reminder_offset_minutes: reminder.reminderOffsetMinutes,
    payload: reminder.payload ?? {},
    status: 'pending',
    attempts: 0,
    sent_at: null,
    cancelled_at: null,
    last_error: null,
  }
}

async function getSentReminderKeys(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  endpoint: string,
  syncScope: string,
  reminderKeys: string[],
) {
  const { data, error } = await supabase
    .from('push_reminders')
    .select('reminder_key')
    .eq('subscription_endpoint', endpoint)
    .eq('sync_scope', syncScope)
    .eq('status', 'sent')
    .in('reminder_key', reminderKeys)

  if (error || !Array.isArray(data)) {
    return new Set<string>()
  }

  return new Set(
    data
      .map((row) => (isRecord(row) && typeof row.reminder_key === 'string' ? row.reminder_key : undefined))
      .filter((key): key is string => Boolean(key)),
  )
}

async function cancelStalePendingReminders(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  endpoint: string,
  syncScope: string,
  rangeStart: string,
  rangeEnd: string,
  incomingKeys: Set<string>,
) {
  const { data, error } = await supabase
    .from('push_reminders')
    .select('id, reminder_key')
    .eq('subscription_endpoint', endpoint)
    .eq('sync_scope', syncScope)
    .eq('status', 'pending')
    .gte('source_date', rangeStart)
    .lte('source_date', rangeEnd)

  if (error || !Array.isArray(data)) {
    return 0
  }

  const idsToCancel = data
    .filter(
      (row) =>
        isRecord(row) &&
        typeof row.id === 'string' &&
        typeof row.reminder_key === 'string' &&
        !incomingKeys.has(row.reminder_key),
    )
    .map((row) => (isRecord(row) && typeof row.id === 'string' ? row.id : undefined))
    .filter((id): id is string => Boolean(id))

  if (!idsToCancel.length) {
    return 0
  }

  const { error: updateError } = await supabase
    .from('push_reminders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .in('id', idsToCancel)

  return updateError ? 0 : idsToCancel.length
}
