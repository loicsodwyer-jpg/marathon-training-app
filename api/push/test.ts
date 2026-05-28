import { applyCors, handleCorsPreflight } from '../_lib/cors'
import { isMissingEnvError } from '../_lib/env'
import {
  getWebPushErrorMessage,
  getWebPushErrorStatus,
  sendPushNotification,
} from '../_lib/pushServer'
import { readJsonBody } from '../_lib/request'
import { errorResponse, jsonResponse, methodNotAllowed } from '../_lib/responses'
import { createSupabaseAdminClient } from '../_lib/supabaseServer'
import type { ApiRequest, ApiResponse, WebPushSubscription } from '../_lib/types'
import { isRecord, validateTestPushPayload } from '../_lib/validation'

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
    const payload = validateTestPushPayload(await readJsonBody(request))

    if (!payload.ok) {
      errorResponse(response, payload.message, 400)
      return
    }

    const supabase = createSupabaseAdminClient()
    const endpoint = 'endpoint' in payload.value ? payload.value.endpoint : undefined
    const subscription = endpoint
      ? await getActiveSubscriptionForEndpoint(supabase, endpoint)
      : payload.value.subscription

    if (!subscription) {
      errorResponse(response, 'Active push subscription was not found.', 404)
      return
    }

    try {
      await sendPushNotification(subscription, {
        title: 'Marathon 2:55 backend test',
        body: 'Backend push is working on this device.',
        url: '/?date=2026-06-09',
        tag: 'backend-test',
        type: 'test',
        reminderId: 'backend-test',
      })
    } catch (error) {
      const statusCode = getWebPushErrorStatus(error)

      if (endpoint && (statusCode === 404 || statusCode === 410)) {
        await supabase.from('push_subscriptions').update({ active: false }).eq('endpoint', endpoint)
        errorResponse(response, 'Subscription expired and was deactivated.', 410)
        return
      }

      errorResponse(response, 'Backend test push failed.', 502, getWebPushErrorMessage(error))
      return
    }

    if (endpoint) {
      await supabase
        .from('push_subscriptions')
        .update({ last_test_sent_at: new Date().toISOString() })
        .eq('endpoint', endpoint)
    }

    jsonResponse(response, 200, {
      ok: true,
      sent: true,
    })
  } catch (error) {
    if (isMissingEnvError(error)) {
      errorResponse(response, 'Push backend environment variables are missing.', 500, error.message)
      return
    }

    errorResponse(response, 'Backend test push failed.', 500)
  }
}

async function getActiveSubscriptionForEndpoint(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  endpoint: string,
): Promise<WebPushSubscription | undefined> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('endpoint', endpoint)
    .eq('active', true)
    .maybeSingle()

  if (error || !data || !isRecord(data)) {
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
