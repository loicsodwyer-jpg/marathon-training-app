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
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-stone-200/80 bg-white/94 px-2 pb-[max(4px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-12px_34px_rgba(39,45,58,0.08)] backdrop-blur-xl dark:border-neutral-800 dark:bg-black/92 dark:shadow-[0_-12px_34px_rgba(0,0,0,0.4)]"
    >
      <div className="grid grid-cols-5 gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.description ?? item.label}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[14px] px-1 text-[10px] font-semibold transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(191,219,254,0.95)] dark:bg-neutral-800 dark:text-neutral-50 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-neutral-500 dark:hover:bg-neutral-900 dark:hover:text-neutral-100'
              }`}
              key={item.id}
              onClick={() => onTabChange(item.id)}
              type="button"
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2.2} />
              <span className="max-w-full truncate leading-none">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
