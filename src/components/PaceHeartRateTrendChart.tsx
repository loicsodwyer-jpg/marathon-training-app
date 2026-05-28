import { Activity } from 'lucide-react'
import type { PaceHeartRateTrendPoint } from '../types/dashboard'
import {
  formatHeartRate,
  formatPaceSeconds,
  formatShortDate,
} from '../utils/chartFormatUtils'
import EmptyStateCard from './EmptyStateCard'

type PaceHeartRateTrendChartProps = {
  points: PaceHeartRateTrendPoint[]
}

function PaceHeartRateTrendChart({ points }: PaceHeartRateTrendChartProps) {
  const visiblePoints = points.slice(-8)

  if (!visiblePoints.length) {
    return (
      <EmptyStateCard
        description="Log distance, duration, and average HR to see pace and heart-rate movement."
        icon={Activity}
        title="No logged run trends yet"
      />
    )
  }

  return (
    <div className="space-y-2">
      {visiblePoints.map((point) => (
        <div
          className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]"
          key={point.date}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-stone-950 dark:text-white">
              {formatShortDate(point.date)}
            </p>
            <p className="text-xs font-semibold text-stone-500 dark:text-neutral-500">
              {formatPaceSeconds(point.paceSecondsPerKm)} · Avg HR {formatHeartRate(point.averageHr)}
            </p>
          </div>
          <div className="grid grid-cols-[54px_1fr] items-center gap-2">
            <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-200">Pace</p>
            <div className="h-2 rounded-full bg-stone-200 dark:bg-white/[0.08]">
              <div
                className="h-2 rounded-full bg-cyan-500 dark:bg-cyan-300"
                style={{ width: getPaceBarWidth(point.paceSecondsPerKm) }}
              />
            </div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-200">HR</p>
            <div className="h-2 rounded-full bg-stone-200 dark:bg-white/[0.08]">
              <div
                className="h-2 rounded-full bg-rose-500 dark:bg-rose-300"
                style={{ width: getHrBarWidth(point.averageHr) }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function getPaceBarWidth(paceSeconds: number | undefined) {
  if (paceSeconds === undefined) {
    return '0%'
  }

  const clamped = Math.min(360, Math.max(210, paceSeconds))
  const width = ((360 - clamped) / 150) * 100
  return `${Math.max(8, width)}%`
}

function getHrBarWidth(averageHr: number | undefined) {
  if (averageHr === undefined) {
    return '0%'
  }

  const clamped = Math.min(180, Math.max(110, averageHr))
  const width = ((clamped - 110) / 70) * 100
  return `${Math.max(8, width)}%`
}

export default PaceHeartRateTrendChart
