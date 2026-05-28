/// <reference types="node" />

export type PushEnvironment = {
  vapidPublicKey: string
  vapidPrivateKey: string
  vapidSubject: string
}

export class MissingEnvError extends Error {
  readonly variableName: string

  constructor(variableName: string) {
    super(`Missing required environment variable: ${variableName}`)
    this.variableName = variableName
    this.name = 'MissingEnvError'
  }
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new MissingEnvError(name)
  }

  return value
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name] || undefined
}

export function readPushEnv(): PushEnvironment {
  return {
    vapidPublicKey: getRequiredEnv('VAPID_PUBLIC_KEY'),
    vapidPrivateKey: getRequiredEnv('VAPID_PRIVATE_KEY'),
    vapidSubject: getRequiredEnv('VAPID_SUBJECT'),
  }
}

export function isMissingEnvError(error: unknown): error is MissingEnvError {
  return error instanceof MissingEnvError
}
