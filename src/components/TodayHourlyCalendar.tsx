import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Clock, Plus, RotateCcw } from 'lucide-react'
import ActivityBlockCard from './ActivityBlockCard'
import type { DailyScheduleBlock } from '../types/schedule'
import type { WorkoutLogEntry } from '../types/workoutLog'
import {
  getPositionedScheduleBlocks,
  type CalendarPositionedBlock,
} from '../utils/calendarLayoutUtils'
import { doBlocksOverlap } from '../utils/scheduleTimeUtils'

type TodayHourlyCalendarProps = {
  date: string
  effectiveBlocks: DailyScheduleBlock[]
  editedBlockIds: Set<string>
  hasChanges: boolean
  onAddActivity: () => void
  onEditBlock: (block: DailyScheduleBlock) => void
  onMoveBlock: (blockId: string, newStartTime: string) => void
  onResetDay: () => void
  onToggleBlockCompleted: (blockId: string) => void
  workoutLog?: WorkoutLogEntry
}

const DAY_START_HOUR = 6
const DAY_END_HOUR = 24
const HOUR_HEIGHT_PX = 96
const MINIMUM_BLOCK_HEIGHT_PX = 44
const LABEL_COLUMN_WIDTH_PX = 54
const COLUMN_GAP_PX = 6

const hours = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, index) => DAY_START_HOUR + index,
)
const dropSlots = Array.from({ length: (DAY_END_HOUR - DAY_START_HOUR) * 2 }, (_, index) => {
  const totalMinutes = DAY_START_HOUR * 60 + index * 30
  const hoursPart = Math.floor(totalMinutes / 60)
  const minutesPart = totalMinutes % 60
  return `${String(hoursPart).padStart(2, '0')}:${String(minutesPart).padStart(2, '0')}`
})

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function getOverlappingBlockIds(blocks: DailyScheduleBlock[]) {
  const overlappingBlockIds = new Set<string>()

  for (let index = 0; index < blocks.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < blocks.length; compareIndex += 1) {
      const firstBlock = blocks[index]
      const secondBlock = blocks[compareIndex]

      if (doBlocksOverlap(firstBlock, secondBlock)) {
        overlappingBlockIds.add(firstBlock.id)
        overlappingBlockIds.add(secondBlock.id)
      }
    }
  }

  return overlappingBlockIds
}

function isCompletedFromWorkoutLog(
  block: DailyScheduleBlock,
  workoutLog: WorkoutLogEntry | undefined,
) {
  if (!workoutLog) {
    return false
  }

  if (block.category === 'run') {
    const loggedAsDone =
      workoutLog.completionStatus === 'completed' || workoutLog.completionStatus === 'partial'

    return loggedAsDone && workoutLog.runCompleted
  }

  if (block.category === 'strength') {
    return workoutLog.strengthCompleted
  }

  return false
}

function TodayHourlyCalendar({
  date,
  effectiveBlocks,
  editedBlockIds,
  hasChanges,
  onAddActivity,
  onEditBlock,
  onMoveBlock,
  onResetDay,
  onToggleBlockCompleted,
  workoutLog,
}: TodayHourlyCalendarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
  )
  const positionedBlocks = getPositionedScheduleBlocks(effectiveBlocks, {
    dayStartHour: DAY_START_HOUR,
    dayEndHour: DAY_END_HOUR,
    hourHeightPx: HOUR_HEIGHT_PX,
    minimumBlockHeightPx: MINIMUM_BLOCK_HEIGHT_PX,
  })
  const overlappingBlockIds = getOverlappingBlockIds(effectiveBlocks)
  const timelineHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT_PX

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id

    if (!overId) {
      return
    }

    const overIdString = String(overId)

    if (!overIdString.startsWith('slot-')) {
      return
    }

    onMoveBlock(String(event.active.id), overIdString.replace('slot-', ''))
  }

  return (
    <section
      aria-label={`Hourly calendar for ${date}`}
      className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(49,55,70,0.07)] dark:border-white/10 dark:bg-neutral-900/85 dark:shadow-[0_22px_70px_rgba(0,0,0,0.35)]"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-neutral-200">
          <Clock className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-stone-950 dark:text-white">
            Hourly calendar
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
            Move, hide, add, and complete activities for this day.
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-400 dark:text-neutral-500">
            Tip: tap a block to edit or delete it. Drag the handle to another hour or half-hour.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-stone-950 px-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-neutral-950 dark:hover:bg-cyan-200"
          onClick={onAddActivity}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add activity
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1] dark:disabled:hover:bg-white/[0.06]"
          disabled={!hasChanges}
          onClick={onResetDay}
          type="button"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset day
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <div
          className="relative overflow-hidden rounded-[22px] border border-stone-100 bg-stone-50/70 dark:border-white/10 dark:bg-neutral-950/35"
          style={{ height: timelineHeight }}
        >
          {hours.map((hour, index) => (
            <HourLine hour={hour} index={index} key={hour} />
          ))}

          <div
            className="absolute bottom-0 top-0"
            style={{ left: LABEL_COLUMN_WIDTH_PX, right: 0 }}
          >
            {dropSlots.map((slot, index) => (
              <DropSlot key={slot} slot={slot} topPx={index * (HOUR_HEIGHT_PX / 2)} />
            ))}

            {positionedBlocks.map((block) => (
              <PositionedBlock
                block={block}
                hasOverlap={overlappingBlockIds.has(block.id)}
                isEdited={editedBlockIds.has(block.id)}
                key={block.id}
                onEditBlock={onEditBlock}
                onToggleBlockCompleted={onToggleBlockCompleted}
                workoutLog={workoutLog}
              />
            ))}
          </div>
        </div>
      </DndContext>
    </section>
  )
}

function HourLine({ hour, index }: { hour: number; index: number }) {
  const topPx = index * HOUR_HEIGHT_PX

  return (
    <div className="absolute left-0 right-0" style={{ top: topPx }}>
      <div className="grid grid-cols-[54px_1fr]">
        <div className="pr-2 pt-1 text-right text-[11px] font-semibold text-stone-400 dark:text-neutral-600">
          {formatHour(hour)}
        </div>
        <div className="border-t border-stone-200/80 dark:border-white/10" />
      </div>
    </div>
  )
}

function DropSlot({ slot, topPx }: { slot: string; topPx: number }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slot}`,
  })

  return (
    <div
      className={`absolute left-0 right-0 transition ${
        isOver ? 'bg-cyan-300/10 ring-1 ring-inset ring-cyan-300/30' : ''
      }`}
      ref={setNodeRef}
      style={{ top: topPx, height: HOUR_HEIGHT_PX / 2 }}
    />
  )
}

function PositionedBlock({
  block,
  hasOverlap,
  isEdited,
  onEditBlock,
  onToggleBlockCompleted,
  workoutLog,
}: {
  block: CalendarPositionedBlock
  hasOverlap: boolean
  isEdited: boolean
  onEditBlock: (block: DailyScheduleBlock) => void
  onToggleBlockCompleted: (blockId: string) => void
  workoutLog: WorkoutLogEntry | undefined
}) {
  const left = `calc(${block.leftPercent}% + ${block.columnIndex > 0 ? COLUMN_GAP_PX / 2 : 0}px)`
  const width = `calc(${block.widthPercent}% - ${
    block.columnCount > 1 ? COLUMN_GAP_PX : 0
  }px)`
  const isLoggedComplete = isCompletedFromWorkoutLog(block, workoutLog)

  return (
    <div
      className="absolute z-10"
      style={{
        top: block.topPx,
        height: block.heightPx,
        left,
        width,
      }}
    >
      <ActivityBlockCard
        block={block}
        completionSource={isLoggedComplete ? 'logged' : undefined}
        displayCompleted={Boolean(block.completed || isLoggedComplete)}
        hasOverlap={hasOverlap}
        isEdited={isEdited}
        onClick={() => onEditBlock(block)}
        onToggleCompleted={() => onToggleBlockCompleted(block.id)}
        visualHeightPx={block.heightPx}
      />
    </div>
  )
}

export default TodayHourlyCalendar
