import { CalendarDays, Moon } from 'lucide-react'
import { useState } from 'react'
import WeekCalendar from '../components/WeekCalendar'
import WeekNavigator from '../components/WeekNavigator'
import WeekSummaryCard from '../components/WeekSummaryCard'
import WeeklyMiniCalendar from '../components/WeeklyMiniCalendar'
import ActivityCard from '../components/ActivityCard'
import ActionButton from '../components/ActionButton'
import SectionHeader from '../components/SectionHeader'
import StatusPill from '../components/StatusPill'
import { trainingPlanStartDate } from '../data/trainingPlan'
import { useWorkoutLogs } from '../hooks/useWorkoutLogs'
import { formatDisplayDate } from '../utils/dateUtils'
import {
  buildWeekViewDays,
  buildWeekViewSummary,
  formatWeekDateRange,
} from '../utils/weekViewUtils'

type WeekPageProps = {
  selectedDate: string
  onSelectedDateChange: (date: string) => void
  onOpenDateInToday: (date: string) => void
}

function WeekPage({
  selectedDate,
  onSelectedDateChange,
  onOpenDateInToday,
}: WeekPageProps) {
  const { logs } = useWorkoutLogs()
  const days = buildWeekViewDays(selectedDate, logs)
  const summary = buildWeekViewSummary(days)
  const hasPlanDays = days.some((day) => day.isInsidePlan)
  const weekRangeLabel = formatWeekDateRange(summary.startDate, summary.endDate)
  const weekKey = `${summary.startDate}-${summary.endDate}`
  const [expandedState, setExpandedState] = useState<{
    dates: Set<string>
    weekKey: string
  }>(() => ({ dates: new Set(), weekKey }))
  const expandedDayDates =
    expandedState.weekKey === weekKey ? expandedState.dates : new Set<string>()
  const allDayDates = days.map((day) => day.date)

  const toggleDayExpanded = (date: string) => {
    setExpandedState((currentState) => {
      const nextDates =
        currentState.weekKey === weekKey ? new Set(currentState.dates) : new Set<string>()

      if (nextDates.has(date)) {
        nextDates.delete(date)
      } else {
        nextDates.add(date)
      }

      return { dates: nextDates, weekKey }
    })
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        action={
          summary.weekNumber ? (
            <StatusPill tone="running">Week {summary.weekNumber}</StatusPill>
          ) : null
        }
        subtitle="Weekly training planner"
        title="Week"
      />

      <WeekNavigator
        onDateChange={onSelectedDateChange}
        selectedDate={selectedDate}
        weekRangeLabel={weekRangeLabel}
      />

      {hasPlanDays ? (
        <>
          <WeekSummaryCard summary={summary} />
          <WeeklyMiniCalendar
            days={days}
            expandedDayDates={expandedDayDates}
            onSelectDay={toggleDayExpanded}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              className="h-10 rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
              onClick={() => setExpandedState({ dates: new Set(allDayDates), weekKey })}
              type="button"
            >
              Expand all
            </button>
            <button
              className="h-10 rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
              onClick={() => setExpandedState({ dates: new Set(), weekKey })}
              type="button"
            >
              Collapse all
            </button>
          </div>
          <WeekCalendar
            days={days}
            expandedDayDates={expandedDayDates}
            onOpenDay={onOpenDateInToday}
            onToggleDay={toggleDayExpanded}
          />
        </>
      ) : (
        <OutsidePlanWeekCard onJumpToPlanStart={() => onSelectedDateChange(trainingPlanStartDate)} />
      )}
    </div>
  )
}

function OutsidePlanWeekCard({ onJumpToPlanStart }: { onJumpToPlanStart: () => void }) {
  return (
    <ActivityCard
      icon={Moon}
      pill="Outside plan"
      subtitle="Select a week inside the marathon block"
      title={`Plan starts on ${formatDisplayDate(trainingPlanStartDate)}`}
      tone="neutral"
    >
      <p className="text-sm leading-6 text-stone-600 dark:text-slate-300">
        The Week view is ready for planning, but this selected week is outside the Amsterdam
        Marathon training block.
      </p>
      <ActionButton
        className="mt-4 w-full"
        icon={<CalendarDays className="h-5 w-5" />}
        onClick={onJumpToPlanStart}
        variant="secondary"
      >
        Jump to plan start
      </ActionButton>
    </ActivityCard>
  )
}

export default WeekPage
