import { Flag, HeartPulse, Moon, Route, Timer, Watch } from 'lucide-react'
import type { DayPlan, RunType } from '../types/training'
import type { FuelingRecommendation } from '../types/fueling'
import ActivityCard from './ActivityCard'
import FuelingRecommendationCard from './FuelingRecommendationCard'
import StatusPill, { type StatusTone } from './StatusPill'

type WorkoutDetailCardProps = {
  dayPlan: DayPlan
  fuelingRecommendation?: FuelingRecommendation
}

const hardRunTypes: RunType[] = ['threshold', 'interval', 'marathon_pace', 'progression']

function formatRunType(runType: RunType) {
  return runType.replaceAll('_', ' ')
}

function getRunTone(runType: RunType): StatusTone {
  if (runType === 'race') {
    return 'race'
  }

  if (hardRunTypes.includes(runType)) {
    return 'warning'
  }

  return runType === 'recovery' ? 'success' : 'running'
}

function WorkoutDetailCard({ dayPlan, fuelingRecommendation }: WorkoutDetailCardProps) {
  const run = dayPlan.plannedRun

  if (!run) {
    return (
      <ActivityCard
        icon={Moon}
        pill={dayPlan.dayType}
        subtitle="No run scheduled"
        title="Run"
        tone="neutral"
      >
        <p className="text-sm leading-6 text-stone-600 dark:text-neutral-300">
          {dayPlan.summary}
        </p>
      </ActivityCard>
    )
  }

  const tone = getRunTone(run.type)

  return (
    <ActivityCard
      icon={run.type === 'race' ? Flag : Watch}
      pill={formatRunType(run.type)}
      subtitle={run.startTime ? `Starts ${run.startTime}` : undefined}
      title={run.title}
      tone={tone}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
          <Route className="mb-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
          <p className="text-lg font-semibold text-stone-950 dark:text-white">
            {run.plannedDistanceKm} km
          </p>
          <p className="text-xs text-stone-500 dark:text-neutral-400">Planned distance</p>
        </div>
        <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
          <Timer className="mb-2 h-4 w-4 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
          <p className="text-lg font-semibold text-stone-950 dark:text-white">
            {run.estimatedDurationMinutes ?? '-'} min
          </p>
          <p className="text-xs text-stone-500 dark:text-neutral-400">Estimated time</p>
        </div>
      </div>

      <div className="mt-3 space-y-2 rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-rose-600 dark:text-rose-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-stone-950 dark:text-white">
            {run.targetHrDescription ?? run.targetHrZone}
          </p>
        </div>
        {run.targetPace ? (
          <p className="text-sm leading-5 text-stone-600 dark:text-neutral-300">
            Pace {run.targetPace.minPerKmFrom}-{run.targetPace.minPerKmTo}/km -{' '}
            {run.targetPace.description}
          </p>
        ) : null}
      </div>

      {run.intervals?.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-stone-950 dark:text-white">Intervals</h3>
          <div className="mt-2 space-y-2">
            {run.intervals.map((interval) => (
              <div
                className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]"
                key={`${interval.label}-${interval.repetitions}-${interval.distanceKm ?? interval.durationMinutes}`}
              >
                <p className="text-sm font-semibold text-stone-900 dark:text-neutral-100">
                  {interval.repetitions} x {interval.label}
                </p>
                <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
                  {interval.distanceKm ? `${interval.distanceKm} km` : null}
                  {interval.durationMinutes ? `${interval.durationMinutes} min` : null}
                  {interval.targetPace
                    ? ` at ${interval.targetPace.minPerKmFrom}-${interval.targetPace.minPerKmTo}/km`
                    : null}
                </p>
                {interval.recoveryInstruction ? (
                  <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-neutral-500">
                    {interval.recoveryInstruction}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {fuelingRecommendation ? (
          <FuelingRecommendationCard compact recommendation={fuelingRecommendation} />
        ) : null}
        <NoteList title="Instructions" items={run.instructions} tone={tone} />
        <NoteList title="Fuel" items={run.fuelNotes ?? []} tone="running" />
        <NoteList title="Recovery" items={run.recoveryNotes ?? []} tone="success" />
      </div>
    </ActivityCard>
  )
}

function NoteList({ title, items, tone }: { title: string; items: string[]; tone: StatusTone }) {
  if (!items.length) {
    return null
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <StatusPill tone={tone}>{title}</StatusPill>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li className="text-sm leading-5 text-stone-600 dark:text-neutral-300" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default WorkoutDetailCard
