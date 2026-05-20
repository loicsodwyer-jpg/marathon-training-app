import type { CalendarExportEvent } from '../types/calendarExport'
import { addDays } from './dateUtils'

type BuildIcsCalendarOptions = {
  calendarName: string
  timezone: string
}

export function escapeIcsText(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replace(/\r?\n/g, '\\n')
}

export function formatIcsDate(date: string): string {
  return date.replaceAll('-', '')
}

export function formatIcsDateTime(date: string, time: string): string {
  return `${formatIcsDate(date)}T${time.replace(':', '')}00`
}

export function foldIcsLine(line: string): string {
  if (line.length <= 75) {
    return line
  }

  const foldedLines: string[] = []
  let remainingLine = line

  while (remainingLine.length > 75) {
    foldedLines.push(remainingLine.slice(0, 75))
    remainingLine = ` ${remainingLine.slice(75)}`
  }

  foldedLines.push(remainingLine)
  return foldedLines.join('\r\n')
}

export function buildIcsCalendar(
  events: CalendarExportEvent[],
  options: BuildIcsCalendarOptions,
): string {
  const timestamp = getTimestamp()
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Loic Marathon 2:55//Training Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(options.calendarName)}`,
    `X-WR-TIMEZONE:${escapeIcsText(options.timezone)}`,
    ...events.flatMap((event) => buildEventLines(event, options.timezone, timestamp)),
    'END:VCALENDAR',
  ]

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}

export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function buildEventLines(event: CalendarExportEvent, timezone: string, timestamp: string) {
  const uid = `${event.id}@loic-marathon-255.local`
  const lines = ['BEGIN:VEVENT', `UID:${escapeIcsText(uid)}`, `DTSTAMP:${timestamp}`]

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(event.date)}`)
    lines.push(`DTEND;VALUE=DATE:${formatIcsDate(addDays(event.endTime || event.date, 1))}`)
  } else {
    lines.push(`DTSTART;TZID=${timezone}:${formatIcsDateTime(event.date, event.startTime)}`)
    lines.push(`DTEND;TZID=${timezone}:${formatIcsDateTime(event.date, event.endTime)}`)
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`)
  lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
  lines.push(`CATEGORIES:${escapeIcsText(event.category.toUpperCase())}`)

  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`)
  }

  lines.push('END:VEVENT')
  return lines
}

function getTimestamp() {
  const date = new Date()
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}
