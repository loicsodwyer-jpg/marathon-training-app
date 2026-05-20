import type {
  AdjustmentIssueType,
  AdjustmentLevel,
  AdjustmentRecommendation,
  InjuryArea,
  PlanAdjustmentInput,
  SicknessType,
} from '../types/planAdjustment'
import type { WorkoutLogEntry } from '../types/workoutLog'
import { addDays } from './dateUtils'
import { getDayPlan } from './trainingPlanUtils'

type AdjustmentLevelRules = {
  label: string
  description: string
  loadReductionRange: string
  longRunReductionRange: string
  strengthGuidance: string
}

const levelRules: Record<AdjustmentLevel, AdjustmentLevelRules> = {
  low: {
    label: 'Low',
    description: 'Keep easy running. Slightly trim quality work and cap effort.',
    loadReductionRange: '0-15%',
    longRunReductionRange: '0-10%',
    strengthGuidance: 'Mostly keep strength, with slightly reduced load if relevant.',
  },
  low_medium: {
    label: 'Low/Medium',
    description: 'Shorten easy runs and turn harder work into controlled aerobic work.',
    loadReductionRange: '15-30%',
    longRunReductionRange: '10-20%',
    strengthGuidance: 'Reduce strength volume by about 20-30%.',
  },
  medium: {
    label: 'Medium',
    description: 'Remove hard running. Keep easy running only if symptoms allow.',
    loadReductionRange: '30-50%',
    longRunReductionRange: '25-40%',
    strengthGuidance: 'Use light prehab, core, or mobility only.',
  },
  medium_high: {
    label: 'Medium/High',
    description: 'Short easy only, bike replacement, or rest. No hard running.',
    loadReductionRange: '50-75%',
    longRunReductionRange: 'Heavy reduction or bike replacement',
    strengthGuidance: 'Mobility only. Avoid heavy loading.',
  },
  high: {
    label: 'High',
    description: 'No running during the affected period. Rest, walk, or easy bike only if safe.',
    loadReductionRange: '75-100%',
    longRunReductionRange: 'Cancel long run',
    strengthGuidance: 'No heavy strength. Gentle mobility only if safe.',
  },
}

const levelRank: Record<AdjustmentLevel, number> = {
  low: 1,
  low_medium: 2,
  medium: 3,
  medium_high: 4,
  high: 5,
}

const levelsByRank: AdjustmentLevel[] = ['low', 'low_medium', 'medium', 'medium_high', 'high']

export function getAdjustmentLevelLabel(level: AdjustmentLevel): string {
  return levelRules[level].label
}

export function getAdjustmentLevelDescription(level: AdjustmentLevel): string {
  return levelRules[level].description
}

export function getAdjustmentLevelRules(level: AdjustmentLevel): AdjustmentLevelRules {
  return levelRules[level]
}

export function getAdjustmentLevelLoadReductionRange(level: AdjustmentLevel): string {
  return levelRules[level].loadReductionRange
}

export function atLeastAdjustmentLevel(
  level: AdjustmentLevel,
  minimumLevel: AdjustmentLevel,
): AdjustmentLevel {
  return levelRank[level] >= levelRank[minimumLevel] ? level : minimumLevel
}

export function recommendAdjustment(
  input: PlanAdjustmentInput,
  selectedDate: string,
  logs: Record<string, WorkoutLogEntry> = {},
): AdjustmentRecommendation {
  const startDate = input.startDate || selectedDate
  const durationDays = getRecommendedDurationDays(input)
  const recommendedLevel = getRecommendedLevel(input)
  const recommendedEndDate = addDays(startDate, Math.max(durationDays - 1, 0))
  const reasoning = getRecommendationReasoning(input, recommendedLevel, durationDays, logs)
  const safetyWarnings = getSafetyWarnings(input)
  const selectedDay = getDayPlan(startDate)

  if (selectedDay?.phase === 'race' || selectedDay?.phase === 'taper') {
    safetyWarnings.push('This touches taper/race week. Prefer freshness and avoid adding missed work back in.')
  }

  return {
    recommendedStartDate: startDate,
    recommendedEndDate,
    recommendedLevel,
    recommendedDurationDays: durationDays,
    summary: `${getAdjustmentLevelLabel(recommendedLevel)} adjustment for ${durationDays} day${durationDays === 1 ? '' : 's'}.`,
    reasoning,
    safetyWarnings,
  }
}

function getRecommendedDurationDays(input: PlanAdjustmentInput): number {
  const severity = input.severity

  if (input.issueType === 'injury') {
    const baseDuration =
      severity <= 2 ? 4 : severity <= 4 ? 7 : severity <= 6 ? 10 : 14
    return isConservativeInjuryArea(input.injuryArea) ? Math.min(baseDuration + 2, 14) : baseDuration
  }

  if (input.issueType === 'sickness') {
    if (input.sicknessType === 'mild_cold') {
      return severity <= 3 ? 3 : 4
    }

    if (input.sicknessType === 'gi_illness') {
      return severity >= 7 ? 6 : 5
    }

    if (input.sicknessType === 'fever_flu' || input.sicknessType === 'chest_symptoms') {
      return severity >= 7 ? 10 : 7
    }

    return severity >= 6 ? 7 : 4
  }

  if (input.issueType === 'fatigue') {
    return severity <= 3 ? 3 : severity <= 6 ? 5 : 7
  }

  if (input.issueType === 'party_social') {
    return severity >= 7 ? 3 : severity >= 4 ? 2 : 1
  }

  if (input.issueType === 'missed_training') {
    return severity >= 6 ? 7 : 4
  }

  if (['travel', 'life_event', 'work_stress'].includes(input.issueType)) {
    return severity >= 7 ? 5 : severity >= 4 ? 4 : 2
  }

  return severity >= 7 ? 5 : 3
}

function getRecommendedLevel(input: PlanAdjustmentInput): AdjustmentLevel {
  let level = getBaseLevel(input.issueType, input.severity)

  if (input.hasRedFlag) {
    level = 'high'
  }

  if (input.issueType === 'injury') {
    if (input.painDuringRun === 'changes_stride' || input.painDuringRun === 'worse') {
      level = atLeastAdjustmentLevel(level, 'medium_high')
    }

    if (input.nextMorningResponse === 'worse') {
      level = atLeastAdjustmentLevel(level, 'medium')
    }

    if (input.nextMorningResponse === 'stiff' && input.injuryArea === 'achilles') {
      level = atLeastAdjustmentLevel(level, input.severity >= 5 ? 'medium_high' : 'medium')
    }

    if (input.injuryArea === 'shin' && input.severity >= 4) {
      level = atLeastAdjustmentLevel(level, 'high')
    }
  }

  if (input.issueType === 'sickness') {
    if (input.sicknessType === 'fever_flu' || input.sicknessType === 'chest_symptoms') {
      level = 'high'
    } else if (input.sicknessType === 'gi_illness' && input.severity >= 6) {
      level = atLeastAdjustmentLevel(level, 'medium_high')
    }
  }

  if (input.runningTolerance === 'no_running') {
    level = atLeastAdjustmentLevel(level, 'high')
  } else if (input.runningTolerance === 'short_easy_only') {
    level = atLeastAdjustmentLevel(level, 'medium_high')
  } else if (input.runningTolerance === 'easy_only') {
    level = atLeastAdjustmentLevel(level, 'medium')
  }

  if (input.raceGoalStillValid === 'no') {
    level = atLeastAdjustmentLevel(level, 'medium_high')
  }

  return level
}

function getBaseLevel(issueType: AdjustmentIssueType, severity: number): AdjustmentLevel {
  if (issueType === 'party_social') {
    return severity <= 3 ? 'low' : severity <= 6 ? 'medium' : 'high'
  }

  if (issueType === 'missed_training') {
    return severity <= 3 ? 'low_medium' : 'medium'
  }

  if (issueType === 'travel' || issueType === 'life_event' || issueType === 'work_stress') {
    return severity <= 3 ? 'low' : severity <= 6 ? 'low_medium' : 'medium'
  }

  if (severity <= 2) {
    return 'low'
  }

  if (severity === 3) {
    return 'low_medium'
  }

  if (severity === 4) {
    return 'medium'
  }

  if (severity <= 6) {
    return 'medium_high'
  }

  return 'high'
}

function getRecommendationReasoning(
  input: PlanAdjustmentInput,
  level: AdjustmentLevel,
  durationDays: number,
  logs: Record<string, WorkoutLogEntry>,
) {
  const latestLogDate = Object.keys(logs).sort().at(-1)
  const reasoning = [
    `${formatIssueType(input.issueType)} severity ${input.severity}/10 maps to ${getAdjustmentLevelLabel(level)}.`,
    `Recommended window is ${durationDays} day${durationDays === 1 ? '' : 's'} to smooth load instead of cramming missed work.`,
  ]

  if (input.issueType === 'injury' && input.injuryArea) {
    reasoning.push(`${formatInjuryArea(input.injuryArea)} issues get conservative impact and strength loading changes.`)
  }

  if (input.symptomTrend === 'worsening') {
    reasoning.push('Worsening symptoms increase the adjustment level.')
  }

  if (latestLogDate) {
    reasoning.push(`Latest local workout log is ${latestLogDate}, used only as light context.`)
  }

  return reasoning
}

function getSafetyWarnings(input: PlanAdjustmentInput) {
  const warnings: string[] = []

  if (input.severity >= 7) {
    warnings.push('High severity: consider physio/medical advice if symptoms persist or worsen.')
  }

  if (input.painDuringRun === 'changes_stride') {
    warnings.push('Changed stride or limping is a stop signal, not a training puzzle to solve with more load.')
  }

  if (input.painDuringRun === 'worse') {
    warnings.push('Pain that worsens during running should not be trained through.')
  }

  if (input.nextMorningResponse === 'worse') {
    warnings.push('A worse next morning response suggests the previous load was too much.')
  }

  if (input.injuryArea === 'shin' || input.injuryArea === 'foot') {
    warnings.push('Shin/foot pain can include bone-stress risk. Be conservative and seek advice if focal or worsening.')
  }

  if (input.sicknessType === 'fever_flu' || input.sicknessType === 'chest_symptoms') {
    warnings.push('Fever, flu, or chest symptoms mean no hard training until fully recovered.')
  }

  if (input.sicknessType === 'gi_illness') {
    warnings.push('GI illness can leave dehydration behind. Resume only after normal eating and hydration.')
  }

  return Array.from(new Set(warnings))
}

function isConservativeInjuryArea(area: InjuryArea | undefined) {
  return area === 'achilles' || area === 'calf' || area === 'shin' || area === 'foot'
}

function formatIssueType(issueType: AdjustmentIssueType) {
  return issueType.replaceAll('_', ' ')
}

function formatInjuryArea(area: InjuryArea) {
  return area.replaceAll('_', '/')
}

export function getAdjustmentLevelOptions() {
  return levelsByRank
}

export function getSicknessTypeLabel(sicknessType: SicknessType) {
  return sicknessType.replaceAll('_', ' ')
}
