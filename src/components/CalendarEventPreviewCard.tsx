import { CalendarDays, Dumbbell, Flag, Soup, Sparkles, TimerReset } from 'lucide-react'
import type { CalendarExportEvent } from '../types/calendarExport'
import { formatDisplayDate } from '../utils/dateUtils'
import StatusPill from './StatusPill'

type CalendarEventPreviewCardProps = {
  event: CalendarExportEvent
}

const categoryTone: Record<CalendarExportEvent['category'], 'running' | 'strength' | 'success' | 'warning' | 'neutral' | 'race'> = {
  custom: 'neutral',
  meal: 'success',
  race: 'race',
  recovery: 'warning',
  run: 'running',
  special: 'race',
  strength: 'strength',
}

function CalendarEventPreviewCard({ event }: CalendarEventPreviewCardProps) {
  return (
    <div className="flex gap-3 rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-700 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-200">
        <CalendarEventIcon category={event.category} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-stone-950 dark:text-white">{event.title}</p>
          <StatusPill tone={categoryTone[event.category]}>{event.category}</StatusPill>
        </div>
        <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-400">
          {formatDisplayDate(event.date)} ·{' '}
          {event.allDay ? 'All day' : `${event.startTime}-${event.endTime}`}
        </p>
      </div>
    </div>
  )
}

function CalendarEventIcon({ category }: { category: CalendarExportEvent['category'] }) {
  if (category === 'strength') {
    return <Dumbbell className="h-5 w-5" aria-hidden="true" />
  }

  if (category === 'race') {
    return <Flag className="h-5 w-5" aria-hidden="true" />
  }

  if (category === 'meal') {
    return <Soup className="h-5 w-5" aria-hidden="true" />
  }

  if (category === 'recovery') {
    return <TimerReset className="h-5 w-5" aria-hidden="true" />
  }

  if (category === 'special') {
    return <Sparkles className="h-5 w-5" aria-hidden="true" />
  }

  return <CalendarDays className="h-5 w-5" aria-hidden="true" />
}

export default CalendarEventPreviewCard
