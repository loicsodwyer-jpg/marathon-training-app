import { CheckCircle2, Dumbbell, Play } from 'lucide-react'
import type { StrengthSession } from '../types/training'
import {
  getStrengthSessionAccent,
  getStrengthSessionSummary,
} from '../utils/strengthUtils'

type StrengthSessionButtonProps = {
  session: StrengthSession
  onOpen: (session: StrengthSession) => void
  onStart?: (session: StrengthSession) => void
  completed?: boolean
  compact?: boolean
}

function StrengthSessionButton({
  session,
  onOpen,
  onStart,
  completed = false,
  compact = false,
}: StrengthSessionButtonProps) {
  const accent = getStrengthSessionAccent(session)

  return (
    <article className="w-full rounded-[20px] border border-purple-100 bg-purple-50/70 p-3 text-left transition hover:-translate-y-0.5 hover:bg-purple-50 dark:border-purple-300/20 dark:bg-purple-300/10 dark:hover:bg-purple-300/15">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-white text-purple-700 ring-1 ring-purple-100 dark:bg-slate-950/45 dark:text-purple-200 dark:ring-purple-300/20">
          <Dumbbell className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-950 dark:text-white">
                {session.shortTitle}
              </p>
              <p className="mt-0.5 text-sm leading-5 text-stone-600 dark:text-slate-300">
                {session.title}
              </p>
            </div>
            {completed ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${accent.className}`}>
              {accent.label}
            </span>
            <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">
              {getStrengthSessionSummary(session)}
            </span>
          </div>

          {!compact ? (
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-stone-600 dark:text-slate-400">
              {session.focus}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {onStart ? (
          <button
            aria-label={`Start ${session.title}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-purple-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 dark:bg-purple-300 dark:text-slate-950 dark:hover:bg-purple-200"
            onClick={() => onStart(session)}
            type="button"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Start session
          </button>
        ) : null}
        <button
          aria-label={`Open ${session.title}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-50 dark:border-purple-300/25 dark:bg-white/[0.06] dark:text-purple-200 dark:hover:bg-purple-300/10"
          onClick={() => onOpen(session)}
          type="button"
        >
          <Dumbbell className="h-4 w-4" aria-hidden="true" />
          Open session
        </button>
      </div>
    </article>
  )
}

export default StrengthSessionButton
