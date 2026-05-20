import { CheckCircle2, Dumbbell, Moon, PartyPopper, Route, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SpecialEvent } from '../types/training'
import type { WeekViewDay } from '../types/weekView'
import PageCard from './PageCard'
import StatusPill from './StatusPill'

type WeeklyMiniCalendarProps = {
  days: WeekViewDay[]
  expandedDayDates: Set<string>
  onSelectDay: (date: string) => void
}

function WeeklyMiniCalendar({
  days,
  expandedDayDates,
  onSelectDay,
}: WeeklyMiniCalendarProps) {
  return (
    <PageCard className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-950 dark:text-white">Week at a glance</h2>
        <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
          Monday to Sunday, compact and tappable.
        </p>
      </div>

      <div className="space-y-2">
        {days.map((day) => (
          <MiniDayRow
            day={day}
            isExpanded={expandedDayDates.has(day.date)}
            key={day.date}
            onSelect={() => onSelectDay(day.date)}
          />
        ))}
      </div>
    </PageCard>
  )
}

function MiniDayRow({
  day,
  isExpanded,
  onSelect,
}: {
  day: WeekViewDay
  isExpanded: boolean
  onSelect: () => void
}) {
  const run = day.dayPlan?.plannedRun
  const runBlock = day.blocks.find((block) => block.category === 'run' || block.category === 'race')
  const strengthBlocks = day.blocks.filter((block) => block.category === 'strength')
  const eventLabels = day.specialEvents
    .filter((event) => event.category !== 'recovery')
    .map(formatMiniEventLabel)

  return (
    <button
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${day.dayName} ${day.displayDate}`}
      className={`w-full rounded-[18px] border p-3 text-left transition hover:bg-stone-50 dark:hover:bg-white/[0.08] ${
        isExpanded || day.isSelected
          ? 'border-cyan-300/40 bg-cyan-50 dark:border-cyan-300/30 dark:bg-cyan-300/10'
          : 'border-stone-200 bg-stone-50/80 dark:border-white/10 dark:bg-white/[0.05]'
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-slate-500">
            {day.dayShort}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-stone-950 dark:text-white">
            {day.displayDate}
          </p>
        </div>

        <div className="min-w-0 space-y-1.5">
          {run ? (
            <MiniSessionLine
              completed={Boolean(runBlock?.completed)}
              icon={run.type === 'race' ? Trophy : Route}
              label={`${run.plannedDistanceKm} km ${run.type.replaceAll('_', ' ')}`}
              tone={run.type === 'race' ? 'race' : 'run'}
            />
          ) : (
            <MiniSessionLine completed={false} icon={Moon} label="Rest / no planned run" tone="rest" />
          )}

          {strengthBlocks.length ? (
            <MiniSessionLine
              completed={strengthBlocks.every((block) => block.completed)}
              icon={Dumbbell}
              label={strengthBlocks.map((block) => block.title).join(' + ')}
              tone="strength"
            />
          ) : null}

          {eventLabels.length ? (
            <MiniSessionLine
              completed={false}
              icon={eventLabels.includes('Race') ? Trophy : PartyPopper}
              label={eventLabels.join(' + ')}
              tone={eventLabels.includes('Race') ? 'race' : 'event'}
            />
          ) : null}
        </div>

        <div className="flex justify-end">
          {day.isToday ? (
            <StatusPill tone="success">Today</StatusPill>
          ) : isExpanded ? (
            <StatusPill tone="running">Open</StatusPill>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function MiniSessionLine({
  completed,
  icon: Icon,
  label,
  tone,
}: {
  completed: boolean
  icon: LucideIcon
  label: string
  tone: 'run' | 'strength' | 'event' | 'race' | 'rest'
}) {
  const classNameByTone = {
    event: 'text-pink-700 dark:text-pink-200',
    race: 'text-rose-700 dark:text-rose-200',
    rest: 'text-stone-600 dark:text-slate-400',
    run: 'text-cyan-700 dark:text-cyan-200',
    strength: 'text-purple-700 dark:text-purple-200',
  }

  return (
    <div className={`flex min-w-0 items-center gap-2 ${classNameByTone[tone]}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate text-xs font-semibold leading-4">{label}</span>
      {completed ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
      ) : null}
    </div>
  )
}

function formatMiniEventLabel(event: SpecialEvent) {
  if (event.category === 'birthday') {
    return 'Birthday'
  }

  if (event.category === 'festival') {
    return 'Festival'
  }

  if (event.category === 'wedding') {
    return 'Wedding'
  }

  if (event.category === 'race') {
    return 'Race'
  }

  return event.title
}

export default WeeklyMiniCalendar
