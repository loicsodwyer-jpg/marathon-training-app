import OfflineStatusBadge from './OfflineStatusBadge'
import SettingsButton from './SettingsButton'

type TopBarProps = {
  onOpenSettings: () => void
}

function TopBar({ onOpenSettings }: TopBarProps) {
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-stone-200/70 bg-[#f4f1eb]/92 px-4 pb-3 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/90">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-stone-950 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(23,32,51,0.18)] ring-1 ring-white/10 dark:bg-gradient-to-br dark:from-cyan-300 dark:to-blue-600 dark:text-neutral-950 dark:shadow-[0_16px_40px_rgba(34,211,238,0.2)]">
            2:55
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-6 text-stone-950 dark:text-white">
              Loïc Marathon 2:55
            </p>
            <p className="truncate text-sm leading-5 text-stone-500 dark:text-neutral-400">
              Amsterdam Marathon build
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden flex-col items-end gap-1 min-[380px]:flex">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-200">
              PWA v1
            </span>
            <OfflineStatusBadge />
          </div>
          <SettingsButton onClick={onOpenSettings} />
        </div>
      </div>
    </header>
  )
}

export default TopBar
