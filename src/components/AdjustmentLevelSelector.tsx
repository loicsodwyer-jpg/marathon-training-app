import type { AdjustmentLevel } from '../types/planAdjustment'
import {
  getAdjustmentLevelDescription,
  getAdjustmentLevelLabel,
  getAdjustmentLevelLoadReductionRange,
  getAdjustmentLevelOptions,
} from '../utils/planAdjustmentRules'

type AdjustmentLevelSelectorProps = {
  value: AdjustmentLevel
  onChange: (level: AdjustmentLevel) => void
}

function AdjustmentLevelSelector({ value, onChange }: AdjustmentLevelSelectorProps) {
  return (
    <div className="space-y-2">
      {getAdjustmentLevelOptions().map((level) => {
        const isActive = level === value

        return (
          <button
            aria-pressed={isActive}
            className={`w-full rounded-[18px] border p-3 text-left transition ${
              isActive
                ? 'border-cyan-300/40 bg-cyan-50 text-stone-950 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-white'
                : 'border-stone-100 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300 dark:hover:bg-white/[0.08]'
            }`}
            key={level}
            onClick={() => onChange(level)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{getAdjustmentLevelLabel(level)}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-neutral-400">
                  {getAdjustmentLevelDescription(level)}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 dark:border-white/10 dark:bg-neutral-950/60 dark:text-neutral-200">
                {getAdjustmentLevelLoadReductionRange(level)}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default AdjustmentLevelSelector
