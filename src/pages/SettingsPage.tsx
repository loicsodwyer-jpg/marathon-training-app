import { useEffect, useState } from 'react'
import SettingsHome from '../components/SettingsHome'
import SettingsSubpageHeader from '../components/SettingsSubpageHeader'
import type { Theme } from '../hooks/useTheme'
import type { SettingsPageId } from '../types/settings'
import AboutSettingsPage from './settings/AboutSettingsPage'
import AppearanceSettingsPage from './settings/AppearanceSettingsPage'
import CalendarExportSettingsPage from './settings/CalendarExportSettingsPage'
import DataManagementSettingsPage from './settings/DataManagementSettingsPage'
import InstallOfflineSettingsPage from './settings/InstallOfflineSettingsPage'
import IntegrationsSettingsPage from './settings/IntegrationsSettingsPage'
import NotificationSettingsPage from './settings/NotificationSettingsPage'
import NutritionLibrarySettingsPage from './settings/NutritionLibrarySettingsPage'
import StrengthLibrarySettingsPage from './settings/StrengthLibrarySettingsPage'

type SettingsPageProps = {
  onClose: () => void
  onThemeChange: (theme: Theme) => void
  selectedDate: string
  theme: Theme
}

const subpageCopy: Record<
  Exclude<SettingsPageId, 'home'>,
  {
    title: string
    subtitle: string
  }
> = {
  appearance: {
    title: 'Appearance',
    subtitle: 'Dark/light mode and app look.',
  },
  install: {
    title: 'Install and offline',
    subtitle: 'Home Screen app, standalone mode, and offline support.',
  },
  calendar: {
    title: 'Calendar export',
    subtitle: 'Download local .ics files from your effective training plan.',
  },
  data: {
    title: 'Data management',
    subtitle: 'Back up, import, export, or clear local app data.',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Permission, test notification, and reminder preview.',
  },
  strength: {
    title: 'Strength library',
    subtitle: 'Gym sessions and Achilles prehab used by the plan.',
  },
  nutrition: {
    title: 'Nutrition library',
    subtitle: 'Meal templates and fuelling guidance.',
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'Future connection ideas. Nothing is connected yet.',
  },
  about: {
    title: 'About app',
    subtitle: 'Version, local storage, privacy, and roadmap.',
  },
}

function SettingsPage({ onClose, onThemeChange, selectedDate, theme }: SettingsPageProps) {
  const [activePage, setActivePage] = useState<SettingsPageId>('home')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleClose = () => {
    setActivePage('home')
    onClose()
  }

  const handleBack = () => {
    setActivePage('home')
  }

  return (
    <div
      aria-label="Settings"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex h-dvh justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
    >
      <div className="h-dvh w-full max-w-[480px] overflow-hidden bg-[#f4f1eb] shadow-[0_0_90px_rgba(0,0,0,0.35)] dark:bg-neutral-950 dark:shadow-[0_0_90px_rgba(0,0,0,0.78)]">
        {activePage === 'home' ? (
          <div className="h-dvh overflow-y-auto">
            <SettingsHome
              onClose={handleClose}
              onSelectPage={setActivePage}
              theme={theme}
            />
          </div>
        ) : (
          <div className="flex h-dvh flex-col">
            <SettingsSubpageHeader
              onBack={handleBack}
              onClose={handleClose}
              subtitle={subpageCopy[activePage].subtitle}
              title={subpageCopy[activePage].title}
            />
            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[calc(32px+env(safe-area-inset-bottom))]">
              {renderSubpage({
                activePage,
                onThemeChange,
                selectedDate,
                theme,
              })}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}

function renderSubpage({
  activePage,
  onThemeChange,
  selectedDate,
  theme,
}: {
  activePage: Exclude<SettingsPageId, 'home'>
  onThemeChange: (theme: Theme) => void
  selectedDate: string
  theme: Theme
}) {
  if (activePage === 'appearance') {
    return <AppearanceSettingsPage onThemeChange={onThemeChange} theme={theme} />
  }

  if (activePage === 'install') {
    return <InstallOfflineSettingsPage />
  }

  if (activePage === 'calendar') {
    return <CalendarExportSettingsPage selectedDate={selectedDate} />
  }

  if (activePage === 'data') {
    return <DataManagementSettingsPage />
  }

  if (activePage === 'notifications') {
    return <NotificationSettingsPage selectedDate={selectedDate} />
  }

  if (activePage === 'strength') {
    return <StrengthLibrarySettingsPage />
  }

  if (activePage === 'nutrition') {
    return <NutritionLibrarySettingsPage />
  }

  if (activePage === 'integrations') {
    return <IntegrationsSettingsPage />
  }

  return <AboutSettingsPage />
}

export default SettingsPage
