export function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

export function roundWhole(value: number): number {
  return Math.round(value)
}

export function formatKm(value: number | undefined): string {
  if (value === undefined) {
    return '-'
  }

  return `${roundOneDecimal(value)} km`
}

export function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '-'
  }

  return `${roundWhole(value)}%`
}

export function formatHeartRate(value: number | undefined): string {
  if (value === undefined) {
    return '-'
  }

  return `${roundWhole(value)}`
}

export function formatPaceSeconds(secondsPerKm: number | undefined): string {
  if (secondsPerKm === undefined || !Number.isFinite(secondsPerKm)) {
    return '-'
  }

  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)

  if (seconds === 60) {
    return `${minutes + 1}:00/km`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}/km`
}

export function formatShortDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}
