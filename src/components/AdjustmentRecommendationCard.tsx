import { CalendarDays, RotateCcw, ShieldCheck } from 'lucide-react'
import type { AdjustmentRecommendation, PlanAdjustmentInput } from '../types/planAdjustment'
import { formatDisplayDate } from '../utils/dateUtils'
import {
  getAdjustmentLevelLabel,
  getAdjustmentLevelRules,
} from '../utils/planAdjustmentRules'
import AdjustmentSafetyWarnings from './AdjustmentSafetyWarnings'
import StatusPill from './StatusPill'

type AdjustmentRecommendationCardProps = {
  input: PlanAdjustmentInput
  recommendation: AdjustmentRecommendation
  onUseDates: () => void
  onUseLevel: () => void
}

function AdjustmentRecommendationCard({
  input,
  recommendation,
  onUseDates,
  onUseLevel,
}: AdjustmentRecommendationCardProps) {
  const rules = getAdjustmentLevelRules(recommendation.recommendedLevel)

  return (
    <section className="space-y-3 rounded-[22px] border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-300/20 dark:bg-cyan-300/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em]">Recommendation</p>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-stone-950 dark:text-white">
            {recommendation.summary}
          </h3>
        </div>
        <StatusPill tone="running">
          {getAdjustmentLevelLabel(recommendation.recommendedLevel)}
        </StatusPill>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="rounded-[16px] border border-white/70 bg-white/75 p-3 dark:border-white/10 dark:bg-neutral-950/35">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-cyan-700 dark:text-cyan-200" aria-hidden="true" />
            <p className="text-sm font-semibold text-stone-950 dark:text-white">
              {formatDisplayDate(recommendation.recommendedStartDate)} -{' '}
              {formatDisplayDate(recommendation.recommendedEndDate)}
            </p>
          </div>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
            {recommendation.recommendedDurationDays} affected day
            {recommendation.recommendedDurationDays === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-[16px] border border-white/70 bg-white/75 p-3 dark:border-white/10 dark:bg-neutral-950/35">
          <p className="text-sm font-semibold text-stone-950 dark:text-white">
            Load reduction: {rules.loadReductionRange}
          </p>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
            {rules.strengthGuidance}
          </p>
        </div>
      </div>

      <ul className="space-y-1">
        {recommendation.reasoning.map((reason) => (
          <li className="text-sm leading-5 text-stone-700 dark:text-neutral-300" key={reason}>
            {reason}
          </li>
        ))}
      </ul>

      <AdjustmentSafetyWarnings warnings={recommendation.safetyWarnings} />

      {(input.userOverrodeDates || input.userOverrodeLevel) ? (
        <p className="rounded-[16px] border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
          You adjusted the recommendation.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-300/25 dark:bg-white/[0.06] dark:text-cyan-200 dark:hover:bg-cyan-300/10"
          onClick={onUseDates}
          type="button"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Use dates
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-cyan-200 bg-white px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-300/25 dark:bg-white/[0.06] dark:text-cyan-200 dark:hover:bg-cyan-300/10"
          onClick={onUseLevel}
          type="button"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Use level
        </button>
      </div>
    </section>
  )
}

export default AdjustmentRecommendationCard
