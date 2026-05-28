import { CheckCircle2, RotateCcw, Save, X } from 'lucide-react'
import { useState } from 'react'
import type { LiveStrengthSessionResult, StrengthSessionFeeling } from '../types/liveStrength'
import { strengthFeelingLabels } from '../utils/liveStrengthUtils'
import StatusPill from './StatusPill'

type LiveStrengthSummaryProps = {
  result: LiveStrengthSessionResult
  onContinue: () => void
  onDiscard: () => void
  onSave: (result: LiveStrengthSessionResult) => void
}

const feelingOptions: StrengthSessionFeeling[] = ['very_good', 'good', 'okay', 'hard', 'bad']

function LiveStrengthSummary({
  result,
  onContinue,
  onDiscard,
  onSave,
}: LiveStrengthSummaryProps) {
  const [feeling, setFeeling] = useState<StrengthSessionFeeling>('good')
  const [notes, setNotes] = useState('')

  const finalResult: LiveStrengthSessionResult = {
    ...result,
    feeling,
    notes,
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-5 dark:border-emerald-300/20 dark:bg-emerald-300/10">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-white text-emerald-700 ring-1 ring-emerald-100 dark:bg-neutral-950/35 dark:text-emerald-200 dark:ring-emerald-300/20">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <StatusPill tone={result.completed ? 'success' : 'warning'}>
              {result.completed ? 'Completed' : 'Partial'}
            </StatusPill>
            <h3 className="mt-2 text-xl font-semibold text-stone-950 dark:text-white">
              Strength summary
            </h3>
            <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-300">
              {result.completionPercent}% complete - {result.completedExercises}/
              {result.totalExercises} exercises finished - {result.skippedExercises} skipped
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-[24px] border border-stone-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
        <h4 className="text-base font-semibold text-stone-950 dark:text-white">How did it feel?</h4>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {feelingOptions.map((option) => (
            <button
              className={`min-h-11 rounded-[18px] border px-3 py-2 text-sm font-semibold transition ${
                feeling === option
                  ? 'border-purple-400 bg-purple-600 text-white dark:border-purple-300 dark:bg-purple-400 dark:text-neutral-950'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]'
              }`}
              key={option}
              onClick={() => setFeeling(option)}
              type="button"
            >
              {strengthFeelingLabels[option]}
            </button>
          ))}
        </div>
      </section>

      <label className="block rounded-[24px] border border-stone-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
        <span className="text-base font-semibold text-stone-950 dark:text-white">Notes</span>
        <textarea
          className="mt-3 min-h-28 w-full resize-none rounded-[18px] border border-stone-200 bg-stone-50 px-3 py-3 text-sm leading-5 text-stone-900 outline-none transition focus:border-purple-300 focus:bg-white dark:border-white/10 dark:bg-neutral-950/45 dark:text-white dark:focus:border-purple-300/50"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anything to remember next time?"
          value={notes}
        />
      </label>

      <div className="grid gap-2">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-neutral-950 dark:hover:bg-cyan-200"
          onClick={() => onSave(finalResult)}
          type="button"
        >
          <Save className="h-5 w-5" aria-hidden="true" />
          Save session
        </button>
        {!result.completed ? (
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[20px] border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100 dark:hover:bg-white/[0.1]"
            onClick={onContinue}
            type="button"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
            Continue session
          </button>
        ) : null}
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-300/25 dark:bg-rose-300/10 dark:text-rose-200 dark:hover:bg-rose-300/15"
          onClick={onDiscard}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          Discard
        </button>
      </div>
    </div>
  )
}

export default LiveStrengthSummary
