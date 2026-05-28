import {
  Apple,
  Cookie,
  Droplets,
  Leaf,
  Milk,
  ShoppingBasket,
  Sunrise,
  Utensils,
  Wheat,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { GroceryCategory, GroceryItem } from '../types/grocery'
import {
  getGroceryCategoryIcon,
  getGroceryCategoryLabel,
} from '../utils/groceryListUtils'
import GroceryItemRow from './GroceryItemRow'

type GroceryCategorySectionProps = {
  category: GroceryCategory
  checkedItems: Record<string, boolean>
  items: GroceryItem[]
  onToggleItem: (itemId: string) => void
}

const iconByKey: Record<string, LucideIcon> = {
  apple: Apple,
  cookie: Cookie,
  droplets: Droplets,
  drumstick: Utensils,
  leaf: Leaf,
  milk: Milk,
  'shopping-basket': ShoppingBasket,
  sunrise: Sunrise,
  wheat: Wheat,
  zap: Zap,
}

function GroceryCategorySection({
  category,
  checkedItems,
  items,
  onToggleItem,
}: GroceryCategorySectionProps) {
  const Icon = iconByKey[getGroceryCategoryIcon(category)] ?? ShoppingBasket

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div className="grid h-8 w-8 place-items-center rounded-[14px] bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-neutral-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-stone-950 dark:text-white">
          {getGroceryCategoryLabel(category)}
        </h3>
        <span className="text-xs font-semibold text-stone-400 dark:text-neutral-500">
          {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <GroceryItemRow
            checked={Boolean(checkedItems[item.id])}
            item={item}
            key={item.id}
            onToggle={() => onToggleItem(item.id)}
          />
        ))}
      </div>
    </section>
  )
}

export default GroceryCategorySection
