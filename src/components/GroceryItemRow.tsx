import type { GroceryItem } from '../types/grocery'

type GroceryItemRowProps = {
  checked: boolean
  item: GroceryItem
  onToggle: () => void
}

const priorityClassName = {
  essential:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200',
  recommended:
    'border-stone-200 bg-stone-50 text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-300',
  optional:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200',
}

function GroceryItemRow({ checked, item, onToggle }: GroceryItemRowProps) {
  return (
    <label
      className={`flex gap-3 rounded-[18px] border p-3 transition ${
        checked
          ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-300/20 dark:bg-emerald-300/10'
          : 'border-stone-100 bg-white dark:border-white/10 dark:bg-white/[0.04]'
      }`}
    >
      <input
        checked={checked}
        className="mt-1 h-5 w-5 rounded border-stone-300 text-stone-950 accent-stone-950 dark:border-neutral-600 dark:accent-neutral-100"
        onChange={onToggle}
        type="checkbox"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={`text-sm font-semibold text-stone-950 dark:text-white ${
              checked ? 'line-through decoration-stone-400 dark:decoration-neutral-500' : ''
            }`}
          >
            {item.name}
          </span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-300">
            {item.quantity}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${priorityClassName[item.priority]}`}
          >
            {item.priority}
          </span>
        </span>
        <span className="mt-1 block text-xs leading-5 text-stone-500 dark:text-neutral-400">
          {item.reason}
        </span>
      </span>
    </label>
  )
}

export default GroceryItemRow
