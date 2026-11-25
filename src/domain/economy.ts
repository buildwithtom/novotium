export const BALANCE = {
  starterCoins: 60,
  starterMaterials: { wood: 15, stone: 10, seeds: 5 },
  allowance: { coins: 25, wood: 15, stone: 10, seeds: 5 },
  offlineDays: 7,
  listingLimit: 5,
  freeLimit: 3,
} as const
export type Materials = { wood: number; stone: number; seeds: number }
export const recipes = {
  chair: { wood: 5 },
  table: { wood: 8, stone: 2 },
  plant: { stone: 2, seeds: 2 },
  tree: { seeds: 3 },
  bench: { wood: 10, stone: 3 },
} as const
export type Recipe = keyof typeof recipes
export function accruedDays(previous: string, arrived: string, today: string) {
  const then = previous || arrived
  const elapsed =
    Math.floor((Date.parse(today + 'T00:00:00Z') - Date.parse(then + 'T00:00:00Z')) / 86400000) +
    (previous ? 0 : 1)
  return Number.isFinite(elapsed) ? Math.max(0, Math.min(BALANCE.offlineDays, elapsed)) : 0
}
