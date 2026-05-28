import { CalendarCheck2, Download, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CalendarExportRange, CalendarExportSettings } from '../types/calendarExport'
import {
  getCalendarExportFilename,
  getDefaultCalendarExportSettings,
  updateCalendarExportRange,
  validateCalendarExportSettings,
} from '../utils/calendarExportUtils'
import { buildCalendarEvents } from '../utils/calendarEventBuildUtils'
import { buildIcsCalendar, downloadIcsFile } from '../utils/icsUtils'
import AppDateInput from './AppDateInput'
import CalendarExportPreview from './CalendarExportPreview'

type CalendarExportModalProps = {
  open: boolean
  selectedDate: string
  initialRange?: CalendarExportRange
  onClose: () => void
}

const rangeOptions: Array<{ value: CalendarExportRange; label: string }> = [
  { value: 'current_week', label: 'Current week' },
  { value: 'next_4_weeks', label: 'Next 4 weeks' },
  { value: 'full_plan', label: 'Full plan' },
  { value: 'custom', label: 'Custom' },
]

function CalendarExportModal({
  initialRange = 'current_week',
  onClose,
  open,
  selectedDate,
}: CalendarExportModalProps) {
  const [settings, setSettings] = useState<CalendarExportSettings>(() =>
    updateCalendarExportRange(
      getDefaultCalendarExportSettings(selectedDate),
      initialRange,
      selectedDate,
    ),
  )
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState<string>()
  const events = useMemo(() => buildCalendarEvents(settings), [settings])

  if (!open) {
    return null
  }

  const updateRange = (range: CalendarExportRange) => {
    setSettings((currentSettings) =>
      updateCalendarExportRange(currentSettings, range, selectedDate),
    )
    setErrors([])
    setMessage(undefined)
  }

  const updateSetting = <Key extends keyof CalendarExportSettings>(
    key: Key,
    value: CalendarExportSettings[Key],
  ) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
    setErrors([])
    setMessage(undefined)
  }

  const handleDownload = () => {
    const validationErrors = validateCalendarExportSettings(settings)

    if (!events.length) {
      validationErrors.push('No events found for these export settings.')
    }

    setErrors(validationErrors)

    if (validationErrors.length) {
      return
    }

    downloadIcsFile(
      getCalendarExportFilename(settings),
      buildIcsCalendar(events, {
        calendarName: settings.calendarName,
        timezone: settings.timezone,
      }),
    )
    setMessage('Calendar file downloaded. On iPhone, open the .ics file and choose Add All to Calendar.')
  }

  return (
    <div
      aria-label="Calendar export"
      aria-modal="true"
      className="modal-overlay z-[100] items-end justify-center bg-slate-950/70 px-3 backdrop-blur-sm sm:items-center"
      role="dialog"
    >
      <div className="modal-panel w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] dark:bg-neutral-900">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-200">
              <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.08em]">
                Calendar export
              </p>
            </div>
            <h2 className="mt-1 truncate text-base font-semibold text-stone-950 dark:text-white">
              Export .ics file
            </h2>
          </div>
          <button
            aria-label="Close calendar export"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-scroll space-y-4 p-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
          <p className="rounded-[20px] border border-stone-100 bg-stone-50 p-3 text-sm leading-5 text-stone-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
            Exports use your effective local plan, including active plan adjustments and moved
            run/strength times from the Today calendar.
          </p>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-950 dark:text-white">Date range</h3>
            <div className="grid grid-cols-2 gap-2">
              {rangeOptions.map((option) => (
                <button
                  aria-pressed={settings.range === option.value}
                  className={`min-h-11 rounded-[16px] border px-3 py-2 text-sm font-semibold transition ${
                    settings.range === option.value
                      ? 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-300/30 dark:bg-cyan-300/15 dark:text-cyan-100'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]'
                  }`}
                  key={option.value}
                  onClick={() => updateRange(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AppDateInput
                disabled={settings.range !== 'custom'}
                label="Start date"
                onChange={(date) => updateSetting('startDate', date)}
                value={settings.startDate}
              />
              <AppDateInput
                disabled={settings.range !== 'custom'}
                label="End date"
                onChange={(date) => updateSetting('endDate', date)}
                value={settings.endDate}
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-950 dark:text-white">Include</h3>
            <div className="grid grid-cols-1 gap-2">
              <Checkbox
                checked={settings.includeRuns}
                label="Runs"
                onChange={(checked) => updateSetting('includeRuns', checked)}
              />
              <Checkbox
                checked={settings.includeStrength}
                label="Strength sessions"
                onChange={(checked) => updateSetting('includeStrength', checked)}
              />
              <Checkbox
                checked={settings.includeRace}
                label="Race day"
                onChange={(checked) => updateSetting('includeRace', checked)}
              />
              <Checkbox
                checked={settings.includeSpecialEvents}
                label="Birthday, festivals, wedding, and social constraints"
                onChange={(checked) => updateSetting('includeSpecialEvents', checked)}
              />
              <Checkbox
                checked={settings.includeMeals}
                label="Meal and fuelling reminders"
                onChange={(checked) => updateSetting('includeMeals', checked)}
              />
              <Checkbox
                checked={settings.includeRecoveryReminders}
                label="Recovery reminders"
                onChange={(checked) => updateSetting('includeRecoveryReminders', checked)}
              />
              <Checkbox
                checked={settings.includeCompletedLoggedSessions}
                label="Include completed/logged sessions"
                onChange={(checked) => updateSetting('includeCompletedLoggedSessions', checked)}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3">
            <label className="space-y-1 text-sm font-semibold text-stone-800 dark:text-neutral-100">
              Calendar name
              <input
                className="h-11 w-full rounded-[16px] border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/20"
                onChange={(event) => updateSetting('calendarName', event.target.value)}
                value={settings.calendarName}
              />
            </label>
            <label className="space-y-1 text-sm font-semibold text-stone-800 dark:text-neutral-100">
              Timezone
              <input
                className="h-11 w-full rounded-[16px] border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/20"
                onChange={(event) => updateSetting('timezone', event.target.value)}
                value={settings.timezone}
              />
            </label>
          </section>

          <CalendarExportPreview events={events} />

          {errors.length ? (
            <section className="rounded-[20px] border border-red-100 bg-red-50 p-4 dark:border-red-300/20 dark:bg-red-300/10">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-100">
                Export needs attention
              </h3>
              <ul className="mt-2 space-y-2">
                {errors.map((error) => (
                  <li className="text-sm leading-5 text-red-800/80 dark:text-red-100/80" key={error}>
                    {error}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {message ? (
            <p className="rounded-[18px] border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
              {message}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-2">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[20px] bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-cyan-300 dark:text-neutral-950 dark:hover:bg-cyan-200"
              onClick={handleDownload}
              type="button"
            >
              <Download className="h-5 w-5" aria-hidden="true" />
              Download .ics
            </button>
            <button
              className="min-h-11 rounded-[18px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100 dark:hover:bg-white/[0.1]"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-[16px] border border-stone-100 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-800 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-100">
      <input
        checked={checked}
        className="h-4 w-4 accent-cyan-500"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  )
}

export default CalendarExportModal
