import {
  Activity,
  CalendarCheck,
  CalendarDays,
  ListChecks,
  NotebookPen,
} from 'lucide-react'
import type { NavigationItem } from '../types/navigation'

export const navigationItems: NavigationItem[] = [
  {
    id: 'today',
    label: 'Today',
    icon: CalendarCheck,
    description: 'Daily training view',
  },
  {
    id: 'week',
    label: 'Week',
    icon: CalendarDays,
    description: 'Weekly schedule',
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: ListChecks,
    description: 'Full marathon plan',
  },
  {
    id: 'log',
    label: 'Log',
    icon: NotebookPen,
    description: 'Workout notes',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Activity,
    description: 'Training analytics',
  },
]
