import type { ReactNode } from 'react'

type ActionButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  className?: string
  icon?: ReactNode
}

function ActionButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  icon,
}: ActionButtonProps) {
  const variantClassName =
    variant === 'primary'
      ? 'bg-stone-950 text-white shadow-[0_16px_40px_rgba(23,32,51,0.16)] hover:bg-stone-800 dark:bg-cyan-300 dark:text-slate-950 dark:shadow-[0_16px_40px_rgba(34,211,238,0.18)] dark:hover:bg-cyan-200'
      : 'border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]'

  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClassName} ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {icon}
      {children}
    </button>
  )
}

export default ActionButton
