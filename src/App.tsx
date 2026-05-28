import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { registerSW } from 'virtual:pwa-register'
import AppShell from './components/AppShell'
import LoadingFallback from './components/LoadingFallback'
import PwaUpdateToast from './components/PwaUpdateToast'
import { useTheme } from './hooks/useTheme'
import TodayPage from './pages/TodayPage'
import type { TabId } from './types/navigation'
import { formatDateKey } from './utils/dateUtils'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const LogPage = lazy(() => import('./pages/LogPage'))
const PlanPage = lazy(() => import('./pages/PlanPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const WeekPage = lazy(() => import('./pages/WeekPage'))

function App() {
  const initialNotificationDate = getInitialDateFromUrl()
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    initialNotificationDate ? 'today' : 'today',
  )
  const [selectedDate, setSelectedDate] = useState(
    () => initialNotificationDate ?? formatDateKey(new Date()),
  )
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const updateServiceWorkerRef = useRef<
    (reloadPage?: boolean) => Promise<void>
  >(async () => undefined)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const updateSw = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
      },
    })

    updateServiceWorkerRef.current = updateSw
  }, [])

  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | undefined

      if (data?.type !== 'notification-click' || !data.url) {
        return
      }

      const date = getDateFromUrl(data.url)

      if (date) {
        setSelectedDate(date)
        setActiveTab('today')
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [])

  const handleLogSelectedDay = () => {
    setActiveTab('log')
  }

  const handleOpenDateInToday = (date: string) => {
    setSelectedDate(date)
    setActiveTab('today')
  }

  const pageByTab: Record<TabId, ReactElement> = {
    today: (
      <TodayPage
        onLogSelectedDay={handleLogSelectedDay}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectedDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />
    ),
    week: (
      <WeekPage
        onOpenDateInToday={handleOpenDateInToday}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectedDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />
    ),
    plan: (
      <PlanPage
        onOpenDateInToday={handleOpenDateInToday}
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedDate={selectedDate}
      />
    ),
    log: (
      <LogPage
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectedDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />
    ),
    dashboard: <DashboardPage onOpenSettings={() => setIsSettingsOpen(true)} />,
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <Suspense fallback={<LoadingFallback />}>{pageByTab[activeTab]}</Suspense>
      {isSettingsOpen ? (
        <Suspense fallback={<LoadingFallback />}>
          <SettingsPage
            onClose={() => setIsSettingsOpen(false)}
            onThemeChange={setTheme}
            selectedDate={selectedDate}
            theme={theme}
          />
        </Suspense>
      ) : null}
      <PwaUpdateToast
        needRefresh={needRefresh}
        offlineReady={offlineReady}
        onClose={() => {
          setNeedRefresh(false)
          setOfflineReady(false)
        }}
        onRefresh={() => {
          void updateServiceWorkerRef.current(true)
        }}
      />
    </AppShell>
  )
}

function getInitialDateFromUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  const date = getDateFromUrl(window.location.href)

  if (date) {
    window.history.replaceState({}, '', window.location.pathname)
  }

  return date
}

function getDateFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url, window.location.origin)
    const date = parsedUrl.searchParams.get('date')
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined
  } catch {
    return undefined
  }
}

export default App
