import { Coffee, Droplets, Flame, RotateCcw, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { FUELING_PRODUCTS } from '../data/fuelingProducts'
import { useFuelingPreferences } from '../hooks/useFuelingPreferences'
import type { FuelingPreferences } from '../types/fueling'
import PageCard from './PageCard'
import FuelingProductPill from './FuelingProductPill'
import StatusPill from './StatusPill'

const carbTargets = [50, 60, 70, 80]

function FuelingSettingsCard() {
  const { preferences, resetPreferences, updatePreferences } = useFuelingPreferences()

  return (
    <PageCard className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-amber-300/10 dark:text-amber-200 dark:ring-amber-300/20">
          <Flame className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
            Maurten fuelling preferences
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
            Local rules for gels, Drink Mix, caffeine, and stomach-sensitive marathon practice.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill tone="warning">Maurten</StatusPill>
        <StatusPill tone={preferences.stomachSensitive ? 'success' : 'neutral'}>
          {preferences.stomachSensitive ? 'Stomach sensitive' : 'Normal tolerance'}
        </StatusPill>
        <StatusPill tone={preferences.caffeineEnabled ? 'warning' : 'neutral'}>
          {preferences.caffeineEnabled ? 'Caffeine enabled' : 'No caffeine'}
        </StatusPill>
      </div>

      <div className="space-y-3">
        <ToggleRow
          checked={preferences.caffeineEnabled}
          icon={<Coffee className="h-4 w-4" aria-hidden="true" />}
          label="Use caffeine products"
          onChange={(value) => updatePreferences({ caffeineEnabled: value })}
        />
        <ToggleRow
          checked={preferences.caffeineForEveningRuns}
          disabled={!preferences.caffeineEnabled}
          icon={<Coffee className="h-4 w-4" aria-hidden="true" />}
          label="Allow caffeine for evening runs"
          onChange={(value) => updatePreferences({ caffeineForEveningRuns: value })}
        />
        <ToggleRow
          checked={preferences.useDrinkMix}
          icon={<Droplets className="h-4 w-4" aria-hidden="true" />}
          label="Use Drink Mix"
          onChange={(value) => updatePreferences({ useDrinkMix: value })}
        />
        <ToggleRow
          checked={preferences.stomachSensitive}
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          label="Stomach-sensitive progression"
          onChange={(value) => updatePreferences({ stomachSensitive: value })}
        />
      </div>

      <SegmentedControl
        label="Preferred gel size"
        onChange={(value) => updatePreferences({ preferredGelSize: value })}
        options={[
          { label: 'Gel 100', value: 'gel_100' },
          { label: 'Gel 160', value: 'gel_160' },
          { label: 'Mixed', value: 'mixed' },
        ]}
        value={preferences.preferredGelSize}
      />

      <NumberSegments
        label="Long-run target carbs/hour"
        onChange={(value) => updatePreferences({ targetCarbsPerHourLongRun: value })}
        value={preferences.targetCarbsPerHourLongRun}
      />
      <NumberSegments
        label="Race target carbs/hour"
        onChange={(value) => updatePreferences({ targetCarbsPerHourRace: value })}
        value={preferences.targetCarbsPerHourRace}
      />

      <section className="space-y-3 rounded-[20px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
        <h3 className="text-sm font-semibold text-stone-950 dark:text-white">
          Product reference
        </h3>
        <div className="flex flex-wrap gap-2">
          {FUELING_PRODUCTS.filter((product) => product.brand === 'Maurten').map((product) => (
            <FuelingProductPill key={product.id} product={product} />
          ))}
        </div>
      </section>

      <div className="rounded-[18px] border border-orange-100 bg-orange-50/75 p-3 dark:border-orange-300/20 dark:bg-orange-300/10">
        <p className="text-sm font-semibold text-orange-800 dark:text-orange-100">
          Practise before race day.
        </p>
        <p className="mt-1 text-sm leading-5 text-orange-800/80 dark:text-orange-100/80">
          Do not introduce new caffeine or a new Drink Mix strategy for the first time on race day.
        </p>
      </div>

      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100 dark:hover:bg-white/[0.1]"
        onClick={resetPreferences}
        type="button"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset fuelling defaults
      </button>
    </PageCard>
  )
}

function ToggleRow({
  checked,
  disabled = false,
  icon,
  label,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  icon: ReactNode
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className={`flex min-h-12 items-center justify-between gap-3 rounded-[18px] border border-stone-100 bg-stone-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.05] ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-neutral-100">
        <span className="text-amber-700 dark:text-amber-200">{icon}</span>
        {label}
      </span>
      <input
        checked={checked}
        className="h-5 w-5 accent-amber-500"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

function SegmentedControl<Value extends FuelingPreferences['preferredGelSize']>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: Value) => void
  options: Array<{ label: string; value: Value }>
  value: Value
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-800 dark:text-neutral-100">{label}</h3>
      <div className="grid grid-cols-3 gap-2 rounded-[20px] border border-stone-100 bg-stone-50 p-2 dark:border-white/10 dark:bg-neutral-950/50">
        {options.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={`min-h-10 rounded-[16px] px-2 text-xs font-semibold transition ${
              value === option.value
                ? 'bg-white text-stone-950 shadow-sm dark:bg-amber-300 dark:text-neutral-950'
                : 'text-stone-500 hover:bg-white/70 hover:text-stone-900 dark:text-neutral-400 dark:hover:bg-white/[0.08] dark:hover:text-white'
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function NumberSegments({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: number) => void
  value: number
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-800 dark:text-neutral-100">{label}</h3>
      <div className="grid grid-cols-4 gap-2">
        {carbTargets.map((target) => (
          <button
            aria-pressed={value === target}
            className={`min-h-10 rounded-[16px] border px-2 text-xs font-semibold transition ${
              value === target
                ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/15 dark:text-amber-100'
                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.1]'
            }`}
            key={target}
            onClick={() => onChange(target)}
            type="button"
          >
            {target} g/h
          </button>
        ))}
      </div>
    </section>
  )
}

export default FuelingSettingsCard
