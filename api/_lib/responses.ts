import type { ApiResponse } from './types.js'

export function jsonResponse(
  response: ApiResponse,
  statusCode: number,
  data: Record<string, unknown>,
): void {
  response.status(statusCode).json(data)
}

export function errorResponse(
  response: ApiResponse,
  message: string,
  statusCode = 500,
  details?: string,
  code?: string,
): void {
  const resolvedCode = details && isMissingTableError(details) ? 'MISSING_TABLE' : code

  jsonResponse(response, statusCode, {
    ok: false,
    message,
    ...(resolvedCode ? { code: resolvedCode } : {}),
    ...(details ? { details } : {}),
  })
}

export function methodNotAllowed(response: ApiResponse, allowedMethods: string[]): void {
  response.setHeader('Allow', allowedMethods.join(', '))
  errorResponse(
    response,
    `Method not allowed. Use ${allowedMethods.join(' or ')}.`,
    405,
    undefined,
    'METHOD_NOT_ALLOWED',
  )
}

function isMissingTableError(message: string) {
  return /relation .*does not exist|schema cache|could not find/i.test(message)
}
