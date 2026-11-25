import { placementIssue, catalog, fresh, kinds, plots, type Game } from '../domain/world'
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const str = (v: unknown, max = 500) => typeof v === 'string' && v.length <= max
const integer = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v))
const hex = (v: unknown) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)
export function decode(raw: unknown): Game {
  if (!record(raw)) throw Error('This file does not contain a Novotium save.')
  const v = { ...raw }
  if (v.version === 1) {
    v.version = 2
    v.ground ??= {}
    v.revision ??= 0
  }
  if (v.version === 2) {
    v.version = 3
    v.materials = { wood: 0, stone: 0, seeds: 0 }
  }
  const invalid = () => {
    throw Error('This Novotium save contains invalid or incomplete records.')
  }
  if (
    v.version !== 3 ||
    !record(v.materials) ||
    ![v.materials.wood, v.materials.stone, v.materials.seeds].every(integer) ||
    !integer(v.revision) ||
    !integer(v.coins) ||
    !integer(v.freeCount) ||
    Number(v.freeCount) > 3 ||
    ![v.day, v.reward].every((x) => x === '' || (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)))
  )
    return invalid()
  const c = v.citizen
  if (
    c !== null &&
    (!record(c) ||
      !str(c.id) ||
      !c.id ||
      !str(c.name, 32) ||
      !c.name ||
      !str(c.home, 40) ||
      !c.home ||
      !date(c.arrived) ||
      !plots.some((p) => p.id === c.plot && !p.resident) ||
      ![c.skin, c.hair, c.coat].every(hex) ||
      !(c.roof === '' || hex(c.roof)) ||
      ![-1, 0, 1].includes(Number(c.house)) ||
      typeof c.house !== 'number' ||
      !integer(c.style) ||
      !str(c.bio, 200) ||
      !['Open house', 'Garden only', 'Private'].includes(String(c.access)))
  )
    return invalid()
  if (!Array.isArray(v.items) || v.items.length > 10000 || !Array.isArray(v.trades) || !record(v.ground))
    return invalid()
  const ids = new Set(),
    owners = new Set([...plots.map((p) => p.resident).filter(Boolean), ...(record(c) ? [c.id] : [])])
  for (const i of v.items) {
    if (
      !record(i) ||
      !str(i.id) ||
      !i.id ||
      ids.has(i.id) ||
      !kinds.includes(i.kind as keyof typeof catalog) ||
      !owners.has(i.owner) ||
      !['inventory', 'placed', 'listed'].includes(String(i.where)) ||
      !Array.isArray(i.history) ||
      !i.history.length
    )
      return invalid()
    if (
      !i.history.every((h) => record(h) && date(h.date) && owners.has(h.owner) && str(h.note)) ||
      i.history.at(-1).owner !== i.owner
    )
      return invalid()
    if (i.where === 'placed') {
      const p = i.place
      if (!record(c) || i.owner !== c.id || !record(p) || ![p.x, p.z, p.rotation].every(Number.isFinite))
        return invalid()
      const land = plots.find((l) => l.id === c.plot)!
      if (Math.abs(Number(p.x) - land.x) > 3.5 || Math.abs(Number(p.z) - land.z) > 3.5) return invalid()
    } else if (i.place !== undefined) return invalid()
    if (i.where === 'listed' ? !integer(i.price) || Number(i.price) > 9999 : i.price !== undefined)
      return invalid()
    ids.add(i.id)
  }
  if (
    !v.trades.every(
      (t) =>
        record(t) &&
        ids.has(t.item) &&
        owners.has(t.from) &&
        owners.has(t.to) &&
        date(t.date) &&
        integer(t.price),
    )
  )
    return invalid()
  const land = record(c) ? plots.find((p) => p.id === c.plot) : null
  if (
    !Object.entries(v.ground).every(([k, val]) => {
      const [x, z] = k.split(',').map(Number)
      return (
        /^-?\d+,-?\d+$/.test(k) &&
        land &&
        Math.abs(x - land.x) <= 3 &&
        Math.abs(z - land.z) <= 3 &&
        ['grass', 'sand', 'stone'].includes(String(val))
      )
    })
  )
    return invalid()
  const game = v as unknown as Game
  if (game.items.some((i) => i.where === 'placed' && i.place && placementIssue(game, i, i.place)))
    return invalid()
  if (
    game.citizen &&
    game.items.filter((i) => i.owner === game.citizen?.id && i.where === 'listed').length > 5
  )
    return invalid()
  return game
}
export interface SaveRepository {
  load(): Promise<{ game: Game; message?: string }>
  write(game: Game, expected: number): Promise<void>
}
export const openWorldDB = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open('novotium-willowmere', 1)
    r.onupgradeneeded = () => r.result.createObjectStore('world')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
export const localRepository: SaveRepository = {
  async load() {
    const db = await openWorldDB()
    try {
      const read = (key: string) =>
        new Promise<unknown>((ok, no) => {
          const r = db.transaction('world').objectStore('world').get(key)
          r.onsuccess = () => ok(r.result)
          r.onerror = () => no(r.error)
        })
      const raw = await new Promise<unknown>((ok, no) => {
        const t = db.transaction('world', 'readwrite'),
          store = t.objectStore('world'),
          r = store.get('current')
        let value: unknown
        r.onsuccess = () => {
          value = r.result
          if (value === undefined) {
            value = fresh()
            store.put(value, 'current')
          }
        }
        t.oncomplete = () => ok(value)
        t.onerror = t.onabort = () => no(t.error)
      })
      try {
        return { game: decode(raw) }
      } catch {
        let game: Game
        try {
          game = decode(await read('backup'))
        } catch {
          game = fresh()
        }
        game.revision = record(raw) && integer(raw.revision) ? Number(raw.revision) : 0
        return { game, message: 'The last save was damaged. A recovery copy is open.' }
      }
    } finally {
      db.close()
    }
  },
  async write(game, expected) {
    const db = await openWorldDB()
    try {
      await new Promise<void>((ok, no) => {
        const tx = db.transaction('world', 'readwrite'),
          s = tx.objectStore('world'),
          r = s.get('current')
        let conflict = false
        r.onsuccess = () => {
          const old = r.result
          if (old && Number.isSafeInteger(old.revision) && old.revision !== expected) {
            conflict = true
            tx.abort()
            return
          }
          if (!game.citizen) {
            s.delete('backup')
          } else if (old) {
            try {
              s.put(decode(old), 'backup')
            } catch {
              /* Keep the previous valid backup. */
            }
          }
          s.put(game, 'current')
        }
        tx.oncomplete = () => ok()
        tx.onabort = tx.onerror = () =>
          no(
            Error(
              conflict
                ? 'Another tab saved changes. Refresh to load them.'
                : 'Could not save in this browser. Export a copy from Settings.',
            ),
          )
      })
    } finally {
      db.close()
    }
  },
}
