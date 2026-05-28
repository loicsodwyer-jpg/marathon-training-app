import { getOptionalEnv } from './env'
import type { ApiRequest, ApiResponse } from './types'

export function applyCors(request: ApiRequest, response: ApiResponse): void {
  const origin = request.headers.origin
  const allowedOrigin = getOptionalEnv('PUSH_ALLOWED_ORIGIN')

  response.setHeader('Vary', 'Origin')

  if (allowedOrigin && origin === allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  }

  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function handleCorsPreflight(request: ApiRequest, response: ApiResponse): boolean {
  if (request.method !== 'OPTIONS') {
    return false
  }

  applyCors(request, response)
  response.status(204).end()
  return true
}
