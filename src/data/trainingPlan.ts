import { getMealTemplate, type MealTemplateId } from './mealTemplates'
import { paceGuidelines } from './paceGuidelines'
import { specialEvents } from './specialEvents'
import { addDays, getDayOfWeek, isDateBetween } from '../utils/dateUtils'
import type {
  DayPlan,
  DayType,
  IntensityLevel,
  ISODateString,
  PaceRange,
  RunType,
  RunWorkout,
  TimeString,
  TrainingPhase,
  WeekPlan,
  WorkoutInterval,
} from '../types/training'

export const trainingPlanStartDate = '2026-06-01'
export const trainingPlanEndDate = '2026-10-18'

type PaceGuidelineKey = keyof typeof paceGuidelines

type RunBlueprint = {
  type: RunType
  title: string
  plannedDistanceKm: number
  paceKey: PaceGuidelineKey
  paceOverride?: PaceRange
  startTime?: TimeString
  estimatedDurationMinutes?: number
  warmupKm?: number
  cooldownKm?: number
  intervals?: WorkoutInterval[]
  instructions?: string[]
  fuelNotes?: string[]
  recoveryNotes?: string[]
  targetHrDescription?: string
}

type DayBlueprint = {
  title: string
  summary: string
  run?: RunBlueprint
  strengthSessionIds?: string[]
  mealTemplateId?: MealTemplateId
  dayType?: DayType
  intensity?: IntensityLevel
  sleepTargetHours?: number
  notes?: string[]
}

type WeekBlueprint = {
  weekNumber: number
  startDate: ISODateString
  phase: TrainingPhase
  targetMileageKm: number
  focus: string
  days: DayBlueprint[]
}

const gymA1 = 'gym-a1-lower-strength-achilles'
const gymA2 = 'gym-a2-unilateral-strength'
const gymB1 = 'gym-b1-posterior-power-core'
const gymB2 = 'gym-b2-stability-hamstrings-prehab'
const miniC = 'mini-c-mobility-prehab'
const taperMobility = 'taper-mobility-activation'
const week1RecoveryMobility = 'week1-recovery-mobility'

const thresholdIntervals = (
  label: string,
  repetitions: number,
  durationMinutes?: number,
  distanceKm?: number,
): WorkoutInterval[] => [
  {
    label,
    repetitions,
    durationMinutes,
    distanceKm,
    targetPace: paceGuidelines.threshold.pace,
    targetHrZone: paceGuidelines.threshold.hrZone,
    recoveryDurationMinutes: distanceKm ? 3 : 2,
    recoveryInstruction: 'Easy jog recovery; keep the next rep controlled.',
  },
]

const marathonIntervals = (
  label: string,
  repetitions: number,
  distanceKm: number,
  recoveryDistanceKm = 1,
): WorkoutInterval[] => [
  {
    label,
    repetitions,
    distanceKm,
    targetPace: paceGuidelines.marathonPace.pace,
    targetHrZone: paceGuidelines.marathonPace.hrZone,
    recoveryDistanceKm,
    recoveryInstruction: 'Easy running between marathon-pace blocks.',
  },
]

const steadyBlock = (label: string, distanceKm: number): WorkoutInterval[] => [
  {
    label,
    repetitions: 1,
    distanceKm,
    targetPace: paceGuidelines.steady.pace,
    targetHrZone: paceGuidelines.steady.hrZone,
    recoveryInstruction: 'Return to easy running after the block.',
  },
]

const paceRange = (pace: string, description: string): PaceRange => ({
  minPerKmFrom: pace,
  minPerKmTo: pace,
  description,
})

const relaxedStrides = (repetitions = 6, seconds = 20): WorkoutInterval[] => [
  {
    label: 'Relaxed strides',
    repetitions,
    durationMinutes: seconds / 60,
    targetPace: paceGuidelines.strides.pace,
    targetHrZone: paceGuidelines.strides.hrZone,
    recoveryInstruction: 'Walk or jog fully between strides. Fast relaxed, not sprinting.',
  },
]

const shortRepIntervals = (
  label: string,
  repetitions: number,
  paceDescription = 'Short fast rep pace',
  minPerKmFrom = paceGuidelines.shortReps.pace.minPerKmFrom,
  minPerKmTo = paceGuidelines.shortReps.pace.minPerKmTo,
): WorkoutInterval[] => [
  {
    label,
    repetitions,
    distanceKm: 0.4,
    targetPace: {
      ...paceGuidelines.shortReps.pace,
      minPerKmFrom,
      minPerKmTo,
      description: paceDescription,
    },
    targetHrZone: paceGuidelines.shortReps.hrZone,
    recoveryDistanceKm: 0.2,
    recoveryInstruction: '200 m jog recovery. Keep every rep controlled and repeatable.',
  },
]

const oneKmRepIntervals = (
  label: string,
  repetitions: number,
  recoveryInstruction = '2 min jog recovery. Smooth and repeatable, not racing.',
): WorkoutInterval[] => [
  {
    label,
    repetitions,
    distanceKm: 1,
    targetPace: paceGuidelines.interval.pace,
    targetHrZone: paceGuidelines.interval.hrZone,
    recoveryDurationMinutes: 2,
    recoveryInstruction,
  },
]

const overUnderIntervals = (repetitions: number, recoveryMinutes = 2): WorkoutInterval[] => [
  {
    label: 'Over/under set: 1 km at 4:00/km + 1 km at 3:40/km',
    repetitions,
    distanceKm: 2,
    targetPace: {
      minPerKmFrom: '3:40',
      minPerKmTo: '4:00',
      description: 'Alternating marathon effort and faster over pace',
    },
    targetHrZone: 'Z4',
    recoveryDurationMinutes: recoveryMinutes,
    recoveryInstruction: `${recoveryMinutes} min jog between sets.`,
  },
]

const tempoLadderIntervals = (): WorkoutInterval[] => [
  {
    label: 'Tempo ladder block',
    repetitions: 1,
    distanceKm: 4,
    targetPace: paceRange('3:50', 'Controlled tempo'),
    targetHrZone: paceGuidelines.threshold.hrZone,
    recoveryDurationMinutes: 3,
    recoveryInstruction: '3 min jog before the next block.',
  },
  {
    label: 'Tempo ladder block',
    repetitions: 1,
    distanceKm: 3,
    targetPace: paceRange('3:45', 'Threshold tempo'),
    targetHrZone: paceGuidelines.threshold.hrZone,
    recoveryDurationMinutes: 3,
    recoveryInstruction: '3 min jog before the next block.',
  },
  {
    label: 'Tempo ladder block',
    repetitions: 1,
    distanceKm: 2,
    targetPace: paceRange('3:40', 'Fast controlled tempo'),
    targetHrZone: paceGuidelines.threshold.hrZone,
    recoveryDurationMinutes: 3,
    recoveryInstruction: '3 min jog before the final block.',
  },
  {
    label: 'Tempo ladder block',
    repetitions: 1,
    distanceKm: 1,
    targetPace: paceRange('3:35', 'Fast but repeatable finish'),
    targetHrZone: paceGuidelines.interval.hrZone,
    recoveryInstruction: 'Cool down relaxed after the final block.',
  },
]

const runDay = (
  type: RunType,
  title: string,
  plannedDistanceKm: number,
  paceKey: PaceGuidelineKey,
  summary: string,
  options: Omit<DayBlueprint, 'title' | 'summary' | 'run'> & Partial<RunBlueprint> = {},
): DayBlueprint => {
  const {
    strengthSessionIds,
    mealTemplateId,
    dayType,
    intensity,
    sleepTargetHours,
    notes,
    ...runOptions
  } = options

  return {
    title,
    summary,
    run: {
      type,
      title,
      plannedDistanceKm,
      paceKey,
      ...runOptions,
    },
    strengthSessionIds,
    mealTemplateId,
    dayType,
    intensity,
    sleepTargetHours,
    notes,
  }
}

const restDay = (
  title: string,
  summary: string,
  options: Omit<DayBlueprint, 'title' | 'summary' | 'run'> = {},
): DayBlueprint => ({
  title,
  summary,
  ...options,
})

const weeks: WeekBlueprint[] = [
  {
    weekNumber: 1,
    startDate: '2026-06-01',
    phase: 'recovery',
    targetMileageKm: 23,
    focus: 'Post-Utrecht Half Marathon recovery and birthday weekend. Three recovery days before first run back on Thursday.',
    days: [
      restDay('Full rest', 'Optional easy walking only. No running and no gym.', {
        dayType: 'recovery',
        intensity: 'rest',
        notes: ['Let the Utrecht Half Marathon settle before rebuilding.', 'No running.', 'No gym.'],
      }),
      restDay('Full rest', 'Optional 20-30 min very easy walk or bike only. No running and no gym.', {
        dayType: 'recovery',
        intensity: 'rest',
        notes: ['Keep this as a full recovery day after the half marathon.', 'No running.', 'No gym.'],
      }),
      restDay('Mobility + light activation', 'No run. Optional 20-30 min recovery mobility/prehab only.', {
        strengthSessionIds: [week1RecoveryMobility],
        dayType: 'recovery',
        intensity: 'low',
        notes: ['No heavy gym.', 'Use this only if it helps recovery and prepares the first run back.'],
      }),
      runDay('recovery', '6 km recovery', 6, 'recovery', 'First run back after the half marathon. Keep it relaxed at 5:10-5:40/km.', {
        paceOverride: {
          minPerKmFrom: '5:10',
          minPerKmTo: '5:40',
          description: 'Very easy Zone 1 to low Zone 2 recovery pace',
        },
        targetHrDescription: 'Very easy, Zone 1 to low Zone 2',
        notes: ['First run after Utrecht Half Marathon.', 'Stop early if Achilles or calves feel sharp.'],
      }),
      runDay('easy', '8 km easy', 8, 'easy', 'Easy Zone 2 run at 4:50-5:20/km. No workout intensity.', {
        paceOverride: {
          minPerKmFrom: '4:50',
          minPerKmTo: '5:20',
          description: 'Easy Zone 2 recovery-week pace',
        },
        targetHrDescription: 'Easy Zone 2',
        notes: ['No workout intensity. Keep it conversational.'],
      }),
      restDay('Birthday/social day', 'No run planned. Optional walk only.', {
        dayType: 'social',
        intensity: 'rest',
        mealTemplateId: 'social_festival',
        sleepTargetHours: 8.5,
        notes: ['Birthday/social/rest day.', 'Optional mobility only.', 'Enjoy the birthday weekend and keep hydration sensible.'],
      }),
      runDay('easy', '9 km easy (8-10 km optional)', 9, 'easy', 'Easy Zone 2 run. Keep the distance flexible between 8-10 km depending how the body feels.', {
        startTime: '09:30',
        paceOverride: {
          minPerKmFrom: '4:55',
          minPerKmTo: '5:25',
          description: 'Easy Zone 2 recovery-week pace',
        },
        targetHrDescription: 'Easy Zone 2',
        notes: ['Planned as 9 km for totals; 8-10 km optional.', 'Shorten if social fatigue is high.'],
      }),
    ],
  },
  {
    weekNumber: 2,
    startDate: '2026-06-08',
    phase: 'base',
    targetMileageKm: 80,
    focus: 'Base restart with faster reps. Fast work stays controlled and repeatable.',
    days: [
      restDay('Rest + Gym A1', 'No running. Gym A1 before the faster restart, controlled and not sore-making.', {
        strengthSessionIds: [gymA1],
        dayType: 'strength',
        intensity: 'low',
      }),
      runDay('interval', '14 km with 10 x 400 m', 14, 'shortReps', '3 km warm-up, 10 x 400 m at 3:20-3:25/km pace, 200 m jog recoveries, cool-down.', {
        paceOverride: {
          minPerKmFrom: '3:20',
          minPerKmTo: '3:25',
          description: '400 m reps at 3:20-3:25/km pace',
        },
        intervals: shortRepIntervals('400 m repeat', 10, '400 m reps at 3:20-3:25/km pace', '3:20', '3:25'),
        warmupKm: 3,
        cooldownKm: 3,
        instructions: ['Fast workouts should be controlled and repeatable, not all-out racing.'],
      }),
      runDay('easy', '12 km easy + Gym B1', 12, 'easy', 'Easy aerobic volume plus Gym B1.', {
        strengthSessionIds: [gymB1],
      }),
      runDay('medium_long', '16 km medium-long steady', 16, 'steady', 'Controlled medium-long run at 4:25-4:45/km.', {
        instructions: ['If Tuesday was very hard, keep this closer to easy than steady.'],
      }),
      runDay('recovery', '8 km recovery', 8, 'recovery', 'Short recovery run. Keep the extra prehab for later weeks.'),
      runDay('easy', '8 km easy + strides', 8, 'easy', 'Easy Saturday with 6 x 20 sec relaxed strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('long', '22 km long easy', 22, 'longRunEasy', 'Easy long run at 4:40-5:05/km.', {
        startTime: '09:00',
        mealTemplateId: 'long_run',
      }),
    ],
  },
  {
    weekNumber: 3,
    startDate: '2026-06-15',
    phase: 'base',
    targetMileageKm: 86,
    focus: 'Introduce over/unders while keeping the rest of the week aerobic.',
    days: [
      restDay('Rest + Gym A2', 'No running. Gym A2 with clean unilateral reps only.', {
        strengthSessionIds: [gymA2],
        dayType: 'strength',
        intensity: 'low',
      }),
      runDay('threshold', '15 km over/unders', 15, 'threshold', '5 x 2 km over/under: 1 km at 4:00/km + 1 km at 3:40/km, 2 min jog between sets.', {
        intervals: overUnderIntervals(5, 2),
        warmupKm: 3,
        cooldownKm: 2,
        instructions: ['Stay smooth on the faster kilometers; this is control work, not racing.'],
      }),
      runDay('easy', '12 km easy + Gym B2', 12, 'easy', 'Easy aerobic run plus Gym B2.', {
        strengthSessionIds: [gymB2],
      }),
      runDay('medium_long', '18 km medium-long', 18, 'steady', 'Medium-long run at 4:25-4:45/km.', {
        instructions: ['Keep Thursday controlled after Tuesday quality.'],
      }),
      runDay('recovery', '9 km recovery', 9, 'recovery', 'Keep cadence light and effort low.'),
      runDay('easy', '8 km easy + strides', 8, 'easy', 'Easy Saturday run with relaxed strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('long', '24 km long easy', 24, 'longRunEasy', 'Long run easy. Fuel 30-40 g carbs/hour.', {
        startTime: '09:00',
        mealTemplateId: 'long_run',
        fuelNotes: ['Fuel 30-40 g carbs/hour and keep the stomach practice calm.'],
      }),
    ],
  },
  {
    weekNumber: 4,
    startDate: '2026-06-22',
    phase: 'build',
    targetMileageKm: 92,
    focus: 'Tempo ladder week with steady aerobic support.',
    days: [
      restDay('Rest + Gym A1', 'No running. Gym A1 without chasing soreness.', {
        strengthSessionIds: [gymA1],
        dayType: 'strength',
        intensity: 'low',
      }),
      runDay('threshold', '16 km tempo ladder', 16, 'threshold', '4-3-2-1 tempo ladder: 4 km at 3:50/km, 3 km at 3:45/km, 2 km at 3:40/km, 1 km at 3:35/km.', {
        intervals: tempoLadderIntervals(),
        warmupKm: 3,
        cooldownKm: 3,
        instructions: ['Take 3 min jog between blocks and keep the final 1 km fast but repeatable.'],
      }),
      runDay('easy', '13 km easy + Gym B1', 13, 'easy', 'Easy aerobic run plus Gym B1.', {
        strengthSessionIds: [gymB1],
      }),
      runDay('medium_long', '18 km steady medium-long', 18, 'steady', 'Steady medium-long run.', {
        instructions: ['Controlled pressure only; Tuesday is the hard work.'],
      }),
      runDay('recovery', '10 km recovery + prehab', 10, 'recovery', 'Recovery run plus prehab.', {
        strengthSessionIds: [miniC],
      }),
      runDay('easy', '10 km easy + strides', 10, 'easy', 'Easy Saturday with 6 x 20 sec strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('progression', '25 km long, last 5 km steady', 25, 'longRunEasy', 'Long run easy, last 5 km steady only if fresh.', {
        startTime: '09:00',
        intervals: steadyBlock('Optional final steady block', 5),
        mealTemplateId: 'long_run',
        instructions: ['Only progress if the first 20 km feel relaxed.'],
      }),
    ],
  },
  {
    weekNumber: 5,
    startDate: '2026-06-29',
    phase: 'recovery',
    targetMileageKm: 76,
    focus: 'Cutback week with light speed and reduced strength load.',
    days: [
      restDay('Rest + lighter Gym A2', 'No running. Keep Gym A2 lighter than normal.', {
        strengthSessionIds: [gymA2],
        dayType: 'strength',
        intensity: 'low',
        notes: ['Reduce gym load by 20-30% this cutback week.'],
      }),
      runDay('interval', '13 km fartlek', 13, 'interval', 'Fartlek 10 x 1 min fast / 1 min easy, fast parts around 3:25-3:35/km effort.', {
        intervals: [
          {
            label: '1 min fast / 1 min easy',
            repetitions: 10,
            durationMinutes: 1,
            targetPace: {
              minPerKmFrom: '3:25',
              minPerKmTo: '3:35',
              description: 'Fast controlled fartlek effort',
            },
            targetHrZone: paceGuidelines.interval.hrZone,
            recoveryDurationMinutes: 1,
            recoveryInstruction: 'Float easy for 1 min between fast parts.',
          },
        ],
        instructions: ['Keep this playful and controlled, not all-out.'],
      }),
      runDay('easy', '10 km easy + light Gym B2', 10, 'easy', 'Easy aerobic run plus light Gym B2.', {
        strengthSessionIds: [gymB2],
        notes: ['Keep gym volume light.'],
      }),
      runDay('medium_long', '16 km easy-medium', 16, 'easy', 'Controlled easy-medium run.'),
      runDay('recovery', '8 km recovery', 8, 'recovery', 'Short recovery run.'),
      runDay('easy', '8 km easy + strides', 8, 'easy', 'Easy Saturday with relaxed strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('long', '21 km relaxed long run', 21, 'longRunEasy', 'Relaxed cutback long run.', {
        startTime: '09:00',
        mealTemplateId: 'long_run',
      }),
    ],
  },
  {
    weekNumber: 6,
    startDate: '2026-07-06',
    phase: 'build',
    targetMileageKm: 98,
    focus: 'Stronger aerobic build with controlled 1 km reps.',
    days: [
      restDay('Rest + Gym A1', 'No running. Gym A1 with clean controlled reps.', {
        strengthSessionIds: [gymA1],
        dayType: 'strength',
        intensity: 'low',
      }),
      runDay('interval', '16 km with 6 x 1 km', 16, 'interval', '6 x 1 km at 3:35-3:40/km with 2 min jog recovery.', {
        intervals: oneKmRepIntervals('1 km repeat', 6),
        warmupKm: 3,
        cooldownKm: 3,
        instructions: ['Fast workouts should be controlled and repeatable, not all-out racing.'],
      }),
      runDay('easy', '14 km easy + Gym B1', 14, 'easy', 'Easy aerobic run plus Gym B1.', {
        strengthSessionIds: [gymB1],
      }),
      runDay('medium_long', '20 km medium-long', 20, 'steady', 'Medium-long run at 4:20-4:40/km.', {
        instructions: ['Keep this aerobic; Tuesday is the quality session.'],
      }),
      runDay('recovery', '10 km recovery', 10, 'recovery', 'Very easy recovery.'),
      runDay('easy', '12 km easy + strides', 12, 'easy', 'Easy Saturday with 8 x 20 sec strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(8, 20),
      }),
      runDay('long', '26 km long easy', 26, 'longRunEasy', 'Long run easy. Fuel 40-50 g carbs/hour.', {
        startTime: '09:00',
        mealTemplateId: 'long_run',
        fuelNotes: ['Fuel 40-50 g carbs/hour and practice drinking with carbs.'],
      }),
    ],
  },
  {
    weekNumber: 7,
    startDate: '2026-07-13',
    phase: 'recovery',
    targetMileageKm: 32,
    focus: 'Festival deload. No hard running, no compensation, protect sleep and hydration.',
    days: [
      restDay('Rest', 'No running. Let the deload begin.', {
        dayType: 'recovery',
        intensity: 'rest',
      }),
      runDay('progression', '12 km progressive', 12, 'steady', 'Start easy and finish the last 3 km around 4:00-4:10/km.', {
        intervals: [
          {
            label: 'Progressive finish',
            repetitions: 1,
            distanceKm: 3,
            targetPace: {
              minPerKmFrom: '4:00',
              minPerKmTo: '4:10',
              description: 'Controlled progressive finish',
            },
            targetHrZone: paceGuidelines.marathonPace.hrZone,
            recoveryInstruction: 'Cool down relaxed after the finish.',
          },
        ],
        instructions: ['This is controlled, not a workout to force.'],
      }),
      runDay('recovery', '8 km recovery', 8, 'recovery', 'Festival week recovery run.', {
        mealTemplateId: 'social_festival',
        notes: ['Hydrate well and keep this genuinely easy.'],
      }),
      runDay('recovery', '6 km very easy + mobility', 6, 'recovery', 'Very easy run plus optional self-guided mobility during the festival block.', {
        mealTemplateId: 'social_festival',
        notes: ['Skip the run if sleep, hydration, or Achilles are off.', 'No heavy gym during festival deload.'],
      }),
      restDay('Rest / festival', 'No running planned. Festival protection day.', {
        dayType: 'social',
        intensity: 'rest',
        mealTemplateId: 'social_festival',
        notes: ['Eat a proper meal before drinking and keep electrolytes simple.'],
      }),
      restDay('Rest / festival', 'No running planned. Festival protection day.', {
        dayType: 'social',
        intensity: 'rest',
        mealTemplateId: 'social_festival',
      }),
      runDay('recovery', '6 km very easy if okay', 6, 'recovery', 'Run only if you feel okay. Otherwise rest.', {
        startTime: '09:30',
        mealTemplateId: 'post_alcohol_recovery',
        notes: ['Do not try to compensate for missed running. Rest is the better choice if anything feels off.'],
      }),
    ],
  },
  {
    weekNumber: 8,
    startDate: '2026-07-20',
    phase: 'base',
    targetMileageKm: 74,
    focus: 'Post-festival rebuild. No hard workout yet.',
    days: [
      restDay('Rest + light Gym A2', 'No running. Restore sleep, hydration, normal food, and keep Gym A2 light.', {
        strengthSessionIds: [gymA2],
        dayType: 'strength',
        intensity: 'low',
        mealTemplateId: 'post_alcohol_recovery',
        sleepTargetHours: 9,
        notes: ['Light post-festival strength only; skip heavy loading if recovery is not back.'],
      }),
      runDay('easy', '12 km easy + strides', 12, 'easy', 'Easy run with 6 x 20 sec strides. No hard workout yet.', {
        intervals: relaxedStrides(6, 20),
        mealTemplateId: 'post_alcohol_recovery',
      }),
      runDay('easy', '10 km easy + Gym B2', 10, 'easy', 'Easy run plus Gym B2.', {
        strengthSessionIds: [gymB2],
        notes: ['Keep Gym B2 light after the festival week.'],
      }),
      runDay('medium_long', '16 km easy-medium', 16, 'easy', 'Controlled easy-medium run.'),
      runDay('recovery', '8 km recovery + Mini C', 8, 'recovery', 'Low-stress recovery run plus restorative Mini C.', {
        strengthSessionIds: [miniC],
        notes: ['Mini C should feel restorative, not like a third hard gym workout.'],
      }),
      runDay('recovery', '6 km very easy', 6, 'recovery', 'Very easy Saturday reset.', {
        startTime: '09:30',
      }),
      runDay('long', '22 km relaxed long run', 22, 'longRunEasy', 'Relaxed long run with no fast finish.', {
        startTime: '09:00',
        mealTemplateId: 'long_run',
      }),
    ],
  },
  {
    weekNumber: 9,
    startDate: '2026-07-27',
    phase: 'build',
    targetMileageKm: 82,
    focus: 'Back into quality while protecting the August festival day.',
    days: [
      restDay('Rest + Gym A1', 'No running. Gym A1 controlled.', {
        strengthSessionIds: [gymA1],
        dayType: 'strength',
        intensity: 'low',
      }),
      runDay('threshold', '15 km with 3 x 3 km threshold', 15, 'threshold', '3 x 3 km at 3:50-3:55/km, 3 min jog recovery.', {
        intervals: thresholdIntervals('3 km threshold block', 3, undefined, 3),
        warmupKm: 3,
        cooldownKm: 3,
        instructions: ['Keep the last block strong but never desperate.'],
      }),
      runDay('easy', '12 km easy + Gym B1', 12, 'easy', 'Easy aerobic run plus Gym B1.', {
        strengthSessionIds: [gymB1],
      }),
      runDay('medium_long', '18 km medium-long', 18, 'steady', 'Controlled medium-long run.'),
      runDay('recovery', '8 km recovery', 8, 'recovery', 'Short and gentle.'),
      runDay('recovery', '5 km shakeout or rest', 5, 'recovery', 'Festival day shakeout only if fresh; rest if tired.', {
        startTime: '09:30',
        mealTemplateId: 'social_festival',
        notes: ['Rest is fully acceptable today.'],
      }),
      runDay('long', '24 km long, last 6 km steady', 24, 'longRunEasy', 'Long run with last 6 km steady around 4:20-4:30/km.', {
        startTime: '09:00',
        intervals: [
          {
            label: 'Final steady block',
            repetitions: 1,
            distanceKm: 6,
            targetPace: {
              minPerKmFrom: '4:20',
              minPerKmTo: '4:30',
              description: 'Controlled steady finish',
            },
            targetHrZone: paceGuidelines.steady.hrZone,
            recoveryInstruction: 'Only progress if the first 18 km are smooth.',
          },
        ],
        mealTemplateId: 'long_run',
      }),
    ],
  },
  {
    weekNumber: 10,
    startDate: '2026-08-03',
    phase: 'specific',
    targetMileageKm: 105,
    focus: 'Marathon-specific build with the first 30 km long run.',
    days: [
      restDay('Rest + Gym A2', 'No running. Gym A2 with no soreness chasing.', {
        strengthSessionIds: [gymA2],
        dayType: 'strength',
        intensity: 'low',
      }),
      runDay('marathon_pace', '17 km with 3 x 3 km marathon pace', 17, 'marathonPace', '3 x 3 km at marathon pace, 1 km float at 4:30/km between blocks.', {
        intervals: [
          {
            label: 'Marathon-pace block',
            repetitions: 3,
            distanceKm: 3,
            targetPace: paceGuidelines.marathonPace.pace,
            targetHrZone: paceGuidelines.marathonPace.hrZone,
            recoveryDistanceKm: 1,
            recoveryInstruction: '1 km float around 4:30/km between blocks.',
          },
        ],
        warmupKm: 3,
        cooldownKm: 2,
        instructions: ['Practice rhythm, not strain.'],
      }),
      runDay('easy', '14 km easy + Gym B2', 14, 'easy', 'Easy aerobic run plus Gym B2.', {
        strengthSessionIds: [gymB2],
      }),
      runDay('medium_long', '21 km medium-long steady', 21, 'steady', 'Medium-long steady run.', {
        instructions: ['If Tuesday took more than expected, keep this easy-medium.'],
      }),
      runDay('recovery', '10 km recovery', 10, 'recovery', 'Recovery run. Keep Friday free from extra gym load.'),
      runDay('easy', '13 km easy + strides', 13, 'easy', 'Easy Saturday with strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('long', '30 km long easy', 30, 'longRunEasy', 'Long run easy. Fuel 50-60 g carbs/hour.', {
        startTime: '09:00',
        mealTemplateId: 'long_run',
        fuelNotes: ['Fuel 50-60 g carbs/hour and practice the Maurten routine.'],
      }),
    ],
  },
  {
    weekNumber: 11,
    startDate: '2026-08-10',
    phase: 'specific',
    targetMileageKm: 110,
    focus: 'Big over/under week with a 32 km long run.',
    days: [
      restDay('Rest + Gym A1', 'No running. Gym A1 controlled.', {
        strengthSessionIds: [gymA1],
        dayType: 'strength',
        intensity: 'low',
      }),
      runDay('threshold', '18 km big over/unders', 18, 'threshold', '5 x 2 km over/under: 1 km at 4:00/km + 1 km at 3:40/km, 2-3 min jog between sets.', {
        intervals: overUnderIntervals(5, 3),
        warmupKm: 4,
        cooldownKm: 4,
        instructions: ['Fast kilometers must stay controlled and repeatable.'],
      }),
      runDay('easy', '14 km easy + Gym B1', 14, 'easy', 'Easy aerobic run plus Gym B1.', {
        strengthSessionIds: [gymB1],
      }),
      runDay('medium_long', '22 km medium-long', 22, 'steady', 'Controlled medium-long run.'),
      runDay('recovery', '10 km recovery', 10, 'recovery', 'Very easy recovery.'),
      runDay('easy', '14 km easy + strides', 14, 'easy', 'Easy Saturday with 6 x 20 sec strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('progression', '32 km long, last 8 km steady', 32, 'longRunEasy', 'Long run with last 8 km steady at 4:15-4:25/km if feeling good.', {
        startTime: '09:00',
        intervals: [
          {
            label: 'Optional final steady block',
            repetitions: 1,
            distanceKm: 8,
            targetPace: {
              minPerKmFrom: '4:15',
              minPerKmTo: '4:25',
              description: 'Controlled steady finish',
            },
            targetHrZone: paceGuidelines.steady.hrZone,
            recoveryInstruction: 'Skip this block if legs or Achilles are not calm.',
          },
        ],
        mealTemplateId: 'long_run',
      }),
    ],
  },
  {
    weekNumber: 12,
    startDate: '2026-08-17',
    phase: 'recovery',
    targetMileageKm: 88,
    focus: 'Cutback plus sharpness. Keep the 400s smooth.',
    days: [
      restDay('Rest + lighter Gym A2', 'No running. Lighter Gym A2.', {
        strengthSessionIds: [gymA2],
        dayType: 'strength',
        intensity: 'low',
        notes: ['Reduce gym load by 20-30%.'],
      }),
      runDay('interval', '15 km with 12 x 400 m', 15, 'shortReps', '12 x 400 m at 3:15-3:25/km pace, 200 m jog recoveries.', {
        intervals: shortRepIntervals('400 m repeat', 12, '400 m reps at 3:15-3:25/km pace'),
        warmupKm: 4,
        cooldownKm: 3,
        instructions: ['Fast relaxed, not sprinting. Keep all reps repeatable.'],
      }),
      runDay('easy', '12 km easy + Gym B2', 12, 'easy', 'Easy run plus Gym B2.', {
        strengthSessionIds: [gymB2],
        notes: ['Keep Gym B2 lighter than normal.'],
      }),
      runDay('medium_long', '18 km easy-medium', 18, 'easy', 'Reduced medium-long run.'),
      runDay('recovery', '8 km recovery + Mini C', 8, 'recovery', 'Short recovery mileage plus restorative Mini C.', {
        strengthSessionIds: [miniC],
        notes: ['Mini C should stay easy and restorative.'],
      }),
      runDay('easy', '10 km easy + strides', 10, 'easy', 'Easy Saturday with strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('long', '25 km relaxed long run', 25, 'longRunEasy', 'Relaxed cutback long run.', {
        startTime: '09:00',
        mealTemplateId: 'long_run',
      }),
    ],
  },
  {
    weekNumber: 13,
    startDate: '2026-08-24',
    phase: 'specific',
    targetMileageKm: 112,
    focus: 'Tempo ladder plus a marathon-specific 34 km long run.',
    days: [
      restDay('Rest + Gym A1', 'No running. Gym A1 controlled.', {
        strengthSessionIds: [gymA1],
        dayType: 'strength',
        intensity: 'low',
      }),
      runDay('threshold', '18 km tempo ladder', 18, 'threshold', '4-3-2-1 tempo ladder again: 4 km at 3:50/km, 3 km at 3:45/km, 2 km at 3:40/km, 1 km at 3:35/km.', {
        intervals: tempoLadderIntervals(),
        warmupKm: 4,
        cooldownKm: 4,
        instructions: ['Keep this strong and repeatable, not like racing.'],
      }),
      runDay('easy', '14 km easy + Gym B1', 14, 'easy', 'Easy aerobic run plus Gym B1.', {
        strengthSessionIds: [gymB1],
      }),
      runDay('medium_long', '22 km medium-long steady', 22, 'steady', 'Medium-long steady run.', {
        instructions: ['Keep Thursday controlled because Sunday has marathon-specific work.'],
      }),
      runDay('recovery', '10 km recovery', 10, 'recovery', 'Very easy recovery.'),
      runDay('easy', '14 km easy + strides', 14, 'easy', 'Easy Saturday with 8 x 20 sec strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(8, 20),
        instructions: ['Saturday stays easy because Sunday has marathon-pace work.'],
      }),
      runDay('progression', '34 km long with 10 km steady', 34, 'longRunMarathonBlocks', '24 km easy + 10 km around 4:10-4:20/km. Fuel 60-75 g carbs/hour.', {
        startTime: '09:00',
        intervals: [
          {
            label: 'Final marathon-steady block',
            repetitions: 1,
            distanceKm: 10,
            targetPace: {
              minPerKmFrom: '4:10',
              minPerKmTo: '4:20',
              description: 'Marathon-specific steady finish',
            },
            targetHrZone: paceGuidelines.marathonPace.hrZone,
            recoveryInstruction: 'Only do the block if the easy section feels smooth.',
          },
        ],
        mealTemplateId: 'long_run',
        fuelNotes: ['Fuel 60-75 g carbs/hour. Practice the exact race products you tolerate.'],
      }),
    ],
  },
  {
    weekNumber: 14,
    startDate: '2026-08-31',
    phase: 'peak',
    targetMileageKm: 116,
    focus: 'Peak marathon strength. Protect sleep, fueling, and Achilles response.',
    days: [
      restDay('Rest + Gym A2', 'No running. Gym A2 controlled, not maximal.', {
        strengthSessionIds: [gymA2],
        dayType: 'strength',
        intensity: 'low',
        notes: ['Do not chase soreness in the gym during peak weeks.'],
      }),
      runDay('threshold', '18 km with 5 x 2 km', 18, 'threshold', '5 x 2 km at 3:45-3:50/km, 2-3 min jog recovery.', {
        intervals: thresholdIntervals('2 km threshold repeat', 5, undefined, 2),
        warmupKm: 4,
        cooldownKm: 4,
        instructions: ['Controlled and repeatable. Reduce intensity first if Achilles talks.'],
      }),
      runDay('easy', '16 km easy + Gym B2', 16, 'easy', 'Easy aerobic run plus Gym B2 with reduced volume.', {
        strengthSessionIds: [gymB2],
        notes: ['Keep gym work submaximal and reduce volume slightly.'],
      }),
      runDay('medium_long', '24 km medium-long', 24, 'steady', 'Medium-long run at 4:20-4:40/km.', {
        instructions: ['Stay aerobic; Sunday is the important marathon-specific run.'],
      }),
      runDay('recovery', '10 km recovery', 10, 'recovery', 'Very easy recovery.'),
      runDay('easy', '12 km easy + strides', 12, 'easy', 'Easy Saturday with relaxed strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
        instructions: ['Saturday stays easy because Sunday has marathon-pace blocks.'],
      }),
      runDay('progression', '36 km long with marathon-pace block', 36, 'longRunMarathonBlocks', '20 km easy + 12 km at 4:05-4:12/km + 4 km easy. Fuel 75-90 g carbs/hour.', {
        startTime: '09:00',
        intervals: [
          {
            label: 'Marathon-pace block',
            repetitions: 1,
            distanceKm: 12,
            targetPace: {
              minPerKmFrom: '4:05',
              minPerKmTo: '4:12',
              description: 'Marathon-pace block inside long run',
            },
            targetHrZone: paceGuidelines.marathonPace.hrZone,
            recoveryInstruction: 'Finish with 4 km easy.',
          },
        ],
        mealTemplateId: 'long_run',
        sleepTargetHours: 9,
        fuelNotes: ['Fuel 75-90 g carbs/hour only if tolerated; practise gradually.'],
        instructions: ['Protect sleep and fueling. If anything feels off, keep the whole run easier.'],
      }),
    ],
  },
  {
    weekNumber: 15,
    startDate: '2026-09-07',
    phase: 'peak',
    targetMileageKm: 116,
    focus: 'High-volume speed endurance with controlled 1 km reps.',
    days: [
      restDay('Rest + Gym A1', 'No running. Gym A1 controlled.', {
        strengthSessionIds: [gymA1],
        dayType: 'strength',
        intensity: 'low',
        notes: ['Keep strength controlled. Do not chase soreness.'],
      }),
      runDay('interval', '18 km with 10 x 1 km', 18, 'interval', '10 x 1 km at 3:35-3:40/km, 90 sec to 2 min jog recovery.', {
        intervals: oneKmRepIntervals('1 km repeat', 10, '90 sec to 2 min jog recovery. Smooth, not maximal.'),
        warmupKm: 4,
        cooldownKm: 4,
        instructions: ['Fast workouts should be controlled and repeatable, not all-out racing.'],
      }),
      runDay('easy', '16 km easy + Gym B1', 16, 'easy', 'Easy aerobic run plus Gym B1.', {
        strengthSessionIds: [gymB1],
      }),
      runDay('medium_long', '23 km medium-long steady', 23, 'steady', 'Controlled medium-long steady run.'),
      runDay('recovery', '10 km recovery', 10, 'recovery', 'Very easy recovery.'),
      runDay('easy', '14 km easy + strides', 14, 'easy', 'Easy Saturday with 6 x 20 sec strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('long', '35 km relaxed long run', 35, 'longRunEasy', 'Long run relaxed, last 5 km steady only if fresh.', {
        startTime: '09:00',
        intervals: steadyBlock('Optional final steady block', 5),
        mealTemplateId: 'long_run',
        instructions: ['Only add the final steady 5 km if legs and Achilles feel normal.'],
      }),
    ],
  },
  {
    weekNumber: 16,
    startDate: '2026-09-14',
    phase: 'recovery',
    targetMileageKm: 82,
    focus: 'Cutback and consolidation. Freshness matters more than extra work.',
    days: [
      restDay('Rest + lighter Gym A2', 'No running. Lighter Gym A2.', {
        strengthSessionIds: [gymA2],
        dayType: 'strength',
        intensity: 'low',
        notes: ['Reduce gym load and keep two reps in reserve.'],
      }),
      runDay('marathon_pace', '15 km with 3 x 4 km marathon pace', 15, 'marathonPace', '3 x 4 km at marathon pace, 1 km easy between blocks.', {
        intervals: marathonIntervals('Marathon-pace block', 3, 4),
        warmupKm: 2,
        cooldownKm: 1,
        instructions: ['Controlled marathon rhythm only.'],
      }),
      runDay('easy', '12 km easy + Gym B2', 12, 'easy', 'Easy run plus Gym B2.', {
        strengthSessionIds: [gymB2],
        notes: ['Light strength only.'],
      }),
      runDay('medium_long', '18 km medium-long easy', 18, 'easy', 'Medium-long easy run.'),
      runDay('recovery', '8 km recovery', 8, 'recovery', 'Short recovery run.'),
      runDay('easy', '8 km easy + strides', 8, 'easy', 'Easy Saturday with relaxed strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(6, 20),
      }),
      runDay('long', '21 km relaxed long run', 21, 'longRunEasy', 'Relaxed cutback long run.', {
        startTime: '09:00',
        mealTemplateId: 'long_run',
      }),
    ],
  },
  {
    weekNumber: 17,
    startDate: '2026-09-21',
    phase: 'peak',
    targetMileageKm: 115,
    focus: 'Peak simulation week. The 38 km simulation is optional to complete fully.',
    days: [
      restDay('Rest + taper mobility', 'No running. Very light taper mobility only.', {
        strengthSessionIds: [taperMobility],
        dayType: 'strength',
        intensity: 'low',
        notes: ['Very light mobility/activation only. No heavy Wednesday gym this week.'],
      }),
      runDay('interval', '18 km speed endurance', 18, 'interval', '6 x 1 km at 3:35-3:40/km, then 4 x 400 m fast relaxed. Do not race this.', {
        intervals: [
          ...oneKmRepIntervals('1 km repeat', 6),
          {
            label: 'Fast relaxed 400 m',
            repetitions: 4,
            distanceKm: 0.4,
            targetPace: paceGuidelines.shortReps.pace,
            targetHrZone: paceGuidelines.shortReps.hrZone,
            recoveryDistanceKm: 0.2,
            recoveryInstruction: 'Jog 200 m and keep it relaxed.',
          },
        ],
        warmupKm: 4,
        cooldownKm: 3,
        instructions: ['Do not race this. Fast workouts should be controlled and repeatable.'],
      }),
      runDay('easy', '15 km easy', 15, 'easy', 'Easy aerobic support run.'),
      runDay('medium_long', '22 km medium-long', 22, 'steady', 'Medium-long run at 4:20-4:40/km.', {
        instructions: ['Keep Thursday controlled; the marathon simulation is Sunday.'],
      }),
      runDay('recovery', '10 km recovery + mobility', 10, 'recovery', 'Recovery run plus optional self-guided mobility. No gym loading before the marathon simulation.'),
      runDay('easy', '12 km easy', 12, 'easy', 'Easy Saturday. No strides if legs feel heavy.', {
        startTime: '09:30',
        instructions: ['Saturday stays easy because Sunday is the simulation.'],
      }),
      runDay('progression', '38 km marathon simulation', 38, 'longRunMarathonBlocks', '8 km easy + 3 x 8 km at 4:03-4:10/km with 2 km easy between blocks + 2 km cool-down.', {
        startTime: '09:00',
        intervals: [
          {
            label: 'Marathon-pace simulation block',
            repetitions: 3,
            distanceKm: 8,
            targetPace: paceGuidelines.marathonPace.pace,
            targetHrZone: paceGuidelines.marathonPace.hrZone,
            recoveryDistanceKm: 2,
            recoveryInstruction: '2 km easy between blocks.',
          },
        ],
        mealTemplateId: 'long_run',
        sleepTargetHours: 9,
        fuelNotes: ['Full race fuel test: 75-90 g carbs/hour. Use only practiced products.'],
        instructions: [
          'If Achilles is irritated, HR is unusually high, or legs feel flat, cap this at 34-36 km.',
          'The goal is confidence, not damage.',
        ],
      }),
    ],
  },
  {
    weekNumber: 18,
    startDate: '2026-09-28',
    phase: 'taper',
    targetMileageKm: 65,
    focus: 'Taper starts plus wedding/social protection. No heavy strength anymore.',
    days: [
      restDay('Rest + taper mobility', 'No running. Taper mobility only; no heavy strength anymore.', {
        strengthSessionIds: [taperMobility],
        dayType: 'strength',
        intensity: 'low',
        notes: ['During taper, freshness is more important than making up missed training.'],
      }),
      runDay('marathon_pace', '14 km with 2 x 4 km marathon pace', 14, 'marathonPace', '2 x 4 km at marathon pace, controlled.', {
        intervals: marathonIntervals('Marathon-pace block', 2, 4),
        warmupKm: 3,
        cooldownKm: 3,
        instructions: ['Controlled and smooth. Finish fresher than expected.'],
      }),
      runDay('easy', '10 km easy', 10, 'easy', 'Easy taper run.'),
      runDay('medium_long', '16 km easy-medium', 16, 'easy', 'Controlled easy-medium run.'),
      runDay('recovery', '8 km recovery', 8, 'recovery', 'Very easy recovery.'),
      runDay('recovery', '5 km shakeout or rest', 5, 'recovery', 'Shakeout or rest depending on wedding/social plans.', {
        startTime: '09:30',
        mealTemplateId: 'social_festival',
        notes: ['Rest if wedding logistics or sleep make this messy.'],
      }),
      runDay('easy', '12 km easy', 12, 'easy', 'Keep this genuinely light.', {
        startTime: '09:00',
        mealTemplateId: 'post_alcohol_recovery',
      }),
    ],
  },
  {
    weekNumber: 19,
    startDate: '2026-10-05',
    phase: 'taper',
    targetMileageKm: 76,
    focus: 'Taper 2. Smooth sharpness, no maximal work.',
    days: [
      restDay('Rest + taper mobility', 'No running. Mobility and activation only.', {
        strengthSessionIds: [taperMobility],
        dayType: 'strength',
        intensity: 'low',
        notes: ['During taper, freshness is more important than making up missed training.'],
      }),
      runDay('interval', '14 km with 5 x 1 km', 14, 'interval', '5 x 1 km at 3:40/km, 2 min jog recovery. Smooth, not maximal.', {
        intervals: [
          {
            label: '1 km smooth repeat',
            repetitions: 5,
            distanceKm: 1,
            targetPace: paceRange('3:40', 'Smooth fast rep pace'),
            targetHrZone: paceGuidelines.interval.hrZone,
            recoveryDurationMinutes: 2,
            recoveryInstruction: '2 min jog recovery. Smooth, not maximal.',
          },
        ],
        warmupKm: 4,
        cooldownKm: 5,
        instructions: ['Keep this smooth, not maximal.'],
      }),
      runDay('easy', '12 km easy', 12, 'easy', 'Easy taper run.'),
      runDay('marathon_pace', '14 km with 6 km marathon pace', 14, 'marathonPace', '14 km total with 6 km at marathon pace.', {
        intervals: [
          {
            label: 'Marathon-pace block',
            repetitions: 1,
            distanceKm: 6,
            targetPace: paceGuidelines.marathonPace.pace,
            targetHrZone: paceGuidelines.marathonPace.hrZone,
            recoveryInstruction: 'Easy running before and after the block.',
          },
        ],
        warmupKm: 4,
        cooldownKm: 4,
        instructions: ['Rhythm only. Do not force pace if tired.'],
      }),
      runDay('recovery', '8 km recovery', 8, 'recovery', 'Very easy recovery.'),
      runDay('easy', '8 km easy + strides', 8, 'easy', 'Easy Saturday with 4 x 20 sec strides.', {
        startTime: '09:30',
        intervals: relaxedStrides(4, 20),
      }),
      runDay('progression', '20 km long with 5 km marathon pace', 20, 'longRunMarathonBlocks', '20 km with 5 km at marathon pace if fresh.', {
        startTime: '09:00',
        intervals: [
          {
            label: 'Optional marathon-pace block',
            repetitions: 1,
            distanceKm: 5,
            targetPace: paceGuidelines.marathonPace.pace,
            targetHrZone: paceGuidelines.marathonPace.hrZone,
            recoveryInstruction: 'Only include this if fresh.',
          },
        ],
        mealTemplateId: 'long_run',
        instructions: ['Skip the marathon-pace block if there is any fatigue signal.'],
      }),
    ],
  },
  {
    weekNumber: 20,
    startDate: '2026-10-12',
    phase: 'race',
    targetMileageKm: 71.2,
    focus: 'Race week for Amsterdam Marathon. Freshness beats extra work.',
    days: [
      restDay('Rest + race-week mobility', 'No running. Race-week mobility only.', {
        strengthSessionIds: [taperMobility],
        dayType: 'strength',
        intensity: 'low',
        mealTemplateId: 'race_week',
        sleepTargetHours: 9,
        notes: ['Do not make up missed training. Freshness is the goal.', 'No gym loading during race week.'],
      }),
      runDay('marathon_pace', '10 km with 4 km marathon pace', 10, 'marathonPace', '3 km easy + 4 km at marathon pace + 3 km easy.', {
        mealTemplateId: 'race_week',
        intervals: [
          {
            label: 'Marathon-pace block',
            repetitions: 1,
            distanceKm: 4,
            targetPace: paceGuidelines.marathonPace.pace,
            targetHrZone: paceGuidelines.marathonPace.hrZone,
            recoveryInstruction: 'Easy running before and after.',
          },
        ],
        warmupKm: 3,
        cooldownKm: 3,
        instructions: ['Finish fresh. This is rhythm only.'],
      }),
      runDay('easy', '8 km easy', 8, 'easy', 'Easy race-week run.', {
        mealTemplateId: 'race_week',
      }),
      runDay('easy', '7 km easy + strides', 7, 'easy', 'Easy run with 4 x 20 sec strides.', {
        mealTemplateId: 'race_week',
        intervals: relaxedStrides(4, 20),
        instructions: ['Strides should feel smooth, not fast.'],
      }),
      restDay('Rest - kit and logistics', 'Prepare kit, gels, shoes, and logistics.', {
        mealTemplateId: 'race_week',
        sleepTargetHours: 9,
        notes: ['Keep food familiar and logistics calm.'],
      }),
      runDay('recovery', '4 km shakeout', 4, 'recovery', 'Very easy shakeout.', {
        startTime: '09:30',
        mealTemplateId: 'race_week',
        instructions: ['Stop while it still feels too easy.'],
      }),
      runDay('race', 'Amsterdam Marathon', 42.2, 'marathonPace', 'Race day: target 2:50-2:55.', {
        startTime: '09:00',
        mealTemplateId: 'race_week',
        dayType: 'race',
        intensity: 'race',
        sleepTargetHours: 9,
        instructions: [
          'Start at 4:08-4:10/km for the first 5 km, then settle around 4:03-4:08/km.',
          'Stay patient through 30 km and avoid hero surges.',
          'Use the practiced marathon pace range until it is time to compete late.',
        ],
        fuelNotes: [
          'Fuel 80-90 g carbs/hour using practiced Maurten products only.',
          'Begin fueling early and keep the rhythm steady.',
        ],
        recoveryNotes: ['Walk, drink, eat, and get warm after the finish.'],
      }),
    ],
  },
]

function getRunStartTime(run: RunBlueprint, dayOfWeek: string) {
  if (run.startTime) {
    return run.startTime
  }

  return dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday' ? '09:00' : '18:30'
}

function getEstimatedDurationMinutes(run: RunBlueprint) {
  if (run.estimatedDurationMinutes) {
    return run.estimatedDurationMinutes
  }

  const minutesPerKmByType: Record<RunType, number> = {
    recovery: 5.4,
    easy: 5.05,
    steady: 4.55,
    medium_long: 5,
    long: 5.05,
    threshold: 4.55,
    interval: 4.35,
    marathon_pace: 4.35,
    progression: 4.75,
    race: 4.05,
    rest: 0,
  }

  return Math.round(run.plannedDistanceKm * minutesPerKmByType[run.type])
}

function getDefaultFuelNotes(run: RunBlueprint) {
  if (run.plannedDistanceKm >= 24 || run.type === 'race') {
    return [
      'Use the 10:30/lunch/pre-run rhythm and practice race fueling when relevant.',
      'Carry fluid or plan access to water for long efforts.',
    ]
  }

  if (['threshold', 'interval', 'marathon_pace', 'progression'].includes(run.type)) {
    return ['Use the 17:15 pre-run snack and start hydrated.']
  }

  return ['Use the 17:15 snack if hungry; water is enough for most easy runs.']
}

function getDefaultRecoveryNotes(run: RunBlueprint) {
  const notes = ['Check Achilles and calf stiffness after the run and the next morning.']

  if (run.plannedDistanceKm >= 18 || ['threshold', 'marathon_pace', 'progression'].includes(run.type)) {
    notes.push('Prioritize dinner, hydration, and sleep after this session.')
  }

  return notes
}

function getDefaultInstructions(run: RunBlueprint) {
  const guideline = paceGuidelines[run.paceKey]
  const baseByType: Record<RunType, string> = {
    recovery: 'Keep the effort extremely easy and relaxed.',
    easy: 'Stay conversational and avoid drifting into steady effort.',
    steady: 'Keep pressure controlled and smooth.',
    medium_long: 'Build aerobic volume without turning it into a workout.',
    long: 'Run mostly easy and protect the final third.',
    threshold: 'Hard but controlled; every rep should feel repeatable.',
    interval: 'Short fast reps only, with full control.',
    marathon_pace: 'Lock into marathon rhythm without forcing faster splits.',
    progression: 'Only progress if the early running feels easy.',
    race: 'Execute patiently and fuel early.',
    rest: 'No running.',
  }

  const safetyNotes: string[] = []

  if (['threshold', 'interval', 'marathon_pace', 'progression'].includes(run.type)) {
    safetyNotes.push('Fast workouts should be controlled and repeatable, not all-out racing.')
  }

  if (['threshold', 'interval', 'marathon_pace', 'progression', 'long'].includes(run.type)) {
    safetyNotes.push('If Achilles pain appears, reduce intensity first, then reduce volume if needed.')
  }

  return Array.from(new Set([baseByType[run.type], guideline.notes, ...safetyNotes, ...(run.instructions ?? [])]))
}

function createRunWorkout(date: ISODateString, dayOfWeek: string, run: RunBlueprint): RunWorkout {
  const guideline = paceGuidelines[run.paceKey]

  return {
    id: `${date}_${run.type}`,
    type: run.type,
    title: run.title,
    startTime: getRunStartTime(run, dayOfWeek),
    plannedDistanceKm: run.plannedDistanceKm,
    estimatedDurationMinutes: getEstimatedDurationMinutes(run),
    targetPace: run.paceOverride ?? guideline.pace,
    targetHrZone: guideline.hrZone,
    targetHrDescription: run.targetHrDescription ?? guideline.hrDescription,
    warmupKm: run.warmupKm,
    cooldownKm: run.cooldownKm,
    intervals: run.intervals,
    instructions: getDefaultInstructions(run),
    fuelNotes: run.fuelNotes ?? getDefaultFuelNotes(run),
    recoveryNotes: run.recoveryNotes ?? getDefaultRecoveryNotes(run),
  }
}

function inferMealTemplate(day: DayBlueprint, phase: TrainingPhase): MealTemplateId {
  if (day.mealTemplateId) {
    return day.mealTemplateId
  }

  if (phase === 'race') {
    return 'race_week'
  }

  if (!day.run) {
    return 'rest_day'
  }

  if (day.run.plannedDistanceKm >= 18 || day.run.type === 'long' || day.run.type === 'progression') {
    return 'long_run'
  }

  if (['threshold', 'interval', 'marathon_pace'].includes(day.run.type)) {
    return 'workout_day'
  }

  return 'easy_run'
}

function inferIntensity(day: DayBlueprint): IntensityLevel {
  if (day.intensity) {
    return day.intensity
  }

  if (!day.run) {
    return day.strengthSessionIds?.length ? 'low' : 'rest'
  }

  if (day.run.type === 'race') {
    return 'race'
  }

  if (['threshold', 'interval', 'marathon_pace', 'progression'].includes(day.run.type)) {
    return 'high'
  }

  if (['long', 'medium_long', 'steady'].includes(day.run.type)) {
    return 'moderate'
  }

  return 'low'
}

function inferDayType(day: DayBlueprint, eventsForDay: string[]): DayType {
  if (day.dayType) {
    return day.dayType
  }

  if (day.run?.type === 'race') {
    return 'race'
  }

  const hasSocialEvent = eventsForDay.some((eventId) =>
    ['birthday', 'july_festival', 'august_festival', 'october_wedding'].includes(eventId),
  )

  if (!day.run && hasSocialEvent) {
    return 'social'
  }

  if (day.run && day.strengthSessionIds?.length) {
    return 'run_strength'
  }

  if (day.run) {
    return 'run'
  }

  if (day.strengthSessionIds?.length) {
    return 'strength'
  }

  return 'rest'
}

function createDayPlan(week: WeekBlueprint, day: DayBlueprint, offset: number): DayPlan {
  const date = addDays(week.startDate, offset)
  const dayOfWeek = getDayOfWeek(date)
  const specialEventIds = specialEvents
    .filter((event) => isDateBetween(date, event.startDate, event.endDate))
    .map((event) => event.id)
  const plannedRun = day.run ? createRunWorkout(date, dayOfWeek, day.run) : undefined
  const eventNotes = specialEvents
    .filter((event) => specialEventIds.includes(event.id))
    .map((event) => event.trainingImpact)

  return {
    date,
    weekNumber: week.weekNumber,
    dayOfWeek,
    phase: week.phase,
    dayType: inferDayType(day, specialEventIds),
    intensity: inferIntensity(day),
    title: day.title,
    summary: day.summary,
    plannedRun,
    strengthSessionIds: day.strengthSessionIds,
    mealPlan: getMealTemplate(inferMealTemplate(day, week.phase)),
    specialEventIds: specialEventIds.length ? specialEventIds : undefined,
    sleepTargetHours:
      day.sleepTargetHours ?? (plannedRun && plannedRun.plannedDistanceKm >= 24 ? 8.5 : 8),
    notes: [...(day.notes ?? []), ...eventNotes],
  }
}

export const trainingPlan: DayPlan[] = weeks.flatMap((week) =>
  week.days.map((day, index) => createDayPlan(week, day, index)),
)

export const weekPlans: WeekPlan[] = weeks.map((week) => ({
  weekNumber: week.weekNumber,
  startDate: week.startDate,
  endDate: addDays(week.startDate, 6),
  phase: week.phase,
  targetMileageKm: week.targetMileageKm,
  focus: week.focus,
  days: trainingPlan.filter((day) => day.weekNumber === week.weekNumber),
}))
