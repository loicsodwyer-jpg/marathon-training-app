import { ChevronDown, ChevronUp, KeyRound, Route, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PlanWeekViewSection } from '../types/planView'
import type { WorkoutLogEntry } from '../types/workoutLog'
import { formatDisplayDate } from '../utils/dateUtils'
import { getSpecialEventsForDate } from '../utils/trainingPlanUtils'
import PlanDayCard from './PlanDayCard'
import PlanWorkoutBadge from './PlanWorkoutBadge'
import StatusPill, { type StatusTone } from './StatusPill'

type PlanWeekSectionProps = {
  isExpanded: boolean
  onOpenDay: (date: string) => void
  onToggleExpanded: () => void
  section: PlanWeekViewSection
  selectedDate: string
  workoutLogs: Record<string, WorkoutLogEntry>
}

const phaseTone: Record<string, StatusTone> = {
  recovery: 'success',
  base: 'running',
  build: 'running',
  specific: 'warning',
  peak: 'warning',
  taper: 'neutral',
  race: 'race',
}

function PlanWeekSection({
  isExpanded,
  onOpenDay,
  onToggleExpanded,
  section,
  selectedDate,
  workoutLogs,
}: PlanWeekSectionProps) {
  const { week } = section

  return (
    <section className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.07)] dark:border-white/10 dark:bg-neutral-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
      <button
        className="w-full text-left"
        onClick={onToggleExpanded}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
              Week {week.weekNumber} - {formatDisplayDate(week.startDate)} - {formatDisplayDate(week.endDate)}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-stone-950 dark:text-white">
              {week.focus}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusPill tone={phaseTone[week.phase] ?? 'neutral'}>{week.phase}</StatusPill>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-stone-500 dark:text-neutral-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-stone-500 dark:text-neutral-400" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <WeekMetric icon={<Route className="h-4 w-4" aria-hidden="true" />} label="Target" value={`${week.targetMileageKm} km`} />
          <WeekMetric icon={<KeyRound className="h-4 w-4" aria-hidden="true" />} label="Key" value={String(section.keyWorkoutCount)} />
          <WeekMetric icon={<Trophy className="h-4 w-4" aria-hidden="true" />} label="Long" value={section.longRunDistanceKm ? `${section.longRunDistanceKm} km` : '-'} />
        </div>

        {section.specialEventLabels.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {section.specialEventLabels.map((label) => (
              <PlanWorkoutBadge key={label} label={label} tone="race" />
            ))}
          </div>
        ) : null}
      </button>

      {isExpanded ? (
        <div className="mt-4 space-y-3">
          {section.matchingDays.map((dayPlan) => (
            <PlanDayCard
              dayPlan={dayPlan}
              events={getSpecialEventsForDate(dayPlan.date)}
              isSelected={dayPlan.date === selectedDate}
              key={dayPlan.date}
              log={workoutLogs[dayPlan.date]}
              onOpenDay={onOpenDay}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function WeekMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-[16px] border border-stone-100 bg-stone-50 p-2.5 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mb-1 flex items-center gap-1 text-stone-500 dark:text-neutral-500">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="text-sm font-semibold text-stone-950 dark:text-white">{value}</p>
    </div>
  )
}

export default PlanWeekSection
