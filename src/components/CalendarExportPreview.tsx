import type { CalendarExportEvent } from '../types/calendarExport'
import CalendarEventPreviewCard from './CalendarEventPreviewCard'

type CalendarExportPreviewProps = {
  events: CalendarExportEvent[]
}

function CalendarExportPreview({ events }: CalendarExportPreviewProps) {
  const previewEvents = events.slice(0, 10)

  return (
    <section className="space-y-3 rounded-[22px] border border-stone-100 bg-stone-50 p-3 dark:border-white/10 dark:bg-neutral-950/35">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-950 dark:text-white">Export preview</h3>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
            {events.length
              ? `${events.length} event${events.length === 1 ? '' : 's'} will be exported.`
              : 'No events match these settings yet.'}
          </p>
        </div>
      </div>

      {previewEvents.length ? (
        <div className="space-y-2">
          {previewEvents.map((event) => (
            <CalendarEventPreviewCard event={event} key={event.id} />
          ))}
          {events.length > previewEvents.length ? (
            <p className="px-1 text-sm text-stone-500 dark:text-neutral-400">
              + {events.length - previewEvents.length} more events in the .ics file.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default CalendarExportPreview
