import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDateKey, formatDisplayDate } from '../utils/dateUtils'
import {
  addMonths,
  buildDatePickerGrid,
  getMonthLabel,
  isDateDisabled,
} from '../utils/datePickerUtils'

type QuickDate = {
  label: string
  date: string
}

type AppDatePickerProps = {
  value: string
  onChange: (date: string) => void
  onClose: () => void
  minDate?: string
  maxDate?: string
  quickDates?: QuickDate[]
  allowClear?: boolean
}

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const todayDate = formatDateKey(new Date())

function AppDatePicker({
  allowClear = false,
  maxDate,
  minDate,
  onChange,
  onClose,
  quickDates = [],
  value,
}: AppDatePickerProps) {
  const [visibleMonth, setVisibleMonth] = useState(value || todayDate)
  const days = buildDatePickerGrid(visibleMonth, todayDate)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      aria-label="Choose date"
      className="max-h-[min(82dvh,520px)] overflow-y-auto rounded-[24px] border border-stone-200 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
      role="dialog"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          aria-label="Previous month"
          className="grid h-10 w-10 place-items-center rounded-[16px] border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          type="button"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-sm font-semibold text-stone-950 dark:text-neutral-50">
            {getMonthLabel(visibleMonth)}
          </p>
          <p className="text-xs text-stone-500 dark:text-neutral-500">
            {value ? formatDisplayDate(value) : 'No date selected'}
          </p>
        </div>
        <button
          aria-label="Next month"
          className="grid h-10 w-10 place-items-center rounded-[16px] border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          type="button"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekdayLabels.map((weekday) => (
          <div
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-neutral-500"
            key={weekday}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const disabled = isDateDisabled(day.date, minDate, maxDate)
          const selected = day.date === value

          return (
            <button
              aria-label={`${disabled ? 'Unavailable' : 'Select'} ${formatDisplayDate(day.date)}`}
              aria-pressed={selected}
              className={`grid h-11 place-items-center rounded-[14px] text-sm font-semibold transition ${
                selected
                  ? 'bg-stone-950 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-950'
                  : day.isToday
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200'
                    : day.isCurrentMonth
                      ? 'text-stone-800 hover:bg-stone-100 dark:text-neutral-100 dark:hover:bg-neutral-800'
                      : 'text-stone-300 hover:bg-stone-50 dark:text-neutral-700 dark:hover:bg-neutral-800/60'
              } ${disabled ? 'cursor-not-allowed opacity-30 hover:bg-transparent' : ''}`}
              disabled={disabled}
              key={day.date}
              onClick={() => {
                onChange(day.date)
                onClose()
              }}
              type="button"
            >
              {day.dayNumber}
            </button>
          )
        })}
      </div>

      {quickDates.length || allowClear ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {quickDates.map((quickDate) => {
            const disabled = isDateDisabled(quickDate.date, minDate, maxDate)

            return (
              <button
                className="min-h-11 rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-stone-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:disabled:hover:bg-neutral-800"
                disabled={disabled}
                key={quickDate.label}
                onClick={() => {
                  onChange(quickDate.date)
                  onClose()
                }}
                type="button"
              >
                {quickDate.label}
              </button>
            )
          })}
          {allowClear ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              onClick={() => {
                onChange('')
                onClose()
              }}
              type="button"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default AppDatePicker
