import { Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import PageCard from '../../components/PageCard'
import StatusPill from '../../components/StatusPill'
import type { Theme } from '../../hooks/useTheme'

type AppearanceSettingsPageProps = {
  onThemeChange: (theme: Theme) => void
  theme: Theme
}

function AppearanceSettingsPage({ onThemeChange, theme }: AppearanceSettingsPageProps) {
  return (
    <div className="space-y-4">
      <PageCard className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-950 dark:text-white">Theme</h2>
            <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
              Dark mode is the default for this app, with light mode available for bright rooms.
            </p>
          </div>
          <StatusPill tone={theme === 'dark' ? 'running' : 'neutral'}>{theme}</StatusPill>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-[20px] border border-stone-100 bg-stone-50 p-2 dark:border-white/10 dark:bg-neutral-950/50">
          <ThemeButton
            icon={<Moon className="h-4 w-4" aria-hidden="true" />}
            isActive={theme === 'dark'}
            label="Dark"
            onClick={() => onThemeChange('dark')}
          />
          <ThemeButton
            icon={<Sun className="h-4 w-4" aria-hidden="true" />}
            isActive={theme === 'light'}
            label="Light"
            onClick={() => onThemeChange('light')}
          />
        </div>
      </PageCard>

      <PageCard>
        <p className="text-sm leading-6 text-stone-600 dark:text-neutral-300">
          The theme preference is stored locally on this device. Clearing all local app data resets
          the app to the dark default.
        </p>
      </PageCard>
    </div>
  )
}

function ThemeButton({
  icon,
  isActive,
  label,
  onClick,
}: {
  icon: ReactNode
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={isActive}
      className={`flex h-11 items-center justify-center gap-2 rounded-[16px] text-sm font-semibold transition ${
        isActive
          ? 'bg-white text-stone-950 shadow-sm dark:bg-cyan-300 dark:text-neutral-950'
          : 'text-stone-500 hover:bg-white/70 hover:text-stone-900 dark:text-neutral-400 dark:hover:bg-white/[0.08] dark:hover:text-white'
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}

export default AppearanceSettingsPage
