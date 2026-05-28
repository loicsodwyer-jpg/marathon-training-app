import {
  Activity,
  Apple,
  Bell,
  CalendarCheck2,
  Cloud,
  Dumbbell,
  Info,
  Moon,
  PlugZap,
  Smartphone,
  X,
} from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import type { SettingsPageId } from '../types/settings'
import { getLocalDataSummary } from '../utils/backupUtils'
import SettingsRow from './SettingsRow'
import SettingsSection from './SettingsSection'

type SettingsHomeProps = {
  onClose: () => void
  onSelectPage: (page: SettingsPageId) => void
  theme: Theme
}

function SettingsHome({ onClose, onSelectPage, theme }: SettingsHomeProps) {
  const summary = getLocalDataSummary()
  const dataBadge =
    summary.workoutLogCount || summary.adjustedDayCount
      ? `${summary.workoutLogCount} logs`
      : 'Local'

  return (
    <>
      <header className="safe-top sticky top-0 z-10 border-b border-stone-200/70 bg-[#f4f1eb]/95 px-4 pb-3 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-600 dark:text-neutral-400">
              Loïc Marathon 2:55
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-stone-950 dark:text-white">
              Settings
            </h1>
          </div>
          <button
            aria-label="Close settings"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-white/80 text-stone-700 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.07] dark:text-neutral-200 dark:hover:bg-white/[0.12]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="space-y-5 px-4 py-5 pb-[calc(32px+env(safe-area-inset-bottom))]">
        <SettingsSection title="Personalization">
          <SettingsRow
            badge={theme}
            icon={Moon}
            iconClassName="bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-neutral-200"
            onSelect={onSelectPage}
            page="appearance"
            subtitle="Dark/light mode and app look"
            title="Appearance"
          />
        </SettingsSection>

        <SettingsSection title="App and data">
          <SettingsRow
            badge="Offline ready"
            icon={Smartphone}
            iconClassName="bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-neutral-200"
            onSelect={onSelectPage}
            page="install"
            subtitle="Home Screen app and offline support"
            title="Install app and offline"
          />
          <SettingsRow
            badge={dataBadge}
            icon={Cloud}
            iconClassName="bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200"
            onSelect={onSelectPage}
            page="data"
            subtitle="Backup, import, export, and clear local data"
            title="Data management"
          />
          <SettingsRow
            badge=".ics"
            icon={CalendarCheck2}
            iconClassName="bg-sky-50 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200"
            onSelect={onSelectPage}
            page="calendar"
            subtitle="Export training events to Apple Calendar, Google Calendar, or Outlook"
            title="Calendar export"
          />
          <SettingsRow
            badge="Preview"
            icon={Bell}
            iconClassName="bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-neutral-200"
            onSelect={onSelectPage}
            page="notifications"
            subtitle="Run, strength, snack, meal and fuelling reminders"
            title="Notifications"
          />
        </SettingsSection>

        <SettingsSection title="Training libraries">
          <SettingsRow
            badge="Gym A/B/C"
            icon={Dumbbell}
            iconClassName="bg-purple-50 text-purple-700 dark:bg-purple-300/10 dark:text-purple-200"
            onSelect={onSelectPage}
            page="strength"
            subtitle="Gym A, Gym B, and Mini C details"
            title="Strength library"
          />
          <SettingsRow
            badge="Fuel"
            icon={Apple}
            iconClassName="bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200"
            onSelect={onSelectPage}
            page="nutrition"
            subtitle="Meal templates and fuelling guidance"
            title="Nutrition library"
          />
        </SettingsSection>

        <SettingsSection title="Future integrations">
          <SettingsRow
            badge="Local"
            icon={PlugZap}
            iconClassName="bg-orange-50 text-orange-700 dark:bg-orange-300/10 dark:text-orange-200"
            onSelect={onSelectPage}
            page="integrations"
            subtitle="Strava, Garmin, Apple Health, and API ideas"
            title="Integrations"
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow
            badge="Private"
            icon={Info}
            iconClassName="bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-neutral-200"
            onSelect={onSelectPage}
            page="about"
            subtitle="Version, storage, privacy, and roadmap"
            title="About app"
          />
        </SettingsSection>

        <div className="rounded-[22px] border border-stone-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center gap-2 text-stone-700 dark:text-neutral-300">
            <Activity className="h-4 w-4" aria-hidden="true" />
            <p className="text-sm font-semibold">Local-first training cockpit</p>
          </div>
          <p className="mt-2 text-sm leading-5 text-stone-500 dark:text-neutral-400">
            Logs, calendar edits, backups, and adjusted plans stay on this browser unless you
            export or copy them yourself.
          </p>
        </div>
      </div>
    </>
  )
}

export default SettingsHome
