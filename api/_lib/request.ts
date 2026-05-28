import type { ApiRequest } from './types.js'

export async function readJsonBody(request: ApiRequest): Promise<unknown> {
  if (request.body !== undefined) {
    return parsePossibleJson(request.body)
  }

  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk))
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim()
  return rawBody ? JSON.parse(rawBody) : {}
}

function parsePossibleJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  return value.trim() ? JSON.parse(value) : {}
}
