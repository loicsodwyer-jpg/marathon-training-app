import type { ISODateString } from '../types/training'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function padDatePart(value: number) {
  return String(value).padStart(2, '0')
}

export function parseLocalDate(dateString: ISODateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateKey(date: Date): ISODateString {
  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  return `${year}-${month}-${day}`
}

export function getDayOfWeek(dateString: ISODateString) {
  return dayNames[parseLocalDate(dateString).getDay()]
}

export function addDays(dateString: ISODateString, days: number): ISODateString {
  const date = parseLocalDate(dateString)
  date.setDate(date.getDate() + days)
  return formatDateKey(date)
}

export function getMondayOfWeek(dateString: ISODateString): ISODateString {
  const date = parseLocalDate(dateString)
  const day = date.getDay()
  const offset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + offset)
  return formatDateKey(date)
}

export function isDateBetween(
  dateString: ISODateString,
  startDate: ISODateString,
  endDate: ISODateString,
) {
  return dateString >= startDate && dateString <= endDate
}

export function formatDisplayDate(dateString: ISODateString) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseLocalDate(dateString))
}
