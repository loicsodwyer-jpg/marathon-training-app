import { Search, X } from 'lucide-react'
import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import AppDateInput from './AppDateInput'

type PlanSearchBarProps = {
  dateMessage?: string
  jumpDate: string
  onJumpDateChange: (date: string) => void
  onSearchTermChange: (value: string) => void
  searchTerm: string
}

function PlanSearchBar({
  dateMessage,
  jumpDate,
  onJumpDateChange,
  onSearchTermChange,
  searchTerm,
}: PlanSearchBarProps) {
  return (
    <div className="space-y-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.07)] dark:border-white/10 dark:bg-neutral-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-stone-700 dark:text-neutral-200">
          Search plan
        </span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-neutral-500" aria-hidden="true" />
          <input
            className="h-12 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-10 text-sm font-semibold text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-cyan-300 dark:focus:ring-cyan-300/10"
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="festival, marathon pace, 2026-10-18..."
            type="search"
            value={searchTerm}
          />
          {searchTerm ? (
            <button
              aria-label="Clear plan search"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-stone-500 transition hover:bg-stone-200 dark:text-neutral-400 dark:hover:bg-white/[0.08]"
              onClick={() => onSearchTermChange('')}
              type="button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </label>

      <AppDateInput
        allowClear
        label="Jump to date"
        maxDate={trainingPlanEndDate}
        minDate={trainingPlanStartDate}
        onChange={onJumpDateChange}
        quickDates={[
          { label: 'Plan start', date: trainingPlanStartDate },
          { label: 'Race day', date: trainingPlanEndDate },
        ]}
        value={jumpDate}
      />

      {dateMessage ? (
        <p className="rounded-[16px] border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 dark:border-orange-300/20 dark:bg-orange-300/10 dark:text-orange-200">
          {dateMessage}
        </p>
      ) : null}
    </div>
  )
}

export default PlanSearchBar
