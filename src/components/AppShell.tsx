import type { ReactNode } from 'react'
import type { TabId } from '../types/navigation'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

type AppShellProps = {
  activeTab: TabId
  children: ReactNode
  onOpenSettings: () => void
  onTabChange: (tabId: TabId) => void
}

function AppShell({ activeTab, children, onOpenSettings, onTabChange }: AppShellProps) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#ebe5da] dark:bg-[#03050a]">
      <div className="relative mx-auto min-h-dvh max-w-[480px] overflow-x-hidden bg-[#f4f1eb] shadow-[0_0_80px_rgba(55,49,40,0.12)] dark:bg-[#070a12] dark:shadow-[0_0_90px_rgba(0,0,0,0.7)]">
        <TopBar onOpenSettings={onOpenSettings} />
        <main className="px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5">{children}</main>
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  )
}

export default AppShell
