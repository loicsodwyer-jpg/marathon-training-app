import { AlertTriangle, Droplets, Flame, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FuelingRecommendation } from '../types/fueling'
import {
  formatCarbs,
  formatFuelingSummary,
  getFuelingCategoryAccent,
  getFuelingCategoryLabel,
} from '../utils/fuelingFormatUtils'
import FuelingProductPill from './FuelingProductPill'
import StatusPill from './StatusPill'

type FuelingRecommendationCardProps = {
  compact?: boolean
  recommendation: FuelingRecommendation
}

function FuelingRecommendationCard({
  compact = false,
  recommendation,
}: FuelingRecommendationCardProps) {
  const allItems = [
    ...recommendation.preRun,
    ...recommendation.duringRun,
    ...recommendation.postRun,
  ]

  return (
    <section className="space-y-3 rounded-[20px] border border-amber-100 bg-amber-50/75 p-4 dark:border-amber-300/20 dark:bg-amber-300/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-100">
            <Flame className="h-4 w-4" aria-hidden="true" />
            <h3 className="text-sm font-semibold">{recommendation.title}</h3>
          </div>
          <p className="mt-1 text-sm leading-5 text-stone-700 dark:text-neutral-300">
            {formatFuelingSummary(recommendation)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getFuelingCategoryAccent(recommendation.category)}`}>
          {getFuelingCategoryLabel(recommendation.category)}
        </span>
      </div>

      {recommendation.category !== 'none' ? (
        <div className="flex flex-wrap gap-2">
          {recommendation.estimatedDurationMinutes ? (
            <StatusPill tone="neutral">{recommendation.estimatedDurationMinutes} min</StatusPill>
          ) : null}
          {recommendation.targetCarbsPerHour ? (
            <StatusPill tone="warning">{recommendation.targetCarbsPerHour} g/h target</StatusPill>
          ) : null}
          {recommendation.totalRecommendedCarbs ? (
            <StatusPill tone="running">{formatCarbs(recommendation.totalRecommendedCarbs)}</StatusPill>
          ) : null}
        </div>
      ) : null}

      {allItems.length ? (
        <div className="flex flex-wrap gap-2">
          {allItems.slice(0, compact ? 3 : allItems.length).map((item) => (
            <FuelingProductPill
              item={item}
              key={`${item.productId}-${item.timing}-${item.quantity}`}
            />
          ))}
        </div>
      ) : null}

      {!compact ? (
        <div className="space-y-2">
          <FuelingTimingSection items={recommendation.preRun} title="Pre-run" />
          <FuelingTimingSection items={recommendation.duringRun} title="During run" />
          <FuelingTimingSection items={recommendation.postRun} title="Post-run" />
          <FuelingList icon={Info} items={recommendation.practiceNotes} title="Practice" />
          <FuelingList icon={Droplets} items={recommendation.hydrationNotes} title="Hydration" />
          <FuelingList icon={AlertTriangle} items={recommendation.warnings} title="Caution" />
        </div>
      ) : null}
    </section>
  )
}

function FuelingTimingSection({
  items,
  title,
}: {
  items: FuelingRecommendation['preRun']
  title: string
}) {
  if (!items.length) {
    return null
  }

  return (
    <div className="rounded-[16px] border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-neutral-950/30">
      <h4 className="text-sm font-semibold text-stone-950 dark:text-white">{title}</h4>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={`${title}-${item.productId}-${item.timing}`}>
            <div className="flex flex-wrap gap-2">
              <FuelingProductPill item={item} />
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-200">
              {item.timing}
            </p>
            <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-300">
              {item.instruction}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FuelingList({
  icon: Icon,
  items,
  title,
}: {
  icon: LucideIcon
  items: string[]
  title: string
}) {
  if (!items.length) {
    return null
  }

  return (
    <div className="rounded-[16px] border border-white/70 bg-white/70 p-3 dark:border-white/10 dark:bg-neutral-950/30">
      <div className="mb-2 flex items-center gap-2 text-stone-800 dark:text-neutral-100">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li className="text-sm leading-5 text-stone-600 dark:text-neutral-300" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FuelingRecommendationCard
