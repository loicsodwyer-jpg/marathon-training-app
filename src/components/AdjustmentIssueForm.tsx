import type {
  AdjustmentIssueType,
  InjuryArea,
  PlanAdjustmentInput,
  RunningTolerance,
  SicknessType,
  StrengthTolerance,
  SymptomTrend,
} from '../types/planAdjustment'
import type { AdjustmentRecommendation } from '../types/planAdjustment'
import { trainingPlanEndDate, trainingPlanStartDate } from '../data/trainingPlan'
import AdjustmentLevelSelector from './AdjustmentLevelSelector'
import AdjustmentRecommendationCard from './AdjustmentRecommendationCard'
import AppDateInput from './AppDateInput'

type AdjustmentIssueFormProps = {
  input: PlanAdjustmentInput
  recommendation: AdjustmentRecommendation
  errors: string[]
  onChange: (input: PlanAdjustmentInput) => void
  onGenerateProposal: () => void
  onUseRecommendedDates: () => void
  onUseRecommendedLevel: () => void
}

const issueTypeOptions: { value: AdjustmentIssueType; label: string }[] = [
  { value: 'injury', label: 'Injury' },
  { value: 'sickness', label: 'Sickness' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'missed_training', label: 'Missed training' },
  { value: 'life_event', label: 'Life event' },
  { value: 'party_social', label: 'Party/social' },
  { value: 'travel', label: 'Travel' },
  { value: 'work_stress', label: 'Work stress' },
  { value: 'other', label: 'Other' },
]

const injuryAreaOptions: { value: InjuryArea; label: string }[] = [
  { value: 'achilles', label: 'Achilles' },
  { value: 'calf', label: 'Calf' },
  { value: 'shin', label: 'Shin' },
  { value: 'foot', label: 'Foot' },
  { value: 'knee', label: 'Knee' },
  { value: 'hamstring_glute', label: 'Hamstring/glute' },
  { value: 'hip', label: 'Hip' },
  { value: 'back', label: 'Back' },
  { value: 'other', label: 'Other' },
]

const sicknessTypeOptions: { value: SicknessType; label: string }[] = [
  { value: 'mild_cold', label: 'Mild cold' },
  { value: 'fever_flu', label: 'Fever/flu' },
  { value: 'chest_symptoms', label: 'Chest symptoms' },
  { value: 'gi_illness', label: 'GI illness' },
  { value: 'other', label: 'Other' },
]

const trendOptions: { value: SymptomTrend; label: string }[] = [
  { value: 'improving', label: 'Improving' },
  { value: 'stable', label: 'Stable' },
  { value: 'worsening', label: 'Worsening' },
  { value: 'unknown', label: 'Unknown' },
]

const runningToleranceOptions: { value: RunningTolerance; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'easy_only', label: 'Easy only' },
  { value: 'short_easy_only', label: 'Short easy only' },
  { value: 'no_running', label: 'No running' },
  { value: 'unknown', label: 'Unknown' },
]

const strengthToleranceOptions: { value: StrengthTolerance; label: string }[] = [
  { value: 'full', label: 'Full' },
  { value: 'reduced', label: 'Reduced' },
  { value: 'upper_core_only', label: 'Upper/core only' },
  { value: 'mobility_only', label: 'Mobility only' },
  { value: 'none', label: 'None' },
]

function AdjustmentIssueForm({
  errors,
  input,
  onChange,
  onGenerateProposal,
  onUseRecommendedDates,
  onUseRecommendedLevel,
  recommendation,
}: AdjustmentIssueFormProps) {
  const updateInput = <K extends keyof PlanAdjustmentInput>(
    key: K,
    value: PlanAdjustmentInput[K],
  ) => {
    onChange({ ...input, [key]: value })
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-[22px] border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
        <div>
          <h3 className="text-lg font-semibold text-stone-950 dark:text-white">Issue details</h3>
          <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
            Structured inputs keep this preview conservative and predictable.
          </p>
        </div>

        <SelectField
          label="Issue type"
          onChange={(value) => updateInput('issueType', value as AdjustmentIssueType)}
          options={issueTypeOptions}
          value={input.issueType}
        />

        {input.issueType === 'injury' ? (
          <SelectField
            label="Injury area"
            onChange={(value) => updateInput('injuryArea', value as InjuryArea)}
            options={injuryAreaOptions}
            value={input.injuryArea ?? ''}
          />
        ) : null}

        {input.issueType === 'sickness' ? (
          <SelectField
            label="Sickness type"
            onChange={(value) => updateInput('sicknessType', value as SicknessType)}
            options={sicknessTypeOptions}
            value={input.sicknessType ?? ''}
          />
        ) : null}

        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-semibold text-stone-700 dark:text-slate-200">
            Severity
            <span>{input.severity}/10</span>
          </span>
          <input
            className="w-full accent-cyan-400"
            max={10}
            min={1}
            onChange={(event) => updateInput('severity', Number(event.target.value))}
            type="range"
            value={input.severity}
          />
        </label>

        <SelectField
          label="Symptom trend"
          onChange={(value) => updateInput('symptomTrend', value as SymptomTrend)}
          options={trendOptions}
          value={input.symptomTrend}
        />

        <SelectField
          label="Pain during run"
          onChange={(value) =>
            updateInput(
              'painDuringRun',
              value as PlanAdjustmentInput['painDuringRun'],
            )
          }
          options={[
            { value: 'none', label: 'None' },
            { value: 'better', label: 'Better' },
            { value: 'same', label: 'Same' },
            { value: 'worse', label: 'Worse' },
            { value: 'changes_stride', label: 'Changes stride' },
            { value: 'unknown', label: 'Unknown' },
          ]}
          value={input.painDuringRun ?? 'unknown'}
        />

        <SelectField
          label="Next morning response"
          onChange={(value) =>
            updateInput(
              'nextMorningResponse',
              value as PlanAdjustmentInput['nextMorningResponse'],
            )
          }
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'stiff', label: 'Stiff' },
            { value: 'worse', label: 'Worse' },
            { value: 'unknown', label: 'Unknown' },
          ]}
          value={input.nextMorningResponse ?? 'unknown'}
        />

        <label className="flex items-start gap-3 rounded-[18px] border border-orange-100 bg-orange-50/70 p-3 dark:border-orange-300/20 dark:bg-orange-300/10">
          <input
            checked={Boolean(input.hasRedFlag)}
            className="mt-1 h-4 w-4 accent-orange-500"
            onChange={(event) => updateInput('hasRedFlag', event.target.checked)}
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-semibold text-orange-800 dark:text-orange-100">
              Red flag / limping / medical concern
            </span>
            <span className="mt-1 block text-sm leading-5 text-orange-800/80 dark:text-orange-100/80">
              Forces a high recommendation in this rule-based preview.
            </span>
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700 dark:text-slate-200">
            Description
          </span>
          <textarea
            className="min-h-24 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/10"
            onChange={(event) => updateInput('description', event.target.value)}
            placeholder="What happened? What feels different?"
            value={input.description}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-[22px] border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
        <div>
          <h3 className="text-lg font-semibold text-stone-950 dark:text-white">
            Window and tolerance
          </h3>
          <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
            You can override the recommendation before generating a proposal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DateField
            label="Start date"
            onChange={(value) =>
              onChange({ ...input, startDate: value, userOverrodeDates: true })
            }
            value={input.startDate}
          />
          <DateField
            label="End date"
            onChange={(value) =>
              onChange({ ...input, endDate: value, userOverrodeDates: true })
            }
            value={input.endDate}
          />
        </div>

        <SelectField
          label="Running tolerance"
          onChange={(value) => updateInput('runningTolerance', value as RunningTolerance)}
          options={runningToleranceOptions}
          value={input.runningTolerance}
        />

        <label className="flex items-center justify-between rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
          <span className="text-sm font-semibold text-stone-700 dark:text-slate-200">
            Easy bike possible
          </span>
          <input
            checked={input.canBike}
            className="h-4 w-4 accent-cyan-400"
            onChange={(event) => updateInput('canBike', event.target.checked)}
            type="checkbox"
          />
        </label>

        <SelectField
          label="Strength tolerance"
          onChange={(value) => updateInput('strengthTolerance', value as StrengthTolerance)}
          options={strengthToleranceOptions}
          value={input.strengthTolerance}
        />

        <SelectField
          label="Race goal still valid"
          onChange={(value) =>
            updateInput('raceGoalStillValid', value as PlanAdjustmentInput['raceGoalStillValid'])
          }
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'maybe', label: 'Maybe' },
            { value: 'no', label: 'No' },
          ]}
          value={input.raceGoalStillValid}
        />
      </section>

      <AdjustmentRecommendationCard
        input={input}
        onUseDates={onUseRecommendedDates}
        onUseLevel={onUseRecommendedLevel}
        recommendation={recommendation}
      />

      <section className="space-y-3 rounded-[22px] border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.05]">
        <div>
          <h3 className="text-lg font-semibold text-stone-950 dark:text-white">
            Adjustment level
          </h3>
          <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-slate-400">
            Lower is closer to plan. Higher removes more training stress.
          </p>
        </div>
        <AdjustmentLevelSelector
          onChange={(level) =>
            onChange({ ...input, adjustmentLevel: level, userOverrodeLevel: true })
          }
          value={input.adjustmentLevel}
        />
      </section>

      {errors.length ? (
        <div className="rounded-[18px] border border-rose-100 bg-rose-50 p-3 dark:border-rose-300/20 dark:bg-rose-300/10">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
            Check the form
          </p>
          <ul className="mt-2 space-y-1">
            {errors.map((error) => (
              <li className="text-sm leading-5 text-rose-700/80 dark:text-rose-100/80" key={error}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        className="min-h-12 w-full rounded-[20px] bg-stone-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(23,32,51,0.16)] transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-slate-950 dark:shadow-[0_16px_40px_rgba(34,211,238,0.18)] dark:hover:bg-cyan-200"
        onClick={onGenerateProposal}
        type="button"
      >
        Generate proposal preview
      </button>
    </div>
  )
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  value: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-stone-700 dark:text-slate-200">
        {label}
      </span>
      <select
        className="h-12 w-full rounded-[18px] border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function DateField({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <AppDateInput
      label={label}
      maxDate={trainingPlanEndDate}
      minDate={trainingPlanStartDate}
      onChange={onChange}
      value={value}
    />
  )
}

export default AdjustmentIssueForm
