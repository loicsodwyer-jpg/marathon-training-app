import type { PlanFilter } from '../types/planView'

type PlanFilterBarProps = {
  activeFilter: PlanFilter
  matchCount: number
  onFilterChange: (filter: PlanFilter) => void
}

const filterOptions: Array<{ id: PlanFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'runs', label: 'Runs' },
  { id: 'key_workouts', label: 'Key workouts' },
  { id: 'long_runs', label: 'Long runs' },
  { id: 'strength', label: 'Strength' },
  { id: 'rest_social', label: 'Rest/social' },
  { id: 'race_week', label: 'Race week' },
]

function PlanFilterBar({ activeFilter, matchCount, onFilterChange }: PlanFilterBarProps) {
  return (
    <div className="space-y-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.07)] dark:border-white/10 dark:bg-neutral-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-950 dark:text-white">Filters</h2>
        <p className="text-xs font-semibold text-stone-500 dark:text-neutral-400">
          {matchCount} matching day{matchCount === 1 ? '' : 's'}
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterOptions.map((option) => (
          <button
            aria-pressed={activeFilter === option.id}
            className={`h-10 shrink-0 rounded-full border px-3 text-xs font-semibold transition ${
              activeFilter === option.id
                ? 'border-cyan-300/40 bg-cyan-300/15 text-stone-950 dark:text-cyan-100'
                : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.1]'
            }`}
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default PlanFilterBar
