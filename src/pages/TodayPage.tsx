import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Flame,
  Moon,
  PartyPopper,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import ActionButton from '../components/ActionButton'
import ActivityCard from '../components/ActivityCard'
import ActivityModal from '../components/ActivityModal'
import AdjustedPlanBadge from '../components/AdjustedPlanBadge'
import AppDateInput from '../components/AppDateInput'
import ConfirmDialog from '../components/ConfirmDialog'
import MealTimelineCard from '../components/MealTimelineCard'
import NutritionDetailModal from '../components/NutritionDetailModal'
import PageCard from '../components/PageCard'
import StatusPill, { type StatusTone } from '../components/StatusPill'
import StrengthDetailCard from '../components/StrengthDetailCard'
import LiveStrengthSessionModal from '../components/LiveStrengthSessionModal'
import StickyTabHeader from '../components/StickyTabHeader'
import StrengthSessionModal from '../components/StrengthSessionModal'
import TodayHourlyCalendar from '../components/TodayHourlyCalendar'
import WorkoutDetailCard from '../components/WorkoutDetailCard'
import { strengthSessionsById } from '../data/strengthSessions'
import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import { useDailyScheduleOverrides } from '../hooks/useDailyScheduleOverrides'
import { useFuelingPreferences } from '../hooks/useFuelingPreferences'
import { usePlanOverrides } from '../hooks/usePlanOverrides'
import { useWorkoutLogs } from '../hooks/useWorkoutLogs'
import type { DailyScheduleBlock } from '../types/schedule'
import type { LiveStrengthSessionResult } from '../types/liveStrength'
import type { WorkoutLogEntry } from '../types/workoutLog'
import type { DayPlanOverride } from '../types/planOverride'
import type {
  DayPlan,
  IntensityLevel,
  SpecialEvent,
  StrengthSession,
  TrainingPhase,
} from '../types/training'
import { formatDateKey, formatDisplayDate } from '../utils/dateUtils'
import { getDayAdjustmentInfo, getEffectiveDayPlan } from '../utils/effectiveTrainingPlanUtils'
import { getFuelingRecommendationForDay } from '../utils/fuelingRules'
import { buildStrengthLogInput } from '../utils/liveStrengthUtils'
import { getDailyScheduleBlocks } from '../utils/todayScheduleUtils'
import { getRaceDay, getSpecialEventsForDate } from '../utils/trainingPlanUtils'

type TodayPageProps = {
  selectedDate: string
  onSelectedDateChange: (date: string) => void
  onLogSelectedDay: () => void
  onOpenSettings: () => void
}

type ActivityModalState =
  | {
      mode: 'add'
    }
  | {
      mode: 'edit'
      block: DailyScheduleBlock
    }

const todayDateKey = formatDateKey(new Date())

const phaseTone: Record<TrainingPhase, StatusTone> = {
  recovery: 'success',
  base: 'running',
  build: 'running',
  specific: 'warning',
  peak: 'warning',
  taper: 'neutral',
  race: 'race',
}

const intensityTone: Record<IntensityLevel, StatusTone> = {
  rest: 'neutral',
  low: 'success',
  moderate: 'running',
  high: 'warning',
  race: 'race',
}

function TodayPage({
  selectedDate,
  onOpenSettings,
  onSelectedDateChange,
  onLogSelectedDay,
}: TodayPageProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [activityModal, setActivityModal] = useState<ActivityModalState>()
  const [deleteBlock, setDeleteBlock] = useState<DailyScheduleBlock>()
  const [isResetDayDialogOpen, setIsResetDayDialogOpen] = useState(false)
  const [selectedStrengthSession, setSelectedStrengthSession] = useState<StrengthSession>()
  const [liveStrengthSession, setLiveStrengthSession] = useState<StrengthSession>()
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false)
  const [isResetPlanOverrideDialogOpen, setIsResetPlanOverrideDialogOpen] = useState(false)
  const planOverrides = usePlanOverrides()
  const { preferences: fuelingPreferences } = useFuelingPreferences()
  const dayPlan = getEffectiveDayPlan(selectedDate)
  const dayAdjustment = getDayAdjustmentInfo(selectedDate)
  const workoutLogs = useWorkoutLogs()
  const selectedLog = workoutLogs.getLogForDate(selectedDate)
  const fuelingRecommendation = dayPlan
    ? getFuelingRecommendationForDay(dayPlan, fuelingPreferences)
    : undefined
  const generatedScheduleBlocks = dayPlan
    ? getDailyScheduleBlocks(dayPlan, fuelingPreferences)
    : []
  const schedule = useDailyScheduleOverrides(selectedDate, generatedScheduleBlocks)
  const events = getSpecialEventsForDate(selectedDate)
  const raceDay = getRaceDay()
  const isSelectedToday = selectedDate === todayDateKey
  const logButtonLabel = selectedLog
    ? 'View/edit log'
    : isSelectedToday
      ? "Log today's workout"
      : 'Log selected day'
  const selectedDisplayDate = selectedDate ? formatDisplayDate(selectedDate) : 'Select a date'
  const strengthSessions = (dayPlan?.strengthSessionIds ?? [])
    .map((sessionId) => strengthSessionsById[sessionId])
    .filter((session) => session !== undefined)
  const editingBlock = activityModal?.mode === 'edit' ? activityModal.block : undefined
  const editingBlockOverride = editingBlock
    ? (schedule.overrides?.blockOverrides[editingBlock.id] ??
      editingBlock.legacyIds
        ?.map((legacyId) => schedule.overrides?.blockOverrides[legacyId])
        .find((override) => override !== undefined))
    : undefined
  const hasTimingOverride = Boolean(editingBlockOverride?.startTime || editingBlockOverride?.endTime)
  const editedBlockIds = new Set(
    schedule.effectiveBlocks
      .filter((block) => {
        const blockOverrides = schedule.overrides?.blockOverrides
        return Boolean(
          blockOverrides?.[block.id] ||
            block.legacyIds?.some((legacyId) => blockOverrides?.[legacyId]),
        )
      })
      .map((block) => block.id),
  )
  const headerTone = dayPlan ? intensityTone[dayPlan.intensity] : 'neutral'
  const headerLabel = getTodayHeaderLabel(dayPlan, dayAdjustment)

  const handleStartStrengthSession = (session: StrengthSession) => {
    setSelectedStrengthSession(undefined)
    setLiveStrengthSession(session)
  }

  const handleSaveLiveStrengthSession = (result: LiveStrengthSessionResult) => {
    const existingLog = workoutLogs.getLogForDate(result.date)
    const input = buildStrengthLogInput(result, existingLog, Boolean(dayPlan?.plannedRun))

    workoutLogs.saveLog(result.date, input)
    setLiveStrengthSession(undefined)
  }

  return (
    <div className="space-y-5">
      <StickyTabHeader
        controls={
          <AppDateInput
            maxDate={trainingPlanEndDate}
            minDate={trainingPlanStartDate}
            onChange={(date) => {
              if (date) {
                onSelectedDateChange(date)
              }
            }}
            quickDates={[
              { label: 'Today', date: todayDateKey },
              { label: 'Plan start', date: trainingPlanStartDate },
              { label: 'Race day', date: raceDay?.date ?? trainingPlanEndDate },
            ]}
            value={selectedDate}
          />
        }
        meta={
          <>
            <StatusPill tone={headerTone}>{headerLabel}</StatusPill>
            {dayPlan ? <StatusPill tone={phaseTone[dayPlan.phase]}>{dayPlan.phase}</StatusPill> : null}
          </>
        }
        onOpenSettings={onOpenSettings}
        subtitle={selectedDisplayDate}
        title="Today"
      />

      <ActionButton className="w-full" icon={<CalendarDays className="h-5 w-5" />} onClick={onLogSelectedDay}>
        {logButtonLabel}
      </ActionButton>

      <TodayLogStatusCard log={selectedLog} />

      {dayPlan ? (
        <>
          <DaySummaryCard dayPlan={dayPlan} events={events} />
          {dayAdjustment ? (
            <AdjustedDayCard
              adjustment={dayAdjustment}
              onReset={() => setIsResetPlanOverrideDialogOpen(true)}
            />
          ) : null}
          <ActionButton
            className="w-full"
            icon={isCalendarOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            onClick={() => setIsCalendarOpen((current) => !current)}
            variant="secondary"
          >
            Check today's hourly calendar
          </ActionButton>

          {isCalendarOpen ? (
            <TodayHourlyCalendar
              date={selectedDate}
              editedBlockIds={editedBlockIds}
              effectiveBlocks={schedule.effectiveBlocks}
              hasChanges={schedule.hasChanges}
              onAddActivity={() => setActivityModal({ mode: 'add' })}
              onEditBlock={(block) => setActivityModal({ mode: 'edit', block })}
              onMoveBlock={schedule.moveBlock}
              onResetDay={() => setIsResetDayDialogOpen(true)}
              onToggleBlockCompleted={schedule.toggleBlockCompleted}
              workoutLog={selectedLog}
            />
          ) : null}
          <WorkoutDetailCard
            dayPlan={dayPlan}
            fuelingRecommendation={fuelingRecommendation}
          />
          <StrengthDetailCard
            isCompleted={Boolean(selectedLog?.strengthCompleted)}
            onOpenSession={setSelectedStrengthSession}
            onStartSession={handleStartStrengthSession}
            sessions={strengthSessions}
          />
          <MealTimelineCard
            dayPlan={dayPlan}
            fuelingRecommendation={fuelingRecommendation}
            mealPlan={dayPlan.mealPlan}
            onOpenNutrition={() => setIsNutritionModalOpen(true)}
          />
          <RecoveryCard dayPlan={dayPlan} events={events} />
          {events.length ? <SpecialEventCard events={events} /> : null}
        </>
      ) : (
        <PlanOutsideRangeCard onSelectedDateChange={onSelectedDateChange} />
      )}

      {activityModal ? (
        <ActivityModal
          block={editingBlock}
          defaultStartTime="19:00"
          hasTimingOverride={hasTimingOverride}
          isOpen
          key={activityModal.mode === 'edit' ? activityModal.block.id : `add-${selectedDate}`}
          mode={activityModal.mode}
          onAdd={schedule.addCustomBlock}
          onClose={() => setActivityModal(undefined)}
          onRequestDelete={setDeleteBlock}
          onResetTiming={schedule.resetPlannedBlock}
          onSave={schedule.updateBlock}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete activity"
        description={
          deleteBlock?.source === 'planned'
            ? 'This hides the generated activity for this day only. You can restore it with Reset day schedule. The training plan stays unchanged.'
            : 'This custom activity will be removed from this day.'
        }
        onCancel={() => setDeleteBlock(undefined)}
        onConfirm={() => {
          if (deleteBlock) {
            schedule.deleteBlock(deleteBlock.id)
          }
          setDeleteBlock(undefined)
          setActivityModal(undefined)
        }}
        open={Boolean(deleteBlock)}
        title="Delete activity?"
        tone="danger"
      />

      <ConfirmDialog
        confirmLabel="Reset day schedule"
        description="This will remove custom activities, moved activities, completed activity ticks, and deleted default blocks for this day. It will not delete workout logs or plan adjustments."
        onCancel={() => setIsResetDayDialogOpen(false)}
        onConfirm={() => {
          schedule.resetDay()
          setIsResetDayDialogOpen(false)
          setActivityModal(undefined)
        }}
        open={isResetDayDialogOpen}
        title="Reset selected day?"
        tone="danger"
      />

      <StrengthSessionModal
        onClose={() => setSelectedStrengthSession(undefined)}
        onStartSession={handleStartStrengthSession}
        open={Boolean(selectedStrengthSession)}
        session={selectedStrengthSession}
      />

      <LiveStrengthSessionModal
        date={selectedDate}
        onClose={() => setLiveStrengthSession(undefined)}
        onSaveResult={handleSaveLiveStrengthSession}
        open={Boolean(liveStrengthSession)}
        session={liveStrengthSession}
      />

      <NutritionDetailModal
        dayPlan={dayPlan}
        fuelingRecommendation={fuelingRecommendation}
        onClose={() => setIsNutritionModalOpen(false)}
        open={isNutritionModalOpen}
      />

      <ConfirmDialog
        confirmLabel="Reset day"
        description="This removes the local plan override for this date only. Workout logs and calendar edits stay unchanged."
        onCancel={() => setIsResetPlanOverrideDialogOpen(false)}
        onConfirm={() => {
          planOverrides.clearDayOverride(selectedDate)
          setIsResetPlanOverrideDialogOpen(false)
        }}
        open={isResetPlanOverrideDialogOpen}
        title="Reset adjusted plan day?"
        tone="danger"
      />
    </div>
  )
}

function getTodayHeaderLabel(
  dayPlan: DayPlan | undefined,
  adjustment: DayPlanOverride | undefined,
) {
  if (adjustment) {
    return 'Adjusted'
  }

  if (!dayPlan) {
    return 'Outside plan'
  }

  if (dayPlan.plannedRun?.type === 'race') {
    return 'Race day'
  }

  if (dayPlan.plannedRun?.type === 'long') {
    return 'Long run'
  }

  if (
    dayPlan.plannedRun &&
    ['threshold', 'interval', 'marathon_pace', 'progression'].includes(dayPlan.plannedRun.type)
  ) {
    return 'Workout'
  }

  if (dayPlan.plannedRun?.type === 'recovery') {
    return 'Recovery'
  }

  if (dayPlan.plannedRun?.type === 'easy') {
    return 'Easy'
  }

  if (dayPlan.dayType === 'rest' || dayPlan.intensity === 'rest') {
    return 'Rest'
  }

  return dayPlan.intensity
}

function AdjustedDayCard({
  adjustment,
  onReset,
}: {
  adjustment: DayPlanOverride
  onReset: () => void
}) {
  return (
    <PageCard className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <AdjustedPlanBadge />
          <h2 className="mt-2 text-base font-semibold text-stone-950 dark:text-white">
            Local plan adjustment
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-300">
            Original: {adjustment.originalTitle}
          </p>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-300">
            Adjusted: {adjustment.adjustedSummary}
          </p>
        </div>
        <button
          className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
          onClick={onReset}
          type="button"
        >
          Reset day
        </button>
      </div>
      <p className="rounded-[16px] border border-purple-100 bg-purple-50/70 p-3 text-sm leading-5 text-purple-800 dark:border-purple-300/20 dark:bg-purple-300/10 dark:text-purple-100">
        {adjustment.reason}
      </p>
    </PageCard>
  )
}

function TodayLogStatusCard({ log }: { log: WorkoutLogEntry | undefined }) {
  if (!log) {
    return (
      <div className="rounded-[20px] border border-stone-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.05]">
        <p className="text-sm font-semibold text-stone-950 dark:text-white">Not logged yet</p>
        <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
          Save the workout and recovery notes from the Log tab after training.
        </p>
      </div>
    )
  }

  const summaryParts = [
    log.actualDistanceKm !== undefined ? `${log.actualDistanceKm} km` : undefined,
    log.actualPaceMinPerKm,
    log.averageHr !== undefined ? `Avg HR ${log.averageHr}` : undefined,
  ].filter(Boolean)

  return (
    <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/75 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
          Logged
        </p>
        <StatusPill tone="success">{log.completionStatus}</StatusPill>
      </div>
      <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-300">
        {summaryParts.length ? summaryParts.join(' - ') : 'Workout log saved'}
      </p>
    </div>
  )
}

function DaySummaryCard({ dayPlan, events }: { dayPlan: DayPlan; events: SpecialEvent[] }) {
  const alcoholEvent = events.find(
    (event) => event.alcoholRisk === 'high' || event.alcoholRisk === 'moderate',
  )

  return (
    <PageCard className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
            Daily context
          </p>
          <h2 className="text-xl font-semibold text-stone-950 dark:text-white">{dayPlan.title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-neutral-300">
            {dayPlan.summary}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusPill tone={phaseTone[dayPlan.phase]}>{dayPlan.phase}</StatusPill>
          <StatusPill tone={intensityTone[dayPlan.intensity]}>{dayPlan.intensity}</StatusPill>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SummaryMetric
          label="Run"
          value={dayPlan.plannedRun ? `${dayPlan.plannedRun.plannedDistanceKm} km` : 'None'}
        />
        <SummaryMetric label="Strength" value={String(dayPlan.strengthSessionIds?.length ?? 0)} />
        <SummaryMetric label="Sleep" value={`${dayPlan.sleepTargetHours}h`} />
      </div>

      {events.length ? (
        <div className="space-y-2 rounded-[18px] border border-rose-100 bg-rose-50/70 p-3 dark:border-rose-300/20 dark:bg-rose-300/10">
          {events.map((event) => (
            <div key={event.id}>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                Context: {event.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-rose-700/80 dark:text-rose-100/80">
                {event.trainingImpact}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {alcoholEvent ? (
        <div className="rounded-[18px] border border-orange-100 bg-orange-50/80 p-3 dark:border-orange-300/25 dark:bg-orange-300/10">
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-200">
            Recovery warning: alcohol risk {alcoholEvent.alcoholRisk}
          </p>
          <p className="mt-1 text-xs leading-5 text-orange-700/80 dark:text-orange-100/80">
            Keep hydration, food, and sleep boringly good around this event.
          </p>
        </div>
      ) : null}
    </PageCard>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-stone-950 dark:text-white">{value}</p>
    </div>
  )
}

function RecoveryCard({ dayPlan, events }: { dayPlan: DayPlan; events: SpecialEvent[] }) {
  const alcoholEvent = events.find(
    (event) => event.alcoholRisk === 'high' || event.alcoholRisk === 'moderate',
  )
  const runRecoveryNotes = dayPlan.plannedRun?.recoveryNotes ?? []
  const notes = [...dayPlan.notes, ...runRecoveryNotes]

  return (
    <ActivityCard
      icon={ShieldCheck}
      pill={`${dayPlan.sleepTargetHours}h sleep`}
      subtitle={`Intensity: ${dayPlan.intensity}`}
      title="Recovery"
      tone={intensityTone[dayPlan.intensity]}
    >
      {notes.length ? (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li className="text-sm leading-5 text-stone-600 dark:text-neutral-300" key={note}>
              {note}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-6 text-stone-600 dark:text-neutral-300">
          Keep hydration, sleep, and Achilles checks simple today.
        </p>
      )}

      {alcoholEvent ? (
        <div className="mt-3 rounded-[18px] border border-orange-100 bg-orange-50/80 p-3 dark:border-orange-300/25 dark:bg-orange-300/10">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-600 dark:text-orange-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-200">
              Alcohol risk: {alcoholEvent.alcoholRisk}
            </p>
          </div>
          <p className="mt-1 text-sm leading-5 text-orange-700/80 dark:text-orange-100/80">
            Keep this non-dramatic: hydrate, eat real food, and resume training carefully.
          </p>
        </div>
      ) : null}
    </ActivityCard>
  )
}

function SpecialEventCard({ events }: { events: SpecialEvent[] }) {
  return (
    <ActivityCard
      icon={PartyPopper}
      pill={`${events.length} event${events.length > 1 ? 's' : ''}`}
      subtitle="Training context"
      title="Special event"
      tone="race"
    >
      <div className="space-y-3">
        {events.map((event) => (
          <div
            className="rounded-[18px] border border-rose-100 bg-rose-50/70 p-3 dark:border-rose-300/20 dark:bg-rose-300/10"
            key={event.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-950 dark:text-white">
                  {event.title}
                </p>
                <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-300">
                  {event.trainingImpact}
                </p>
              </div>
              <StatusPill tone="race">{event.category}</StatusPill>
            </div>
            {event.alcoholRisk ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-rose-700 dark:text-rose-200">
                Alcohol risk: {event.alcoholRisk}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </ActivityCard>
  )
}

function PlanOutsideRangeCard({
  onSelectedDateChange,
}: {
  onSelectedDateChange: (date: string) => void
}) {
  return (
    <ActivityCard
      icon={Moon}
      pill="Outside plan"
      subtitle="Select a date inside the marathon block"
      title={`Plan starts on ${formatDisplayDate(trainingPlanStartDate)}`}
      tone="neutral"
    >
      <p className="text-sm leading-6 text-stone-600 dark:text-neutral-300">
        The training plan runs from {formatDisplayDate(trainingPlanStartDate)} to{' '}
        {formatDisplayDate(trainingPlanEndDate)}.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton onClick={() => onSelectedDateChange('2026-06-02')} variant="secondary">
          Try 2 Jun
        </ActionButton>
        <ActionButton onClick={() => onSelectedDateChange('2026-10-18')} variant="secondary">
          Race day
        </ActionButton>
      </div>
    </ActivityCard>
  )
}

export default TodayPage
