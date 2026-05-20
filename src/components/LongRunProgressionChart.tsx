import type { WeeklyDashboardSummary } from '../types/dashboard'
import { formatKm } from '../utils/chartFormatUtils'

type LongRunProgressionChartProps = {
  summaries: WeeklyDashboardSummary[]
}

function LongRunProgressionChart({ summaries }: LongRunProgressionChartProps) {
  const maxKm = Math.max(
    1,
    ...summaries.flatMap((week) => [week.plannedLongRunKm ?? 0, week.longestRunKm ?? 0]),
  )

  return (
    <div className="space-y-3">
      {summaries.map((week) => (
        <div className="space-y-1.5" key={week.weekNumber}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-500">
              W{week.weekNumber}
            </p>
            <p className="text-xs font-semibold text-stone-600 dark:text-slate-400">
              {formatKm(week.longestRunKm)} / {formatKm(week.plannedLongRunKm)}
            </p>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.08]">
            <div
              className="absolute bottom-0 top-0 rounded-full bg-cyan-500/30 dark:bg-cyan-300/35"
              style={{ width: `${((week.plannedLongRunKm ?? 0) / maxKm) * 100}%` }}
            />
            <div
              className="absolute bottom-0 top-0 rounded-full bg-emerald-500 dark:bg-emerald-300"
              style={{ width: `${((week.longestRunKm ?? 0) / maxKm) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs font-semibold text-stone-500 dark:text-slate-400">
        <Legend colorClassName="bg-cyan-400/50" label="Planned longest" />
        <Legend colorClassName="bg-emerald-400" label="Logged longest" />
      </div>
    </div>
  )
}

function Legend({ colorClassName, label }: { colorClassName: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${colorClassName}`} />
      {label}
    </span>
  )
}

export default LongRunProgressionChart
