import type { LucideIcon } from 'lucide-react'

export type TabId = 'today' | 'week' | 'plan' | 'log' | 'dashboard'

export type NavigationItem = {
  id: TabId
  label: string
  icon: LucideIcon
  description?: string
}
