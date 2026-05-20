import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

function SectionHeader({ title, subtitle, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold tracking-normal text-stone-950 dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap justify-end gap-2">{action}</div> : null}
    </div>
  )
}

export default SectionHeader
