import { CheckCircle2, Clock, Coffee, Dumbbell, HeartPulse, Route } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFuelingPreferences } from '../hooks/useFuelingPreferences'
import type { DayPlan, SpecialEvent } from '../types/training'
import type { WorkoutLogEntry } from '../types/workoutLog'
import { formatShortDate } from '../utils/chartFormatUtils'
import { getDayAdjustmentInfo } from '../utils/effectiveTrainingPlanUtils'
import { formatFuelingSummary } from '../utils/fuelingFormatUtils'
import { getFuelingRecommendationForDay } from '../utils/fuelingRules'
import { getFuelingGuidanceForRun, getNutritionSummaryForDay } from '../utils/nutritionUtils'
import { getDayBadges, getIntervalSummary } from '../utils/planViewUtils'
import { getStrengthSessionsByIds } from '../utils/strengthUtils'
import AdjustedPlanBadge from './AdjustedPlanBadge'
import PlanWorkoutBadge from './PlanWorkoutBadge'
import StatusPill from './StatusPill'

type PlanDayCardProps = {
  dayPlan: DayPlan
  events: SpecialEvent[]
  isSelected: boolean
  log: WorkoutLogEntry | undefined
  onOpenDay: (date: string) => void
}

function PlanDayCard({ dayPlan, events, isSelected, log, onOpenDay }: PlanDayCardProps) {
  const { preferences } = useFuelingPreferences()
  const run = dayPlan.plannedRun
  const badges = getDayBadges(dayPlan)
  const intervalSummary = getIntervalSummary(run)
  const isRunCompleted =
    log?.runCompleted && (log.completionStatus === 'completed' || log.completionStatus === 'partial')
  const strengthSessions = getStrengthSessionsByIds(dayPlan.strengthSessionIds)
  const fuelingRecommendation = getFuelingRecommendationForDay(dayPlan, preferences)
  const fuelingNote =
    fuelingRecommendation.category !== 'none'
      ? formatFuelingSummary(fuelingRecommendation)
      : getFuelingGuidanceForRun(run)[0]
  const adjustment = getDayAdjustmentInfo(dayPlan.date)

  return (
    <button
      aria-label={`Open ${dayPlan.dayOfWeek} ${formatShortDate(dayPlan.date)} in Today`}
      className={`w-full rounded-[22px] border p-4 text-left transition hover:scale-[1.005] ${
        isSelected
          ? 'border-cyan-300/40 bg-cyan-50/70 dark:border-cyan-300/30 dark:bg-cyan-300/10'
          : 'border-stone-100 bg-stone-50/80 dark:border-white/10 dark:bg-white/[0.05]'
      }`}
      onClick={() => onOpenDay(dayPlan.date)}
      type="button"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
            {dayPlan.dayOfWeek} - {formatShortDate(dayPlan.date)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-stone-950 dark:text-white">
            {dayPlan.title}
          </h3>
        </div>
        <StatusPill tone={dayPlan.intensity === 'race' ? 'race' : dayPlan.intensity === 'high' ? 'warning' : 'neutral'}>
          {dayPlan.intensity}
        </StatusPill>
      </div>

      <p className="text-sm leading-5 text-stone-600 dark:text-neutral-300">{dayPlan.summary}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <PlanWorkoutBadge key={`${dayPlan.date}-${badge.label}`} label={badge.label} tone={badge.tone} />
        ))}
        {log ? (
          <PlanWorkoutBadge
            label={isRunCompleted ? 'Logged complete' : `Logged ${log.completionStatus}`}
            tone={isRunCompleted ? 'success' : 'neutral'}
          />
        ) : null}
        {adjustment ? <AdjustedPlanBadge /> : null}
      </div>

      {adjustment ? (
        <div className="mt-3 rounded-[16px] border border-purple-100 bg-purple-50/70 p-3 dark:border-purple-300/20 dark:bg-purple-300/10">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
            Original: {adjustment.originalTitle}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-purple-800 dark:text-purple-100">
            {adjustment.reason}
          </p>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {run ? (
          <DetailLine
            icon={<Route className="h-4 w-4" aria-hidden="true" />}
            label={`${run.plannedDistanceKm} km - ${run.type.replaceAll('_', ' ')}`}
            value={[
              run.targetPace ? `${run.targetPace.minPerKmFrom}-${run.targetPace.minPerKmTo}/km` : undefined,
              run.targetHrDescription ?? run.targetHrZone,
            ]
              .filter(Boolean)
              .join(' - ')}
          />
        ) : (
          <DetailLine
            icon={<Clock className="h-4 w-4" aria-hidden="true" />}
            label="No planned run"
            value={dayPlan.dayType.replaceAll('_', ' ')}
          />
        )}

        {intervalSummary ? (
          <DetailLine
            icon={<HeartPulse className="h-4 w-4" aria-hidden="true" />}
            label="Main set"
            value={intervalSummary}
          />
        ) : null}

        {strengthSessions.length ? (
          <DetailLine
            icon={<Dumbbell className="h-4 w-4" aria-hidden="true" />}
            label="Strength"
            value={strengthSessions
              .map((session) => `${session.shortTitle}: ${session.focus}`)
              .join(' - ')}
          />
        ) : null}

        <DetailLine
          icon={<Coffee className="h-4 w-4" aria-hidden="true" />}
          label={`Nutrition: ${dayPlan.mealPlan.carbFocus.replace('_', ' ')} carbs`}
          value={getNutritionSummaryForDay(dayPlan)}
        />

        {run?.fuelNotes?.[0] || fuelingNote ? (
          <DetailLine
            icon={<Coffee className="h-4 w-4" aria-hidden="true" />}
            label={fuelingRecommendation.category !== 'none' ? 'Maurten fuel' : 'Fuel'}
            value={fuelingRecommendation.category !== 'none' ? fuelingNote : (run?.fuelNotes?.[0] ?? fuelingNote)}
          />
        ) : null}

        {log ? (
          <DetailLine
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
            label="Saved log"
            value={getLogSummary(log)}
          />
        ) : null}
      </div>

      {events.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {events.map((event) => (
            <PlanWorkoutBadge
              key={event.id}
              label={event.title}
              tone={event.category === 'race' ? 'race' : 'warning'}
            />
          ))}
        </div>
      ) : null}

      {dayPlan.notes.length ? (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-500 dark:text-neutral-400">
          {dayPlan.notes.join(' ')}
        </p>
      ) : null}
    </button>
  )
}

function DetailLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2 rounded-[16px] border border-stone-100 bg-white p-3 dark:border-white/10 dark:bg-neutral-950/35">
      <span className="mt-0.5 shrink-0 text-stone-500 dark:text-neutral-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-950 dark:text-white">{label}</p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-stone-600 dark:text-neutral-400">
          {value || '-'}
        </p>
      </div>
    </div>
  )
}

function getLogSummary(log: WorkoutLogEntry) {
  const parts = [
    log.actualDistanceKm !== undefined ? `${log.actualDistanceKm} km` : undefined,
    log.actualPaceMinPerKm,
    log.averageHr !== undefined ? `Avg HR ${log.averageHr}` : undefined,
  ].filter(Boolean)

  return parts.length ? parts.join(' - ') : log.completionStatus
}

export default PlanDayCard
