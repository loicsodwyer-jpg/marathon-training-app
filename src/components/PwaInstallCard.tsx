import {
  CheckCircle2,
  Download,
  Info,
  Share,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { usePwaInstallPrompt } from '../hooks/usePwaInstallPrompt'
import PageCard from './PageCard'
import StatusPill from './StatusPill'

function PwaInstallCard() {
  const isOnline = useOnlineStatus()
  const { canInstall, isIos, isStandalone, lastOutcome, promptInstall } = usePwaInstallPrompt()
  const hasServiceWorkerSupport =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator

  return (
    <PageCard className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-200">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-stone-950 dark:text-white">Install app</h2>
          </div>
          <p className="mt-2 text-sm leading-5 text-stone-600 dark:text-neutral-400">
            Add Loïc Marathon 2:55 to your Home Screen for an app-like experience.
          </p>
        </div>
        <StatusPill tone={isStandalone ? 'success' : 'neutral'}>
          {isStandalone ? 'Installed' : 'Not installed'}
        </StatusPill>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <PwaStatusItem
          icon={isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          label={isOnline ? 'Online' : 'Offline'}
          tone={isOnline ? 'success' : 'warning'}
        />
        <PwaStatusItem
          icon={<CheckCircle2 className="h-4 w-4" />}
          label={hasServiceWorkerSupport ? 'Offline support' : 'Limited browser'}
          tone={hasServiceWorkerSupport ? 'running' : 'warning'}
        />
        <PwaStatusItem
          icon={<Download className="h-4 w-4" />}
          label={canInstall ? 'Install ready' : isIos ? 'iPhone steps' : 'Browser managed'}
          tone={canInstall ? 'running' : 'neutral'}
        />
      </div>

      {isStandalone ? (
        <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/10">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">
            Installed mode detected.
          </p>
          <p className="mt-1 text-sm leading-5 text-emerald-800/75 dark:text-emerald-100/75">
            Open the app from your Home Screen or app launcher for the cleanest standalone view.
          </p>
        </div>
      ) : canInstall ? (
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-neutral-950 dark:hover:bg-cyan-200"
          onClick={() => {
            void promptInstall()
          }}
          type="button"
        >
          <Download className="h-5 w-5" aria-hidden="true" />
          Install app
        </button>
      ) : (
        <div className="rounded-[20px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
          <div className="flex items-center gap-2 text-stone-900 dark:text-white">
            <Share className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm font-semibold">
              {isIos ? 'Install on iPhone' : 'Install from your browser menu'}
            </p>
          </div>
          <ol className="mt-3 space-y-2 text-sm leading-5 text-stone-600 dark:text-neutral-400">
            {isIos ? (
              <>
                <li>1. Open this app in Safari.</li>
                <li>2. Tap Share.</li>
                <li>3. Choose Add to Home Screen.</li>
                <li>4. Open it from the new Home Screen icon.</li>
              </>
            ) : (
              <>
                <li>1. Open the browser app menu.</li>
                <li>2. Choose Install app or Add to Home Screen if shown.</li>
                <li>3. Reopen from the installed app icon.</li>
              </>
            )}
          </ol>
        </div>
      )}

      {lastOutcome === 'dismissed' ? (
        <p className="rounded-[18px] border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-400">
          Install was dismissed. You can try again later if your browser shows the prompt.
        </p>
      ) : null}

      <div className="flex items-start gap-2 rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-neutral-950/35">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-500 dark:text-neutral-400" aria-hidden="true" />
        <p className="text-sm leading-5 text-stone-600 dark:text-neutral-400">
          Logs, calendar edits, backups, and adjusted plans are stored locally on this
          device/browser. Export a backup before clearing browser data or changing devices.
        </p>
      </div>
    </PageCard>
  )
}

function PwaStatusItem({
  icon,
  label,
  tone,
}: {
  icon: ReactNode
  label: string
  tone: 'running' | 'success' | 'warning' | 'neutral'
}) {
  return (
    <div className="flex items-center gap-2 rounded-[18px] border border-stone-100 bg-stone-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.05]">
      <span className="text-stone-600 dark:text-neutral-300">{icon}</span>
      <StatusPill tone={tone}>{label}</StatusPill>
    </div>
  )
}

export default PwaInstallCard
