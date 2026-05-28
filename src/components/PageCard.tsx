import type { ReactNode } from 'react'

type PageCardProps = {
  children: ReactNode
  className?: string
}

function PageCard({ children, className = '' }: PageCardProps) {
  return (
    <section
      className={`rounded-[24px] border border-white/80 bg-white p-4 shadow-[0_18px_55px_rgba(49,55,70,0.08)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </section>
  )
}

export default PageCard
