import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  LiveStrengthExerciseStep,
  LiveStrengthSessionState,
  LiveStrengthSessionStatus,
} from '../types/liveStrength'
import type { StrengthSession } from '../types/training'
import {
  calculateLiveStrengthProgress,
  canCompleteSession,
  createLiveStrengthSteps,
  getCurrentExercise,
} from '../utils/liveStrengthUtils'

function createInitialState(session: StrengthSession, date: string): LiveStrengthSessionState {
  return {
    sessionId: session.id,
    sessionTitle: session.shortTitle,
    date,
    status: 'not_started',
    currentExerciseIndex: 0,
    currentRestSecondsRemaining: 0,
    isTimerRunning: false,
    steps: createLiveStrengthSteps(session),
    skippedExerciseIds: [],
    completedExerciseIds: [],
  }
}

export function useLiveStrengthSession(session: StrengthSession, date: string) {
  const [state, setState] = useState<LiveStrengthSessionState>(() =>
    createInitialState(session, date),
  )
  const previousRunningStatusRef = useRef<LiveStrengthSessionStatus>('active')

  useEffect(() => {
    if (state.status !== 'resting' || !state.isTimerRunning) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setState((currentState) => {
        if (currentState.status !== 'resting' || !currentState.isTimerRunning) {
          return currentState
        }

        const nextSeconds = Math.max(0, currentState.currentRestSecondsRemaining - 1)

        if (nextSeconds === 0) {
          return {
            ...currentState,
            status: 'active',
            currentRestSecondsRemaining: 0,
            isTimerRunning: false,
          }
        }

        return {
          ...currentState,
          currentRestSecondsRemaining: nextSeconds,
        }
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [state.isTimerRunning, state.status])

  const start = useCallback(() => {
    setState((currentState) => {
      if (currentState.status !== 'not_started') {
        return currentState
      }

      return {
        ...currentState,
        status: 'active',
        startedAt: new Date().toISOString(),
      }
    })
  }, [])

  const pause = useCallback(() => {
    setState((currentState) => {
      if (currentState.status !== 'active' && currentState.status !== 'resting') {
        return currentState
      }

      previousRunningStatusRef.current = currentState.status

      return {
        ...currentState,
        status: 'paused',
        isTimerRunning: false,
      }
    })
  }, [])

  const resume = useCallback(() => {
    setState((currentState) => {
      if (currentState.status !== 'paused') {
        return currentState
      }

      const resumedStatus = previousRunningStatusRef.current === 'resting' ? 'resting' : 'active'

      return {
        ...currentState,
        status: resumedStatus,
        isTimerRunning: resumedStatus === 'resting' && currentState.currentRestSecondsRemaining > 0,
      }
    })
  }, [])

  const completeCurrentSet = useCallback(() => {
    setState((currentState) => completeSetForState(currentState))
  }, [])

  const skipRest = useCallback(() => {
    setState((currentState) => {
      if (currentState.status !== 'resting') {
        return currentState
      }

      return {
        ...currentState,
        status: 'active',
        currentRestSecondsRemaining: 0,
        isTimerRunning: false,
      }
    })
  }, [])

  const skipExercise = useCallback(() => {
    setState((currentState) => {
      const currentStep = getCurrentExercise(currentState)

      if (!currentStep) {
        return currentState
      }

      const nextSteps = updateStep(currentState.steps, currentState.currentExerciseIndex, {
        status: 'skipped',
      })
      const nextIndex = findNextAvailableStepIndex(nextSteps, currentState.currentExerciseIndex + 1)

      return {
        ...currentState,
        status: nextIndex === undefined ? getEndedStatus(currentState) : 'active',
        endedAt: nextIndex === undefined ? new Date().toISOString() : currentState.endedAt,
        currentExerciseIndex: nextIndex ?? currentState.currentExerciseIndex,
        currentRestSecondsRemaining: 0,
        isTimerRunning: false,
        steps: nextSteps,
        skippedExerciseIds: uniqueIds([...currentState.skippedExerciseIds, currentStep.id]),
      }
    })
  }, [])

  const previousExercise = useCallback(() => {
    setState((currentState) => {
      const previousIndex = Math.max(0, currentState.currentExerciseIndex - 1)

      return {
        ...currentState,
        status: currentState.status === 'not_started' ? 'not_started' : 'active',
        currentExerciseIndex: previousIndex,
        currentRestSecondsRemaining: 0,
        isTimerRunning: false,
      }
    })
  }, [])

  const nextExercise = useCallback(() => {
    setState((currentState) => {
      const nextIndex = Math.min(currentState.steps.length - 1, currentState.currentExerciseIndex + 1)

      return {
        ...currentState,
        status: currentState.status === 'not_started' ? 'not_started' : 'active',
        currentExerciseIndex: nextIndex,
        currentRestSecondsRemaining: 0,
        isTimerRunning: false,
      }
    })
  }, [])

  const endSession = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      status: getEndedStatus(currentState),
      endedAt: new Date().toISOString(),
      currentRestSecondsRemaining: 0,
      isTimerRunning: false,
    }))
  }, [])

  const continueSession = useCallback(() => {
    setState((currentState) => {
      if (currentState.status !== 'completed' && currentState.status !== 'ended_early') {
        return currentState
      }

      return {
        ...currentState,
        status: 'active',
        endedAt: undefined,
      }
    })
  }, [])

  const resetSession = useCallback(() => {
    setState(createInitialState(session, date))
  }, [date, session])

  return {
    state,
    currentExercise: getCurrentExercise(state),
    progress: calculateLiveStrengthProgress(state),
    canComplete: canCompleteSession(state),
    start,
    pause,
    resume,
    completeCurrentSet,
    skipRest,
    skipExercise,
    previousExercise,
    nextExercise,
    endSession,
    continueSession,
    resetSession,
  }
}

function completeSetForState(state: LiveStrengthSessionState): LiveStrengthSessionState {
  if (state.status !== 'active' && state.status !== 'resting') {
    return state
  }

  const currentStep = getCurrentExercise(state)

  if (!currentStep) {
    return state
  }

  const nextCompletedSets = Math.min(currentStep.sets, currentStep.completedSets + 1)
  const isExerciseComplete = nextCompletedSets >= currentStep.sets
  const nextSteps = updateStep(state.steps, state.currentExerciseIndex, {
    completedSets: nextCompletedSets,
    status: isExerciseComplete ? 'completed' : 'active',
  })

  if (!isExerciseComplete) {
    return {
      ...state,
      status: currentStep.restSeconds > 0 ? 'resting' : 'active',
      currentRestSecondsRemaining: currentStep.restSeconds,
      isTimerRunning: currentStep.restSeconds > 0,
      steps: nextSteps,
    }
  }

  const nextIndex = findNextAvailableStepIndex(nextSteps, state.currentExerciseIndex + 1)

  return {
    ...state,
    status: nextIndex === undefined ? 'completed' : 'active',
    endedAt: nextIndex === undefined ? new Date().toISOString() : state.endedAt,
    currentExerciseIndex: nextIndex ?? state.currentExerciseIndex,
    currentRestSecondsRemaining: 0,
    isTimerRunning: false,
    steps: nextSteps,
    completedExerciseIds: uniqueIds([...state.completedExerciseIds, currentStep.id]),
  }
}

function updateStep(
  steps: LiveStrengthExerciseStep[],
  stepIndex: number,
  updates: Partial<LiveStrengthExerciseStep>,
) {
  return steps.map((step, index) => (index === stepIndex ? { ...step, ...updates } : step))
}

function findNextAvailableStepIndex(
  steps: LiveStrengthExerciseStep[],
  startIndex: number,
): number | undefined {
  const nextIndex = steps.findIndex(
    (step, index) => index >= startIndex && step.status !== 'completed' && step.status !== 'skipped',
  )

  return nextIndex >= 0 ? nextIndex : undefined
}

function getEndedStatus(state: LiveStrengthSessionState): 'completed' | 'ended_early' {
  return calculateLiveStrengthProgress(state).completionPercent >= 70 ? 'completed' : 'ended_early'
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)]
}
