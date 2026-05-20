import { navigationItems } from '../config/navigation'
import type { TabId } from '../types/navigation'

type BottomNavProps = {
  activeTab: TabId
  onTabChange: (tabId: TabId) => void
}

function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-200/80 bg-white/94 px-2 pt-2 shadow-[0_-18px_45px_rgba(39,45,58,0.09)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92 dark:shadow-[0_-18px_45px_rgba(0,0,0,0.45)]"
    >
      <div className="grid grid-cols-5 gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.description ?? item.label}
              className={`flex h-[58px] flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[10px] font-semibold transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(191,219,254,0.95)] dark:bg-cyan-300/12 dark:text-cyan-200 dark:shadow-[inset_0_0_0_1px_rgba(103,232,249,0.22)]'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-slate-500 dark:hover:bg-white/[0.08] dark:hover:text-slate-100'
              }`}
              key={item.id}
              onClick={() => onTabChange(item.id)}
              type="button"
            >
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              <span className="max-w-full truncate leading-none">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
