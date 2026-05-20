import type { WeeklyDashboardSummary } from '../types/dashboard'
import { formatPercent } from '../utils/chartFormatUtils'

type CompletionChartProps = {
  summaries: WeeklyDashboardSummary[]
}

function CompletionChart({ summaries }: CompletionChartProps) {
  return (
    <div className="space-y-2">
      {summaries.map((week) => (
        <div className="grid grid-cols-[42px_1fr_48px] items-center gap-3" key={week.weekNumber}>
          <p className="text-xs font-semibold text-stone-500 dark:text-slate-500">
            W{week.weekNumber}
          </p>
          <div className="relative h-3 overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.08]">
            <div
              className="absolute bottom-0 top-0 rounded-full bg-emerald-500 dark:bg-emerald-300"
              style={{ width: `${Math.min(100, week.completionPercent)}%` }}
            />
            <div className="absolute bottom-0 top-0 w-px bg-white/80 dark:bg-slate-950" style={{ left: '85%' }} />
          </div>
          <p className="text-right text-xs font-semibold text-stone-700 dark:text-slate-300">
            {formatPercent(week.completionPercent)}
          </p>
        </div>
      ))}
      <p className="text-xs leading-5 text-stone-500 dark:text-slate-500">
        Thin marker shows the 85% consistency target.
      </p>
    </div>
  )
}

export default CompletionChart
