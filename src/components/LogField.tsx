import type { ReactNode } from 'react'

type LogFieldProps = {
  label: string
  children: ReactNode
  hint?: string
}

function LogField({ label, children, hint }: LogFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-neutral-200">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-stone-500 dark:text-neutral-500">{hint}</span> : null}
    </label>
  )
}

export const inputClassName =
  'h-12 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/10'

export const textareaClassName =
  'min-h-28 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/10'

export default LogField
