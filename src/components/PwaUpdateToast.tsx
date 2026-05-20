import { CheckCircle2, RefreshCw, X } from 'lucide-react'

type PwaUpdateToastProps = {
  needRefresh: boolean
  offlineReady: boolean
  onClose: () => void
  onRefresh: () => void
}

function PwaUpdateToast({ needRefresh, offlineReady, onClose, onRefresh }: PwaUpdateToastProps) {
  if (!needRefresh && !offlineReady) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-full max-w-[480px] px-4">
      <div className="rounded-[22px] border border-white/10 bg-slate-950/95 p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.4)] backdrop-blur dark:bg-slate-900/95">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200">
            {needRefresh ? (
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {needRefresh ? 'Update available' : 'Offline support ready'}
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-300">
              {needRefresh
                ? 'A fresh version of Loïc Marathon 2:55 is ready.'
                : 'The app shell is cached and can reopen offline after this load.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {needRefresh ? (
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                  onClick={onRefresh}
                  type="button"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Refresh
                </button>
              ) : null}
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.1]"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PwaUpdateToast
