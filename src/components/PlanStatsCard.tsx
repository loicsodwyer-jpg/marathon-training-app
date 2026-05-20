import { Activity, CalendarDays, Dumbbell, Flag, Gauge, KeyRound, Route, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PlanStats } from '../types/planView'
import { formatDisplayDate } from '../utils/dateUtils'
import PageCard from './PageCard'

type PlanStatsCardProps = {
  stats: PlanStats
}

function PlanStatsCard({ stats }: PlanStatsCardProps) {
  return (
    <PageCard className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-950 dark:text-white">Plan stats</h2>
        <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
          Complete 20-week Amsterdam build overview.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile icon={Route} label="Total km" value={`${stats.totalPlannedKm}`} />
        <StatTile icon={CalendarDays} label="Weeks" value={`${stats.totalWeeks}`} />
        <StatTile icon={Gauge} label="Peak" value={`W${stats.peakWeekNumber} - ${stats.peakWeekKm} km`} />
        <StatTile icon={Activity} label="Runs" value={`${stats.plannedRuns}`} />
        <StatTile icon={Dumbbell} label="Strength" value={`${stats.strengthSessions}`} />
        <StatTile icon={Trophy} label="Long runs" value={`${stats.longRuns}`} />
        <StatTile icon={KeyRound} label="Key workouts" value={`${stats.keyWorkouts}`} />
        <StatTile icon={Flag} label="Race day" value={stats.raceDate ? formatDisplayDate(stats.raceDate) : '-'} />
      </div>
    </PageCard>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="mb-1 flex items-center gap-1.5 text-stone-500 dark:text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.08em]">{label}</p>
      </div>
      <p className="text-base font-semibold text-stone-950 dark:text-white">{value}</p>
    </div>
  )
}

export default PlanStatsCard
