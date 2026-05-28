import { SearchX, SlidersHorizontal } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import EmptyStateCard from '../components/EmptyStateCard'
import PlanFilterBar from '../components/PlanFilterBar'
import PlanOverrideManager from '../components/PlanOverrideManager'
import PlanPhaseTimeline from '../components/PlanPhaseTimeline'
import PlanSearchBar from '../components/PlanSearchBar'
import PlanStatsCard from '../components/PlanStatsCard'
import PlanWeekSection from '../components/PlanWeekSection'
import PlanWorkoutBadge from '../components/PlanWorkoutBadge'
import StickyTabHeader from '../components/StickyTabHeader'
import StatusPill from '../components/StatusPill'
import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import { usePlanOverrides } from '../hooks/usePlanOverrides'
import { useWorkoutLogs } from '../hooks/useWorkoutLogs'
import type { PlanAdjustmentProposal } from '../types/planAdjustment'
import type { PlanFilter } from '../types/planView'
import { getEffectiveFullTrainingPlan } from '../utils/effectiveTrainingPlanUtils'
import { convertProposalToPlanOverrides } from '../utils/planAdjustmentApplyUtils'
import {
  buildPhaseTimeline,
  buildPlanStats,
  filterPlanDays,
  groupDaysByWeek,
} from '../utils/planViewUtils'

const PlanAdjustmentAssistantModal = lazy(
  () => import('../components/PlanAdjustmentAssistantModal'),
)

type PlanPageProps = {
  selectedDate: string
  onOpenDateInToday: (date: string) => void
  onOpenSettings: () => void
}

function PlanPage({ selectedDate, onOpenDateInToday, onOpenSettings }: PlanPageProps) {
  const { logs } = useWorkoutLogs()
  const planOverrides = usePlanOverrides()
  const [activeFilter, setActiveFilter] = useState<PlanFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [jumpDate, setJumpDate] = useState('')
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(() => new Set())
  const [isAdjustmentAssistantOpen, setIsAdjustmentAssistantOpen] = useState(false)
  const stats = buildPlanStats()
  const phaseSegments = buildPhaseTimeline()
  const dateMessage = getDateMessage(jumpDate)
  const effectiveSearchTerm = jumpDate && !dateMessage ? jumpDate : searchTerm
  const filteredDays = filterPlanDays(getEffectiveFullTrainingPlan(), activeFilter, effectiveSearchTerm)
  const sections = groupDaysByWeek(filteredDays)
  const activeDayOverrideCount = Object.keys(planOverrides.activeDayOverrides).length
  const hasActiveFilterOrSearch = Boolean(effectiveSearchTerm || activeFilter !== 'all')

  const handleApplyProposal = (proposal: PlanAdjustmentProposal) => {
    const { dayOverrides, record } = convertProposalToPlanOverrides(proposal)
    planOverrides.saveAdjustment(record, dayOverrides)
    setExpandedWeeks(new Set())
  }

  const handleJumpDateChange = (date: string) => {
    setJumpDate(date)

    if (!date) {
      return
    }

    if (date >= trainingPlanStartDate && date <= trainingPlanEndDate) {
      setSearchTerm(date)
      setExpandedWeeks(new Set())
    }
  }

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value)
    setJumpDate('')
    setExpandedWeeks(new Set())
  }

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((currentWeeks) => {
      const nextWeeks = new Set(currentWeeks)

      if (nextWeeks.has(weekNumber)) {
        nextWeeks.delete(weekNumber)
      } else {
        nextWeeks.add(weekNumber)
      }

      return nextWeeks
    })
  }

  const expandAllWeeks = () => {
    setExpandedWeeks(new Set(sections.map((section) => section.week.weekNumber)))
  }

  const collapseAllWeeks = () => {
    setExpandedWeeks(new Set())
  }

  return (
    <div className="space-y-5">
      <StickyTabHeader
        controls={
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(23,32,51,0.14)] transition hover:bg-stone-800 dark:bg-neutral-100 dark:text-neutral-950 dark:shadow-none dark:hover:bg-white"
            onClick={() => setIsAdjustmentAssistantOpen(true)}
            type="button"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Adjust plan
          </button>
        }
        meta={
          <>
            <StatusPill tone="race">Goal: 2:50-2:55</StatusPill>
            <StatusPill tone="success">{stats.totalPlannedKm} km</StatusPill>
            {activeDayOverrideCount ? <StatusPill tone="strength">Adjusted</StatusPill> : null}
          </>
        }
        onOpenSettings={onOpenSettings}
        subtitle="Amsterdam Marathon build"
        title="Plan"
      />

      <div className="flex flex-wrap gap-2">
        <PlanWorkoutBadge label="20 weeks" tone="running" />
        <PlanWorkoutBadge label="Race: 18 Oct" tone="race" />
        <PlanWorkoutBadge label={`${stats.totalPlannedKm} km planned`} tone="success" />
      </div>

      <PlanStatsCard stats={stats} />
      <PlanOverrideManager
        adjustedDayCount={activeDayOverrideCount}
        onClearAdjustment={planOverrides.clearAdjustment}
        onClearAll={planOverrides.clearAllOverrides}
        records={planOverrides.adjustmentRecords}
      />
      <PlanPhaseTimeline segments={phaseSegments} />
      <PlanSearchBar
        dateMessage={dateMessage}
        jumpDate={jumpDate}
        onJumpDateChange={handleJumpDateChange}
        onSearchTermChange={handleSearchTermChange}
        searchTerm={searchTerm}
      />
      <PlanFilterBar
        activeFilter={activeFilter}
        matchCount={filteredDays.length}
        onFilterChange={(filter) => {
          setActiveFilter(filter)
          setExpandedWeeks(new Set())
        }}
      />

      {sections.length ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="h-10 rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
              onClick={expandAllWeeks}
              type="button"
            >
              Expand all
            </button>
            <button
              className="h-10 rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
              onClick={collapseAllWeeks}
              type="button"
            >
              Collapse all
            </button>
          </div>
          {sections.map((section) => (
            <PlanWeekSection
              isExpanded={
                hasActiveFilterOrSearch || expandedWeeks.has(section.week.weekNumber)
              }
              key={section.week.weekNumber}
              onOpenDay={onOpenDateInToday}
              onToggleExpanded={() => toggleWeek(section.week.weekNumber)}
              section={section}
              selectedDate={selectedDate}
              workoutLogs={logs}
            />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          description="Try clearing the search, switching the filter, or choosing a date inside the marathon block."
          icon={SearchX}
          title="No matching plan days"
        />
      )}

      <Suspense fallback={null}>
        <PlanAdjustmentAssistantModal
          activePlanOverrides={planOverrides.activeDayOverrides}
          onApplyProposal={handleApplyProposal}
          onClose={() => setIsAdjustmentAssistantOpen(false)}
          open={isAdjustmentAssistantOpen}
          selectedDate={selectedDate}
          workoutLogs={logs}
        />
      </Suspense>
    </div>
  )
}

function getDateMessage(date: string) {
  if (!date) {
    return undefined
  }

  if (date < trainingPlanStartDate || date > trainingPlanEndDate) {
    return 'Date is outside the marathon block.'
  }

  return undefined
}

export default PlanPage
