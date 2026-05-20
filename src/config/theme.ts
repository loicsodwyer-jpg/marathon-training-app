export const appTheme = {
  background: '#f4f1eb',
  darkBackground: '#05070d',
  surface: '#ffffff',
  darkSurface: '#111827',
  text: '#172033',
  darkText: '#edf3ff',
  mutedText: '#687082',
  darkMutedText: '#94a3b8',
} as const

export type AppTone = 'running' | 'strength' | 'completed' | 'warning' | 'neutral'

export const toneStyles: Record<
  AppTone,
  {
    badge: string
    bar: string
    card: string
    text: string
  }
> = {
  running: {
    badge:
      'border-blue-100 bg-blue-50 text-blue-700 dark:border-cyan-400/25 dark:bg-cyan-400/10 dark:text-cyan-200',
    bar: 'bg-blue-500 dark:bg-cyan-400',
    card: 'border-blue-100 bg-blue-50/70 dark:border-cyan-400/20 dark:bg-cyan-400/10',
    text: 'text-blue-700 dark:text-cyan-200',
  },
  strength: {
    badge:
      'border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-400/25 dark:bg-purple-400/10 dark:text-purple-200',
    bar: 'bg-purple-500 dark:bg-purple-400',
    card: 'border-purple-100 bg-purple-50/70 dark:border-purple-400/20 dark:bg-purple-400/10',
    text: 'text-purple-700 dark:text-purple-200',
  },
  completed: {
    badge:
      'border-green-100 bg-green-50 text-green-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200',
    bar: 'bg-green-500 dark:bg-emerald-400',
    card: 'border-green-100 bg-green-50/70 dark:border-emerald-400/20 dark:bg-emerald-400/10',
    text: 'text-green-700 dark:text-emerald-200',
  },
  warning: {
    badge:
      'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-400/25 dark:bg-orange-400/10 dark:text-orange-200',
    bar: 'bg-orange-500 dark:bg-orange-400',
    card: 'border-orange-100 bg-orange-50/70 dark:border-orange-400/20 dark:bg-orange-400/10',
    text: 'text-orange-700 dark:text-orange-200',
  },
  neutral: {
    badge:
      'border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200',
    bar: 'bg-stone-400 dark:bg-slate-400',
    card: 'border-stone-200 bg-stone-50 dark:border-white/10 dark:bg-white/[0.06]',
    text: 'text-stone-700 dark:text-slate-200',
  },
}
