import type { WeekViewDay } from '../types/weekView'
import WeekDayCard from './WeekDayCard'

type WeekCalendarProps = {
  days: WeekViewDay[]
  expandedDayDates: Set<string>
  onOpenDay: (date: string) => void
  onToggleDay: (date: string) => void
}

function WeekCalendar({ days, expandedDayDates, onOpenDay, onToggleDay }: WeekCalendarProps) {
  return (
    <div className="space-y-3">
      {days.map((day) => (
        <WeekDayCard
          day={day}
          isExpanded={expandedDayDates.has(day.date)}
          key={day.date}
          onOpenDay={onOpenDay}
          onToggleExpanded={() => onToggleDay(day.date)}
        />
      ))}
    </div>
  )
}

export default WeekCalendar
