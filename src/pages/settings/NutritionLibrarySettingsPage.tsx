import { ShoppingBasket } from 'lucide-react'
import FuelingSettingsCard from '../../components/FuelingSettingsCard'
import NutritionLibraryCard from '../../components/NutritionLibraryCard'
import PageCard from '../../components/PageCard'

function NutritionLibrarySettingsPage() {
  return (
    <div className="space-y-4">
      <FuelingSettingsCard />
      <PageCard className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-stone-100 text-stone-700 dark:bg-white/[0.07] dark:text-neutral-200">
          <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-950 dark:text-white">
            Weekly grocery lists
          </h2>
          <p className="mt-1 text-sm leading-5 text-stone-600 dark:text-neutral-400">
            The Week tab builds grocery lists from meal templates, training load, active plan
            adjustments, and Maurten fuelling preferences.
          </p>
        </div>
      </PageCard>
      <NutritionLibraryCard />
    </div>
  )
}

export default NutritionLibrarySettingsPage
