import { applyCors, handleCorsPreflight } from '../../_lib/cors.js'
import { isMissingEnvError } from '../../_lib/env.js'
import { readJsonBody } from '../../_lib/request.js'
import { errorResponse, jsonResponse, methodNotAllowed } from '../../_lib/responses.js'
import { createSupabaseAdminClient } from '../../_lib/supabaseServer.js'
import type { ApiRequest, ApiResponse } from '../../_lib/types.js'
import { isRecord, validateReminderHealthPayload } from '../../_lib/validation.js'

type SchedulerRun = {
  startedAt: string
  status: string
  sent: number
  failed: number
}

type DeviceReminder = {
  status: string
  sendAt?: string
  sentAt?: string
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
    const payload = validateReminderHealthPayload(await readJsonBody(request))

    if (payload.ok === false) {
      errorResponse(response, payload.message, 400, undefined, 'VALIDATION_ERROR')
      return
    }

    const supabase = createSupabaseAdminClient()
    const schedulerHealth = await readSchedulerHealth(supabase)

    if (!schedulerHealth.ok) {
      errorResponse(
        response,
        schedulerHealth.message ?? 'Could not check scheduler health.',
        500,
        schedulerHealth.details,
        schedulerHealth.code,
      )
      return
    }

    const deviceHealth = payload.value.endpoint
      ? await readDeviceHealth(supabase, payload.value.endpoint)
      : undefined

    if (deviceHealth && !deviceHealth.ok) {
      errorResponse(
        response,
        deviceHealth.message ?? 'Could not check device reminder health.',
        500,
        deviceHealth.details,
        deviceHealth.code,
      )
      return
    }

    jsonResponse(response, 200, {
      ok: true,
      message: 'Reminder health checked.',
      scheduler: schedulerHealth.scheduler,
      ...(deviceHealth?.device ? { device: deviceHealth.device } : {}),
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

    errorResponse(response, 'Could not check reminder health.', 500, undefined, 'SUPABASE_ERROR')
  }
}

async function readSchedulerHealth(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('push_scheduler_runs')
    .select('started_at, status, sent, failed')
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(100)

  if (error) {
    return {
      ok: false,
      message: isMissingTableError(error.message)
        ? 'Scheduler health table is missing. Run supabase/push_scheduler_runs.sql.'
        : 'Could not check scheduler health.',
      code: isMissingTableError(error.message) ? 'MISSING_TABLE' : 'SUPABASE_ERROR',
      details: error.message,
    }
  }

  const runs = Array.isArray(data)
    ? data.map(parseSchedulerRun).filter((run): run is SchedulerRun => Boolean(run))
    : []
  const lastRun = runs[0]
  const lastSuccessfulRun = runs.find((run) => run.status === 'success')
  const lastFailedRun = runs.find(
    (run) => run.status === 'failed' || run.status === 'partial_failure',
  )

  return {
    ok: true,
    scheduler: {
      lastRunAt: lastRun?.startedAt ?? null,
      lastStatus: lastRun?.status ?? null,
      lastSuccessfulRunAt: lastSuccessfulRun?.startedAt ?? null,
      lastFailedRunAt: lastFailedRun?.startedAt ?? null,
      recentRuns: runs.length,
      recentSent: runs.reduce((total, run) => total + run.sent, 0),
      recentFailed: runs.reduce((total, run) => total + run.failed, 0),
    },
  }
}

async function readDeviceHealth(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  endpoint: string,
) {
  const { data, error } = await supabase
    .from('push_reminders')
    .select('status, send_at, sent_at')
    .eq('subscription_endpoint', endpoint)
    .order('send_at', { ascending: true })
    .limit(500)

  if (error) {
    return {
      ok: false,
      message: isMissingTableError(error.message)
        ? 'Reminder table is missing. Run supabase/push_reminders.sql.'
        : 'Could not check device reminder health.',
      code: isMissingTableError(error.message) ? 'MISSING_TABLE' : 'SUPABASE_ERROR',
      details: error.message,
    }
  }

  const reminders = Array.isArray(data)
    ? data.map(parseDeviceReminder).filter((reminder): reminder is DeviceReminder => Boolean(reminder))
    : []
  const pending = reminders.filter((reminder) => reminder.status === 'pending')
  const sent = reminders.filter((reminder) => reminder.status === 'sent')

  return {
    ok: true,
    device: {
      pending: pending.length,
      sent: sent.length,
      failed: reminders.filter((reminder) => reminder.status === 'failed').length,
      cancelled: reminders.filter((reminder) => reminder.status === 'cancelled').length,
      nextPendingSendAt: pending[0]?.sendAt ?? null,
      lastSentAt:
        sent
          .map((reminder) => reminder.sentAt)
          .filter((value): value is string => Boolean(value))
          .sort()
          .at(-1) ?? null,
    },
  }
}

function parseSchedulerRun(row: unknown): SchedulerRun | undefined {
  if (!isRecord(row)) {
    return undefined
  }

  const startedAt = getString(row.started_at)
  const status = getString(row.status)

  if (!startedAt || !status) {
    return undefined
  }

  return {
    startedAt,
    status,
    sent: typeof row.sent === 'number' ? row.sent : 0,
    failed: typeof row.failed === 'number' ? row.failed : 0,
  }
}

function parseDeviceReminder(row: unknown): DeviceReminder | undefined {
  if (!isRecord(row)) {
    return undefined
  }

  const status = getString(row.status)

  if (!status) {
    return undefined
  }

  return {
    status,
    sendAt: getString(row.send_at),
    sentAt: getString(row.sent_at),
  }
}

function isMissingTableError(message: string) {
  return /relation .*does not exist|schema cache|could not find/i.test(message)
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
