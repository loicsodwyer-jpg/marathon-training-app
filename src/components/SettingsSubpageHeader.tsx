import { ChevronLeft, X } from 'lucide-react'

type SettingsSubpageHeaderProps = {
  onBack: () => void
  onClose: () => void
  subtitle?: string
  title: string
}

function SettingsSubpageHeader({
  onBack,
  onClose,
  subtitle,
  title,
}: SettingsSubpageHeaderProps) {
  return (
    <header className="safe-top sticky top-0 z-10 border-b border-stone-200/70 bg-[#f4f1eb]/95 px-4 pb-3 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95">
      <div className="flex items-center justify-between gap-3">
        <button
          aria-label="Back to Settings"
          className="inline-flex h-10 items-center gap-1 rounded-full border border-stone-200 bg-white/80 px-3 text-sm font-semibold text-stone-700 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.07] dark:text-neutral-200 dark:hover:bg-white/[0.12]"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          aria-label="Close settings"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone-200 bg-white/80 text-stone-700 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.07] dark:text-neutral-200 dark:hover:bg-white/[0.12]"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3">
        <h1 className="text-2xl font-semibold tracking-normal text-stone-950 dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">{subtitle}</p>
        ) : null}
      </div>
    </header>
  )
}

export default SettingsSubpageHeader
