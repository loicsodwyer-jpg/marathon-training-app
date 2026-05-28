import { LoaderCircle } from 'lucide-react'

type LoadingFallbackProps = {
  message?: string
}

function LoadingFallback({ message = 'Loading view' }: LoadingFallbackProps) {
  return (
    <div
      className="flex min-h-24 items-center gap-3 rounded-[24px] border border-stone-200 bg-white p-4 text-sm font-semibold text-stone-700 shadow-[0_18px_55px_rgba(49,55,70,0.08)] dark:border-white/10 dark:bg-neutral-900/85 dark:text-neutral-200"
      role="status"
    >
      <LoaderCircle className="h-5 w-5 animate-spin text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
      <span>{message}...</span>
    </div>
  )
}

export default LoadingFallback
