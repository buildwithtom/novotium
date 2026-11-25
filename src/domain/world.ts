import { footprint } from './footprints'
import { BALANCE, recipes, accruedDays, type Materials, type Recipe } from './economy'
export const DISTRICT = 'Willowmere'
export type Access = 'Open house' | 'Garden only' | 'Private'
export interface Plot {
  id: string
  x: number
  z: number
  name: string
  resident: string
  style: number
  access: Access
}
export const plots: Plot[] = [
  {
    id: 'A1',
    x: -10,
    z: -7,
    name: 'Bramble Cottage',
    resident: 'Mabel',
    style: 0,
    access: 'Open house',
  },
  {
    id: 'A2',
    x: 0,
    z: -7,
    name: 'The Little Library',
    resident: 'Jules',
    style: 1,
    access: 'Open house',
  },
  { id: 'A3', x: 10, z: -7, name: 'Bluebell House', resident: 'Cleo', style: 2, access: 'Garden only' },
  { id: 'B1', x: -10, z: 6, name: 'Clover Meadow', resident: '', style: 0, access: 'Open house' },
  { id: 'B2', x: 0, z: 6, name: 'Fern & Stone', resident: 'Robin', style: 3, access: 'Open house' },
  { id: 'B3', x: 10, z: 6, name: 'Brookside Meadow', resident: '', style: 1, access: 'Open house' },
]
export const SKINS = ['#f0c09a', '#dca178', '#b9815d', '#87523b', '#5e382d']
export const COATS = ['#77917b', '#b66950', '#698b9a', '#d1a54f', '#a4829b']
export const HAIR = ['#49352c', '#946747', '#cfb280', '#433c39', '#c0b8a6']
export const catalog = {
  chair: {
    name: 'Spindle chair',
    description: 'A beechwood chair polished smooth by use.',
    price: 14,
    r: 0.38,
    category: 'Furniture',
  },
  table: {
    name: 'Breakfast table',
    description: 'Just enough room for tea and a favourite book.',
    price: 22,
    r: 0.58,
    category: 'Furniture',
  },
  plant: {
    name: 'Terracotta fern',
    description: 'Soft green fronds in a little clay pot.',
    price: 8,
    r: 0.32,
    category: 'Garden',
  },
  tree: {
    name: 'Garden sapling',
    description: 'A young tree for a sunny corner outside.',
    price: 20,
    r: 0.56,
    category: 'Garden',
  },
  rug: {
    name: 'Woven hearth rug',
    description: 'A woollen rug for chilly mornings.',
    price: 12,
    r: 0.56,
    category: 'Furnishings',
  },
  lamp: {
    name: 'Reading lamp',
    description: 'A warm pool of light beside your chair.',
    price: 18,
    r: 0.29,
    category: 'Furnishings',
  },
  bench: {
    name: 'Garden bench',
    description: 'A seat to share in the garden.',
    price: 24,
    r: 0.72,
    category: 'Furniture',
  },
  bookshelf: {
    name: 'Cottage bookshelf',
    description: 'Shelves for well-thumbed stories.',
    price: 26,
    r: 0.58,
    category: 'Furniture',
  },
  bed: {
    name: 'Quilted bed',
    description: 'A painted frame and a patchwork quilt.',
    price: 32,
    r: 0.83,
    category: 'Furniture',
  },
} as const
export type Kind = keyof typeof catalog
export const kinds = Object.keys(catalog) as Kind[]
export interface Citizen {
  id: string
  name: string
  home: string
  plot: string
  arrived: string
  skin: string
  hair: string
  coat: string
  style: number
  house: number
  roof: string
  access: Access
  bio: string
}
export interface Placement {
  x: number
  z: number
  rotation: number
}
export interface Entry {
  date: string
  owner: string
  note: string
}
export interface Item {
  id: string
  kind: Kind
  owner: string
  where: 'inventory' | 'placed' | 'listed'
  place?: Placement
  price?: number
  history: Entry[]
}
export interface Trade {
  item: string
  from: string
  to: string
  price: number
  date: string
}
export interface Game {
  version: 3
  materials: Materials
  revision: number
  citizen: Citizen | null
  coins: number
  items: Item[]
  trades: Trade[]
  day: string
  freeCount: number
  reward: string
  ground: Record<string, string>
}
export const uid = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 15) | 64
  b[8] = (b[8] & 63) | 128
  const hex = Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join(
    '-',
  )
}
export const dayOf = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
export const newItem = (kind: Kind, owner: string, note: string): Item => ({
  id: uid(),
  kind,
  owner,
  where: 'inventory',
  history: [{ date: new Date().toISOString(), owner, note }],
})
export function fresh(): Game {
  const items: Item[] = [
    ['chair', 'Mabel', 9],
    ['plant', 'Robin', 0],
    ['lamp', 'Jules', 12],
  ].map(([kind, owner, price]) => ({
    ...newItem(kind as Kind, String(owner), 'From the simulated resident’s cottage collection.'),
    where: 'listed',
    price: Number(price),
  }))
  return {
    version: 3,
    materials: { wood: 0, stone: 0, seeds: 0 },
    revision: 0,
    citizen: null,
    coins: 0,
    items,
    trades: [],
    day: '',
    freeCount: 0,
    reward: '',
    ground: {},
  }
}
export const plotBy = (id: string) => plots.find((p) => p.id === id)!
export function localPlot(g: Game, p: Plot): Plot {
  const c = g.citizen
  return c?.plot === p.id
    ? { ...p, name: c.home, resident: c.name, style: c.house, access: c.access }
    : p
}
export function insideHouse(p: Plot, x: number, z: number) {
  return Math.abs(x - p.x) < 2.2 && Math.abs(z - (p.z - 0.85)) < 1.9
}
export function canEnter(g: Game, p: Plot) {
  return g.citizen?.plot === p.id || p.access === 'Open house'
}
export function listingSpot(g: Game, it: Item) {
  const p =
    it.owner === g.citizen?.id ? plotBy(g.citizen.plot) : plots.find((p) => p.resident === it.owner)
  if (!p) return null
  const n = g.items
    .filter((i) => i.owner === it.owner && i.where === 'listed')
    .findIndex((i) => i.id === it.id)
  const spots = [
    [-2.65, 2.35],
    [-1.65, 2.38],
    [2.55, 2.35],
    [2.65, 0.9],
    [-2.65, 0.85],
  ]
  const spot = spots[n]
  if (!spot) return null
  const x = p.x + spot[0],
    z = p.z + spot[1]
  if (
    g.items.some(
      (i) =>
        i.where === 'placed' &&
        i.place &&
        Math.hypot(i.place.x - x, i.place.z - z) < catalog[i.kind].r + catalog[it.kind].r,
    )
  )
    return null
  return { x, z }
}
export function placementIssue(g: Game, item: Item, at: Placement): string | null {
  const c = g.citizen
  if (!c || item.owner !== c.id || item.where === 'listed')
    return 'Only your available belongings can be placed.'
  if (![at.x, at.z, at.rotation].every(Number.isFinite)) return 'Choose a square in your plot.'
  const p = plotBy(c.plot),
    x = at.x - p.x,
    z = at.z - p.z,
    r = catalog[item.kind].r
  const { halfX, halfZ } = footprint(item.kind, at.rotation)
  if (Math.abs(x) + halfX > 3.5 || Math.abs(z) + halfZ > 3.5)
    return 'Keep the whole object inside your plot.'
  if (c.house >= 0) {
    const dz = z + 0.85
    if (Math.abs(x) < 0.7 + r && z > 0.34 - r && z < 2.15 + r) return 'Leave the doorway clear.'
    if (
      (Math.abs(Math.abs(x) - 2.2) < halfX + 0.08 && Math.abs(dz) < 1.9 + halfZ) ||
      (Math.abs(Math.abs(dz) - 1.9) < halfZ + 0.08 && Math.abs(x) < 2.2 + halfX)
    )
      return 'Leave some room beside the wall.'
    if (item.kind === 'tree' && insideHouse(p, at.x, at.z))
      return 'Find an outdoor square for the sapling.'
  }
  if (
    g.items.some((i) => {
      if (
        i.id === item.id ||
        i.where !== 'placed' ||
        !i.place ||
        i.kind === 'rug' ||
        item.kind === 'rug'
      )
        return false
      const other = footprint(i.kind, i.place.rotation)
      return (
        Math.abs(i.place.x - at.x) < other.halfX + halfX - 0.025 &&
        Math.abs(i.place.z - at.z) < other.halfZ + halfZ - 0.025
      )
    })
  )
    return 'Another belonging is in this spot.'
  if (Math.hypot(x - 2.7, z + 2.55) < r + 0.24) return 'Leave room around the garden tree.'
  if (Math.abs(x - 1) < halfX + 0.23 && Math.abs(z - 2.72) < halfZ + 0.18)
    return 'Leave the mailbox accessible.'
  if (
    g.items.some((i) => {
      const s = i.where === 'listed' && listingSpot(g, i)
      return s && Math.hypot(s.x - at.x, s.z - at.z) < r + 0.45
    })
  )
    return 'Leave room for the doorstep display.'
  return null
}
export interface Arrival {
  name: string
  home: string
  plot: string
  skin: string
  coat: string
  hair: string
  style: number
  house: number
  gift: Kind
}
export type Action =
  | { type: 'join'; profile: Arrival }
  | { type: 'craft'; kind: Recipe }
  | {
      type: 'profile'
      values: Partial<
        Pick<
          Citizen,
          'name' | 'home' | 'skin' | 'coat' | 'hair' | 'style' | 'access' | 'bio' | 'roof' | 'house'
        >
      >
    }
  | { type: 'place'; id: string; at: Placement }
  | { type: 'store' | 'cancel' | 'buy' | 'simulate'; id: string }
  | { type: 'list'; id: string; price: number }
  | { type: 'shop'; kind: Kind }
  | { type: 'reward' }
  | { type: 'paint'; x: number; z: number; color: string }
function need(valid: unknown, message: string): asserts valid {
  if (!valid) throw new Error(message)
}
export function stock(date = dayOf()): Kind[] {
  const extra: Kind[] = ['lamp', 'rug', 'bench', 'bookshelf', 'bed']
  const n = Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000)
  return ['chair', 'plant', 'table', 'tree', extra[n % 5], extra[(n + 1) % 5]]
}
export function apply(previous: Game, a: Action, today = dayOf()): Game {
  const g = structuredClone(previous),
    c = g.citizen
  g.revision++
  if (a.type === 'join') {
    const v = a.profile,
      p = plots.find((p) => p.id === v.plot)
    need(!c && p && !p.resident, 'Choose an available plot.')
    need(
      SKINS.includes(v.skin) &&
        HAIR.includes(v.hair) &&
        COATS.includes(v.coat) &&
        [0, 1, 2, 3].includes(v.style),
      'Choose a valid appearance.',
    )
    need(
      v.name.trim() && v.home.trim() && v.name.length <= 32 && v.home.length <= 40,
      'Give your citizen and home a short name.',
    )
    need([-1, 0, 1].includes(v.house) && kinds.includes(v.gift), 'Choose a starter home and gift.')
    const id = uid()
    g.citizen = {
      id,
      name: v.name.trim(),
      home: v.home.trim(),
      arrived: new Date().toISOString(),
      plot: p.id,
      skin: v.skin,
      hair: v.hair,
      coat: v.coat,
      style: v.style,
      house: v.house,
      access: 'Open house',
      bio: '',
      roof: '',
    }
    g.coins = BALANCE.starterCoins
    g.materials = { ...BALANCE.starterMaterials }
    for (const kind of ['chair', 'table', 'tree', v.gift] as Kind[])
      g.items.push(newItem(kind, id, 'Received on arrival in Willowmere.'))
    return g
  }
  need(c, 'Become a Novotian to do that.')
  if (a.type === 'profile') {
    const v = a.values
    need(
      (v.access === undefined || ['Open house', 'Garden only', 'Private'].includes(v.access)) &&
        (v.house === undefined || [-1, 0, 1].includes(v.house)) &&
        (v.style === undefined || [0, 1, 2, 3].includes(v.style)) &&
        [v.skin, v.hair, v.coat, v.roof].every(
          (t) => t === undefined || t === '' || /^#[a-f0-9]{6}$/i.test(t),
        ) &&
        (v.bio === undefined || v.bio.length <= 200),
      'Choose valid citizen details.',
    )
    need(
      (v.home === undefined || (v.home.trim().length > 0 && v.home.length <= 40)) &&
        (v.name === undefined || (v.name.trim().length > 0 && v.name.length <= 32)),
      'Choose a short name.',
    )
    if (v.house !== undefined && v.house !== c.house)
      need(
        !g.items.some((i) => i.where === 'placed'),
        'Store your placed belongings before changing the house.',
      )
    Object.assign(c, v)
    return g
  }
  if (a.type === 'reward') {
    const days = accruedDays(g.reward, dayOf(new Date(c.arrived)), today)
    need(days > 0, 'You have already collected today’s allowance.')
    g.reward = today
    g.coins += BALANCE.allowance.coins * days
    for (const key of ['wood', 'stone', 'seeds'] as const)
      g.materials[key] += BALANCE.allowance[key] * days
    return g
  }
  if (a.type === 'craft') {
    const cost: Partial<Materials> = recipes[a.kind]
    need(cost, 'Choose a workshop recipe.')
    for (const [k, n] of Object.entries(cost))
      need(g.materials[k as keyof Materials] >= n, 'Collect more materials for this recipe.')
    for (const [k, n] of Object.entries(cost)) g.materials[k as keyof Materials] -= n
    g.items.push(newItem(a.kind, c.id, 'Made by hand at the Willowmere workbench.'))
    return g
  }
  if (a.type === 'shop') {
    need(stock(today).includes(a.kind), 'This item is outside today’s selection.')
    const cost = catalog[a.kind].price
    need(g.coins >= cost, 'You need more coins for this belonging.')
    g.coins -= cost
    g.items.push(newItem(a.kind, c.id, 'Purchased at Willowmere Market.'))
    return g
  }
  if (a.type === 'paint') {
    const p = plotBy(c.plot)
    need(
      Number.isInteger(a.x) &&
        Number.isInteger(a.z) &&
        Math.abs(a.x - p.x) <= 3 &&
        Math.abs(a.z - p.z) <= 3 &&
        ['grass', 'sand', 'stone'].includes(a.color),
      'Choose a tile within your plot.',
    )
    g.ground[a.x + ',' + a.z] = a.color
    return g
  }
  const i = g.items.find((i) => i.id === a.id)
  need(i, 'This belonging could not be found.')
  if (a.type === 'buy' || a.type === 'simulate') {
    need(i.where === 'listed' && i.price !== undefined, 'This listing is no longer available.')
    const price = i.price,
      buy = a.type === 'buy'
    need(buy ? i.owner !== c.id : i.owner === c.id, 'Choose a different listing.')
    if (buy) {
      need(g.coins >= price, 'You need more coins for this belonging.')
      if (price === 0) {
        if (g.day < today) {
          g.freeCount = 0
          g.day = today
        }
        need(g.freeCount < BALANCE.freeLimit, 'You have collected three free items today.')
        g.freeCount++
      }
      g.coins -= price
    } else g.coins += price
    const from = i.owner,
      to = buy ? c.id : 'Robin',
      date = new Date().toISOString()
    g.trades.push({ item: i.id, from, to, price, date })
    i.history.push({
      date,
      owner: to,
      note: price ? 'Purchased at a doorstep sale.' : 'Collected from the Free Stuff Box.',
    })
    i.owner = to
    i.where = 'inventory'
    delete i.price
    return g
  }
  need(i.owner === c.id, 'This belonging has another owner.')
  if (a.type === 'place') {
    const issue = placementIssue(g, i, a.at)
    need(!issue, issue || '')
    i.where = 'placed'
    i.place = a.at
  }
  if (a.type === 'store') {
    need(i.where === 'placed', 'Select a placed item.')
    i.where = 'inventory'
    delete i.place
  }
  if (a.type === 'cancel') {
    need(i.where === 'listed', 'Select an active listing.')
    i.where = 'inventory'
    delete i.price
  }
  if (a.type === 'list') {
    need(i.where === 'inventory', 'Store the item first.')
    need(
      Number.isSafeInteger(a.price) && a.price >= 0 && a.price <= 9999,
      'Choose a whole-number price from 0 to 9999.',
    )
    need(
      g.items.filter((i) => i.owner === c.id && i.where === 'listed').length < BALANCE.listingLimit,
      'You can display five listings at a time.',
    )
    i.where = 'listed'
    i.price = a.price
  }
  return g
}
