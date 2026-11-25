import { useSyncExternalStore } from 'react'
import { apply, fresh, type Action, type Game } from '../domain/world'
import { decode, localRepository } from './save'
let game = fresh(),
  ready = false,
  volatile = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((f) => f())
const listen = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
export const useGame = () => useSyncExternalStore(listen, () => game)
let starting: Promise<string | undefined> | undefined
export function start() {
  return (starting ??= (async () => {
    try {
      const loaded = await localRepository.load()
      game = loaded.game
      return loaded.message
    } catch {
      volatile = true
      return 'Browser storage is unavailable. Export your world before leaving.'
    } finally {
      ready = true
      notify()
    }
  })())
}
let pending = Promise.resolve<unknown>(null)
const undo: Game[] = [],
  redo: Game[] = []
export function change(action: Action | 'undo' | 'redo' | { type: 'replace'; value: unknown }) {
  const operation = pending.then(async () => {
    if (!ready) throw Error('Opening your world…')
    const prev = game
    let next: Game
    if (action === 'undo' || action === 'redo') {
      const stack = action === 'undo' ? undo : redo
      if (!stack.length) throw Error('There is nothing to ' + action + '.')
      next = structuredClone(stack.at(-1)!)
    } else if (action.type === 'replace') next = decode(action.value)
    else next = apply(prev, action)
    next.revision = prev.revision + 1
    if (!volatile) await localRepository.write(next, prev.revision)
    if (action === 'undo') {
      undo.pop()
      redo.push(prev)
    } else if (action === 'redo') {
      redo.pop()
      undo.push(prev)
    } else if (['place', 'store', 'paint'].includes(action.type)) {
      undo.push(prev)
      if (undo.length > 40) undo.shift()
      redo.length = 0
    } else {
      undo.length = 0
      redo.length = 0
    }
    game = next
    notify()
    return next
  })
  pending = operation.catch(() => {})
  return operation
}
