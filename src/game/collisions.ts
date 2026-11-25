import { plots, localPlot, insideHouse, canEnter, catalog, type Game } from '../domain/world'
import { blocksPublicMovement, isOnIsland, isWater } from '../art/landscape'
export function blocksWalking(game: Game, x: number, z: number) {
  if (!isOnIsland(x, z) || isWater(x, z) || blocksPublicMovement(x, z, 0.19)) return true
  for (const base of plots) {
    const p = localPlot(game, base)
    const lx = x - p.x,
      lz = z - p.z
    if (
      (Math.abs(lx + 3.35) < 0.23 && lz >= -3.48 && lz <= 3.4) ||
      (Math.abs(lz + 3.35) < 0.23 && lx >= -3.48 && lx <= 2.65) ||
      (Math.abs(lz - 3.25) < 0.23 && ((lx >= -3.5 && lx <= -1.2) || (lx >= 0.97 && lx <= 3.5)))
    )
      return true
    if (Math.hypot(lx - 2.7, lz + 2.55) < 0.28) return true
    if (!p.resident || p.style < 0) continue
    const dx = Math.abs(lx),
      dz = lz + 0.85
    if (!canEnter(game, p) && dx < 2.42 && Math.abs(dz) < 2.1) return true
    if (
      (Math.abs(dx - 2.2) < 0.21 && Math.abs(dz) < 2.06) ||
      (Math.abs(dz + 1.9) < 0.2 && dx < 2.38) ||
      (Math.abs(dz - 1.9) < 0.2 && dx < 2.38 && dx > 0.39)
    )
      return true
    if (p.id !== game.citizen?.plot && insideHouse(p, x, z)) {
      if (p.style % 3 === 1) {
        if (
          (dz < -1.02 && lx > -2.08 && lx < 0.96) ||
          Math.hypot(lx - 1.22, dz - 0.13) < 0.49 ||
          Math.hypot(lx - 1.6, dz + 1.21) < 0.42
        )
          return true
      } else if (
        (Math.abs(lx + 1.45) < 0.73 && Math.abs(dz + 0.86) < 1.07) ||
        Math.hypot(lx - 1.16, dz + 0.96) < 0.76 ||
        Math.hypot(lx - 1.27, dz - 0.12) < 0.5
      )
        return true
    }
  }
  return game.items.some(
    (i) =>
      i.where === 'placed' &&
      i.place &&
      i.kind !== 'rug' &&
      Math.hypot(i.place.x - x, i.place.z - z) < catalog[i.kind].r + 0.14,
  )
}
