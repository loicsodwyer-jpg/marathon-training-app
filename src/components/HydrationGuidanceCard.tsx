import { Droplets } from 'lucide-react'

type HydrationGuidanceCardProps = {
  items: string[]
}

function HydrationGuidanceCard({ items }: HydrationGuidanceCardProps) {
  if (!items.length) {
    return null
  }

  return (
    <section className="rounded-[20px] border border-cyan-100 bg-cyan-50/75 p-4 dark:border-cyan-300/25 dark:bg-cyan-300/10">
      <div className="flex items-center gap-2">
        <Droplets className="h-4 w-4 text-cyan-700 dark:text-cyan-200" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-cyan-800 dark:text-cyan-100">
          Hydration
        </h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li className="text-sm leading-5 text-cyan-800/80 dark:text-cyan-100/80" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default HydrationGuidanceCard
