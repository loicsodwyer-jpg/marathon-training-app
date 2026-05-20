import { CheckCircle2, Circle, SkipForward } from 'lucide-react'
import type { LiveStrengthExerciseStep } from '../types/liveStrength'
import { liveStrengthSectionLabels } from '../utils/liveStrengthUtils'

type ExerciseStepCardProps = {
  step: LiveStrengthExerciseStep
  active?: boolean
}

function ExerciseStepCard({ step, active = false }: ExerciseStepCardProps) {
  const statusIcon =
    step.status === 'completed' ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
    ) : step.status === 'skipped' ? (
      <SkipForward className="h-4 w-4 text-orange-600 dark:text-orange-300" aria-hidden="true" />
    ) : (
      <Circle className="h-4 w-4 text-stone-400 dark:text-slate-500" aria-hidden="true" />
    )

  return (
    <div
      className={`rounded-[18px] border p-3 ${
        active
          ? 'border-purple-200 bg-purple-50 dark:border-purple-300/30 dark:bg-purple-300/10'
          : 'border-stone-100 bg-white dark:border-white/10 dark:bg-white/[0.05]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{statusIcon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-stone-950 dark:text-white">
              {step.exerciseName}
            </p>
            <span className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-semibold text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
              {liveStrengthSectionLabels[step.section]}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-slate-400">
            {step.completedSets}/{step.sets} sets - {step.reps}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExerciseStepCard
