import type { FuelingProduct } from '../types/fueling'

export const MAURTEN_PRODUCT_IDS = {
  gel100: 'maurten_gel_100',
  gel100Caf100: 'maurten_gel_100_caf_100',
  gel160: 'maurten_gel_160',
  drinkMix160: 'maurten_drink_mix_160',
  drinkMix320: 'maurten_drink_mix_320',
  drinkMix320Caf100: 'maurten_drink_mix_320_caf_100',
  water: 'water',
  electrolytes: 'electrolytes',
} as const

export const FUELING_PRODUCTS: FuelingProduct[] = [
  {
    id: MAURTEN_PRODUCT_IDS.gel100,
    brand: 'Maurten',
    name: 'Gel 100',
    type: 'gel',
    carbsGrams: 25,
    servingDescription: '1 gel',
    notes: ['Simple default gel for training and race practice.'],
  },
  {
    id: MAURTEN_PRODUCT_IDS.gel100Caf100,
    brand: 'Maurten',
    name: 'Gel 100 Caf 100',
    type: 'gel',
    carbsGrams: 25,
    caffeineMg: 100,
    servingDescription: '1 caffeinated gel',
    notes: ['Use only when caffeine is enabled and already practised.'],
  },
  {
    id: MAURTEN_PRODUCT_IDS.gel160,
    brand: 'Maurten',
    name: 'Gel 160',
    type: 'gel',
    carbsGrams: 40,
    servingDescription: '1 larger gel',
    notes: ['Useful when carrying fewer gels is easier.'],
  },
  {
    id: MAURTEN_PRODUCT_IDS.drinkMix160,
    brand: 'Maurten',
    name: 'Drink Mix 160',
    type: 'drink_mix',
    carbsGrams: 40,
    servingDescription: '1 sachet in 500 ml water',
    notes: ['Good for pre-loading or carrying carbs in fluid.'],
  },
  {
    id: MAURTEN_PRODUCT_IDS.drinkMix320,
    brand: 'Maurten',
    name: 'Drink Mix 320',
    type: 'drink_mix',
    carbsGrams: 80,
    servingDescription: '1 sachet in 500 ml water',
    notes: ['High-carb option for long-run and race rehearsal.'],
  },
  {
    id: MAURTEN_PRODUCT_IDS.drinkMix320Caf100,
    brand: 'Maurten',
    name: 'Drink Mix 320 Caf 100',
    type: 'drink_mix',
    carbsGrams: 80,
    caffeineMg: 100,
    servingDescription: '1 caffeinated sachet in 500 ml water',
    notes: ['Avoid for evening runs unless specifically enabled.'],
  },
  {
    id: MAURTEN_PRODUCT_IDS.water,
    brand: 'Generic',
    name: 'Water',
    type: 'water',
    carbsGrams: 0,
    servingDescription: 'as needed',
  },
  {
    id: MAURTEN_PRODUCT_IDS.electrolytes,
    brand: 'Generic',
    name: 'Electrolytes',
    type: 'electrolytes',
    carbsGrams: 0,
    servingDescription: '1 serving',
    notes: ['Useful in heat, long runs, race week, or after alcohol.'],
  },
]

const productsById = Object.fromEntries(
  FUELING_PRODUCTS.map((product) => [product.id, product]),
) as Record<string, FuelingProduct>

export function getFuelingProductById(id: string): FuelingProduct | undefined {
  return productsById[id]
}
