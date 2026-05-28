import type { ApiResponse } from './types'

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
): void {
  jsonResponse(response, statusCode, {
    ok: false,
    message,
    ...(details ? { details } : {}),
  })
}

export function methodNotAllowed(response: ApiResponse, allowedMethods: string[]): void {
  response.setHeader('Allow', allowedMethods.join(', '))
  errorResponse(response, `Method not allowed. Use ${allowedMethods.join(' or ')}.`, 405)
}
