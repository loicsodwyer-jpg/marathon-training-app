import { applyCors, handleCorsPreflight } from '../_lib/cors.js'
import { isMissingEnvError } from '../_lib/env.js'
import { readJsonBody } from '../_lib/request.js'
import { errorResponse, jsonResponse, methodNotAllowed } from '../_lib/responses.js'
import { createSupabaseAdminClient } from '../_lib/supabaseServer.js'
import type { ApiRequest, ApiResponse } from '../_lib/types.js'
import { isRecord, validateSubscribePayload } from '../_lib/validation.js'

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
    const payload = validateSubscribePayload(await readJsonBody(request))

    if (payload.ok === false) {
      errorResponse(response, payload.message, 400, undefined, 'VALIDATION_ERROR')
      return
    }

    const supabase = createSupabaseAdminClient()
    const { subscription, preferences, timezone, deviceLabel, userAgent } = payload.value
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          preferences,
          timezone,
          device_label: deviceLabel,
          user_agent: userAgent,
          active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      )
      .select('id, active')
      .single()

    if (error) {
      errorResponse(response, 'Could not save push subscription.', 500, error.message, 'SUPABASE_ERROR')
      return
    }

    jsonResponse(response, 200, {
      ok: true,
      subscriptionId: isRecord(data) && typeof data.id === 'string' ? data.id : undefined,
      active: isRecord(data) && typeof data.active === 'boolean' ? data.active : true,
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

    errorResponse(response, 'Could not save push subscription.', 500, undefined, 'SUPABASE_ERROR')
  }
}
