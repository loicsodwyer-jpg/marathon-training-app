import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { RiskSignal } from '../types/dashboard'
import DashboardSection from './DashboardSection'
import EmptyStateCard from './EmptyStateCard'
import StatusPill, { type StatusTone } from './StatusPill'

type RiskSignalsCardProps = {
  signals: RiskSignal[]
}

const severityTone: Record<RiskSignal['severity'], StatusTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'race',
}

function RiskSignalsCard({ signals }: RiskSignalsCardProps) {
  return (
    <DashboardSection
      icon={AlertTriangle}
      pill={`${signals.length} signal${signals.length === 1 ? '' : 's'}`}
      subtitle="Guidance signals from local logs, not medical advice."
      title="Risk signals"
      tone={signals.some((signal) => signal.severity === 'high') ? 'race' : signals.length ? 'warning' : 'success'}
    >
      {signals.length ? (
        <div className="space-y-2">
          {signals.map((signal) => (
            <div
              className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]"
              key={signal.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-950 dark:text-white">
                    {signal.label}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-300">
                    {signal.description}
                  </p>
                </div>
                <StatusPill tone={severityTone[signal.severity]}>{signal.severity}</StatusPill>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateCard
          description="No major risk signals from the logged data. Keep logging consistently so this stays useful."
          icon={CheckCircle2}
          title="No major signals"
        />
      )}
    </DashboardSection>
  )
}

export default RiskSignalsCard
