import { applyCors, handleCorsPreflight } from '../_lib/cors.js'
import { isMissingEnvError } from '../_lib/env.js'
import { readJsonBody } from '../_lib/request.js'
import { errorResponse, jsonResponse, methodNotAllowed } from '../_lib/responses.js'
import { createSupabaseAdminClient } from '../_lib/supabaseServer.js'
import type { ApiRequest, ApiResponse } from '../_lib/types.js'
import { isRecord, validateEndpointPayload } from '../_lib/validation.js'

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
    const payload = validateEndpointPayload(await readJsonBody(request))

    if (payload.ok === false) {
      errorResponse(response, payload.message, 400)
      return
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('active, last_seen_at, last_test_sent_at')
      .eq('endpoint', payload.value.endpoint)
      .maybeSingle()

    if (error) {
      errorResponse(response, 'Could not check push subscription status.', 500, error.message)
      return
    }

    if (!data || !isRecord(data)) {
      jsonResponse(response, 200, {
        ok: true,
        exists: false,
        active: false,
      })
      return
    }

    jsonResponse(response, 200, {
      ok: true,
      exists: true,
      active: data.active === true,
      lastSeenAt: typeof data.last_seen_at === 'string' ? data.last_seen_at : undefined,
      lastTestSentAt:
        typeof data.last_test_sent_at === 'string' ? data.last_test_sent_at : undefined,
    })
  } catch (error) {
    if (isMissingEnvError(error)) {
      errorResponse(response, 'Push backend environment variables are missing.', 500, error.message)
      return
    }

    errorResponse(response, 'Could not check push subscription status.', 500)
  }
}
