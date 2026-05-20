import { Activity, CheckCircle2, Clock, HeartPulse, Route } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DayPlan } from '../types/training'
import type { WorkoutLogEntry } from '../types/workoutLog'
import { formatMinutesToDuration } from '../utils/timeFormatUtils'
import {
  calculateDistanceDelta,
  getDistanceExecutionLabel,
  getPaceExecutionLabel,
  getRecoveryRiskHint,
} from '../utils/workoutLogUtils'
import ActivityCard from './ActivityCard'
import StatusPill from './StatusPill'

type WorkoutLogSummaryProps = {
  log: WorkoutLogEntry
  dayPlan: DayPlan | undefined
}

function WorkoutLogSummary({ log, dayPlan }: WorkoutLogSummaryProps) {
  const plannedKm = dayPlan?.plannedRun?.plannedDistanceKm
  const distanceDelta = calculateDistanceDelta(plannedKm, log.actualDistanceKm)
  const recoveryHint = getRecoveryRiskHint(log)
  const recoveryTone =
    recoveryHint === 'Recovery looks okay' ? 'success' : recoveryHint === 'Recovery not logged yet' ? 'neutral' : 'warning'

  return (
    <ActivityCard
      icon={Activity}
      pill={log.completionStatus}
      subtitle="Saved local workout log"
      title="Saved log"
      tone={log.completionStatus === 'completed' || log.completionStatus === 'rest' ? 'success' : 'warning'}
    >
      <div className="grid grid-cols-2 gap-2">
        <SummaryTile
          icon={<Route className="h-4 w-4" aria-hidden="true" />}
          label="Distance"
          value={log.actualDistanceKm !== undefined ? `${log.actualDistanceKm} km` : '-'}
        />
        <SummaryTile
          icon={<Clock className="h-4 w-4" aria-hidden="true" />}
          label="Duration"
          value={
            log.actualDurationMinutes !== undefined
              ? formatMinutesToDuration(log.actualDurationMinutes)
              : '-'
          }
        />
        <SummaryTile label="Pace" value={log.actualPaceMinPerKm ?? '-'} />
        <SummaryTile
          icon={<HeartPulse className="h-4 w-4" aria-hidden="true" />}
          label="Avg HR"
          value={log.averageHr !== undefined ? String(log.averageHr) : '-'}
        />
        <SummaryTile
          icon={<HeartPulse className="h-4 w-4" aria-hidden="true" />}
          label="Max HR"
          value={log.maxHr !== undefined ? String(log.maxHr) : '-'}
        />
        <SummaryTile
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          label="Run"
          value={log.runCompleted ? 'Completed' : 'Not done'}
        />
        <SummaryTile
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          label="Strength"
          value={log.strengthCompleted ? 'Completed' : 'Not done'}
        />
        <SummaryTile
          label="Alcohol"
          value={log.alcoholYesterday ?? '-'}
        />
      </div>

      <div className="mt-4 space-y-2">
        <FeedbackLine label="Distance" value={getDistanceExecutionLabel(plannedKm, log.actualDistanceKm)} />
        {distanceDelta !== undefined ? (
          <FeedbackLine
            label="Delta"
            value={`${distanceDelta > 0 ? '+' : ''}${distanceDelta} km vs planned`}
          />
        ) : null}
        <FeedbackLine
          label="Pace"
          value={getPaceExecutionLabel(dayPlan?.plannedRun, log.actualPaceMinPerKm)}
        />
        <div className="flex items-center justify-between gap-3 rounded-[16px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
          <span className="text-sm font-semibold text-stone-700 dark:text-slate-200">Recovery</span>
          <StatusPill tone={recoveryTone}>{recoveryHint}</StatusPill>
        </div>
      </div>

      {log.notes ? (
        <p className="mt-4 rounded-[18px] border border-stone-100 bg-stone-50 p-3 text-sm leading-6 text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
          {log.notes}
        </p>
      ) : null}
    </ActivityCard>
  )
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon?: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mb-1 flex items-center gap-1.5 text-stone-500 dark:text-slate-500">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="text-base font-semibold text-stone-950 dark:text-white">{value}</p>
    </div>
  )
}

function FeedbackLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <span className="text-sm font-semibold text-stone-700 dark:text-slate-200">{label}</span>
      <span className="text-right text-sm text-stone-600 dark:text-slate-300">{value}</span>
    </div>
  )
}

export default WorkoutLogSummary
