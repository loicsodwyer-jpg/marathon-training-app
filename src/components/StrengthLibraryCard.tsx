import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { strengthPhaseDescriptions, strengthProgressionRules } from '../data/strengthSessions'
import { getAllStrengthSessions } from '../utils/strengthUtils'
import type { StrengthSession } from '../types/training'
import type { LiveStrengthSessionResult } from '../types/liveStrength'
import { useWorkoutLogs } from '../hooks/useWorkoutLogs'
import { formatDateKey } from '../utils/dateUtils'
import { getEffectiveDayPlan } from '../utils/effectiveTrainingPlanUtils'
import { buildStrengthLogInput } from '../utils/liveStrengthUtils'
import LiveStrengthSessionModal from './LiveStrengthSessionModal'
import PageCard from './PageCard'
import StrengthSessionButton from './StrengthSessionButton'
import StrengthSessionModal from './StrengthSessionModal'

function StrengthLibraryCard() {
  const [selectedSession, setSelectedSession] = useState<StrengthSession>()
  const [liveSession, setLiveSession] = useState<StrengthSession>()
  const workoutLogs = useWorkoutLogs()
  const sessions = getAllStrengthSessions()
  const liveSessionDate = formatDateKey(new Date())
  const liveSessionDayPlan = getEffectiveDayPlan(liveSessionDate)

  const handleStartSession = (session: StrengthSession) => {
    setSelectedSession(undefined)
    setLiveSession(session)
  }

  const handleSaveLiveSession = (result: LiveStrengthSessionResult) => {
    const existingLog = workoutLogs.getLogForDate(result.date)
    const input = buildStrengthLogInput(result, existingLog, Boolean(liveSessionDayPlan?.plannedRun))

    workoutLogs.saveLog(result.date, input)
    setLiveSession(undefined)
  }

  return (
    <>
      <PageCard className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-purple-50 text-purple-700 ring-1 ring-purple-100 dark:bg-purple-300/10 dark:text-purple-200 dark:ring-purple-300/20">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
              Strength library
            </h2>
            <p className="mt-1 text-sm leading-5 text-stone-500 dark:text-neutral-400">
              Periodized gym, prehab, mobility, and taper sessions support the marathon plan.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
            Strength phases
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {strengthPhaseDescriptions.map((phase) => (
              <div
                className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]"
                key={phase.weeks}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-200">
                  {phase.weeks}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-950 dark:text-white">
                  {phase.title}
                </p>
                <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {sessions.map((session) => (
            <StrengthSessionButton
              key={session.id}
              onOpen={setSelectedSession}
              onStart={handleStartSession}
              session={session}
            />
          ))}
        </div>

        <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
            Progression rules
          </p>
          <ul className="mt-2 space-y-1">
            {strengthProgressionRules.slice(0, 5).map((rule) => (
              <li className="text-sm leading-5 text-stone-600 dark:text-neutral-400" key={rule}>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </PageCard>

      <StrengthSessionModal
        onClose={() => setSelectedSession(undefined)}
        onStartSession={handleStartSession}
        open={Boolean(selectedSession)}
        session={selectedSession}
      />

      <LiveStrengthSessionModal
        date={liveSessionDate}
        onClose={() => setLiveSession(undefined)}
        onSaveResult={handleSaveLiveSession}
        open={Boolean(liveSession)}
        session={liveSession}
      />
    </>
  )
}

export default StrengthLibraryCard
