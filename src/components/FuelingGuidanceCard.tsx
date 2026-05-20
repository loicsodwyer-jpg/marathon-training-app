import { Flame } from 'lucide-react'

type FuelingGuidanceCardProps = {
  title?: string
  items: string[]
}

function FuelingGuidanceCard({ title = 'Workout fuelling', items }: FuelingGuidanceCardProps) {
  if (!items.length) {
    return null
  }

  return (
    <section className="rounded-[20px] border border-amber-100 bg-amber-50/75 p-4 dark:border-amber-300/25 dark:bg-amber-300/10">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-amber-700 dark:text-amber-200" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-100">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li className="text-sm leading-5 text-amber-800/80 dark:text-amber-100/80" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FuelingGuidanceCard
