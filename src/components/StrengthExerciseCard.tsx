import { Info, Repeat, Timer } from 'lucide-react'
import type { ReactNode } from 'react'
import type { StrengthExercise } from '../types/training'
import { getExerciseVisualType } from '../utils/exerciseVisualUtils'
import ExerciseIllustration from './exerciseIllustrations/ExerciseIllustration'

type StrengthExerciseCardProps = {
  exercise: StrengthExercise
}

function StrengthExerciseCard({ exercise }: StrengthExerciseCardProps) {
  const visualType = getExerciseVisualType(exercise.name)

  return (
    <article className="rounded-[18px] border border-stone-100 bg-white p-3 dark:border-white/10 dark:bg-slate-950/45">
      <div className="flex items-start gap-3">
        <div className="grid h-24 w-28 shrink-0 place-items-center rounded-[16px] border border-purple-100 bg-slate-950 p-1 text-white dark:border-purple-300/20">
          <ExerciseIllustration
            className="h-full w-full"
            title={exercise.name}
            variant={visualType}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-stone-950 dark:text-white">{exercise.name}</h4>
              {exercise.intensity ? (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
                  {exercise.intensity}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ExerciseMetric icon={<Repeat className="h-3.5 w-3.5" />} label="Sets" value={exercise.sets} />
        <ExerciseMetric icon={<Repeat className="h-3.5 w-3.5" />} label="Reps" value={exercise.reps} />
        <ExerciseMetric icon={<Timer className="h-3.5 w-3.5" />} label="Rest" value={exercise.rest} />
      </div>

      {exercise.notes ? (
        <div className="mt-3 flex gap-2 rounded-[14px] border border-stone-100 bg-stone-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-500 dark:text-slate-400" aria-hidden="true" />
          <p className="text-xs leading-5 text-stone-600 dark:text-slate-300">{exercise.notes}</p>
        </div>
      ) : null}
    </article>
  )
}

function ExerciseMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-stone-100 bg-stone-50 px-2 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-1 text-stone-500 dark:text-slate-400">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <p className="mt-1 break-words text-xs font-semibold leading-4 text-stone-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  )
}

export default StrengthExerciseCard
