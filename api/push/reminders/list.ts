import { applyCors, handleCorsPreflight } from '../../_lib/cors.js'
import { isMissingEnvError } from '../../_lib/env.js'
import { readJsonBody } from '../../_lib/request.js'
import { errorResponse, jsonResponse, methodNotAllowed } from '../../_lib/responses.js'
import { createSupabaseAdminClient } from '../../_lib/supabaseServer.js'
import type { ApiRequest, ApiResponse } from '../../_lib/types.js'
import { isRecord, validateListRemindersPayload } from '../../_lib/validation.js'

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
    const payload = validateListRemindersPayload(await readJsonBody(request))

    if (payload.ok === false) {
      errorResponse(response, payload.message, 400, undefined, 'VALIDATION_ERROR')
      return
    }

    const supabase = createSupabaseAdminClient()
    const { endpoint, rangeEnd, rangeStart, status } = payload.value
    let query = supabase
      .from('push_reminders')
      .select(
        'id, reminder_key, type, title, body, url, send_at, event_time, reminder_offset_minutes, source_activity_id, source_date, status, sent_at, last_error',
      )
      .eq('subscription_endpoint', endpoint)
      .gte('source_date', rangeStart)
      .lte('source_date', rangeEnd)
      .order('send_at', { ascending: true })
      .limit(200)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      errorResponse(response, 'Could not list push reminders.', 500, error.message, 'SUPABASE_ERROR')
      return
    }

    jsonResponse(response, 200, {
      ok: true,
      reminders: Array.isArray(data) ? data.map(toReminderResponse).filter(Boolean) : [],
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

    errorResponse(response, 'Could not list push reminders.', 500, undefined, 'SUPABASE_ERROR')
  }
}

function toReminderResponse(row: unknown) {
  if (!isRecord(row)) {
    return undefined
  }

  return {
    id: getString(row.id),
    reminderKey: getString(row.reminder_key),
    type: getString(row.type),
    title: getString(row.title),
    body: getString(row.body),
    url: getString(row.url),
    sendAt: getString(row.send_at),
    eventTime: getString(row.event_time),
    reminderOffsetMinutes: getNumber(row.reminder_offset_minutes),
    sourceActivityId: getString(row.source_activity_id),
    sourceDate: getString(row.source_date),
    status: getString(row.status),
    sentAt: getString(row.sent_at),
    lastError: getString(row.last_error),
  }
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}
