import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyStateCardProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

function EmptyStateCard({ action, icon: Icon, title, description }: EmptyStateCardProps) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white p-4 text-center shadow-[0_18px_45px_rgba(49,55,70,0.06)] dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-[18px] bg-stone-50 text-stone-600 ring-1 ring-stone-100 dark:bg-white/[0.07] dark:text-neutral-300 dark:ring-white/10">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-semibold text-stone-950 dark:text-white">{title}</p>
      <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export default EmptyStateCard
