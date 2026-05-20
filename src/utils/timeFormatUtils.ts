export function formatMinutesToDuration(totalMinutes: number): string {
  const totalSeconds = Math.round(totalMinutes * 60)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return seconds > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${hours}h ${minutes}m`
  }

  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

export function parseDurationToMinutes(input: string): number | undefined {
  const trimmedInput = input.trim()

  if (!trimmedInput) {
    return undefined
  }

  if (!trimmedInput.includes(':')) {
    const parsedMinutes = Number(trimmedInput.replace(',', '.'))
    return Number.isFinite(parsedMinutes) ? parsedMinutes : undefined
  }

  const parts = trimmedInput.split(':').map(Number)

  if (parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return undefined
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return minutes + seconds / 60
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 60 + minutes + seconds / 60
  }

  return undefined
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)

  if (seconds === 60) {
    return `${minutes + 1}:00/km`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}/km`
}

export function calculatePaceMinPerKm(
  distanceKm: number,
  durationMinutes: number,
): string {
  if (distanceKm <= 0 || durationMinutes <= 0) {
    return ''
  }

  return formatPace((durationMinutes * 60) / distanceKm)
}

export function paceStringToSeconds(pace: string): number | undefined {
  const normalizedPace = pace.replace('/km', '').trim()
  const [minutes, seconds] = normalizedPace.split(':').map(Number)

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return undefined
  }

  return minutes * 60 + seconds
}
