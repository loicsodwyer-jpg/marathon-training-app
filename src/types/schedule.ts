export type ScheduleBlockCategory =
  | 'wake'
  | 'commute'
  | 'work'
  | 'meal'
  | 'run'
  | 'strength'
  | 'recovery'
  | 'social'
  | 'race'
  | 'rest'
  | 'custom'

export type ScheduleBlockSource = 'planned' | 'custom'

export interface DailyScheduleBlock {
  id: string
  date: string
  title: string
  startTime: string
  endTime: string
  category: ScheduleBlockCategory
  source: ScheduleBlockSource
  description?: string
  isMovable?: boolean
  isEditable?: boolean
  originalStartTime?: string
  originalEndTime?: string
  relatedPlanId?: string
  completed?: boolean
  legacyIds?: string[]
}

export interface ScheduleBlockOverride {
  blockId: string
  startTime?: string
  endTime?: string
  title?: string
  description?: string
  category?: ScheduleBlockCategory
  completed?: boolean
}

export interface DailyScheduleOverrides {
  date: string
  blockOverrides: Record<string, ScheduleBlockOverride>
  customBlocks: DailyScheduleBlock[]
  hiddenDefaultActivityIds: string[]
  updatedAt: string
}

export type EditableScheduleBlockInput = {
  title: string
  category: ScheduleBlockCategory
  startTime: string
  endTime: string
  description?: string
}

export type EditableScheduleBlockUpdates = Partial<EditableScheduleBlockInput>
export type EditableScheduleBlockPatch = EditableScheduleBlockUpdates & {
  completed?: boolean
}
