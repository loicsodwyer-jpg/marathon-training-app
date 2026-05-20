import CalendarExportCard from '../../components/CalendarExportCard'

type CalendarExportSettingsPageProps = {
  selectedDate: string
}

function CalendarExportSettingsPage({ selectedDate }: CalendarExportSettingsPageProps) {
  return <CalendarExportCard selectedDate={selectedDate} />
}

export default CalendarExportSettingsPage
