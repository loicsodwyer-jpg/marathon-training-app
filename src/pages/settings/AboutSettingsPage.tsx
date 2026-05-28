import { LockKeyhole, Map, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageCard from '../../components/PageCard'
import StatusPill from '../../components/StatusPill'
import { trainingPlanEndDate, trainingPlanStartDate } from '../../data/trainingPlan'
import { formatDisplayDate } from '../../utils/dateUtils'

function AboutSettingsPage() {
  return (
    <div className="space-y-4">
      <PageCard className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:text-cyan-200">
              Loïc Marathon 2:55
            </p>
            <h2 className="mt-1 text-xl font-semibold text-stone-950 dark:text-white">
              Amsterdam Marathon build
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-neutral-300">
              Private training app for a 2:50-2:55 marathon goal.
            </p>
          </div>
          <StatusPill tone="race">Local build</StatusPill>
        </div>
      </PageCard>

      <InfoCard
        icon={Map}
        items={[
          `Plan period: ${formatDisplayDate(trainingPlanStartDate)} - ${formatDisplayDate(trainingPlanEndDate)}`,
          'Race: Amsterdam Marathon on 18 Oct 2026',
          'Training plan is bundled with the app; local adjustments are stored separately.',
        ]}
        title="Plan"
      />

      <InfoCard
        icon={LockKeyhole}
        items={[
          'Workout logs, calendar edits, backups, and adjusted plans are local to this browser/device.',
          'There is no automatic cloud sync.',
          'Export a backup before clearing browser data or moving devices.',
        ]}
        title="Storage and privacy"
      />

      <InfoCard
        icon={ShieldCheck}
        items={[
          'Manual ChatGPT fallback only copies text when you choose to copy it.',
          'No OpenAI, Gemini, Strava, Garmin, or Apple Health API calls are made.',
          'Roadmap: iPhone install/deployment checks, optional integrations, and future refinements.',
        ]}
        title="Roadmap"
      />
    </div>
  )
}

function InfoCard({
  icon: Icon,
  items,
  title,
}: {
  icon: LucideIcon
  items: string[]
  title: string
}) {
  return (
    <PageCard className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-cyan-700 dark:text-cyan-200" aria-hidden="true" />
        <h3 className="text-base font-semibold text-stone-950 dark:text-white">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li className="text-sm leading-5 text-stone-600 dark:text-neutral-300" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </PageCard>
  )
}

export default AboutSettingsPage
