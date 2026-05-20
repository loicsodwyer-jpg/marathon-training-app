import { Dumbbell, Timer, X } from 'lucide-react'
import type { StrengthSession } from '../types/training'
import type { LiveStrengthSessionResult } from '../types/liveStrength'
import { useLiveStrengthSession } from '../hooks/useLiveStrengthSession'
import { formatDisplayDate } from '../utils/dateUtils'
import {
  buildLiveStrengthSessionResult,
  liveStrengthSectionLabels,
} from '../utils/liveStrengthUtils'
import ExerciseStepCard from './ExerciseStepCard'
import LiveStrengthControls from './LiveStrengthControls'
import LiveStrengthExerciseVisual from './LiveStrengthExerciseVisual'
import LiveStrengthProgressBar from './LiveStrengthProgressBar'
import LiveStrengthSummary from './LiveStrengthSummary'
import StatusPill from './StatusPill'

type LiveStrengthSessionModalProps = {
  open: boolean
  session: StrengthSession | undefined
  date: string
  onClose: () => void
  onSaveResult: (result: LiveStrengthSessionResult) => void
}

function LiveStrengthSessionModal(props: LiveStrengthSessionModalProps) {
  if (!props.open || !props.session) {
    return null
  }

  return (
    <LiveStrengthSessionModalContent
      date={props.date}
      onClose={props.onClose}
      onSaveResult={props.onSaveResult}
      session={props.session}
    />
  )
}

function LiveStrengthSessionModalContent({
  date,
  onClose,
  onSaveResult,
  session,
}: Omit<LiveStrengthSessionModalProps, 'open' | 'session'> & { session: StrengthSession }) {
  const liveSession = useLiveStrengthSession(session, date)
  const { currentExercise, progress, state } = liveSession
  const isFinished = state.status === 'completed' || state.status === 'ended_early'
  const currentStepNumber = state.currentExerciseIndex + 1
  const nextSteps = state.steps.slice(state.currentExerciseIndex + 1, state.currentExerciseIndex + 4)
  const summaryResult = buildLiveStrengthSessionResult(state)

  return (
    <div
      aria-label="Live strength session"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex h-dvh justify-center bg-slate-950/80 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-sm"
      role="dialog"
    >
      <div className="flex h-[calc(100dvh-24px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-stone-50 shadow-[0_30px_100px_rgba(0,0,0,0.45)] dark:bg-slate-900">
        <header className="shrink-0 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
                Live strength
              </p>
              <h2 className="truncate text-base font-semibold text-stone-950 dark:text-white">
                {session.shortTitle} - {formatDisplayDate(date)}
              </h2>
            </div>
            <button
              aria-label="Close live strength session"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(28px+env(safe-area-inset-bottom))]">
          {isFinished ? (
            <LiveStrengthSummary
              onContinue={liveSession.continueSession}
              onDiscard={onClose}
              onSave={onSaveResult}
              result={summaryResult}
            />
          ) : (
            <div className="space-y-4">
              <section className="rounded-[24px] border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <StatusPill tone="strength">{state.status.replace('_', ' ')}</StatusPill>
                    <h3 className="mt-2 text-xl font-semibold text-stone-950 dark:text-white">
                      {session.title}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-300">
                      {session.focus}
                    </p>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-purple-50 text-purple-700 ring-1 ring-purple-100 dark:bg-purple-300/10 dark:text-purple-200 dark:ring-purple-300/20">
                    <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
                <div className="mt-4">
                  <LiveStrengthProgressBar percent={progress.completionPercent} />
                </div>
              </section>

              {currentExercise ? (
                <>
                  <LiveStrengthExerciseVisual
                    exerciseName={currentExercise.exerciseName}
                    visualType={currentExercise.visualType}
                  />

                  <section className="rounded-[26px] border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-slate-500">
                          Exercise {currentStepNumber} / {state.steps.length}
                        </p>
                        <h3 className="mt-1 text-2xl font-semibold text-stone-950 dark:text-white">
                          {currentExercise.exerciseName}
                        </h3>
                      </div>
                      <StatusPill tone="strength">
                        {liveStrengthSectionLabels[currentExercise.section]}
                      </StatusPill>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Metric label="Set" value={`${currentExercise.completedSets + 1}/${currentExercise.sets}`} />
                      <Metric label="Reps" value={currentExercise.reps} />
                      <Metric label="Rest" value={formatRest(currentExercise.restSeconds)} />
                    </div>

                    {currentExercise.notes ? (
                      <p className="mt-4 rounded-[18px] border border-purple-100 bg-purple-50/70 p-3 text-sm leading-5 text-purple-800 dark:border-purple-300/20 dark:bg-purple-300/10 dark:text-purple-100">
                        {currentExercise.notes}
                      </p>
                    ) : null}
                  </section>
                </>
              ) : null}

              {state.status === 'resting' ? (
                <section className="rounded-[28px] border border-cyan-100 bg-cyan-50 p-5 text-center dark:border-cyan-300/25 dark:bg-cyan-300/10">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-[18px] bg-white text-cyan-700 ring-1 ring-cyan-100 dark:bg-slate-950/35 dark:text-cyan-200 dark:ring-cyan-300/20">
                    <Timer className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:text-cyan-200">
                    Rest timer
                  </p>
                  <p className="mt-1 text-5xl font-semibold text-stone-950 dark:text-white">
                    {formatTimer(state.currentRestSecondsRemaining)}
                  </p>
                  <button
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[18px] border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-300/25 dark:bg-white/[0.06] dark:text-cyan-200 dark:hover:bg-cyan-300/10"
                    onClick={liveSession.skipRest}
                    type="button"
                  >
                    Skip rest
                  </button>
                </section>
              ) : null}

              {state.status === 'paused' ? (
                <div className="rounded-[22px] border border-orange-100 bg-orange-50 p-4 text-sm font-semibold text-orange-700 dark:border-orange-300/25 dark:bg-orange-300/10 dark:text-orange-200">
                  Paused. Resume when you are ready.
                </div>
              ) : null}

              <LiveStrengthControls
                canCompleteSet={Boolean(currentExercise)}
                canGoNext={state.currentExerciseIndex < state.steps.length - 1}
                canGoPrevious={state.currentExerciseIndex > 0}
                onCompleteSet={liveSession.completeCurrentSet}
                onEndSession={liveSession.endSession}
                onNextExercise={liveSession.nextExercise}
                onPause={liveSession.pause}
                onPreviousExercise={liveSession.previousExercise}
                onResume={liveSession.resume}
                onSkipExercise={liveSession.skipExercise}
                onStart={liveSession.start}
                status={state.status}
              />

              {nextSteps.length ? (
                <section className="space-y-2">
                  <div>
                    <h3 className="text-base font-semibold text-stone-950 dark:text-white">
                      Up next
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-slate-400">
                      The next few movements in this session.
                    </p>
                  </div>
                  {nextSteps.map((step) => (
                    <ExerciseStepCard key={step.id} step={step} />
                  ))}
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.06]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-stone-950 dark:text-white">
        {value}
      </p>
    </div>
  )
}

function formatRest(seconds: number) {
  return seconds > 0 ? formatTimer(seconds) : 'None'
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = String(seconds % 60).padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

export default LiveStrengthSessionModal
