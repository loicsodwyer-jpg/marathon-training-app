import { Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { DayPlan } from '../types/training'
import type {
  AlcoholLevel,
  CompletionStatus,
  WorkoutLogEntry,
  WorkoutLogInput,
} from '../types/workoutLog'
import { calculatePaceMinPerKm, parseDurationToMinutes } from '../utils/timeFormatUtils'
import { getDistanceExecutionLabel, getPaceExecutionLabel } from '../utils/workoutLogUtils'
import ActionButton from './ActionButton'
import LogField, { inputClassName, textareaClassName } from './LogField'
import StatusPill from './StatusPill'

type WorkoutLogFormProps = {
  dayPlan: DayPlan | undefined
  existingLog: WorkoutLogEntry | undefined
  onDelete: () => void
  onSave: (input: WorkoutLogInput) => void
}

const completionStatuses: CompletionStatus[] = ['completed', 'partial', 'missed', 'rest', 'skipped']
const alcoholLevels: AlcoholLevel[] = ['none', 'light', 'moderate', 'heavy']

function stringifyNumber(value: number | undefined) {
  return value === undefined ? '' : String(value)
}

function parseOptionalNumber(value: string) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return undefined
  }

  const parsedValue = Number(trimmedValue.replace(',', '.'))
  return Number.isFinite(parsedValue) ? parsedValue : Number.NaN
}

function WorkoutLogForm({ dayPlan, existingLog, onDelete, onSave }: WorkoutLogFormProps) {
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>(
    existingLog?.completionStatus ?? (dayPlan?.plannedRun ? 'completed' : 'rest'),
  )
  const [runCompleted, setRunCompleted] = useState(existingLog?.runCompleted ?? false)
  const [strengthCompleted, setStrengthCompleted] = useState(existingLog?.strengthCompleted ?? false)
  const [actualDistanceKm, setActualDistanceKm] = useState(stringifyNumber(existingLog?.actualDistanceKm))
  const [actualDuration, setActualDuration] = useState(stringifyNumber(existingLog?.actualDurationMinutes))
  const [averageHr, setAverageHr] = useState(stringifyNumber(existingLog?.averageHr))
  const [maxHr, setMaxHr] = useState(stringifyNumber(existingLog?.maxHr))
  const [alcoholYesterday, setAlcoholYesterday] = useState<AlcoholLevel>(
    existingLog?.alcoholYesterday ?? 'none',
  )
  const [notes, setNotes] = useState(existingLog?.notes ?? '')
  const [stravaUrl, setStravaUrl] = useState(existingLog?.stravaUrl ?? '')
  const [error, setError] = useState<string | undefined>()

  const parsedDistance = parseOptionalNumber(actualDistanceKm)
  const parsedDuration = parseDurationToMinutes(actualDuration)
  const livePace = useMemo(() => {
    if (
      parsedDistance === undefined ||
      parsedDuration === undefined ||
      Number.isNaN(parsedDistance) ||
      parsedDistance <= 0 ||
      parsedDuration <= 0
    ) {
      return undefined
    }

    return calculatePaceMinPerKm(parsedDistance, parsedDuration)
  }, [parsedDistance, parsedDuration])

  const validateNumber = (
    label: string,
    value: number | undefined,
    minimum: number,
    maximum?: number,
  ) => {
    if (value === undefined) {
      return undefined
    }

    if (Number.isNaN(value) || value < minimum || (maximum !== undefined && value > maximum)) {
      return maximum === undefined
        ? `${label} must be ${minimum} or higher.`
        : `${label} must be between ${minimum} and ${maximum}.`
    }

    return undefined
  }

  const handleSubmit = () => {
    const distance = parseOptionalNumber(actualDistanceKm)
    const duration = parseDurationToMinutes(actualDuration)
    const avgHr = parseOptionalNumber(averageHr)
    const parsedMaxHr = parseOptionalNumber(maxHr)
    const validationError =
      validateNumber('Distance', distance, 0) ??
      (actualDuration.trim() && duration === undefined ? 'Duration is not valid.' : undefined) ??
      validateNumber('Duration', duration, 0) ??
      validateNumber('Average HR', avgHr, 30, 240) ??
      validateNumber('Max HR', parsedMaxHr, 30, 240)

    if (validationError) {
      setError(validationError)
      return
    }

    setError(undefined)
    onSave({
      completionStatus,
      runCompleted,
      strengthCompleted,
      actualDistanceKm: distance,
      actualDurationMinutes: duration,
      averageHr: avgHr,
      maxHr: parsedMaxHr,
      alcoholYesterday,
      notes,
      stravaUrl,
    })
  }

  return (
    <div className="space-y-5 rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.07)] dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
      <div>
        <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
          {existingLog ? 'Edit log' : 'Create log'}
        </h2>
        <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
          Enter the data manually from Garmin, Strava, or your watch.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-stone-700 dark:text-slate-200">
          Completion status
        </p>
        <div className="grid grid-cols-2 gap-2">
          {completionStatuses.map((status) => (
            <SegmentButton
              isActive={completionStatus === status}
              key={status}
              label={status}
              onClick={() => setCompletionStatus(status)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ToggleButton
          isActive={runCompleted}
          label="Run completed"
          onClick={() => setRunCompleted((current) => !current)}
        />
        <ToggleButton
          isActive={strengthCompleted}
          label="Strength completed"
          onClick={() => setStrengthCompleted((current) => !current)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LogField label="Distance km">
          <input
            className={inputClassName}
            inputMode="decimal"
            onChange={(event) => setActualDistanceKm(event.target.value)}
            placeholder="6.2"
            type="number"
            value={actualDistanceKm}
          />
        </LogField>
        <LogField label="Duration" hint="Minutes, mm:ss, or h:mm:ss">
          <input
            className={inputClassName}
            onChange={(event) => setActualDuration(event.target.value)}
            placeholder="31 or 31:00"
            type="text"
            value={actualDuration}
          />
        </LogField>
      </div>

      <div className="rounded-[18px] border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-300/20 dark:bg-cyan-300/10">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-stone-700 dark:text-slate-200">
            Calculated pace
          </span>
          <StatusPill tone={livePace ? 'running' : 'neutral'}>{livePace ?? 'Waiting'}</StatusPill>
        </div>
        <p className="mt-2 text-sm leading-5 text-stone-600 dark:text-slate-300">
          {getDistanceExecutionLabel(dayPlan?.plannedRun?.plannedDistanceKm, parsedDistance)}
          {' · '}
          {getPaceExecutionLabel(dayPlan?.plannedRun, livePace)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LogField label="Average HR">
          <input className={inputClassName} onChange={(event) => setAverageHr(event.target.value)} type="number" value={averageHr} />
        </LogField>
        <LogField label="Max HR">
          <input className={inputClassName} onChange={(event) => setMaxHr(event.target.value)} type="number" value={maxHr} />
        </LogField>
      </div>

      <LogField label="Alcohol yesterday">
        <select
          className={inputClassName}
          onChange={(event) => setAlcoholYesterday(event.target.value as AlcoholLevel)}
          value={alcoholYesterday}
        >
          {alcoholLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </LogField>

      <LogField label="Strava URL">
        <input
          className={inputClassName}
          onChange={(event) => setStravaUrl(event.target.value)}
          placeholder="Optional"
          type="url"
          value={stravaUrl}
        />
      </LogField>

      <LogField label="Notes">
        <textarea
          className={textareaClassName}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Felt easy"
          value={notes}
        />
      </LogField>

      {error ? (
        <p className="rounded-[16px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2">
        <ActionButton icon={<Save className="h-5 w-5" />} onClick={handleSubmit}>
          Save log
        </ActionButton>
        {existingLog ? (
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200 dark:hover:bg-rose-300/15"
            onClick={onDelete}
            type="button"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete log
          </button>
        ) : null}
      </div>
    </div>
  )
}

function SegmentButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`h-11 rounded-[16px] text-sm font-semibold capitalize transition ${
        isActive
          ? 'bg-stone-950 text-white dark:bg-cyan-300 dark:text-slate-950'
          : 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1]'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function ToggleButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={isActive}
      className={`h-12 rounded-[18px] text-sm font-semibold transition ${
        isActive
          ? 'border border-emerald-300/30 bg-emerald-300/15 text-emerald-700 dark:text-emerald-200'
          : 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1]'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

export default WorkoutLogForm
