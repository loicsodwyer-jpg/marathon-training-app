import { getExerciseVisualMeta } from '../utils/exerciseVisualUtils'
import ExerciseIllustration from './exerciseIllustrations/ExerciseIllustration'

type LiveStrengthExerciseVisualProps = {
  exerciseName: string
  visualType: string
}

function LiveStrengthExerciseVisual({
  exerciseName,
  visualType,
}: LiveStrengthExerciseVisualProps) {
  const meta = getExerciseVisualMeta(visualType)

  return (
    <div className={`overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${meta.accentClassName} bg-slate-950 p-4 text-white shadow-[0_26px_70px_rgba(0,0,0,0.28)]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
            Movement visual
          </p>
          <h3 className="mt-1 text-xl font-semibold">{meta.label}</h3>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
          {exerciseName}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="grid min-h-[190px] place-items-center rounded-[24px] border border-white/10 bg-white/[0.06] p-2 text-white">
          <ExerciseIllustration
            className="h-full max-h-[230px] w-full"
            title={exerciseName}
            variant={meta.type}
          />
        </div>
        <div className="space-y-2">
          {meta.cues.map((cue) => (
            <div
              className="rounded-[18px] border border-white/10 bg-white/[0.07] px-3 py-2 text-sm font-semibold text-white/85"
              key={cue}
            >
              {cue}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LiveStrengthExerciseVisual
