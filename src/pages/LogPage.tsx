import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import AdjustedPlanBadge from '../components/AdjustedPlanBadge'
import AppDateInput from '../components/AppDateInput'
import ConfirmDialog from '../components/ConfirmDialog'
import PlannedSessionSummary from '../components/PlannedSessionSummary'
import SectionHeader from '../components/SectionHeader'
import StatusPill, { type StatusTone } from '../components/StatusPill'
import WorkoutLogForm from '../components/WorkoutLogForm'
import WorkoutLogSummary from '../components/WorkoutLogSummary'
import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import { useWorkoutLogs } from '../hooks/useWorkoutLogs'
import type { CompletionStatus, WorkoutLogInput } from '../types/workoutLog'
import { formatDisplayDate } from '../utils/dateUtils'
import { getDayAdjustmentInfo, getEffectiveDayPlan } from '../utils/effectiveTrainingPlanUtils'
import { getSpecialEventsForDate } from '../utils/trainingPlanUtils'
import { getCompletionLabel } from '../utils/workoutLogUtils'

type LogPageProps = {
  selectedDate: string
  onSelectedDateChange: (date: string) => void
}

type SaveMessage = {
  date: string
  text: string
}

const statusTone: Record<CompletionStatus | 'not_logged', StatusTone> = {
  completed: 'success',
  partial: 'warning',
  missed: 'warning',
  rest: 'neutral',
  skipped: 'neutral',
  not_logged: 'neutral',
}

function LogPage({ selectedDate, onSelectedDateChange }: LogPageProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState<SaveMessage | undefined>()
  const workoutLogs = useWorkoutLogs()
  const dayPlan = getEffectiveDayPlan(selectedDate)
  const dayAdjustment = getDayAdjustmentInfo(selectedDate)
  const events = getSpecialEventsForDate(selectedDate)
  const existingLog = workoutLogs.getLogForDate(selectedDate)
  const currentStatus = existingLog?.completionStatus ?? 'not_logged'

  const handleSave = (input: WorkoutLogInput) => {
    workoutLogs.saveLog(selectedDate, input)
    setSaveMessage({ date: selectedDate, text: 'Workout log saved locally.' })
  }

  const handleDelete = () => {
    workoutLogs.deleteLog(selectedDate)
    setIsDeleteDialogOpen(false)
    setSaveMessage({ date: selectedDate, text: 'Workout log deleted.' })
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        action={<StatusPill tone={statusTone[currentStatus]}>{getCompletionLabel(existingLog)}</StatusPill>}
        title="Log workout"
        subtitle={formatDisplayDate(selectedDate)}
      />

      <div className="space-y-3 rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.07)] dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
        <AppDateInput
          label="Select log date"
          maxDate={trainingPlanEndDate}
          minDate={trainingPlanStartDate}
          onChange={(date) => {
            if (date) {
              onSelectedDateChange(date)
            }
          }}
          quickDates={[
            { label: 'Plan start', date: trainingPlanStartDate },
            { label: 'Race day', date: trainingPlanEndDate },
          ]}
          value={selectedDate}
        />
      </div>

      <PlannedSessionSummary dayPlan={dayPlan} events={events} />

      {dayAdjustment ? (
        <div className="rounded-[20px] border border-purple-100 bg-purple-50/70 p-3 dark:border-purple-300/20 dark:bg-purple-300/10">
          <AdjustedPlanBadge />
          <p className="mt-2 text-sm leading-5 text-purple-800 dark:text-purple-100">
            Planned session reflects a local adjustment: {dayAdjustment.reason}
          </p>
        </div>
      ) : null}

      {existingLog ? <WorkoutLogSummary dayPlan={dayPlan} log={existingLog} /> : null}

      {saveMessage?.date === selectedDate ? (
        <div
          className="flex items-start gap-2 rounded-[18px] border border-emerald-100 bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{saveMessage.text}</span>
        </div>
      ) : null}

      <WorkoutLogForm
        dayPlan={dayPlan}
        existingLog={existingLog}
        key={`${selectedDate}-${existingLog?.updatedAt ?? 'new'}`}
        onDelete={() => setIsDeleteDialogOpen(true)}
        onSave={handleSave}
      />

      <ConfirmDialog
        confirmLabel="Delete log"
        description="This removes the saved workout log for this date. The training plan stays unchanged."
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        open={isDeleteDialogOpen}
        title="Delete workout log?"
        tone="danger"
      />
    </div>
  )
}

export default LogPage
