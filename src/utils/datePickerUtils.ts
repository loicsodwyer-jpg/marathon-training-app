import { addDays, formatDateKey, parseLocalDate } from './dateUtils'

export type DatePickerDay = {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

export function getMonthKey(dateString: string) {
  return dateString.slice(0, 7)
}

export function addMonths(dateString: string, months: number) {
  const date = parseLocalDate(`${getMonthKey(dateString)}-01`)
  date.setMonth(date.getMonth() + months)
  return formatDateKey(date)
}

export function getMonthLabel(dateString: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDate(`${getMonthKey(dateString)}-01`))
}

export function buildDatePickerGrid(monthDate: string, todayDate: string): DatePickerDay[] {
  const firstOfMonth = parseLocalDate(`${getMonthKey(monthDate)}-01`)
  const mondayOffset = firstOfMonth.getDay() === 0 ? -6 : 1 - firstOfMonth.getDay()
  const firstGridDate = formatDateKey(
    new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), firstOfMonth.getDate() + mondayOffset),
  )

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstGridDate, index)

    return {
      date,
      dayNumber: parseLocalDate(date).getDate(),
      isCurrentMonth: getMonthKey(date) === getMonthKey(monthDate),
      isToday: date === todayDate,
    }
  })
}

export function isDateDisabled(date: string, minDate?: string, maxDate?: string) {
  return Boolean((minDate && date < minDate) || (maxDate && date > maxDate))
}
