import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  SkipForward,
  Square,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { LiveStrengthSessionStatus } from '../types/liveStrength'

type LiveStrengthControlsProps = {
  status: LiveStrengthSessionStatus
  canCompleteSet: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onCompleteSet: () => void
  onSkipExercise: () => void
  onPreviousExercise: () => void
  onNextExercise: () => void
  onEndSession: () => void
}

function LiveStrengthControls({
  status,
  canCompleteSet,
  canGoPrevious,
  canGoNext,
  onStart,
  onPause,
  onResume,
  onCompleteSet,
  onSkipExercise,
  onPreviousExercise,
  onNextExercise,
  onEndSession,
}: LiveStrengthControlsProps) {
  const isStarted = status !== 'not_started'
  const isFinished = status === 'completed' || status === 'ended_early'

  if (isFinished) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {!isStarted ? (
          <ControlButton
            icon={<Play className="h-5 w-5" aria-hidden="true" />}
            label="Start"
            onClick={onStart}
            tone="primary"
          />
        ) : status === 'paused' ? (
          <ControlButton
            icon={<Play className="h-5 w-5" aria-hidden="true" />}
            label="Resume"
            onClick={onResume}
            tone="primary"
          />
        ) : (
          <ControlButton
            icon={<Pause className="h-5 w-5" aria-hidden="true" />}
            label="Pause"
            onClick={onPause}
            tone="secondary"
          />
        )}

        <ControlButton
          disabled={!isStarted || status === 'paused' || status === 'resting' || !canCompleteSet}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          label="Complete set"
          onClick={onCompleteSet}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ControlButton
          disabled={!canGoPrevious}
          icon={<ChevronLeft className="h-5 w-5" aria-hidden="true" />}
          label="Previous"
          onClick={onPreviousExercise}
          tone="secondary"
        />
        <ControlButton
          disabled={!isStarted}
          icon={<SkipForward className="h-5 w-5" aria-hidden="true" />}
          label="Skip"
          onClick={onSkipExercise}
          tone="warning"
        />
        <ControlButton
          disabled={!canGoNext}
          icon={<ChevronRight className="h-5 w-5" aria-hidden="true" />}
          label="Next"
          onClick={onNextExercise}
          tone="secondary"
        />
      </div>

      <ControlButton
        disabled={!isStarted}
        icon={<Square className="h-5 w-5" aria-hidden="true" />}
        label="End session"
        onClick={onEndSession}
        tone="danger"
      />
    </div>
  )
}

function ControlButton({
  disabled = false,
  icon,
  label,
  onClick,
  tone,
}: {
  disabled?: boolean
  icon: ReactNode
  label: string
  onClick: () => void
  tone: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}) {
  const toneClassName = {
    primary:
      'border-purple-500 bg-purple-600 text-white shadow-[0_18px_45px_rgba(126,34,206,0.22)] hover:bg-purple-500',
    secondary:
      'border-stone-200 bg-white text-stone-800 hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100 dark:hover:bg-white/[0.1]',
    success:
      'border-emerald-200 bg-emerald-500 text-white hover:bg-emerald-400 dark:border-emerald-300/25',
    warning:
      'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-300/25 dark:bg-orange-300/10 dark:text-orange-200 dark:hover:bg-orange-300/15',
    danger:
      'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-300/25 dark:bg-rose-300/10 dark:text-rose-200 dark:hover:bg-rose-300/15',
  }[tone]

  return (
    <button
      aria-label={label}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[20px] border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${toneClassName}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}

export default LiveStrengthControls
