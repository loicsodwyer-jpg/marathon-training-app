import { AlertTriangle, CheckCircle2, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react'
import type { PlanAdjustmentProposal } from '../types/planAdjustment'
import { formatDisplayDate } from '../utils/dateUtils'
import {
  getChangedRunDayCount,
  getOriginalKm,
  getProposedKm,
} from '../utils/planAdjustmentProposalUtils'
import { getAdjustmentLevelLabel } from '../utils/planAdjustmentRules'
import AdjustmentChangeCard from './AdjustmentChangeCard'
import StatusPill from './StatusPill'

type AdjustmentProposalPreviewProps = {
  proposal: PlanAdjustmentProposal
  backLabel?: string
  isApplied?: boolean
  onBack: () => void
  onApprove: () => void
  onUseChatGptFallback?: () => void
}

function AdjustmentProposalPreview({
  backLabel = 'Back/edit',
  isApplied = false,
  onApprove,
  onBack,
  onUseChatGptFallback,
  proposal,
}: AdjustmentProposalPreviewProps) {
  const originalKm = getOriginalKm(proposal.changes)
  const proposedKm = getProposedKm(proposal.changes)
  const reductionPercent = originalKm > 0 ? Math.round((1 - proposedKm / originalKm) * 100) : 0
  const changedRunDays = getChangedRunDayCount(proposal.changes)

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-[24px] border border-cyan-100 bg-cyan-50/70 p-4 dark:border-cyan-300/20 dark:bg-cyan-300/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:text-cyan-200">
              Preview only
            </p>
            <h3 className="mt-1 text-xl font-semibold text-stone-950 dark:text-white">
              {proposal.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-stone-700 dark:text-slate-300">
              {proposal.summary}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusPill tone={proposal.source === 'manual_chatgpt' ? 'strength' : 'running'}>
              {proposal.source === 'manual_chatgpt' ? 'ChatGPT fallback' : 'Rule-based'}
            </StatusPill>
            <StatusPill tone="running">
              {getAdjustmentLevelLabel(proposal.adjustmentLevel)}
            </StatusPill>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Dates" value={`${formatDisplayDate(proposal.startDate)} - ${formatDisplayDate(proposal.endDate)}`} />
          <Metric label="Affected days" value={`${proposal.changes.length}`} />
          <Metric label="Run days changed" value={`${changedRunDays}`} />
          <Metric label="Km reduction" value={`${reductionPercent}%`} />
        </div>
      </section>

      {proposal.globalWarnings.length ? (
        <section className="rounded-[20px] border border-orange-100 bg-orange-50/80 p-4 dark:border-orange-300/25 dark:bg-orange-300/10">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-700 dark:text-orange-200" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-100">
              Proposal warnings
            </h3>
          </div>
          <ul className="space-y-2">
            {proposal.globalWarnings.map((warning) => (
              <li className="text-sm leading-5 text-orange-800/80 dark:text-orange-100/80" key={warning}>
                {warning}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-950 dark:text-white">
            Proposed day-by-day changes
          </h3>
          <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
            Preview the replacement sessions before saving them as local plan overrides.
          </p>
        </div>
        {proposal.changes.map((change) => (
          <AdjustmentChangeCard change={change} key={change.date} />
        ))}
      </section>

      <section className="space-y-3 rounded-[22px] border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
        {isApplied ? (
          <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/10">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
              Adjustment applied to your local plan. Your original plan is preserved.
            </p>
          </div>
        ) : null}
        <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-slate-950/35">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-stone-600 dark:text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-stone-950 dark:text-white">
              Approved adjustments are saved locally. Original plan data stays unchanged.
            </p>
          </div>
        </div>
        <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-slate-950/35">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-stone-600 dark:text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-stone-950 dark:text-white">
              {proposal.source === 'manual_chatgpt'
                ? 'This proposal came from manual ChatGPT fallback and was pasted locally.'
                : 'Manual ChatGPT fallback is available if you want an alternative proposal.'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button
            className="min-h-11 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
            onClick={onBack}
            type="button"
          >
            {backLabel}
          </button>
          <button
            className={`min-h-11 rounded-[18px] px-4 py-2 text-sm font-semibold transition ${
              isApplied
                ? 'cursor-not-allowed border border-stone-200 bg-stone-100 text-stone-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500'
                : 'bg-stone-950 text-white hover:bg-stone-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200'
            }`}
            disabled={isApplied}
            onClick={onApprove}
            title={isApplied ? 'This adjustment has already been applied.' : 'Apply this proposal as local plan overrides.'}
            type="button"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {isApplied ? 'Adjustment applied' : 'Approve adjustment'}
            </span>
          </button>
          {onUseChatGptFallback && !isApplied ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 transition hover:bg-purple-100 dark:border-purple-300/20 dark:bg-purple-300/10 dark:text-purple-100 dark:hover:bg-purple-300/15"
              onClick={onUseChatGptFallback}
              type="button"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Use ChatGPT fallback
            </button>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/70 bg-white/75 p-3 dark:border-white/10 dark:bg-slate-950/35">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-white">{value}</p>
    </div>
  )
}

export default AdjustmentProposalPreview
