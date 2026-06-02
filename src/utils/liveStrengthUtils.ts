import type {
  LiveStrengthExerciseSection,
  LiveStrengthExerciseStep,
  LiveStrengthProgress,
  LiveStrengthSessionResult,
  LiveStrengthSessionState,
  StrengthSessionFeeling,
} from '../types/liveStrength'
import type { StrengthExercise, StrengthSession } from '../types/training'
import type { WorkoutLogEntry, WorkoutLogInput } from '../types/workoutLog'
import { getExerciseVisualType } from './exerciseVisualUtils'

const completionThresholdPercent = 70

export const liveStrengthSectionLabels: Record<LiveStrengthExerciseSection, string> = {
  warmup: 'Warm-up',
  main: 'Main strength',
  calf_achilles: 'Calf/Achilles',
  core_mobility: 'Core/mobility',
  cooldown: 'Cooldown',
}

export const strengthFeelingLabels: Record<StrengthSessionFeeling, string> = {
  very_good: 'Very good',
  good: 'Good',
  okay: 'Okay',
  hard: 'Hard',
  bad: 'Bad',
}

export function createLiveStrengthSteps(session: StrengthSession): LiveStrengthExerciseStep[] {
  const exerciseSteps = session.exercises.map((exercise, index) =>
    createExerciseStep(session.id, exercise, index),
  )

  const hasWarmupStep = exerciseSteps.some((step) => step.section === 'warmup')
  const warmupSteps = hasWarmupStep
    ? []
    : (session.warmup ?? []).map((item, index) =>
        createTextStep(session.id, 'warmup', item, index, 'Warm-up'),
      )

  const cooldownSteps = (session.cooldown ?? []).map((item, index) =>
    createTextStep(session.id, 'cooldown', item, index, 'Cooldown'),
  )

  return [...warmupSteps, ...exerciseSteps, ...cooldownSteps].map((step, index) => ({
    ...step,
    status: index === 0 ? 'active' : 'pending',
  }))
}

export function parseSets(value: string): number {
  const match = value.match(/\d+/)
  const parsedValue = match ? Number(match[0]) : 1

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1
}

export function parseRestSeconds(value: string, section: LiveStrengthExerciseSection): number {
  const lowerValue = value.toLowerCase()

  if (
    !value.trim() ||
    lowerValue.includes('as needed') ||
    lowerValue.includes('easy transition')
  ) {
    return getFallbackRestSeconds(section)
  }

  const match = lowerValue.match(/\d+/)

  if (!match) {
    return getFallbackRestSeconds(section)
  }

  const amount = Number(match[0])

  if (!Number.isFinite(amount)) {
    return getFallbackRestSeconds(section)
  }

  if (lowerValue.includes('min')) {
    return amount * 60
  }

  return amount
}

export function getExerciseSection(
  exerciseName: string,
  preferredSection?: LiveStrengthExerciseSection,
): LiveStrengthExerciseSection {
  if (preferredSection) {
    return preferredSection
  }

  const name = exerciseName.toLowerCase()

  if (
    name.includes('warm-up') ||
    name.includes('easy bike') ||
    name.includes('easy walk') ||
    name.includes('breathing') ||
    name.includes('rowing')
  ) {
    return 'warmup'
  }

  if (
    name.includes('calf') ||
    name.includes('soleus') ||
    name.includes('tibialis') ||
    name.includes('eccentric')
  ) {
    return 'calf_achilles'
  }

  if (
    name.includes('ankle rocks') ||
    name.includes('leg swings') ||
    name.includes('hamstring sweeps') ||
    name.includes('bodyweight') ||
    name.includes('plank') ||
    name.includes('pallof') ||
    name.includes('dead bug') ||
    name.includes('mobility') ||
    name.includes('stretch') ||
    name.includes('foam rolling') ||
    name.includes('clamshell') ||
    name.includes('banded') ||
    name.includes('glute bridge') ||
    name.includes('airplanes') ||
    name.includes('monster walks') ||
    name.includes('adductor') ||
    name.includes('figure-four')
  ) {
    return 'core_mobility'
  }

  return 'main'
}

export function calculateLiveStrengthProgress(
  state: LiveStrengthSessionState,
): LiveStrengthProgress {
  const totalSets = state.steps.reduce((total, step) => total + step.sets, 0)
  const completedSets = state.steps.reduce((total, step) => total + step.completedSets, 0)
  const completedExercises = state.steps.filter((step) => step.status === 'completed').length
  const skippedExercises = state.steps.filter((step) => step.status === 'skipped').length
  const completionPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0

  return {
    completedSets,
    totalSets,
    completedExercises,
    skippedExercises,
    totalExercises: state.steps.length,
    completionPercent,
  }
}

export function getCurrentExercise(
  state: LiveStrengthSessionState,
): LiveStrengthExerciseStep | undefined {
  return state.steps[state.currentExerciseIndex]
}

export function canCompleteSession(state: LiveStrengthSessionState): boolean {
  return calculateLiveStrengthProgress(state).completedSets > 0
}

export function buildLiveStrengthSessionResult(
  state: LiveStrengthSessionState,
  feeling?: StrengthSessionFeeling,
  notes?: string,
): LiveStrengthSessionResult {
  const progress = calculateLiveStrengthProgress(state)
  const completed =
    state.status === 'completed' || progress.completionPercent >= completionThresholdPercent

  return {
    sessionId: state.sessionId,
    sessionTitle: state.sessionTitle,
    date: state.date,
    completed,
    completionPercent: progress.completionPercent,
    completedExercises: progress.completedExercises,
    totalExercises: progress.totalExercises,
    skippedExercises: progress.skippedExercises,
    feeling,
    notes: removeEmptyText(notes),
    startedAt: state.startedAt,
    endedAt: state.endedAt ?? new Date().toISOString(),
  }
}

export function buildStrengthLogInput(
  result: LiveStrengthSessionResult,
  existingLog: WorkoutLogEntry | undefined,
  hasPlannedRun: boolean,
): WorkoutLogInput {
  const strengthCompleted =
    Boolean(existingLog?.strengthCompleted) || result.completed || result.completionPercent >= completionThresholdPercent
  const completionStatus = getStrengthCompletionStatus(result, existingLog, hasPlannedRun)
  const strengthNote = buildStrengthLogNote(result)
  const notes = appendLogNote(existingLog?.notes, strengthNote)

  return {
    completionStatus,
    runCompleted: existingLog?.runCompleted ?? false,
    strengthCompleted,
    actualDistanceKm: existingLog?.actualDistanceKm,
    actualDurationMinutes: existingLog?.actualDurationMinutes,
    averageHr: existingLog?.averageHr,
    maxHr: existingLog?.maxHr,
    alcoholYesterday: existingLog?.alcoholYesterday,
    notes,
    stravaUrl: existingLog?.stravaUrl,
  }
}

function createExerciseStep(
  sessionId: string,
  exercise: StrengthExercise,
  index: number,
): LiveStrengthExerciseStep {
  const section = getExerciseSection(exercise.name)

  return {
    id: `${sessionId}-exercise-${index}-${slugify(exercise.name)}`,
    exerciseName: exercise.name,
    sets: parseSets(exercise.sets),
    reps: exercise.reps,
    restSeconds: parseRestSeconds(exercise.rest, section),
    notes: exercise.notes,
    section,
    visualType: getExerciseVisualType(exercise.name),
    status: 'pending',
    completedSets: 0,
  }
}

function createTextStep(
  sessionId: string,
  section: LiveStrengthExerciseSection,
  text: string,
  index: number,
  title: string,
): LiveStrengthExerciseStep {
  return {
    id: `${sessionId}-${section}-${index}-${slugify(text)}`,
    exerciseName: title,
    sets: 1,
    reps: text,
    restSeconds: 0,
    notes: text,
    section,
    visualType: getExerciseVisualType(text),
    status: 'pending',
    completedSets: 0,
  }
}

function getFallbackRestSeconds(section: LiveStrengthExerciseSection): number {
  if (section === 'warmup' || section === 'cooldown') {
    return 0
  }

  if (section === 'main') {
    return 90
  }

  if (section === 'calf_achilles') {
    return 60
  }

  return 45
}

function getStrengthCompletionStatus(
  result: LiveStrengthSessionResult,
  existingLog: WorkoutLogEntry | undefined,
  hasPlannedRun: boolean,
) {
  const strengthCompleted = result.completed || result.completionPercent >= completionThresholdPercent

  if (existingLog?.runCompleted || existingLog?.actualDistanceKm !== undefined) {
    return existingLog.completionStatus
  }

  if (strengthCompleted && !hasPlannedRun) {
    return 'completed'
  }

  if (strengthCompleted && hasPlannedRun) {
    return 'partial'
  }

  return existingLog?.completionStatus ?? 'partial'
}

function buildStrengthLogNote(result: LiveStrengthSessionResult): string {
  const feelingText = result.feeling ? ` Felt ${strengthFeelingLabels[result.feeling].toLowerCase()}.` : ''
  const notesText = result.notes ? ` Notes: ${result.notes}` : ''
  const status = result.completed ? 'completed' : 'partial'

  return `Strength session ${result.sessionTitle}: ${status} ${result.completionPercent}% (${result.completedExercises}/${result.totalExercises} exercises, ${result.skippedExercises} skipped).${feelingText}${notesText}`
}

function appendLogNote(existingNotes: string | undefined, newNote: string): string {
  const trimmedExistingNotes = existingNotes?.trim()

  if (!trimmedExistingNotes) {
    return newNote
  }

  return `${trimmedExistingNotes}\n\n${newNote}`
}

function removeEmptyText(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : undefined
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
