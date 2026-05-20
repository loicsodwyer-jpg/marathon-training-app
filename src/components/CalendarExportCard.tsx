import { CalendarCheck2, Download, Settings2 } from 'lucide-react'
import { useState } from 'react'
import type { CalendarExportRange } from '../types/calendarExport'
import {
  getCalendarExportFilename,
  getDefaultCalendarExportSettings,
  updateCalendarExportRange,
  validateCalendarExportSettings,
} from '../utils/calendarExportUtils'
import { buildCalendarEvents } from '../utils/calendarEventBuildUtils'
import { buildIcsCalendar, downloadIcsFile } from '../utils/icsUtils'
import CalendarExportModal from './CalendarExportModal'
import PageCard from './PageCard'

type CalendarExportCardProps = {
  selectedDate: string
}

function CalendarExportCard({ selectedDate }: CalendarExportCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [initialRange, setInitialRange] = useState<CalendarExportRange>('current_week')
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string }>()

  const handleQuickExport = (range: CalendarExportRange) => {
    const settings = updateCalendarExportRange(
      getDefaultCalendarExportSettings(selectedDate),
      range,
      selectedDate,
    )
    const events = buildCalendarEvents(settings)
    const errors = validateCalendarExportSettings(settings)

    if (!events.length) {
      errors.push('No events found for this quick export.')
    }

    if (errors.length) {
      setMessage({ tone: 'error', text: errors.join(' ') })
      return
    }

    downloadIcsFile(
      getCalendarExportFilename(settings),
      buildIcsCalendar(events, {
        calendarName: settings.calendarName,
        timezone: settings.timezone,
      }),
    )
    setMessage({ tone: 'success', text: `${events.length} calendar events exported.` })
  }

  const openModal = (range: CalendarExportRange = 'current_week') => {
    setInitialRange(range)
    setIsModalOpen(true)
    setMessage(undefined)
  }

  return (
    <PageCard className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-200">
          <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-950 dark:text-white">
            Calendar export
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-slate-400">
            Download your effective training plan as an .ics file for Apple Calendar, Google
            Calendar, or Outlook.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <QuickButton label="Export current week" onClick={() => handleQuickExport('current_week')} />
        <QuickButton label="Export next 4 weeks" onClick={() => handleQuickExport('next_4_weeks')} />
        <QuickButton label="Export full plan" onClick={() => handleQuickExport('full_plan')} />
      </div>

      <button
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
        onClick={() => openModal('custom')}
        type="button"
      >
        <Settings2 className="h-5 w-5" aria-hidden="true" />
        Open export options
      </button>

      {message ? (
        <p
          className={`rounded-[18px] border px-3 py-2 text-sm font-semibold ${
            message.tone === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100'
              : 'border-red-100 bg-red-50 text-red-800 dark:border-red-300/20 dark:bg-red-300/10 dark:text-red-100'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="rounded-[18px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-slate-950/35">
        <p className="text-sm leading-5 text-stone-600 dark:text-slate-400">
          Exports use active local plan adjustments. Custom daily activities are not exported yet,
          so private notes stay out of calendar files.
        </p>
      </div>

      {isModalOpen ? (
        <CalendarExportModal
          initialRange={initialRange}
          onClose={() => setIsModalOpen(false)}
          open={isModalOpen}
          selectedDate={selectedDate}
        />
      ) : null}
    </PageCard>
  )
}

function QuickButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.1]"
      onClick={onClick}
      type="button"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}

export default CalendarExportCard
