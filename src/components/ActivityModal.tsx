import { useState } from 'react'
import type {
  DailyScheduleBlock,
  EditableScheduleBlockInput,
  EditableScheduleBlockPatch,
  ScheduleBlockCategory,
} from '../types/schedule'
import { timeToMinutes } from '../utils/scheduleTimeUtils'

type ActivityModalMode = 'add' | 'edit'

type ActivityModalProps = {
  mode: ActivityModalMode
  block?: DailyScheduleBlock
  defaultStartTime?: string
  isOpen: boolean
  hasTimingOverride?: boolean
  onAdd: (input: EditableScheduleBlockInput) => void
  onClose: () => void
  onRequestDelete: (block: DailyScheduleBlock) => void
  onResetTiming: (blockId: string) => void
  onSave: (blockId: string, updates: EditableScheduleBlockPatch) => void
}

const categoryOptions: ScheduleBlockCategory[] = [
  'wake',
  'commute',
  'work',
  'meal',
  'run',
  'strength',
  'recovery',
  'social',
  'race',
  'rest',
  'custom',
]

function ActivityModal({
  mode,
  block,
  defaultStartTime = '19:00',
  isOpen,
  hasTimingOverride = false,
  onAdd,
  onClose,
  onRequestDelete,
  onResetTiming,
  onSave,
}: ActivityModalProps) {
  const [title, setTitle] = useState(block?.title ?? '')
  const [category, setCategory] = useState<ScheduleBlockCategory>(block?.category ?? 'custom')
  const [startTime, setStartTime] = useState(block?.startTime ?? defaultStartTime)
  const [endTime, setEndTime] = useState(block?.endTime ?? '20:00')
  const [description, setDescription] = useState(block?.description ?? '')
  const [completed, setCompleted] = useState(block?.completed ?? false)
  const [error, setError] = useState<string | undefined>()
  const isEditingPlannedBlock = mode === 'edit' && block?.source === 'planned'
  const isEditingCustomBlock = mode === 'edit' && block?.source === 'custom'
  const sourceLabel =
    mode === 'add' ? 'Custom' : block?.source === 'custom' ? 'Custom' : hasTimingOverride ? 'Edited' : 'Planned'

  if (!isOpen) {
    return null
  }

  const validate = () => {
    if (!title.trim()) {
      return 'Title is required.'
    }

    if (!startTime || !endTime) {
      return 'Start and end time are required.'
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return 'End time must be after start time.'
    }

    if (timeToMinutes(startTime) < 6 * 60 || timeToMinutes(endTime) > 23 * 60 + 59) {
      return 'Time must stay between 06:00 and 23:59.'
    }

    return undefined
  }

  const handleSubmit = () => {
    const validationError = validate()

    if (validationError) {
      setError(validationError)
      return
    }

    if (mode === 'add') {
      onAdd({
        title,
        category,
        startTime,
        endTime,
        description,
      })
      onClose()
      return
    }

    if (!block) {
      return
    }

    onSave(block.id, {
      title: block.source === 'custom' ? title : undefined,
      category,
      startTime,
      endTime,
      description,
      completed,
    })
    onClose()
  }

  return (
    <div
      aria-label="Activity editor"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex h-dvh items-end bg-slate-950/70 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:justify-center"
      role="dialog"
    >
      <div className="max-h-[calc(100dvh-28px)] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/10 bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
              {mode === 'add' ? 'Add activity' : 'Edit activity'}
            </h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
              {mode === 'add' ? 'Create a custom day block.' : `${sourceLabel} block`}
            </p>
          </div>
          <button
            className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 dark:border-white/10 dark:text-slate-300"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-slate-200">
              Title
            </span>
            <input
              className="h-11 w-full rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-cyan-300"
              onChange={(event) => setTitle(event.target.value)}
              readOnly={isEditingPlannedBlock}
              type="text"
              value={title}
            />
          </label>

          {mode === 'edit' ? (
            <button
              aria-pressed={completed}
              className={`flex h-11 w-full items-center justify-center rounded-[16px] border text-sm font-semibold transition ${
                completed
                  ? 'border-emerald-300/30 bg-emerald-300/15 text-emerald-700 dark:text-emerald-200'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]'
              }`}
              onClick={() => setCompleted((current) => !current)}
              type="button"
            >
              {completed ? 'Marked complete' : 'Mark complete'}
            </button>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-slate-200">
              Category
            </span>
            <select
              className="h-11 w-full rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-cyan-300"
              onChange={(event) => setCategory(event.target.value as ScheduleBlockCategory)}
              value={category}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-slate-200">
                Start time
              </span>
              <input
                className="h-11 w-full rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-cyan-300"
                onChange={(event) => setStartTime(event.target.value)}
                type="time"
                value={startTime}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-slate-200">
                End time
              </span>
              <input
                className="h-11 w-full rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-cyan-300"
                onChange={(event) => setEndTime(event.target.value)}
                type="time"
                value={endTime}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-slate-200">
              Description
            </span>
            <textarea
              className="min-h-24 w-full rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-950 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-cyan-300"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>

          {error ? (
            <p className="rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-2">
          <button
            className="h-12 w-full rounded-[18px] bg-stone-950 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
            onClick={handleSubmit}
            type="button"
          >
            {mode === 'add' ? 'Add activity' : 'Save changes'}
          </button>

          {isEditingPlannedBlock && hasTimingOverride && block ? (
            <button
              className="h-11 w-full rounded-[16px] border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
              onClick={() => {
                onResetTiming(block.id)
                onClose()
              }}
              type="button"
            >
              Reset timing
            </button>
          ) : null}

          {isEditingCustomBlock && block ? (
            <button
              className="h-11 w-full rounded-[16px] border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200 dark:hover:bg-rose-300/15"
              onClick={() => onRequestDelete(block)}
              type="button"
            >
              Delete activity
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ActivityModal
