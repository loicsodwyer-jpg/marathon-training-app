import { applyCors, handleCorsPreflight } from '../../_lib/cors.js'
import { isMissingEnvError } from '../../_lib/env.js'
import { readJsonBody } from '../../_lib/request.js'
import { errorResponse, jsonResponse, methodNotAllowed } from '../../_lib/responses.js'
import { createSupabaseAdminClient } from '../../_lib/supabaseServer.js'
import type { ApiRequest, ApiResponse } from '../../_lib/types.js'
import { isRecord, validateClearRemindersPayload } from '../../_lib/validation.js'

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
    const payload = validateClearRemindersPayload(await readJsonBody(request))

    if (payload.ok === false) {
      errorResponse(response, payload.message, 400)
      return
    }

    const supabase = createSupabaseAdminClient()
    const { endpoint, syncScope } = payload.value
    const { data, error } = await supabase
      .from('push_reminders')
      .select('id')
      .eq('subscription_endpoint', endpoint)
      .eq('sync_scope', syncScope)
      .eq('status', 'pending')

    if (error) {
      errorResponse(response, 'Could not clear synced reminders.', 500, error.message)
      return
    }

    const ids = Array.isArray(data)
      ? data
          .map((row) => (isRecord(row) && typeof row.id === 'string' ? row.id : undefined))
          .filter((id): id is string => Boolean(id))
      : []

    if (ids.length) {
      const { error: updateError } = await supabase
        .from('push_reminders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .in('id', ids)

      if (updateError) {
        errorResponse(response, 'Could not clear synced reminders.', 500, updateError.message)
        return
      }
    }

    jsonResponse(response, 200, {
      ok: true,
      message: 'Synced reminders cleared.',
      cancelled: ids.length,
    })
  } catch (error) {
    if (isMissingEnvError(error)) {
      errorResponse(response, 'Push backend environment variables are missing.', 500, error.message)
      return
    }

    errorResponse(response, 'Could not clear synced reminders.', 500)
  }
}
