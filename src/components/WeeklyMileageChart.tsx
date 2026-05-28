import type { WeeklyDashboardSummary } from '../types/dashboard'
import { formatKm } from '../utils/chartFormatUtils'

type WeeklyMileageChartProps = {
  summaries: WeeklyDashboardSummary[]
}

function WeeklyMileageChart({ summaries }: WeeklyMileageChartProps) {
  const maxKm = Math.max(1, ...summaries.flatMap((week) => [week.plannedKm, week.actualKm]))

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[720px] items-end gap-2 rounded-[22px] border border-stone-100 bg-stone-50 p-4 dark:border-white/10 dark:bg-neutral-950/45">
        {summaries.map((week) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={week.weekNumber}>
            <div className="flex h-40 w-full items-end justify-center gap-1.5">
              <Bar
                label={`Week ${week.weekNumber} planned ${formatKm(week.plannedKm)}`}
                tone="planned"
                valuePercent={(week.plannedKm / maxKm) * 100}
              />
              <Bar
                label={`Week ${week.weekNumber} actual ${formatKm(week.actualKm)}`}
                tone="actual"
                valuePercent={(week.actualKm / maxKm) * 100}
              />
            </div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-neutral-500">
              W{week.weekNumber}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-stone-500 dark:text-neutral-400">
        <Legend colorClassName="bg-cyan-400" label="Planned" />
        <Legend colorClassName="bg-emerald-400" label="Actual" />
      </div>
    </div>
  )
}

function Bar({
  label,
  tone,
  valuePercent,
}: {
  label: string
  tone: 'planned' | 'actual'
  valuePercent: number
}) {
  const className =
    tone === 'planned'
      ? 'bg-cyan-500/35 dark:bg-cyan-300/45'
      : 'bg-emerald-500/75 dark:bg-emerald-300/75'

  return (
    <div
      aria-label={label}
      className={`w-3 rounded-full ${className}`}
      role="img"
      style={{ height: `${Math.max(2, valuePercent)}%` }}
      title={label}
    />
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

export default WeeklyMileageChart
