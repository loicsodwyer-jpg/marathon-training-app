import {
  Briefcase,
  CheckCircle2,
  Coffee,
  Dumbbell,
  HeartPulse,
  Moon,
  PartyPopper,
  Route,
  Sparkles,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DailyScheduleBlock, ScheduleBlockCategory } from '../types/schedule'

type WeekBlockPillProps = {
  block: DailyScheduleBlock
  onOpen: () => void
}

const iconByCategory: Record<ScheduleBlockCategory, LucideIcon> = {
  wake: Sparkles,
  commute: Briefcase,
  work: Briefcase,
  meal: Coffee,
  run: Route,
  strength: Dumbbell,
  recovery: HeartPulse,
  social: PartyPopper,
  race: Trophy,
  rest: Moon,
  custom: Sparkles,
}

const classNameByCategory: Record<ScheduleBlockCategory, string> = {
  wake: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200',
  commute:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200',
  work: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200',
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

function WeekBlockPill({ block, onOpen }: WeekBlockPillProps) {
  const Icon = iconByCategory[block.category]
  const sourceLabel = getSourceLabel(block)

  return (
    <button
      className={`w-full rounded-[16px] border px-3 py-2.5 text-left transition hover:scale-[1.005] ${classNameByCategory[block.category]} ${
        block.completed ? 'ring-1 ring-emerald-300/35 saturate-75' : ''
      }`}
      onClick={onOpen}
      type="button"
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold leading-5">{block.title}</p>
              <p className="mt-0.5 text-xs font-semibold opacity-80">
                {block.startTime}-{block.endTime}
                {sourceLabel ? ` - ${sourceLabel}` : ''}
              </p>
            </div>
            {block.completed ? (
              <CheckCircle2
                className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300"
                aria-hidden="true"
              />
            ) : null}
          </div>
          {block.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-4 opacity-75">{block.description}</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function getSourceLabel(block: DailyScheduleBlock) {
  if (block.source === 'custom') {
    return 'Custom'
  }

  if (
    (block.originalStartTime && block.startTime !== block.originalStartTime) ||
    (block.originalEndTime && block.endTime !== block.originalEndTime)
  ) {
    return 'Edited'
  }

  return undefined
}

export default WeekBlockPill
