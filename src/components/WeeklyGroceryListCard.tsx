import { CheckCircle2, ChevronDown, Clipboard, RotateCcw, ShoppingBasket } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useGroceryListChecks } from '../hooks/useGroceryListChecks'
import type { WeeklyGroceryList } from '../types/grocery'
import {
  formatGroceryListForClipboard,
  groupGroceryItemsByCategory,
} from '../utils/groceryListUtils'
import ConfirmDialog from './ConfirmDialog'
import GroceryCategorySection from './GroceryCategorySection'
import PageCard from './PageCard'
import StatusPill from './StatusPill'

type WeeklyGroceryListCardProps = {
  groceryList: WeeklyGroceryList
}

type CopyMessage = {
  tone: 'success' | 'error'
  text: string
}

function WeeklyGroceryListCard({ groceryList }: WeeklyGroceryListCardProps) {
  const weekKey = `${groceryList.startDate}_${groceryList.endDate}`
  const { checkedItems, clearWeek, toggleItem } = useGroceryListChecks(weekKey)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showOnlyUnchecked, setShowOnlyUnchecked] = useState(false)
  const [copyMessage, setCopyMessage] = useState<CopyMessage>()
  const [isResetOpen, setIsResetOpen] = useState(false)
  const checkedCount = groceryList.items.filter((item) => checkedItems[item.id]).length
  const uncheckedCount = groceryList.items.length - checkedCount
  const visibleItems = useMemo(
    () =>
      showOnlyUnchecked
        ? groceryList.items.filter((item) => !checkedItems[item.id])
        : groceryList.items,
    [checkedItems, groceryList.items, showOnlyUnchecked],
  )
  const groupedItems = groupGroceryItemsByCategory(visibleItems)

  const handleCopyList = async () => {
    const text = formatGroceryListForClipboard(groceryList)

    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage({ tone: 'success', text: 'Grocery list copied.' })
    } catch {
      setCopyMessage({
        tone: 'error',
        text: 'Copy failed. Select the list text manually if needed.',
      })
    }
  }

  return (
    <PageCard className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-stone-100 text-stone-700 ring-1 ring-stone-200 dark:bg-white/[0.07] dark:text-neutral-200 dark:ring-white/10">
          <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500 dark:text-neutral-500">
                For this week&apos;s training and meal prep
              </p>
              <h2 className="mt-1 text-lg font-semibold text-stone-950 dark:text-white">
                Grocery list
              </h2>
            </div>
            <button
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse grocery list' : 'Open grocery list'}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
              onClick={() => setIsExpanded((currentValue) => !currentValue)}
              type="button"
            >
              <ChevronDown
                className={`h-5 w-5 transition ${isExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
          <p className="mt-2 text-sm leading-5 text-stone-600 dark:text-neutral-400">
            {groceryList.summary}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill tone="neutral">{groceryList.items.length} items</StatusPill>
        <StatusPill tone={uncheckedCount ? 'warning' : 'success'}>
          {uncheckedCount} unchecked
        </StatusPill>
        {checkedCount ? <StatusPill tone="success">{checkedCount} checked</StatusPill> : null}
      </div>

      {!isExpanded ? (
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
          onClick={() => setIsExpanded(true)}
          type="button"
        >
          <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
          Open grocery list
        </button>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-stone-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white"
              onClick={handleCopyList}
              type="button"
            >
              <Clipboard className="h-4 w-4" aria-hidden="true" />
              Copy list
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
              onClick={() => setIsResetOpen(true)}
              type="button"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>

          <label className="flex items-center gap-2 rounded-[16px] border border-stone-100 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-300">
            <input
              checked={showOnlyUnchecked}
              className="h-4 w-4 accent-stone-950 dark:accent-neutral-100"
              onChange={(event) => setShowOnlyUnchecked(event.target.checked)}
              type="checkbox"
            />
            Show only unchecked
          </label>

          {copyMessage ? (
            <p
              className={`rounded-[16px] border px-3 py-2 text-sm font-semibold ${
                copyMessage.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200'
              }`}
            >
              {copyMessage.text}
            </p>
          ) : null}

          {groupedItems.length ? (
            <div className="space-y-5">
              {groupedItems.map((group) => (
                <GroceryCategorySection
                  category={group.category}
                  checkedItems={checkedItems}
                  items={group.items}
                  key={group.category}
                  onToggleItem={toggleItem}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">
              <CheckCircle2 className="mb-2 h-5 w-5" aria-hidden="true" />
              All items are checked for this week.
            </div>
          )}

          <button
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[16px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-200 dark:hover:bg-white/[0.1]"
            onClick={() => setIsExpanded(false)}
            type="button"
          >
            Collapse
          </button>
        </div>
      )}

      <ConfirmDialog
        confirmLabel="Reset checks"
        description="This clears grocery checkmarks for this week only. It does not change the generated list or any training data."
        onCancel={() => setIsResetOpen(false)}
        onConfirm={() => {
          clearWeek()
          setIsResetOpen(false)
        }}
        open={isResetOpen}
        title="Reset grocery checks?"
        tone="danger"
      />
    </PageCard>
  )
}

export default WeeklyGroceryListCard
