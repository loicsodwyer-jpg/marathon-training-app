import {
  Activity,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  Route,
  TrendingUp,
} from 'lucide-react'
import CompletionChart from '../components/CompletionChart'
import DashboardMetricCard from '../components/DashboardMetricCard'
import DashboardSection from '../components/DashboardSection'
import EmptyStateCard from '../components/EmptyStateCard'
import LongRunProgressionChart from '../components/LongRunProgressionChart'
import PaceHeartRateTrendChart from '../components/PaceHeartRateTrendChart'
import ReadinessCard from '../components/ReadinessCard'
import RiskSignalsCard from '../components/RiskSignalsCard'
import SectionHeader from '../components/SectionHeader'
import StatusPill from '../components/StatusPill'
import WeeklyMileageChart from '../components/WeeklyMileageChart'
import { usePlanOverrides } from '../hooks/usePlanOverrides'
import { useWorkoutLogs } from '../hooks/useWorkoutLogs'
import {
  buildDashboardTotals,
  buildRiskSignals,
  buildWeeklyDashboardSummaries,
  calculateMarathonReadiness,
  getLatestLoggedWeekSummary,
  getPaceHeartRateTrendPoints,
} from '../utils/dashboardAnalytics'
import {
  formatHeartRate,
  formatKm,
  formatPercent,
  formatShortDate,
} from '../utils/chartFormatUtils'

function DashboardPage() {
  const { logs } = useWorkoutLogs()
  const planOverrides = usePlanOverrides()
  const logCount = Object.keys(logs).length
  const weeklySummaries = buildWeeklyDashboardSummaries(logs)
  const totals = buildDashboardTotals(logs)
  const latestWeek = getLatestLoggedWeekSummary(logs, weeklySummaries)
  const trendPoints = getPaceHeartRateTrendPoints(logs)
  const riskSignals = buildRiskSignals(logs, weeklySummaries)
  const readiness = calculateMarathonReadiness(logs, weeklySummaries)
  const hasLogs = logCount > 0

  return (
    <div className="space-y-5">
      <SectionHeader
        action={<StatusPill tone={hasLogs ? 'running' : 'neutral'}>{hasLogs ? 'Local logs' : 'No logs yet'}</StatusPill>}
        subtitle="Progress toward Amsterdam 2:50-2:55"
        title="Dashboard"
      />

      <div className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.06)] dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
        <p className="text-sm leading-6 text-stone-600 dark:text-slate-300">
          {hasLogs
            ? 'Based on your local workout logs and the loaded Amsterdam marathon plan.'
            : 'Start logging workouts to unlock progress analytics. Planned mileage still appears below.'}
        </p>
        {planOverrides.hasOverrides ? (
          <p className="mt-2 rounded-[16px] border border-purple-100 bg-purple-50/70 px-3 py-2 text-sm font-semibold text-purple-700 dark:border-purple-300/20 dark:bg-purple-300/10 dark:text-purple-200">
            Planned metrics include active local adjustments.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DashboardMetricCard
          icon={Route}
          label="This week"
          subtitle={`planned ${formatKm(latestWeek?.plannedKm)}`}
          tone="running"
          value={formatKm(latestWeek?.actualKm)}
        />
        <DashboardMetricCard
          icon={CheckCircle2}
          label="Run completion"
          subtitle={`${latestWeek?.completedRunCount ?? 0}/${latestWeek?.plannedRunCount ?? 0} this week`}
          tone="success"
          value={formatPercent(latestWeek?.completionPercent)}
        />
        <DashboardMetricCard
          icon={HeartPulse}
          label="Avg HR"
          subtitle={totals.averageHr ? 'logged runs' : 'waiting for HR'}
          tone="race"
          value={formatHeartRate(latestWeek?.averageHr ?? totals.averageHr)}
        />
        <DashboardMetricCard
          icon={Dumbbell}
          label="Strength"
          subtitle={`${latestWeek?.completedStrengthCount ?? 0}/${latestWeek?.plannedStrengthCount ?? 0} this week`}
          tone="strength"
          value={`${totals.completedStrengthSessions}/${totals.plannedStrengthSessions}`}
        />
        <DashboardMetricCard
          icon={Activity}
          label="Total actual"
          subtitle={`${formatKm(totals.plannedKmToDate)} planned to date`}
          tone="running"
          value={formatKm(totals.actualKmToDate)}
        />
        <DashboardMetricCard
          icon={CalendarCheck}
          label="Latest log"
          subtitle={totals.currentWeekNumber ? `Week ${totals.currentWeekNumber}` : 'outside plan'}
          tone="neutral"
          value={totals.latestLogDate ? formatShortDate(totals.latestLogDate) : 'None'}
        />
      </div>

      <DashboardSection
        icon={BarChart3}
        pill="20 weeks"
        subtitle="Planned marathon volume against logged actual distance."
        title="Weekly mileage"
        tone="running"
      >
        <WeeklyMileageChart summaries={weeklySummaries} />
      </DashboardSection>

      <DashboardSection
        icon={CheckCircle2}
        pill={formatPercent(totals.completionPercent)}
        subtitle="A run counts when logged as completed or partial with run completed enabled."
        title="Run completion"
        tone="success"
      >
        {hasLogs ? (
          <CompletionChart summaries={weeklySummaries} />
        ) : (
          <EmptyStateCard
            description="Completion percentages will appear once workouts are logged."
            icon={CheckCircle2}
            title="No completion data yet"
          />
        )}
      </DashboardSection>

      <DashboardSection
        icon={HeartPulse}
        subtitle="Latest logged runs with distance, duration, and average heart rate."
        title="Pace and heart rate"
        tone="race"
      >
        <PaceHeartRateTrendChart points={trendPoints} />
      </DashboardSection>

      <DashboardSection
        icon={TrendingUp}
        subtitle="Planned long-run progression compared with your longest logged run each week."
        title="Long-run progression"
        tone="running"
      >
        <LongRunProgressionChart summaries={weeklySummaries} />
      </DashboardSection>

      <ReadinessCard readiness={readiness} />
      <RiskSignalsCard signals={riskSignals} />
    </div>
  )
}

export default DashboardPage
