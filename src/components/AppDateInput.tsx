import { CalendarDays } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatDisplayDate } from '../utils/dateUtils'
import AppDatePicker from './AppDatePicker'

type QuickDate = {
  label: string
  date: string
}

type AppDateInputProps = {
  value: string
  onChange: (date: string) => void
  label?: string
  helperText?: string
  minDate?: string
  maxDate?: string
  quickDates?: QuickDate[]
  disabled?: boolean
  allowClear?: boolean
}

function AppDateInput({
  allowClear = false,
  disabled = false,
  helperText,
  label,
  maxDate,
  minDate,
  onChange,
  quickDates,
  value,
}: AppDateInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <div className="relative" ref={wrapperRef}>
      {label ? (
        <label className="mb-2 block text-sm font-semibold text-stone-700 dark:text-slate-200">
          {label}
        </label>
      ) : null}
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="flex h-12 w-full items-center justify-between gap-3 rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-left text-sm font-semibold text-stone-900 outline-none transition hover:bg-stone-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:hover:bg-white/[0.06] dark:focus:border-cyan-300 dark:focus:ring-cyan-300/10"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{value ? formatDisplayDate(value) : 'Select date'}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-stone-400 dark:text-slate-500" aria-hidden="true" />
      </button>
      {helperText ? (
        <p className="mt-1.5 text-xs leading-5 text-stone-500 dark:text-slate-500">{helperText}</p>
      ) : null}

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[130]">
          <AppDatePicker
            allowClear={allowClear}
            maxDate={maxDate}
            minDate={minDate}
            onChange={onChange}
            onClose={() => setIsOpen(false)}
            quickDates={quickDates}
            value={value}
          />
        </div>
      ) : null}
    </div>
  )
}

export default AppDateInput
