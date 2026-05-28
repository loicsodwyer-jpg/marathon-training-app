import type { PlanPhaseSegment } from '../types/planView'
import PageCard from './PageCard'
import StatusPill, { type StatusTone } from './StatusPill'

type PlanPhaseTimelineProps = {
  segments: PlanPhaseSegment[]
}

const phaseTone: Record<string, StatusTone> = {
  recovery: 'success',
  base: 'running',
  build: 'running',
  specific: 'warning',
  peak: 'warning',
  taper: 'neutral',
  race: 'race',
}

function PlanPhaseTimeline({ segments }: PlanPhaseTimelineProps) {
  return (
    <PageCard className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-950 dark:text-white">Phase timeline</h2>
        <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
          Recovery, base, build, specific, peak, taper, and race week.
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[720px] gap-2">
          {segments.map((segment) => (
            <div
              className="min-w-[132px] flex-1 rounded-[20px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]"
              key={`${segment.phase}-${segment.startWeek}`}
            >
              <StatusPill tone={phaseTone[segment.phase] ?? 'neutral'}>{segment.phase}</StatusPill>
              <p className="mt-3 text-sm font-semibold text-stone-950 dark:text-white">
                W{segment.startWeek}
                {segment.endWeek !== segment.startWeek ? `-W${segment.endWeek}` : ''}
              </p>
              <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-neutral-400">
                {segment.weekCount} week{segment.weekCount === 1 ? '' : 's'} - {segment.minMileageKm}
                {segment.maxMileageKm !== segment.minMileageKm ? `-${segment.maxMileageKm}` : ''} km
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageCard>
  )
}

export default PlanPhaseTimeline
