import { applyCors, handleCorsPreflight } from '../_lib/cors'
import { isMissingEnvError } from '../_lib/env'
import { readJsonBody } from '../_lib/request'
import { errorResponse, jsonResponse, methodNotAllowed } from '../_lib/responses'
import { createSupabaseAdminClient } from '../_lib/supabaseServer'
import type { ApiRequest, ApiResponse } from '../_lib/types'
import { validateEndpointPayload } from '../_lib/validation'

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

    if (!payload.ok) {
      errorResponse(response, payload.message, 400)
      return
    }

    const supabase = createSupabaseAdminClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .update({
        active: false,
        last_seen_at: new Date().toISOString(),
      })
      .eq('endpoint', payload.value.endpoint)

    if (error) {
      errorResponse(response, 'Could not remove push subscription.', 500, error.message)
      return
    }

    jsonResponse(response, 200, {
      ok: true,
      message: 'Subscription was removed or was already inactive.',
    })
  } catch (error) {
    if (isMissingEnvError(error)) {
      errorResponse(response, 'Push backend environment variables are missing.', 500, error.message)
      return
    }

    errorResponse(response, 'Could not remove push subscription.', 500)
  }
}
