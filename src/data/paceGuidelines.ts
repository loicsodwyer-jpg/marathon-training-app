import type { HRZone, PaceRange } from '../types/training'

type PaceGuideline = {
  pace: PaceRange
  hrZone: HRZone
  hrDescription: string
  notes: string
}

export const paceGuidelines = {
  recovery: {
    pace: {
      minPerKmFrom: '5:05',
      minPerKmTo: '5:40',
      description: 'Very easy recovery pace',
    },
    hrZone: 'Z1',
    hrDescription: 'Z1-low Z2',
    notes: 'Keep it relaxed enough to finish fresher than you started.',
  },
  easy: {
    pace: {
      minPerKmFrom: '4:35',
      minPerKmTo: '5:05',
      description: 'Conversational aerobic pace',
    },
    hrZone: 'Z2',
    hrDescription: 'Z2',
    notes: 'Default mileage pace for durability and aerobic development.',
  },
  steady: {
    pace: {
      minPerKmFrom: '4:15',
      minPerKmTo: '4:35',
      description: 'Steady aerobic pressure',
    },
    hrZone: 'Z3',
    hrDescription: 'High Z2-Z3',
    notes: 'Controlled, never straining.',
  },
  marathonPace: {
    pace: {
      minPerKmFrom: '4:03',
      minPerKmTo: '4:10',
      description: 'Controlled goal marathon pace range',
    },
    hrZone: 'Z3',
    hrDescription: 'Z3-low Z4',
    notes: 'Practice rhythm and fueling without forcing the pace.',
  },
  threshold: {
    pace: {
      minPerKmFrom: '3:45',
      minPerKmTo: '3:55',
      description: 'Hard but controlled threshold pace',
    },
    hrZone: 'Z4',
    hrDescription: 'Z4',
    notes: 'Strong, repeatable, and below all-out effort.',
  },
  interval: {
    pace: {
      minPerKmFrom: '3:35',
      minPerKmTo: '3:40',
      description: 'Fast 1 km rep pace',
    },
    hrZone: 'Z5',
    hrDescription: 'Z4-Z5',
    notes: 'Fast workouts should be controlled and repeatable, not all-out racing.',
  },
  shortReps: {
    pace: {
      minPerKmFrom: '3:15',
      minPerKmTo: '3:25',
      description: '400 m rep pace',
    },
    hrZone: 'Z5',
    hrDescription: 'Z4-Z5',
    notes: 'Use for short reps only; relaxed speed, not sprinting.',
  },
  strides: {
    pace: {
      minPerKmFrom: '3:15',
      minPerKmTo: '3:25',
      description: 'Fast relaxed strides, not sprinting',
    },
    hrZone: 'Z5',
    hrDescription: 'Neuromuscular speed',
    notes: 'Float fast with full control and plenty of recovery.',
  },
  longRunEasy: {
    pace: {
      minPerKmFrom: '4:35',
      minPerKmTo: '5:05',
      description: 'Easy long-run pace',
    },
    hrZone: 'Z2',
    hrDescription: 'Z2',
    notes: 'Keep the first half especially controlled.',
  },
  longRunMarathonBlocks: {
    pace: {
      minPerKmFrom: '4:03',
      minPerKmTo: '4:10',
      description: 'Marathon blocks at goal pace, easy outside blocks',
    },
    hrZone: 'Z3',
    hrDescription: 'Z3-low Z4 during blocks',
    notes: 'Easy pace outside the marathon-pace sections.',
  },
} satisfies Record<string, PaceGuideline>
