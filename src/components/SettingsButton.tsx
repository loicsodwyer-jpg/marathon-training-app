import { Settings } from 'lucide-react'

type SettingsButtonProps = {
  onClick: () => void
}

function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      aria-label="Open settings"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-white/80 text-stone-700 shadow-sm transition hover:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
      onClick={onClick}
      type="button"
    >
      <Settings className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}

export default SettingsButton
