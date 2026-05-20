import { Dumbbell, Flag, Moon, Watch } from 'lucide-react'
import type { DayPlan, SpecialEvent } from '../types/training'
import { getStrengthSessionsByIds } from '../utils/strengthUtils'
import ActivityCard from './ActivityCard'
import StatusPill from './StatusPill'

type PlannedSessionSummaryProps = {
  dayPlan: DayPlan | undefined
  events: SpecialEvent[]
}

function PlannedSessionSummary({ dayPlan, events }: PlannedSessionSummaryProps) {
  if (!dayPlan) {
    return (
      <ActivityCard icon={Moon} pill="No plan" title="Planned session" tone="neutral">
        <p className="text-sm leading-6 text-stone-600 dark:text-slate-300">
          There is no marathon plan entry for this date.
        </p>
      </ActivityCard>
    )
  }

  const plannedRun = dayPlan.plannedRun
  const strengthSessions = getStrengthSessionsByIds(dayPlan.strengthSessionIds)

  return (
    <ActivityCard
      icon={plannedRun?.type === 'race' ? Flag : plannedRun ? Watch : Moon}
      pill={dayPlan.intensity}
      subtitle={`${dayPlan.phase} phase`}
      title="Planned session"
      tone={plannedRun?.type === 'race' ? 'race' : plannedRun ? 'running' : 'neutral'}
    >
      <div>
        <h2 className="text-lg font-semibold text-stone-950 dark:text-white">{dayPlan.title}</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-slate-300">
          {dayPlan.summary}
        </p>
      </div>

      {plannedRun ? (
        <div className="mt-4 rounded-[20px] border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-300/20 dark:bg-cyan-300/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-950 dark:text-white">
                {plannedRun.title}
              </p>
              <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-300">
                {plannedRun.plannedDistanceKm} km - {plannedRun.startTime ?? 'Flexible'}
              </p>
            </div>
            <StatusPill tone="running">{plannedRun.type.replaceAll('_', ' ')}</StatusPill>
          </div>
          {plannedRun.targetPace ? (
            <p className="mt-2 text-sm leading-5 text-stone-600 dark:text-slate-300">
              Pace {plannedRun.targetPace.minPerKmFrom}-{plannedRun.targetPace.minPerKmTo}/km -{' '}
              {plannedRun.targetHrDescription ?? plannedRun.targetHrZone}
            </p>
          ) : null}
          {plannedRun.intervals?.length ? (
            <div className="mt-2 space-y-1">
              {plannedRun.intervals.map((interval) => (
                <p
                  className="text-xs leading-5 text-stone-500 dark:text-slate-400"
                  key={`${interval.label}-${interval.repetitions}-${interval.distanceKm ?? interval.durationMinutes}`}
                >
                  {interval.repetitions} x{' '}
                  {interval.distanceKm ? `${interval.distanceKm} km` : `${interval.durationMinutes} min`}{' '}
                  {interval.label}
                </p>
              ))}
            </div>
          ) : null}
          {plannedRun.fuelNotes?.length ? (
            <p className="mt-2 text-xs leading-5 text-cyan-700 dark:text-cyan-200">
              Fuel: {plannedRun.fuelNotes[0]}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
          <p className="text-sm font-semibold text-stone-950 dark:text-white">
            Rest, recovery, or social day
          </p>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-300">
            No planned run for this date.
          </p>
        </div>
      )}

      {strengthSessions.length ? (
        <div className="mt-4 rounded-[20px] border border-purple-100 bg-purple-50/70 p-3 dark:border-purple-300/20 dark:bg-purple-300/10">
          <div className="mb-2 flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-purple-700 dark:text-purple-200" aria-hidden="true" />
            <p className="text-sm font-semibold text-stone-950 dark:text-white">Strength</p>
          </div>
          {strengthSessions.map((session) => (
            <div
              className="mt-2 rounded-[16px] border border-white/70 bg-white/75 p-3 dark:border-white/10 dark:bg-slate-950/35"
              key={session.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-950 dark:text-white">
                    {session.shortTitle}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-300">
                    {session.focus}
                  </p>
                </div>
                <StatusPill tone="strength">{session.estimatedDurationMinutes} min</StatusPill>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {events.length ? (
        <div className="mt-4 space-y-2">
          {events.map((event) => (
            <div className="rounded-[18px] border border-rose-100 bg-rose-50/70 p-3 dark:border-rose-300/20 dark:bg-rose-300/10" key={event.id}>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                {event.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-rose-700/80 dark:text-rose-100/80">
                {event.trainingImpact}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </ActivityCard>
  )
}

export default PlannedSessionSummary
