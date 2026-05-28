import { CheckCircle2, Dumbbell, Play } from 'lucide-react'
import type { StrengthSession } from '../types/training'
import { getStrengthSessionSummary } from '../utils/strengthUtils'
import ActivityCard from './ActivityCard'
import StatusPill from './StatusPill'

type StrengthDetailCardProps = {
  sessions: StrengthSession[]
  isCompleted?: boolean
  onOpenSession?: (session: StrengthSession) => void
  onStartSession?: (session: StrengthSession) => void
}

function StrengthDetailCard({
  sessions,
  isCompleted = false,
  onOpenSession,
  onStartSession,
}: StrengthDetailCardProps) {
  if (!sessions.length) {
    return (
      <ActivityCard
        icon={Dumbbell}
        pill="None"
        subtitle="No gym session planned"
        title="Strength"
        tone="neutral"
      >
        <p className="text-sm leading-6 text-stone-600 dark:text-neutral-300">
          Keep the day focused on the planned run, recovery, or social context.
        </p>
      </ActivityCard>
    )
  }

  return (
    <ActivityCard
      icon={Dumbbell}
      pill={isCompleted ? 'Completed' : `${sessions.length} planned`}
      subtitle="Strength and resilience work"
      title="Strength"
      tone={isCompleted ? 'success' : 'strength'}
    >
      <div className="space-y-4">
        {sessions.map((session) => (
          <div className="rounded-[20px] border border-purple-100 bg-purple-50/70 p-3 dark:border-purple-300/20 dark:bg-purple-300/10" key={session.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
                  {session.shortTitle}
                </p>
                <h3 className="text-sm font-semibold text-stone-950 dark:text-white">
                  {session.title}
                </h3>
                <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-300">
                  {session.focus}
                </p>
              </div>
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
              ) : (
                <StatusPill tone="strength">{session.startTime ?? 'Flexible'}</StatusPill>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill tone="strength">{session.startTime ?? 'Flexible'}</StatusPill>
              <StatusPill tone="neutral">{getStrengthSessionSummary(session)}</StatusPill>
              {isCompleted ? <StatusPill tone="success">Done</StatusPill> : null}
            </div>

            <div className="mt-3 rounded-[16px] border border-white/70 bg-white/75 p-3 dark:border-white/10 dark:bg-neutral-950/35">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
                Key exercises
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {session.exercises.slice(0, 4).map((exercise) => (
                  <span
                    className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200"
                    key={`${session.id}-${exercise.name}`}
                  >
                    {exercise.name}
                  </span>
                ))}
              </div>
              {session.exercises.length > 4 ? (
                <p className="mt-2 text-xs leading-5 text-stone-500 dark:text-neutral-400">
                  Plus {session.exercises.length - 4} more in the full session.
                </p>
              ) : null}
            </div>

            {onOpenSession || onStartSession ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {onStartSession ? (
                  <button
                    aria-label={`Start ${session.title}`}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-purple-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 dark:bg-purple-300 dark:text-neutral-950 dark:hover:bg-purple-200"
                    onClick={() => onStartSession(session)}
                    type="button"
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Start session
                  </button>
                ) : null}
                {onOpenSession ? (
                  <button
                    aria-label={`Open ${session.title}`}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 dark:border-purple-300/25 dark:bg-white/[0.06] dark:text-purple-200 dark:hover:bg-purple-300/10"
                    onClick={() => onOpenSession(session)}
                    type="button"
                  >
                    <Dumbbell className="h-4 w-4" aria-hidden="true" />
                    Open session
                  </button>
                ) : null}
              </div>
            ) : null}

            {session.progressionNotes?.length ? (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
                  Progression
                </p>
                <ul className="mt-2 space-y-1">
                  {session.progressionNotes.slice(0, 2).map((note) => (
                    <li className="text-xs leading-5 text-stone-600 dark:text-neutral-300" key={note}>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ActivityCard>
  )
}

export default StrengthDetailCard
