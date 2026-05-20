import { AlertTriangle } from 'lucide-react'

type AdjustmentSafetyWarningsProps = {
  warnings: string[]
}

function AdjustmentSafetyWarnings({ warnings }: AdjustmentSafetyWarningsProps) {
  if (!warnings.length) {
    return (
      <div className="rounded-[18px] border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/10">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
          No major safety warnings from these inputs.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[18px] border border-orange-100 bg-orange-50/80 p-3 dark:border-orange-300/25 dark:bg-orange-300/10">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-700 dark:text-orange-200" aria-hidden="true" />
        <p className="text-sm font-semibold text-orange-800 dark:text-orange-100">
          Safety notes
        </p>
      </div>
      <ul className="mt-2 space-y-1">
        {warnings.map((warning) => (
          <li className="text-sm leading-5 text-orange-800/80 dark:text-orange-100/80" key={warning}>
            {warning}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdjustmentSafetyWarnings
