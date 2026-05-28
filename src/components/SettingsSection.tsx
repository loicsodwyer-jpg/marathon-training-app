import type { ReactNode } from 'react'

type SettingsSectionProps = {
  children: ReactNode
  title?: string
}

function SettingsSection({ children, title }: SettingsSectionProps) {
  return (
    <section className="space-y-2">
      {title ? (
        <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_16px_44px_rgba(49,55,70,0.06)] dark:border-white/10 dark:bg-neutral-900/85 dark:shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
        {children}
      </div>
    </section>
  )
}

export default SettingsSection
