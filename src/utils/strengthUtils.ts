import { strengthSessions, strengthSessionsById } from '../data/strengthSessions'
import type { StrengthExercise, StrengthSession } from '../types/training'
import type {
  StrengthExerciseGroup,
  StrengthExerciseGroupId,
  StrengthSessionCategory,
} from '../types/strengthView'
import type { WorkoutLogEntry } from '../types/workoutLog'

const groupMeta: Record<StrengthExerciseGroupId, Omit<StrengthExerciseGroup, 'exercises'>> = {
  warmup: {
    id: 'warmup',
    title: 'Warm-up and activation',
    description: 'Ease in, check tissue stiffness, and prepare the main patterns.',
  },
  main_strength: {
    id: 'main_strength',
    title: 'Main strength',
    description: 'The primary loading that supports running economy and durability.',
  },
  calf_achilles: {
    id: 'calf_achilles',
    title: 'Calf and Achilles durability',
    description: 'Controlled lower-leg work to build tolerance without chasing fatigue.',
  },
  core_mobility: {
    id: 'core_mobility',
    title: 'Core, hips, and mobility',
    description: 'Trunk and hip control for stable late-race mechanics.',
  },
  accessory: {
    id: 'accessory',
    title: 'Accessory work',
    description: 'Supportive work that fills the gaps around the main session.',
  },
}

export function getStrengthSessionById(id: string): StrengthSession | undefined {
  return strengthSessionsById[id]
}

export function getStrengthSessionsByIds(ids: string[] = []): StrengthSession[] {
  return ids
    .map((id) => getStrengthSessionById(id))
    .filter((session) => session !== undefined)
}

export function getAllStrengthSessions(): StrengthSession[] {
  return strengthSessions
}

export function getStrengthSessionCategory(session: StrengthSession): StrengthSessionCategory {
  const lookup = `${session.id} ${session.title} ${session.focus}`.toLowerCase()

  if (lookup.includes('mini') || lookup.includes('prehab')) {
    return 'prehab'
  }

  if (lookup.includes('mobility')) {
    return 'mobility'
  }

  return 'gym'
}

export function getStrengthSessionAccent(session: StrengthSession) {
  const category = getStrengthSessionCategory(session)

  if (category === 'prehab') {
    return {
      label: 'Prehab',
      className:
        'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-300/25 dark:bg-orange-300/10 dark:text-orange-200',
    }
  }

  if (category === 'mobility') {
    return {
      label: 'Mobility',
      className:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200',
    }
  }

  return {
    label: 'Gym',
    className:
      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-300/25 dark:bg-purple-300/10 dark:text-purple-200',
  }
}

export function getStrengthSessionSummary(session: StrengthSession): string {
  return `${session.estimatedDurationMinutes} min - ${session.exercises.length} exercises`
}

export function groupStrengthExercises(session: StrengthSession): StrengthExerciseGroup[] {
  const grouped = new Map<StrengthExerciseGroupId, StrengthExercise[]>()

  session.exercises.forEach((exercise) => {
    const groupId = getExerciseGroupId(exercise)
    grouped.set(groupId, [...(grouped.get(groupId) ?? []), exercise])
  })

  return (Object.keys(groupMeta) as StrengthExerciseGroupId[])
    .map((id) => ({
      ...groupMeta[id],
      exercises: grouped.get(id) ?? [],
    }))
    .filter((group) => group.exercises.length > 0)
}

export function getStrengthCompletionLabel(
  strengthSessionIds: string[] | undefined,
  workoutLog: WorkoutLogEntry | undefined,
): string {
  if (!strengthSessionIds?.length) {
    return 'No strength planned'
  }

  if (workoutLog?.strengthCompleted) {
    return 'Strength completed'
  }

  return `${strengthSessionIds.length} strength session${strengthSessionIds.length > 1 ? 's' : ''} planned`
}

function getExerciseGroupId(exercise: StrengthExercise): StrengthExerciseGroupId {
  const name = exercise.name.toLowerCase()

  if (name.includes('warm-up') || name.includes('easy bike') || name.includes('dynamic mobility')) {
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
    name.includes('plank') ||
    name.includes('pallof') ||
    name.includes('dead bug') ||
    name.includes('mobility') ||
    name.includes('clamshell') ||
    name.includes('glute bridge') ||
    name.includes('hip flexor') ||
    name.includes('banded') ||
    name.includes('airplanes')
  ) {
    return 'core_mobility'
  }

  if (
    name.includes('split squat') ||
    name.includes('romanian deadlift') ||
    name.includes('leg press') ||
    name.includes('goblet') ||
    name.includes('hip thrust') ||
    name.includes('hamstring curl') ||
    name.includes('step-up')
  ) {
    return 'main_strength'
  }

  return 'accessory'
}
