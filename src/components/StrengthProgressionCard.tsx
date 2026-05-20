import { TrendingUp } from 'lucide-react'

type StrengthProgressionCardProps = {
  notes: string[]
}

function StrengthProgressionCard({ notes }: StrengthProgressionCardProps) {
  if (!notes.length) {
    return null
  }

  return (
    <section className="rounded-[20px] border border-orange-100 bg-orange-50/75 p-4 dark:border-orange-300/25 dark:bg-orange-300/10">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-orange-700 dark:text-orange-200" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-100">
          Progression guidance
        </h3>
      </div>
      <ul className="mt-3 space-y-2">
        {notes.map((note) => (
          <li className="text-sm leading-5 text-orange-800/80 dark:text-orange-100/80" key={note}>
            {note}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default StrengthProgressionCard
