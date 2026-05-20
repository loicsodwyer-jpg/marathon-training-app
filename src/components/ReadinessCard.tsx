import { Gauge, Minus, Plus } from 'lucide-react'
import type { MarathonReadiness } from '../types/dashboard'
import DashboardSection from './DashboardSection'
import StatusPill, { type StatusTone } from './StatusPill'

type ReadinessCardProps = {
  readiness: MarathonReadiness
}

const readinessTone: Record<MarathonReadiness['label'], StatusTone> = {
  'Not enough data': 'neutral',
  Building: 'running',
  'On track': 'success',
  Strong: 'success',
  'At risk': 'warning',
}

function ReadinessCard({ readiness }: ReadinessCardProps) {
  const tone = readinessTone[readiness.label]

  return (
    <DashboardSection
      icon={Gauge}
      pill={readiness.label}
      subtitle="Simple guidance from logged consistency, mileage, long runs, and strength."
      title="Marathon readiness"
      tone={tone}
    >
      <div className="rounded-[20px] border border-stone-100 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/[0.05]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-600 dark:text-slate-400">Score</p>
            <p className="mt-1 text-4xl font-semibold text-stone-950 dark:text-white">
              {readiness.label === 'Not enough data' ? '-' : readiness.score}
            </p>
          </div>
          <StatusPill tone={tone}>{readiness.label}</StatusPill>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-cyan-500 dark:bg-cyan-300"
            style={{ width: `${readiness.score}%` }}
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-slate-300">
          {readiness.description}
        </p>
      </div>

      <div className="grid gap-2">
        {readiness.positives.map((positive) => (
          <SignalLine icon="positive" key={positive} text={positive} />
        ))}
        {readiness.concerns.map((concern) => (
          <SignalLine icon="concern" key={concern} text={concern} />
        ))}
      </div>
    </DashboardSection>
  )
}

function SignalLine({ icon, text }: { icon: 'positive' | 'concern'; text: string }) {
  const Icon = icon === 'positive' ? Plus : Minus

  return (
    <div className="flex items-start gap-2 rounded-[16px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          icon === 'positive'
            ? 'text-emerald-600 dark:text-emerald-300'
            : 'text-orange-600 dark:text-orange-300'
        }`}
        aria-hidden="true"
      />
      <p className="text-sm leading-5 text-stone-600 dark:text-slate-300">{text}</p>
    </div>
  )
}

export default ReadinessCard
