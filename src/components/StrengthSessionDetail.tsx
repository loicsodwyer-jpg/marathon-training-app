import { Activity, Dumbbell, ShieldCheck, Timer } from 'lucide-react'
import type { ReactNode } from 'react'
import type { StrengthSession } from '../types/training'
import { getStrengthSessionAccent, groupStrengthExercises } from '../utils/strengthUtils'
import StatusPill from './StatusPill'
import StrengthExerciseCard from './StrengthExerciseCard'
import StrengthProgressionCard from './StrengthProgressionCard'

type StrengthSessionDetailProps = {
  session: StrengthSession
}

function StrengthSessionDetail({ session }: StrengthSessionDetailProps) {
  const accent = getStrengthSessionAccent(session)
  const exerciseGroups = groupStrengthExercises(session)
  const hasWarmupExerciseGroup = exerciseGroups.some((group) => group.id === 'warmup')

  return (
    <div className="space-y-5">
      <header className="rounded-[24px] border border-purple-100 bg-purple-50/70 p-4 dark:border-purple-300/20 dark:bg-purple-300/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
              {session.shortTitle}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-stone-950 dark:text-white">
              {session.title}
            </h2>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${accent.className}`}>
            {accent.label}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-neutral-300">{session.focus}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <HeaderMetric
            icon={<Timer className="h-4 w-4" aria-hidden="true" />}
            label="Duration"
            value={`${session.estimatedDurationMinutes} min`}
          />
          <HeaderMetric
            icon={<Dumbbell className="h-4 w-4" aria-hidden="true" />}
            label="Exercises"
            value={`${session.exercises.length}`}
          />
        </div>
      </header>

      {session.warmup?.length && !hasWarmupExerciseGroup ? (
        <DetailList
          icon={<Activity className="h-4 w-4" aria-hidden="true" />}
          items={session.warmup}
          title="Warm-up"
        />
      ) : null}

      {exerciseGroups.map((group) => (
        <section className="space-y-3" key={group.id}>
          <div>
            <h3 className="text-base font-semibold text-stone-950 dark:text-white">{group.title}</h3>
            <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
              {group.description}
            </p>
          </div>
          <div className="space-y-2">
            {group.exercises.map((exercise) => (
              <StrengthExerciseCard exercise={exercise} key={`${session.id}-${exercise.name}`} />
            ))}
          </div>
        </section>
      ))}

      {session.cooldown?.length ? (
        <DetailList
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          items={session.cooldown}
          title="Cooldown"
        />
      ) : null}

      <StrengthProgressionCard notes={session.progressionNotes ?? []} />
    </div>
  )
}

function HeaderMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-[18px] border border-white/70 bg-white/80 p-3 dark:border-white/10 dark:bg-neutral-950/35">
      <div className="flex items-center gap-2 text-stone-500 dark:text-neutral-400">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-white">{value}</p>
    </div>
  )
}

function DetailList({
  icon,
  items,
  title,
}: {
  icon: ReactNode
  items: string[]
  title: string
}) {
  return (
    <section className="rounded-[20px] border border-stone-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-purple-700 dark:text-purple-200">{icon}</span>
          <h3 className="text-base font-semibold text-stone-950 dark:text-white">{title}</h3>
        </div>
        <StatusPill tone="strength">{items.length}</StatusPill>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li className="text-sm leading-5 text-stone-600 dark:text-neutral-300" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default StrengthSessionDetail
