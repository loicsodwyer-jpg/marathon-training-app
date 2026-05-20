import { SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import type { DayPlanOverride } from '../types/planOverride'
import type { PlanAdjustmentInput, PlanAdjustmentProposal } from '../types/planAdjustment'
import type { WorkoutLogEntry } from '../types/workoutLog'
import { parseChatGptAdjustmentJson } from '../utils/chatGptAdjustmentParser'
import {
  buildChatGptAdjustmentContext,
  buildChatGptAdjustmentPrompt,
} from '../utils/chatGptAdjustmentPromptUtils'
import { addDays } from '../utils/dateUtils'
import {
  buildAdjustmentProposal,
  validateAdjustmentProposal,
} from '../utils/planAdjustmentProposalUtils'
import { recommendAdjustment } from '../utils/planAdjustmentRules'
import AdjustmentIssueForm from './AdjustmentIssueForm'
import AdjustmentProposalPreview from './AdjustmentProposalPreview'
import ChatGptJsonPasteBox from './ChatGptJsonPasteBox'
import ChatGptPromptPreview from './ChatGptPromptPreview'
import ConfirmDialog from './ConfirmDialog'

type PlanAdjustmentAssistantModalProps = {
  open: boolean
  selectedDate: string
  activePlanOverrides?: Record<string, DayPlanOverride>
  workoutLogs: Record<string, WorkoutLogEntry>
  onApplyProposal: (proposal: PlanAdjustmentProposal) => void
  onClose: () => void
}

type AssistantStep = 'form' | 'preview' | 'chatgpt_prompt' | 'chatgpt_paste' | 'chatgpt_preview'

function PlanAdjustmentAssistantModal({
  activePlanOverrides,
  onClose,
  onApplyProposal,
  open,
  selectedDate,
  workoutLogs,
}: PlanAdjustmentAssistantModalProps) {
  const [input, setInput] = useState<PlanAdjustmentInput>(() =>
    createInitialInput(selectedDate, workoutLogs),
  )
  const [proposal, setProposal] = useState<PlanAdjustmentProposal>()
  const [ruleBasedProposal, setRuleBasedProposal] = useState<PlanAdjustmentProposal>()
  const [step, setStep] = useState<AssistantStep>('form')
  const [errors, setErrors] = useState<string[]>([])
  const [chatGptPrompt, setChatGptPrompt] = useState('')
  const [chatGptJson, setChatGptJson] = useState('')
  const [chatGptErrors, setChatGptErrors] = useState<string[]>([])
  const [chatGptMessage, setChatGptMessage] = useState<string>()
  const [isWarningConfirmOpen, setIsWarningConfirmOpen] = useState(false)
  const [isApplied, setIsApplied] = useState(false)
  const recommendation = useMemo(
    () => recommendAdjustment(input, selectedDate, workoutLogs),
    [input, selectedDate, workoutLogs],
  )

  if (!open) {
    return null
  }

  const handleUseRecommendedDates = () => {
    setInput((current) => ({
      ...current,
      startDate: recommendation.recommendedStartDate,
      endDate: recommendation.recommendedEndDate,
      userOverrodeDates: false,
    }))
  }

  const handleUseRecommendedLevel = () => {
    setInput((current) => ({
      ...current,
      adjustmentLevel: recommendation.recommendedLevel,
      userOverrodeLevel: false,
    }))
  }

  const handleGenerateProposal = () => {
    const validationErrors = validateInput(input)
    setErrors(validationErrors)

    if (validationErrors.length) {
      return
    }

    const effectiveInput: PlanAdjustmentInput = {
      ...input,
      startDate: input.userOverrodeDates ? input.startDate : recommendation.recommendedStartDate,
      endDate: input.userOverrodeDates ? input.endDate : recommendation.recommendedEndDate,
      adjustmentLevel: input.userOverrodeLevel
        ? input.adjustmentLevel
        : recommendation.recommendedLevel,
    }
    const effectiveRecommendation = recommendAdjustment(effectiveInput, selectedDate, workoutLogs)
    const nextProposal = buildAdjustmentProposal(effectiveInput, effectiveRecommendation)
    const extraWarnings = validateAdjustmentProposal(nextProposal, effectiveInput)
    const proposalWithWarnings = {
      ...nextProposal,
      globalWarnings: Array.from(new Set([...nextProposal.globalWarnings, ...extraWarnings])),
    }

    setInput(effectiveInput)
    setProposal(proposalWithWarnings)
    setRuleBasedProposal(proposalWithWarnings)
    setChatGptPrompt('')
    setChatGptJson('')
    setChatGptErrors([])
    setChatGptMessage(undefined)
    setIsApplied(false)
    setStep('preview')
  }

  const handleUseChatGptFallback = () => {
    const currentRuleProposal = ruleBasedProposal ?? proposal

    if (!currentRuleProposal) {
      return
    }

    setChatGptPrompt(
      buildChatGptAdjustmentPrompt({
        adjustmentInput: input,
        activePlanOverrides,
        ruleBasedProposal: currentRuleProposal,
        workoutLogs,
      }),
    )
    setChatGptErrors([])
    setChatGptMessage(undefined)
    setStep('chatgpt_prompt')
  }

  const handleValidateChatGptJson = () => {
    if (!ruleBasedProposal) {
      setChatGptErrors(['Generate a rule-based proposal first, then use the ChatGPT fallback.'])
      return
    }

    const result = parseChatGptAdjustmentJson(
      chatGptJson,
      buildChatGptAdjustmentContext({
        adjustmentInput: input,
        activePlanOverrides,
        ruleBasedProposal,
      }),
    )

    if (!result.success || !result.proposal) {
      setChatGptErrors(result.errors)
      return
    }

    setProposal(result.proposal)
    setChatGptErrors([])
    setChatGptMessage(undefined)
    setIsApplied(false)
    setStep('chatgpt_preview')
  }

  const applyProposal = () => {
    if (!proposal || isApplied) {
      return
    }

    if (proposal.globalWarnings.length) {
      setIsWarningConfirmOpen(true)
      return
    }

    onApplyProposal(proposal)
    setIsApplied(true)
  }

  const applyProposalWithWarnings = () => {
    if (!proposal || isApplied) {
      return
    }

    onApplyProposal(proposal)
    setIsApplied(true)
    setIsWarningConfirmOpen(false)
  }

  return (
    <div
      aria-label="Plan adjustment assistant"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex h-dvh items-end justify-center bg-slate-950/70 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center"
      role="dialog"
    >
      <div className="max-h-[calc(100dvh-28px)] w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-200">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.08em]">
                {step.startsWith('chatgpt') ? 'Manual ChatGPT fallback' : 'Rule-based preview'}
              </p>
            </div>
            <h2 className="mt-1 truncate text-base font-semibold text-stone-950 dark:text-white">
              Adjust plan
            </h2>
          </div>
          <button
            aria-label="Close plan adjustment assistant"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-96px)] overflow-y-auto p-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
          <div className="mb-4 rounded-[20px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
            <p className="text-sm leading-5 text-stone-600 dark:text-slate-300">
              Rule-based adjustments for injury, sickness, fatigue, missed training, or life events.
              Preview changes first, then save them as local overrides only after approval.
            </p>
          </div>

          {step === 'form' || !proposal ? (
            <AdjustmentIssueForm
              errors={errors}
              input={input}
              onChange={(nextInput) => {
                setInput(nextInput)
                setProposal(undefined)
                setRuleBasedProposal(undefined)
                setErrors([])
                setChatGptErrors([])
                setChatGptMessage(undefined)
              }}
              onGenerateProposal={handleGenerateProposal}
              onUseRecommendedDates={handleUseRecommendedDates}
              onUseRecommendedLevel={handleUseRecommendedLevel}
              recommendation={recommendation}
            />
          ) : step === 'chatgpt_prompt' ? (
            <ChatGptPromptPreview
              onBack={() => setStep('preview')}
              onContinue={() => setStep('chatgpt_paste')}
              prompt={chatGptPrompt}
            />
          ) : step === 'chatgpt_paste' ? (
            <ChatGptJsonPasteBox
              errors={chatGptErrors}
              message={chatGptMessage}
              onBackToPrompt={() => setStep('chatgpt_prompt')}
              onChange={(value) => {
                setChatGptJson(value)
                setChatGptErrors([])
              }}
              onClear={() => {
                setChatGptJson('')
                setChatGptErrors([])
              }}
              onValidate={handleValidateChatGptJson}
              value={chatGptJson}
            />
          ) : (
            <AdjustmentProposalPreview
              backLabel={step === 'chatgpt_preview' ? 'Ask for revision' : 'Back/edit'}
              isApplied={isApplied}
              onApprove={applyProposal}
              onBack={() => {
                if (step === 'chatgpt_preview') {
                  setChatGptMessage(
                    'Please ask ChatGPT to revise the output and paste the new version here.',
                  )
                  setStep('chatgpt_paste')
                  return
                }

                setProposal(ruleBasedProposal)
                setStep('form')
              }}
              onUseChatGptFallback={
                proposal.source === 'manual_chatgpt' ? undefined : handleUseChatGptFallback
              }
              proposal={proposal}
            />
          )}
        </div>

        <ConfirmDialog
          confirmLabel="Apply anyway"
          description="This proposal has warnings. It will only create local overrides and the original plan will stay preserved."
          onCancel={() => setIsWarningConfirmOpen(false)}
          onConfirm={applyProposalWithWarnings}
          open={isWarningConfirmOpen}
          title="Apply proposal with warnings?"
          tone="danger"
        />
      </div>
    </div>
  )
}

function createInitialInput(
  selectedDate: string,
  workoutLogs: Record<string, WorkoutLogEntry>,
): PlanAdjustmentInput {
  const startDate =
    selectedDate >= trainingPlanStartDate && selectedDate <= trainingPlanEndDate
      ? selectedDate
      : trainingPlanStartDate
  const baseInput: PlanAdjustmentInput = {
    issueType: 'injury',
    injuryArea: 'achilles',
    sicknessType: 'mild_cold',
    severity: 3,
    symptomTrend: 'stable',
    painDuringRun: 'unknown',
    nextMorningResponse: 'unknown',
    hasRedFlag: false,
    description: '',
    startDate,
    endDate: addDays(startDate, 4),
    userOverrodeDates: false,
    adjustmentLevel: 'low_medium',
    userOverrodeLevel: false,
    runningTolerance: 'easy_only',
    canBike: true,
    strengthTolerance: 'reduced',
    raceGoalStillValid: 'yes',
  }
  const recommendation = recommendAdjustment(baseInput, selectedDate, workoutLogs)

  return {
    ...baseInput,
    endDate: recommendation.recommendedEndDate,
    adjustmentLevel: recommendation.recommendedLevel,
  }
}

function validateInput(input: PlanAdjustmentInput): string[] {
  const errors: string[] = []

  if (!input.startDate) {
    errors.push('Start date is required.')
  }

  if (!input.endDate) {
    errors.push('End date is required.')
  }

  if (input.startDate && input.endDate && input.endDate < input.startDate) {
    errors.push('End date must be on or after start date.')
  }

  if (input.severity < 1 || input.severity > 10) {
    errors.push('Severity must be between 1 and 10.')
  }

  if (input.issueType === 'injury' && !input.injuryArea) {
    errors.push('Injury area is required for injury issues.')
  }

  if (input.issueType === 'sickness' && !input.sicknessType) {
    errors.push('Sickness type is required for sickness issues.')
  }

  if (input.startDate < trainingPlanStartDate || input.endDate > trainingPlanEndDate) {
    errors.push('Dates should be inside the marathon block for this preview.')
  }

  return errors
}

export default PlanAdjustmentAssistantModal
