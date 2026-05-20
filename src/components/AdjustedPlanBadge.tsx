import { SlidersHorizontal } from 'lucide-react'

type AdjustedPlanBadgeProps = {
  label?: string
}

function AdjustedPlanBadge({ label = 'Adjusted' }: AdjustedPlanBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-300/25 dark:bg-purple-300/10 dark:text-purple-200">
      <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

export default AdjustedPlanBadge
