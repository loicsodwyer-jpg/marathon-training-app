import {
  AlertTriangle,
  CalendarX,
  DatabaseBackup,
  FileSpreadsheet,
  HardDrive,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { BackupImportResult, LocalDataSummary } from '../types/backup'
import {
  clearAllLocalAppData,
  clearPlanOverridesOnly,
  clearScheduleOverridesOnly,
  clearWorkoutLogsOnly,
  downloadFullBackup,
  getLocalDataSummary,
} from '../utils/backupUtils'
import { downloadWorkoutLogsCsv } from '../utils/csvExportUtils'
import ConfirmDialog from './ConfirmDialog'
import ImportBackupModal from './ImportBackupModal'
import PageCard from './PageCard'

type ClearAction = 'logs' | 'calendar' | 'plan' | 'all'

type Message = {
  tone: 'success' | 'error'
  text: string
}

const clearActionContent: Record<
  ClearAction,
  {
    title: string
    description: string
    confirmLabel: string
  }
> = {
  logs: {
    title: 'Clear workout logs?',
    description:
      'This removes saved workout logs from this browser. Calendar edits and the built-in marathon plan stay unchanged.',
    confirmLabel: 'Clear logs',
  },
  calendar: {
    title: 'Clear calendar edits?',
    description:
      'This removes custom activities, moved blocks, and block completion ticks saved on this device. Workout logs stay unchanged.',
    confirmLabel: 'Clear edits',
  },
  plan: {
    title: 'Clear plan adjustments?',
    description:
      'This removes local plan overrides and returns adjusted days to the original marathon plan. Workout logs and calendar edits stay unchanged.',
    confirmLabel: 'Clear adjustments',
  },
  all: {
    title: 'Clear all local data?',
    description:
      'This removes workout logs, daily calendar edits, local plan adjustments, and the theme preference from this browser. The app will return to the dark-mode default.',
    confirmLabel: 'Clear all',
  },
}

function DataManagementCard() {
  const [summary, setSummary] = useState<LocalDataSummary>(() => getLocalDataSummary())
  const [message, setMessage] = useState<Message>()
  const [clearAction, setClearAction] = useState<ClearAction>()
  const [isImportOpen, setIsImportOpen] = useState(false)

  const refreshSummary = () => {
    setSummary(getLocalDataSummary())
  }

  const scheduleReload = () => {
    window.setTimeout(() => {
      window.location.reload()
    }, 700)
  }

  const handleExportBackup = () => {
    downloadFullBackup()
    setMessage({ tone: 'success', text: 'Full JSON backup exported.' })
    refreshSummary()
  }

  const handleExportCsv = () => {
    downloadWorkoutLogsCsv()
    setMessage({
      tone: 'success',
      text:
        summary.workoutLogCount > 0
          ? 'Workout logs CSV exported.'
          : 'Workout logs CSV exported with header row only.',
    })
    refreshSummary()
  }

  const handleClearConfirmed = () => {
    if (clearAction === 'logs') {
      clearWorkoutLogsOnly()
      setMessage({ tone: 'success', text: 'Workout logs cleared. Reloading...' })
    }

    if (clearAction === 'calendar') {
      clearScheduleOverridesOnly()
      setMessage({ tone: 'success', text: 'Calendar edits cleared. Reloading...' })
    }

    if (clearAction === 'plan') {
      clearPlanOverridesOnly()
      setMessage({ tone: 'success', text: 'Plan adjustments cleared. Reloading...' })
    }

    if (clearAction === 'all') {
      clearAllLocalAppData()
      setMessage({ tone: 'success', text: 'All local app data cleared. Reloading...' })
    }

    setClearAction(undefined)
    refreshSummary()
    scheduleReload()
  }

  const handleImported = (result: BackupImportResult) => {
    setMessage({
      tone: result.success ? 'success' : 'error',
      text: result.success ? `${result.message} Reloading...` : result.message,
    })
    refreshSummary()

    if (result.success) {
      scheduleReload()
    }
  }

  const activeClearContent = clearAction ? clearActionContent[clearAction] : undefined

  return (
    <PageCard className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">
          <HardDrive className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
            Data management
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-400">
            Your logs, calendar edits, plan adjustments, and fuelling preferences are stored
            locally on this device. Export a backup before clearing browser data or changing
            devices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SummaryTile label="Workout logs" value={String(summary.workoutLogCount)} />
        <SummaryTile label="Edited days" value={String(summary.scheduleOverrideDayCount)} />
        <SummaryTile label="Adjustments" value={String(summary.planAdjustmentCount)} />
        <SummaryTile label="Adjusted days" value={String(summary.adjustedDayCount)} />
        <SummaryTile label="Latest log" value={summary.latestWorkoutLogDate ?? 'None'} />
        <SummaryTile label="Storage" value={summary.storageMode} />
      </div>

      {message ? (
        <p
          className={`rounded-[16px] border px-3 py-2 text-sm font-semibold ${
            message.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="space-y-2">
        <ActionButton
          icon={<DatabaseBackup className="h-4 w-4" aria-hidden="true" />}
          label="Export full backup (.json)"
          onClick={handleExportBackup}
        />
        <ActionButton
          icon={<Upload className="h-4 w-4" aria-hidden="true" />}
          label="Import backup (.json)"
          onClick={() => setIsImportOpen(true)}
          variant="secondary"
        />
        <ActionButton
          icon={<FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
          label="Export workout logs (.csv)"
          onClick={handleExportCsv}
          variant="secondary"
        />
      </div>

      <div className="space-y-2 rounded-[22px] border border-rose-100 bg-rose-50/55 p-3 dark:border-rose-300/20 dark:bg-rose-300/10">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-700 dark:text-rose-200" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
              Destructive actions
            </p>
            <p className="mt-1 text-xs leading-5 text-rose-700/80 dark:text-rose-100/80">
              Export a backup first if you may want this data later.
            </p>
          </div>
        </div>
        <ActionButton
          icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
          label="Clear workout logs"
          onClick={() => setClearAction('logs')}
          variant="danger"
        />
        <ActionButton
          icon={<CalendarX className="h-4 w-4" aria-hidden="true" />}
          label="Clear calendar edits"
          onClick={() => setClearAction('calendar')}
          variant="danger"
        />
        <ActionButton
          icon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
          label="Clear plan adjustments"
          onClick={() => setClearAction('plan')}
          variant="danger"
        />
        <ActionButton
          icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
          label="Clear all local data"
          onClick={() => setClearAction('all')}
          variant="danger"
        />
      </div>

      <ImportBackupModal
        onClose={() => setIsImportOpen(false)}
        onImported={handleImported}
        open={isImportOpen}
      />

      <ConfirmDialog
        confirmLabel={activeClearContent?.confirmLabel ?? 'Confirm'}
        description={activeClearContent?.description ?? ''}
        onCancel={() => setClearAction(undefined)}
        onConfirm={handleClearConfirmed}
        open={Boolean(clearAction)}
        title={activeClearContent?.title ?? ''}
        tone="danger"
      />
    </PageCard>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-semibold text-stone-950 dark:text-white">
        {value}
      </p>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'primary',
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const classNameByVariant = {
    primary:
      'bg-stone-950 text-white hover:bg-stone-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200',
    secondary:
      'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/[0.1]',
    danger:
      'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-300/20 dark:bg-slate-950/30 dark:text-rose-200 dark:hover:bg-rose-300/10',
  }

  return (
    <button
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-[16px] px-3 text-sm font-semibold transition ${classNameByVariant[variant]}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}

export default DataManagementCard
