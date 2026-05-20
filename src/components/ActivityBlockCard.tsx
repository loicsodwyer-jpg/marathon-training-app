import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, Circle, Edit3, GripVertical } from 'lucide-react'
import type { DailyScheduleBlock, ScheduleBlockCategory } from '../types/schedule'
import { calculateDurationMinutes } from '../utils/scheduleTimeUtils'

type ActivityBlockCardProps = {
  block: DailyScheduleBlock
  completionSource?: 'manual' | 'logged'
  displayCompleted?: boolean
  hasOverlap: boolean
  isEdited: boolean
  onClick: () => void
  onToggleCompleted: () => void
  visualHeightPx?: number
}

const categoryClassNames: Record<ScheduleBlockCategory, string> = {
  wake: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200',
  commute:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-slate-200',
  work: 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-300/20 dark:bg-blue-300/10 dark:text-blue-200',
  meal: 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
  run: 'border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-200',
  strength:
    'border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-300/25 dark:bg-purple-300/10 dark:text-purple-200',
  recovery:
    'border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-300/25 dark:bg-orange-300/10 dark:text-orange-200',
  social:
    'border-pink-100 bg-pink-50 text-pink-700 dark:border-pink-300/25 dark:bg-pink-300/10 dark:text-pink-200',
  race: 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-300/25 dark:bg-rose-300/10 dark:text-rose-200',
  rest: 'border-stone-200 bg-stone-100 text-stone-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200',
  custom:
    'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-300/25 dark:bg-sky-300/10 dark:text-sky-200',
}

function ActivityBlockCard({
  block,
  completionSource,
  displayCompleted,
  hasOverlap,
  isEdited,
  onClick,
  onToggleCompleted,
  visualHeightPx,
}: ActivityBlockCardProps) {
  const isDraggable = block.isMovable !== false
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    disabled: !isDraggable,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
  }
  const sourceLabel = block.source === 'custom' ? 'Custom' : isEdited ? 'Edited' : 'Planned'
  const isCompleted = displayCompleted ?? Boolean(block.completed)
  const completedLabel = completionSource === 'logged' ? 'Logged' : 'Done'
  const density = getBlockDensity(block, visualHeightPx)
  const showBadges = density === 'medium' || density === 'large'
  const showDescription = density === 'medium' || density === 'large'
  const showEditIcon = density !== 'tiny'

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] border px-2.5 py-2 text-left transition ${
        categoryClassNames[block.category]
      } ${isDragging ? 'scale-[1.02] opacity-85 shadow-xl' : 'shadow-sm'} ${
        isCompleted ? 'ring-1 ring-emerald-300/35 saturate-75' : ''
      }`}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex min-h-0 flex-1 gap-2">
        {isDraggable ? (
          <button
            aria-label={`Move ${block.title}`}
            className="flex shrink-0 touch-none items-start pt-0.5 opacity-75"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}

        <button className="min-w-0 flex-1 overflow-hidden text-left" onClick={onClick} type="button">
          <div className={`flex items-center gap-1.5 ${showBadges ? 'flex-wrap' : 'min-w-0'}`}>
            <p className={`${density === 'tiny' ? 'text-xs leading-4' : 'text-sm leading-5'} truncate font-semibold`}>
              {block.title}
            </p>
            {showBadges ? (
              <>
                <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-85">
                  {sourceLabel}
                </span>
                {isCompleted ? (
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-200">
                    {completedLabel}
                  </span>
                ) : null}
                {hasOverlap ? (
                  <span className="rounded-full border border-orange-300/30 bg-orange-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-700 dark:text-orange-200">
                    Overlap
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
          {density !== 'tiny' ? (
            <p className="mt-0.5 truncate text-xs font-semibold opacity-80">
              {block.startTime}-{block.endTime}
            </p>
          ) : null}
          {showDescription && block.description ? (
            <p className={`${density === 'large' ? 'line-clamp-3' : 'line-clamp-1'} mt-1 text-xs leading-4 opacity-80`}>
              {block.description}
            </p>
          ) : null}
        </button>

        <div className="flex shrink-0 flex-col items-center justify-between gap-2">
          <button
            aria-label={isCompleted ? `Mark ${block.title} incomplete` : `Mark ${block.title} complete`}
            className={`rounded-full p-0.5 transition ${
              isCompleted
                ? 'text-emerald-600 dark:text-emerald-300'
                : 'opacity-75 hover:opacity-100'
            }`}
            onClick={onToggleCompleted}
            title={completionSource === 'logged' ? 'Completed from workout log' : undefined}
            type="button"
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          {showEditIcon ? (
            <button aria-label={`Edit ${block.title}`} className="opacity-75" onClick={onClick} type="button">
              <Edit3 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function getBlockDensity(block: DailyScheduleBlock, visualHeightPx: number | undefined) {
  const durationMinutes = calculateDurationMinutes(block.startTime, block.endTime)

  if (durationMinutes < 20 || (visualHeightPx !== undefined && visualHeightPx < 36)) {
    return 'tiny'
  }

  if (durationMinutes < 35 || (visualHeightPx !== undefined && visualHeightPx < 60)) {
    return 'small'
  }

  if (durationMinutes < 75 || (visualHeightPx !== undefined && visualHeightPx < 110)) {
    return 'medium'
  }

  return 'large'
}

export default ActivityBlockCard
