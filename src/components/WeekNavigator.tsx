import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import type { ReactNode } from 'react'
import { addDays, formatDateKey, getMondayOfWeek } from '../utils/dateUtils'
import { trainingPlanStartDate } from '../data/trainingPlan'
import AppDateInput from './AppDateInput'

type WeekNavigatorProps = {
  selectedDate: string
  weekRangeLabel: string
  onDateChange: (date: string) => void
}

const todayDateKey = formatDateKey(new Date())

function WeekNavigator({ selectedDate, weekRangeLabel, onDateChange }: WeekNavigatorProps) {
  const selectedMonday = getMondayOfWeek(selectedDate)

  return (
    <section className="space-y-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.07)] dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <button
          aria-label="Previous week"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
          onClick={() => onDateChange(addDays(selectedMonday, -7))}
          type="button"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-sm font-semibold text-stone-950 dark:text-white">{weekRangeLabel}</p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-500">Monday to Sunday</p>
        </div>
        <button
          aria-label="Next week"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
          onClick={() => onDateChange(addDays(selectedMonday, 7))}
          type="button"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <AppDateInput
        label="Jump to date"
        onChange={(date) => {
          if (date) {
            onDateChange(date)
          }
        }}
        quickDates={[
          { label: 'Today', date: todayDateKey },
          { label: 'Plan start', date: trainingPlanStartDate },
        ]}
        value={selectedDate}
      />

      <div className="grid grid-cols-2 gap-2">
        <QuickButton
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          label="Today"
          onClick={() => onDateChange(todayDateKey)}
        />
        <QuickButton label="Plan start" onClick={() => onDateChange(trainingPlanStartDate)} />
      </div>
    </section>
  )
}

function QuickButton({
  icon,
  label,
  onClick,
}: {
  icon?: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}

export default WeekNavigator
