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
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()))
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
        onSelectedDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />
    ),
    week: (
      <WeekPage
        onOpenDateInToday={handleOpenDateInToday}
        onSelectedDateChange={setSelectedDate}
        selectedDate={selectedDate}
      />
    ),
    plan: <PlanPage onOpenDateInToday={handleOpenDateInToday} selectedDate={selectedDate} />,
    log: <LogPage onSelectedDateChange={setSelectedDate} selectedDate={selectedDate} />,
    dashboard: <DashboardPage />,
  }

  return (
    <AppShell
      activeTab={activeTab}
      onOpenSettings={() => setIsSettingsOpen(true)}
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

export default App
