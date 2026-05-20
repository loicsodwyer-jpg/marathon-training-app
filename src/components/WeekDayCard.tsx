import { CalendarCheck, CheckCircle2, ChevronDown, ChevronUp, Flame, Moon, Route, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useFuelingPreferences } from '../hooks/useFuelingPreferences'
import type { WeekViewDay } from '../types/weekView'
import { formatFuelingSummary } from '../utils/fuelingFormatUtils'
import { getFuelingRecommendationForDay } from '../utils/fuelingRules'
import { getNutritionSummaryForDay } from '../utils/nutritionUtils'
import { getStrengthSessionsByIds } from '../utils/strengthUtils'
import AdjustedPlanBadge from './AdjustedPlanBadge'
import StatusPill from './StatusPill'
import WeekBlockPill from './WeekBlockPill'

type WeekDayCardProps = {
  day: WeekViewDay
  isExpanded: boolean
  onOpenDay: (date: string) => void
  onToggleExpanded: () => void
}

function WeekDayCard({ day, isExpanded, onOpenDay, onToggleExpanded }: WeekDayCardProps) {
  const { preferences } = useFuelingPreferences()
  const run = day.dayPlan?.plannedRun
  const log = day.workoutLog
  const visibleSpecialEvents = day.specialEvents.filter(
    (event) => event.category !== 'recovery' && event.category !== 'birthday',
  )
  const isLoggedRun =
    log?.runCompleted && (log.completionStatus === 'completed' || log.completionStatus === 'partial')
  const strengthSessions = getStrengthSessionsByIds(day.dayPlan?.strengthSessionIds)
  const fuelingRecommendation = day.dayPlan
    ? getFuelingRecommendationForDay(day.dayPlan, preferences)
    : undefined
  const cardClassName = day.isSelected
    ? 'border-cyan-300/40 bg-cyan-50/70 dark:border-cyan-300/30 dark:bg-cyan-300/10'
    : day.isInsidePlan
      ? 'border-stone-200 bg-white dark:border-white/10 dark:bg-slate-900/85'
      : 'border-stone-200 bg-stone-50/70 dark:border-white/10 dark:bg-white/[0.04]'

  return (
    <article className={`rounded-[24px] border p-4 shadow-[0_18px_45px_rgba(49,55,70,0.06)] dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)] ${cardClassName}`}>
      <div className={`${isExpanded ? 'mb-4' : ''} flex items-start justify-between gap-3`}>
        <button
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          onClick={onToggleExpanded}
          type="button"
        >
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] text-sm font-semibold ${
            day.isToday
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200'
              : 'bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-slate-200'
          }`}>
            <span>{day.dayShort}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-stone-950 dark:text-white">
                {day.displayDate}
              </h2>
              {day.isToday ? <StatusPill tone="success">Today</StatusPill> : null}
              {day.isSelected ? <StatusPill tone="running">Selected</StatusPill> : null}
              {day.adjustment ? <AdjustedPlanBadge /> : null}
            </div>
            <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-400">
              {day.dayPlan?.title ?? 'Outside training plan'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill tone={run ? 'running' : 'neutral'}>
                {run ? `${run.plannedDistanceKm} km ${run.type.replaceAll('_', ' ')}` : 'No run'}
              </StatusPill>
              {strengthSessions.length ? (
                <StatusPill tone="strength">
                  {strengthSessions.map((session) => session.shortTitle).join(' + ')}
                </StatusPill>
              ) : null}
              {log ? <StatusPill tone={isLoggedRun ? 'success' : 'warning'}>Logged</StatusPill> : null}
            </div>
          </div>
        </button>
        <button
          aria-label={isExpanded ? `Collapse ${day.displayDate}` : `Expand ${day.displayDate}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
          onClick={onToggleExpanded}
          type="button"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {day.isInsidePlan && isExpanded ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <InfoLine
              icon={run ? Route : Moon}
              label={run ? `${run.plannedDistanceKm} km ${run.type.replaceAll('_', ' ')}` : 'No planned run'}
              value={run?.targetPace ? `${run.targetPace.minPerKmFrom}-${run.targetPace.minPerKmTo}/km` : day.dayPlan?.summary ?? 'Rest or recovery'}
              tone={run ? 'running' : 'neutral'}
            />
            <InfoLine
              icon={log ? CheckCircle2 : CalendarCheck}
              label={log ? 'Logged' : 'Not logged'}
              value={getLogSummary(day)}
              tone={isLoggedRun ? 'success' : log ? 'warning' : 'neutral'}
            />
            {day.dayPlan ? (
              <InfoLine
                icon={Utensils}
                label={`Nutrition: ${day.dayPlan.mealPlan.carbFocus.replace('_', ' ')} carbs`}
                value={getNutritionSummaryForDay(day.dayPlan)}
                tone="fuel"
              />
            ) : null}
            {fuelingRecommendation && fuelingRecommendation.category !== 'none' ? (
              <InfoLine
                icon={Flame}
                label="Maurten fuel"
                value={formatFuelingSummary(fuelingRecommendation)}
                tone="fuel"
              />
            ) : null}
          </div>

          {strengthSessions.length ? (
            <p className="rounded-[16px] border border-purple-100 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 dark:border-purple-300/20 dark:bg-purple-300/10 dark:text-purple-200">
              Strength planned: {strengthSessions.map((session) => session.shortTitle).join(' - ')}
            </p>
          ) : null}

          {visibleSpecialEvents.length ? (
            <div className="flex flex-wrap gap-2">
              {visibleSpecialEvents.map((event) => (
                <StatusPill key={event.id} tone={event.category === 'race' ? 'race' : 'warning'}>
                  {event.title}
                </StatusPill>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            {day.keyBlocks.length ? (
              day.keyBlocks.map((block) => (
                <WeekBlockPill block={block} key={block.id} onOpen={() => onOpenDay(day.date)} />
              ))
            ) : (
              <p className="rounded-[16px] border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
                No key blocks for this day.
              </p>
            )}
          </div>

          <button
            className="h-11 w-full rounded-[16px] border border-stone-200 bg-white text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
            onClick={() => onOpenDay(day.date)}
            type="button"
          >
            Open Today
          </button>
        </div>
      ) : !day.isInsidePlan && isExpanded ? (
        <p className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 text-sm leading-5 text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
          The Amsterdam marathon plan is not active on this date.
        </p>
      ) : null}
    </article>
  )
}

function InfoLine({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon
  label: string
  tone: 'running' | 'success' | 'warning' | 'neutral' | 'fuel'
  value: string
}) {
  const toneClassName = {
    running: 'text-cyan-700 dark:text-cyan-200',
    success: 'text-emerald-700 dark:text-emerald-200',
    warning: 'text-orange-700 dark:text-orange-200',
    neutral: 'text-stone-700 dark:text-slate-200',
    fuel: 'text-amber-700 dark:text-amber-200',
  }[tone]

  return (
    <div className="flex items-start gap-2 rounded-[16px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${toneClassName}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-stone-950 dark:text-white">{label}</p>
        <p className="mt-0.5 truncate text-sm text-stone-600 dark:text-slate-400">{value}</p>
      </div>
    </div>
  )
}

function getLogSummary(day: WeekViewDay) {
  const log = day.workoutLog

  if (!log) {
    return 'Open day after training to log it'
  }

  const parts = [
    log.actualDistanceKm !== undefined ? `${log.actualDistanceKm} km` : undefined,
    log.actualPaceMinPerKm,
    log.averageHr !== undefined ? `Avg HR ${log.averageHr}` : undefined,
  ].filter(Boolean)

  return parts.length ? parts.join(' - ') : log.completionStatus
}

export default WeekDayCard
