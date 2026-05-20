import { CalendarRange, CheckCircle2, Dumbbell, Route } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { WeekViewSummary } from '../types/weekView'
import { formatWeekDateRange } from '../utils/weekViewUtils'
import PageCard from './PageCard'
import StatusPill, { type StatusTone } from './StatusPill'

type WeekSummaryCardProps = {
  summary: WeekViewSummary
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

function WeekSummaryCard({ summary }: WeekSummaryCardProps) {
  const phase = summary.phase ?? 'outside plan'
  const tone = phaseTone[phase] ?? 'neutral'
  const mileagePercent =
    summary.plannedKm > 0 ? Math.min(100, (summary.completedKm / summary.plannedKm) * 100) : 0

  return (
    <PageCard className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-slate-500">
            {summary.weekNumber ? `Week ${summary.weekNumber}` : 'Week view'}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-950 dark:text-white">
            {formatWeekDateRange(summary.startDate, summary.endDate)}
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-400">
            {summary.focus ?? 'Select a week inside the plan to see the training focus.'}
          </p>
        </div>
        <StatusPill tone={tone}>{phase}</StatusPill>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SummaryMetric
          icon={Route}
          label="Km"
          value={`${summary.completedKm}/${summary.plannedKm}`}
        />
        <SummaryMetric
          icon={CheckCircle2}
          label="Runs"
          value={`${summary.completedRuns}/${summary.plannedRuns}`}
        />
        <SummaryMetric
          icon={Dumbbell}
          label="Strength"
          value={`${summary.completedStrengthSessions}/${summary.plannedStrengthSessions}`}
        />
        <SummaryMetric
          icon={CalendarRange}
          label="Completion"
          value={`${summary.completionPercent}%`}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-slate-500">
          <span>Completed mileage</span>
          <span>{summary.completedKm} / {summary.plannedKm} km</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-cyan-500 dark:bg-cyan-300"
            style={{ width: `${mileagePercent}%` }}
          />
        </div>
      </div>

      {summary.specialEventLabels.length ? (
        <div className="flex flex-wrap gap-2">
          {summary.specialEventLabels.map((label) => (
            <StatusPill key={label} tone="race">
              {label}
            </StatusPill>
          ))}
        </div>
      ) : null}
    </PageCard>
  )
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mb-1 flex items-center gap-1.5 text-stone-500 dark:text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="text-base font-semibold text-stone-950 dark:text-white">{value}</p>
    </div>
  )
}

export default WeekSummaryCard
