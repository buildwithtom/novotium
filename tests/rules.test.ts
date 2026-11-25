import { describe, it, expect } from 'vitest'
import {
  apply,
  canEnter,
  COATS,
  fresh,
  HAIR,
  insideHouse,
  listingSpot,
  placementIssue,
  plotBy,
  SKINS,
  stock,
  type Arrival,
  type Item,
} from '../src/domain/world'
import { decode } from '../src/services/save'
import { blocksPublicMovement, isWater, isOnIsland } from '../src/art/landscape'
const profile: Arrival = {
  name: 'Rowan',
  home: 'Wren Cottage',
  plot: 'B1',
  coat: COATS[0],
  hair: HAIR[0],
  skin: SKINS[0],
  style: 2,
  house: 0,
  gift: 'plant',
}
const join = () => apply(fresh(), { type: 'join', profile })
describe('citizenship and land', () => {
  it('creates a local passport and four individually owned starter belongings', () => {
    const g = join()
    expect(g.citizen?.home).toBe('Wren Cottage')
    expect(g.items.filter((i) => i.owner === g.citizen?.id)).toHaveLength(4)
    expect(join().citizen?.id).not.toBe(g.citizen?.id)
    expect(new Set(g.items.map((i) => i.id)).size).toBe(g.items.length)
  })
  it('permits only one available plot', () => {
    expect(() => apply(join(), { type: 'join', profile })).toThrow()
    expect(() => apply(fresh(), { type: 'join', profile: { ...profile, plot: 'A1' } })).toThrow()
  })
  it('honours indoor visitor permissions', () => {
    const g = join()
    expect(canEnter(g, plotBy('A1'))).toBe(true)
    expect(canEnter(g, plotBy('A3'))).toBe(false)
    expect(insideHouse(plotBy('A3'), 10, -7)).toBe(true)
  })
  it('rejects empty names', () =>
    expect(() => apply(fresh(), { type: 'join', profile: { ...profile, name: '  ' } })).toThrow())
})
describe('placement', () => {
  it('validates boundaries, walls, doors, trees and occupied footprints', () => {
    const g = join(),
      chair = g.items.find((i) => i.owner === g.citizen?.id && i.kind === 'chair')!,
      tree = g.items.find((i) => i.kind === 'tree')!
    const check = (i: Item, x: number, z: number) => placementIssue(g, i, { x, z, rotation: 0 })
    expect(check(chair, -15, 6)).toContain('plot')
    expect(check(chair, -10, 7.5)).toContain('door')
    expect(check(chair, -12, 5)).toContain('wall')
    expect(check(tree, -11, 5)).toContain('outdoor')
    expect(check(chair, -11, 5)).toBeNull()
    const placed = apply(g, { type: 'place', id: chair.id, at: { x: -11, z: 5, rotation: 0 } })
    expect(
      placementIssue(placed, placed.items.find((i) => i.kind === 'table')!, {
        x: -11,
        z: 5,
        rotation: 0,
      }),
    ).toContain('Another')
    expect(g.items.find((i) => i.id === chair.id)?.where).toBe('inventory')
    expect(
      apply(placed, { type: 'store', id: chair.id }).items.find((i) => i.id === chair.id)?.place,
    ).toBeUndefined()
  })
  it('protects public land and restricted objects', () => {
    const g = join()
    expect(() => apply(g, { type: 'paint', x: 0, z: 0, color: 'sand' })).toThrow()
    expect(() =>
      apply(g, { type: 'place', id: g.items[0].id, at: { x: -11, z: 5, rotation: 0 } }),
    ).toThrow()
  })
  it('recognises land, stream, bridge and public obstacles', () => {
    expect(isOnIsland(0, 0)).toBe(true)
    expect(isOnIsland(60, 60)).toBe(false)
    expect(isWater(-4.65, 12.45)).toBe(false)
    expect(isWater(0, 12.2)).toBe(true)
    expect(blocksPublicMovement(0, 0)).toBe(true)
  })
})
describe('possessions and trade', () => {
  it('transfers exactly one instance, spends once and retains both owners', () => {
    const g = join(),
      i = g.items[0],
      next = apply(g, { type: 'buy', id: i.id })
    expect(listingSpot(g, i)).toBeTruthy()
    expect(next.coins).toBe(g.coins - 9)
    expect(next.items).toHaveLength(g.items.length)
    const got = next.items.find((t) => t.id === i.id)!
    expect(got.owner).toBe(g.citizen?.id)
    expect(got.history.map((h) => h.owner)).toEqual(['Mabel', g.citizen?.id])
    expect(() => apply(next, { type: 'buy', id: i.id })).toThrow()
    expect(next.trades).toHaveLength(1)
  })
  it('rejects duplicate listings and invalid prices, allows cancellation and simulated collection', () => {
    const g = join(),
      id = g.items.at(-1)!.id
    expect(() => apply(g, { type: 'list', id, price: -1 })).toThrow()
    const listed = apply(g, { type: 'list', id, price: 11 })
    expect(() => apply(listed, { type: 'list', id, price: 11 })).toThrow()
    expect(apply(listed, { type: 'cancel', id }).items.at(-1)?.where).toBe('inventory')
    const sold = apply(listed, { type: 'simulate', id })
    expect(sold.coins).toBe(g.coins + 11)
    expect(sold.items.at(-1)?.owner).toBe('Robin')
    expect(() => apply(sold, { type: 'simulate', id })).toThrow()
  })
  it('rejects insufficient funds without mutating the original', () => {
    const g = join()
    g.coins = 1
    expect(() => apply(g, { type: 'buy', id: g.items[0].id })).toThrow('coins')
    expect(g.items[0].where).toBe('listed')
  })
  it('enforces three free collections and rolls over on a later day', () => {
    let g = join()
    const gift = g.items.find((i) => i.price === 0)!
    for (let i = 0; i < 4; i++) g.items.push({ ...structuredClone(gift), id: 'gift-' + i })
    for (let i = 0; i < 3; i++) g = apply(g, { type: 'buy', id: 'gift-' + i }, '2026-11-25')
    expect(() => apply(g, { type: 'buy', id: 'gift-3' }, '2026-11-25')).toThrow('three')
    expect(apply(g, { type: 'buy', id: 'gift-3' }, '2026-11-26').freeCount).toBe(1)
  })
  it('grants a daily allowance once and keeps shop stock deterministic', () => {
    const g = join()
    g.citizen!.arrived = '2026-11-25T12:00:00'
    const a = apply(g, { type: 'reward' }, '2026-11-25')
    expect(a.coins).toBe(g.coins + 25)
    expect(() => apply(a, { type: 'reward' }, '2026-11-25')).toThrow()
    expect(apply(a, { type: 'reward' }, '2026-11-26').coins).toBe(g.coins + 50)
    expect(stock('2026-11-25')).toEqual(stock('2026-11-25'))
    expect(apply(g, { type: 'shop', kind: 'chair' }).coins).toBe(46)
  })
})
describe('save format', () => {
  it('restores a populated world faithfully', () => {
    const g = join()
    expect(decode(JSON.parse(JSON.stringify(g)))).toEqual(g)
  })
  it('migrates version one terrain and revision defaults', () => {
    const g = join()
    expect(decode({ ...g, version: 1, ground: undefined, revision: undefined })).toEqual({
      ...g,
      revision: 0,
      materials: { wood: 0, stone: 0, seeds: 0 },
    })
  })
  it('rejects corruption, invalid owners, duplicated items and unknown versions', () => {
    const g = join()
    for (const bad of [
      null,
      {},
      { ...g, version: 85 },
      { ...g, coins: -1 },
      { ...g, items: [...g.items, g.items[0]] },
      { ...g, items: [{ ...g.items[0], owner: 'Missing' }] },
    ])
      expect(() => decode(bad)).toThrow()
  })
})
describe('materials and offline allowance', () => {
  it('banks seven days and keeps the wallet and supplies on later visits', () => {
    const g = join()
    g.reward = '2026-11-01'
    const next = apply(g, { type: 'reward' }, '2026-11-25')
    expect(next.coins - g.coins).toBe(175)
    expect(next.materials.seeds - g.materials.seeds).toBe(35)
    expect(() => apply(next, { type: 'reward' }, '2026-11-22')).toThrow()
  })
  it('consumes crafting materials atomically and records the new item', () => {
    const g = join(),
      next = apply(g, { type: 'craft', kind: 'chair' })
    expect(next.materials.wood).toBe(10)
    expect(next.items.at(-1)?.history[0].note).toContain('workbench')
    expect(g.materials.wood).toBe(15)
    g.materials.wood = 0
    expect(() => apply(g, { type: 'craft', kind: 'chair' })).toThrow()
  })
})
import { blocksWalking } from '../src/game/collisions'
describe('cottage walking', () => {
  it('permits passage down the open doorway and blocks the adjoining wall', () => {
    const g = join(),
      p = plotBy('A1')
    expect(blocksWalking(g, p.x, p.z + 1.05)).toBe(false)
    expect(blocksWalking(g, p.x + 1.1, p.z + 1.05)).toBe(true)
  })
  it('keeps visitors outside a garden-only cottage and allows access to its path', () => {
    const g = join(),
      p = plotBy('A3')
    expect(blocksWalking(g, p.x, p.z - 0.8)).toBe(true)
    expect(blocksWalking(g, p.x, p.z + 2.1)).toBe(false)
  })
})
