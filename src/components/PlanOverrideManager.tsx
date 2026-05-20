import { AlertTriangle, CalendarX, RotateCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { PlanAdjustmentRecord } from '../types/planOverride'
import { formatDisplayDate } from '../utils/dateUtils'
import ConfirmDialog from './ConfirmDialog'
import PageCard from './PageCard'
import StatusPill from './StatusPill'

type PlanOverrideManagerProps = {
  records: PlanAdjustmentRecord[]
  adjustedDayCount: number
  onClearAdjustment: (adjustmentId: string) => void
  onClearAll: () => void
}

type ClearTarget =
  | {
      type: 'adjustment'
      record: PlanAdjustmentRecord
    }
  | {
      type: 'all'
    }

function PlanOverrideManager({
  adjustedDayCount,
  onClearAdjustment,
  onClearAll,
  records,
}: PlanOverrideManagerProps) {
  const [clearTarget, setClearTarget] = useState<ClearTarget>()

  if (!records.length) {
    return null
  }

  const confirmContent =
    clearTarget?.type === 'adjustment'
      ? {
          title: 'Reset this adjustment?',
          description: `This removes local overrides from ${clearTarget.record.title}. The original plan returns for those dates.`,
          confirmLabel: 'Reset adjustment',
        }
      : {
          title: 'Clear all plan adjustments?',
          description:
            'This removes all local plan overrides. Workout logs and calendar edits stay unchanged.',
          confirmLabel: 'Clear adjustments',
        }

  return (
    <PageCard className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-purple-50 text-purple-700 ring-1 ring-purple-100 dark:bg-purple-300/10 dark:text-purple-200 dark:ring-purple-300/20">
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
              Plan adjustments active
            </h2>
            <StatusPill tone="strength">{records.length}</StatusPill>
          </div>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-400">
            {adjustedDayCount} adjusted day{adjustedDayCount === 1 ? '' : 's'} are applied locally.
            The original plan is preserved.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {records.map((record) => (
          <article
            className="rounded-[20px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]"
            key={record.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-950 dark:text-white">
                  {record.title}
                </p>
                <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-400">
                  {formatDisplayDate(record.startDate)} - {formatDisplayDate(record.endDate)}
                </p>
              </div>
              <StatusPill tone="warning">{record.adjustmentLevel.replaceAll('_', '/')}</StatusPill>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusPill tone="neutral">{record.issueType.replaceAll('_', ' ')}</StatusPill>
              <StatusPill tone="running">{record.affectedDates.length} days</StatusPill>
              {record.globalWarnings.length ? (
                <StatusPill tone="warning">{record.globalWarnings.length} warnings</StatusPill>
              ) : null}
            </div>
            {record.globalWarnings.length ? (
              <div className="mt-3 flex gap-2 rounded-[16px] border border-orange-100 bg-orange-50/80 p-2 dark:border-orange-300/25 dark:bg-orange-300/10">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-700 dark:text-orange-200" aria-hidden="true" />
                <p className="line-clamp-2 text-xs leading-5 text-orange-800 dark:text-orange-100">
                  {record.globalWarnings[0]}
                </p>
              </div>
            ) : null}
            <button
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-200 dark:hover:bg-white/[0.08]"
              onClick={() => setClearTarget({ type: 'adjustment', record })}
              type="button"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset this adjustment
            </button>
          </article>
        ))}
      </div>

      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200 dark:hover:bg-rose-300/15"
        onClick={() => setClearTarget({ type: 'all' })}
        type="button"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Clear all adjustments
      </button>

      <div className="flex gap-2 rounded-[16px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
        <CalendarX className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 dark:text-slate-400" aria-hidden="true" />
        <p className="text-xs leading-5 text-stone-600 dark:text-slate-400">
          Daily calendar edits are separate. If a day had custom schedule edits before the plan
          changed, reset that day schedule from Today if needed.
        </p>
      </div>

      <ConfirmDialog
        confirmLabel={confirmContent.confirmLabel}
        description={confirmContent.description}
        onCancel={() => setClearTarget(undefined)}
        onConfirm={() => {
          if (clearTarget?.type === 'adjustment') {
            onClearAdjustment(clearTarget.record.id)
          }

          if (clearTarget?.type === 'all') {
            onClearAll()
          }

          setClearTarget(undefined)
        }}
        open={Boolean(clearTarget)}
        title={confirmContent.title}
        tone="danger"
      />
    </PageCard>
  )
}

export default PlanOverrideManager
