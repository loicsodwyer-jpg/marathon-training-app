import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
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
              Two gym sessions and one mini prehab session support the marathon plan.
            </p>
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
