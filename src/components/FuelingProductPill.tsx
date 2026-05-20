import { Coffee, Droplets, Flame } from 'lucide-react'
import type { FuelingItem, FuelingProduct } from '../types/fueling'
import { formatCaffeine, formatCarbs } from '../utils/fuelingFormatUtils'

type FuelingProductPillProps = {
  item?: FuelingItem
  product?: FuelingProduct
}

function FuelingProductPill({ item, product }: FuelingProductPillProps) {
  const name = item?.productName ?? product?.name
  const carbs = item?.carbsGrams ?? product?.carbsGrams
  const caffeine = item?.caffeineMg ?? product?.caffeineMg
  const hasCaffeine = caffeine !== undefined && caffeine > 0

  if (!name) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
      {product?.type === 'drink_mix' ? (
        <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
      ) : hasCaffeine ? (
        <Coffee className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Flame className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {item && item.quantity > 1 ? `${item.quantity} x ` : null}
      {name}
      <span className="opacity-70">· {formatCarbs(carbs)}</span>
      {hasCaffeine ? <span className="opacity-70">· {formatCaffeine(caffeine)}</span> : null}
    </span>
  )
}

export default FuelingProductPill
