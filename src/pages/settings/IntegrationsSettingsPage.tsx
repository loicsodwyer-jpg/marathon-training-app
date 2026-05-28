import { Activity, Bot, HeartPulse, Radio, Watch } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageCard from '../../components/PageCard'
import StatusPill from '../../components/StatusPill'

const integrations: Array<{
  description: string
  icon: LucideIcon
  status: string
  title: string
}> = [
  {
    title: 'Strava import',
    description:
      'Potential future option to import completed activities after the core app is finished.',
    icon: Activity,
    status: 'Later',
  },
  {
    title: 'Garmin direct sync',
    description: 'Possible only with official API access; not implemented in this local app.',
    icon: Watch,
    status: 'Not connected',
  },
  {
    title: 'Apple Health',
    description: 'Would require native iOS and HealthKit support, so it is outside this PWA for now.',
    icon: HeartPulse,
    status: 'Native only',
  },
  {
    title: 'LLM/API',
    description:
      'Plan adjustment currently works locally with rule-based logic and manual ChatGPT fallback. No API keys or calls are used.',
    icon: Bot,
    status: 'Local',
  },
]

function IntegrationsSettingsPage() {
  return (
    <div className="space-y-4">
      <PageCard className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:bg-orange-300/10 dark:text-orange-200 dark:ring-orange-300/20">
            <Radio className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
              Nothing is connected
            </h2>
            <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
              This app stays local for now. These rows are roadmap notes only, with no login,
              backend, or API keys.
            </p>
          </div>
        </div>
      </PageCard>

      <div className="space-y-3">
        {integrations.map((integration) => {
          const Icon = integration.icon

          return (
            <PageCard className="space-y-2" key={integration.title}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-950 dark:text-white">
                      {integration.title}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <StatusPill tone="neutral">{integration.status}</StatusPill>
              </div>
            </PageCard>
          )
        })}
      </div>
    </div>
  )
}

export default IntegrationsSettingsPage
