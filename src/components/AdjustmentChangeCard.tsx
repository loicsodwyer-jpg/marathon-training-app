import { AlertTriangle, ArrowRight, Bike, Dumbbell, Route } from 'lucide-react'
import type { ProposedPlanChange } from '../types/planAdjustment'
import { formatDisplayDate } from '../utils/dateUtils'
import StatusPill, { type StatusTone } from './StatusPill'

type AdjustmentChangeCardProps = {
  change: ProposedPlanChange
}

const changeTone: Record<ProposedPlanChange['proposedChangeType'], StatusTone> = {
  keep: 'neutral',
  reduce: 'warning',
  replace_with_easy_run: 'success',
  replace_with_bike: 'running',
  replace_with_rest: 'race',
  replace_with_mobility: 'success',
  remove_strength: 'race',
  reduce_strength: 'strength',
  race_caution: 'race',
}

function AdjustmentChangeCard({ change }: AdjustmentChangeCardProps) {
  const tone = changeTone[change.proposedChangeType]

  return (
    <article className="space-y-3 rounded-[22px] border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
            {formatDisplayDate(change.date)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-stone-950 dark:text-white">
            {change.originalTitle}
          </h3>
        </div>
        <StatusPill tone={tone}>{change.proposedChangeType.replaceAll('_', ' ')}</StatusPill>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <SessionPanel
          distanceKm={change.originalDistanceKm}
          icon="run"
          label="Original"
          runType={change.originalRunType}
          summary={change.originalSummary}
          title={change.originalTitle}
        />

        <div className="flex justify-center text-stone-400 dark:text-neutral-500">
          <ArrowRight className="h-5 w-5 rotate-90" aria-hidden="true" />
        </div>

        <SessionPanel
          distanceKm={change.proposedDistanceKm}
          icon={change.proposedChangeType === 'replace_with_bike' ? 'bike' : 'run'}
          label="Proposed"
          runType={change.proposedRunType}
          summary={change.proposedSummary}
          title={change.proposedTitle}
        />
      </div>

      {change.strengthAdjustment ? (
        <div className="flex gap-2 rounded-[16px] border border-purple-100 bg-purple-50/70 p-3 dark:border-purple-300/20 dark:bg-purple-300/10">
          <Dumbbell className="mt-0.5 h-4 w-4 shrink-0 text-purple-700 dark:text-purple-200" aria-hidden="true" />
          <p className="text-sm leading-5 text-purple-800 dark:text-purple-100">
            {change.strengthAdjustment}
          </p>
        </div>
      ) : null}

      {change.nutritionNote ? (
        <div className="rounded-[16px] border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-300/20 dark:bg-amber-300/10">
          <p className="text-sm leading-5 text-amber-800 dark:text-amber-100">
            Nutrition: {change.nutritionNote}
          </p>
        </div>
      ) : null}

      <div className="rounded-[16px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-neutral-950/35">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
          Reason
        </p>
        <p className="mt-1 text-sm leading-5 text-stone-700 dark:text-neutral-300">
          {change.reason}
        </p>
      </div>

      {change.warnings.length ? (
        <div className="rounded-[16px] border border-orange-100 bg-orange-50/80 p-3 dark:border-orange-300/25 dark:bg-orange-300/10">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-700 dark:text-orange-200" aria-hidden="true" />
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-100">
              Notes
            </p>
          </div>
          <ul className="space-y-1">
            {change.warnings.map((warning) => (
              <li className="text-sm leading-5 text-orange-800/80 dark:text-orange-100/80" key={warning}>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}

function SessionPanel({
  distanceKm,
  icon,
  label,
  runType,
  summary,
  title,
}: {
  distanceKm?: number
  icon: 'run' | 'bike'
  label: string
  runType?: string
  summary: string
  title: string
}) {
  const Icon = icon === 'bike' ? Bike : Route

  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-neutral-950/35">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 dark:text-neutral-400" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-white">{title}</p>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">{summary}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {distanceKm !== undefined ? <StatusPill tone="running">{distanceKm} km</StatusPill> : null}
            {runType ? <StatusPill tone="neutral">{runType.replaceAll('_', ' ')}</StatusPill> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdjustmentChangeCard
