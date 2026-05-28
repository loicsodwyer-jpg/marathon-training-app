import { Play, X } from 'lucide-react'
import type { StrengthSession } from '../types/training'
import StrengthSessionDetail from './StrengthSessionDetail'

type StrengthSessionModalProps = {
  open: boolean
  session: StrengthSession | undefined
  onClose: () => void
  onStartSession?: (session: StrengthSession) => void
}

function StrengthSessionModal({
  open,
  session,
  onClose,
  onStartSession,
}: StrengthSessionModalProps) {
  if (!open || !session) {
    return null
  }

  return (
    <div
      aria-label="Strength session details"
      aria-modal="true"
      className="modal-overlay z-[100] items-end justify-center bg-slate-950/70 px-3 backdrop-blur-sm sm:items-center"
      role="dialog"
    >
      <div className="modal-panel w-full max-w-[480px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:bg-neutral-900">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
              Strength session
            </p>
            <h2 className="truncate text-base font-semibold text-stone-950 dark:text-white">
              {session.shortTitle}
            </h2>
          </div>
          <button
            aria-label="Close strength session"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-scroll p-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
          {onStartSession ? (
            <button
              aria-label={`Start ${session.title}`}
              className="mb-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 dark:bg-purple-300 dark:text-neutral-950 dark:hover:bg-purple-200"
              onClick={() => onStartSession(session)}
              type="button"
            >
              <Play className="h-5 w-5" aria-hidden="true" />
              Start session
            </button>
          ) : null}
          <StrengthSessionDetail session={session} />
        </div>
      </div>
    </div>
  )
}

export default StrengthSessionModal
