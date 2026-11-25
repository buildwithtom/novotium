import { type Settings } from '../game/settings'
import { openWorldDB } from './save'
export async function persistPreferences(p: Settings) {
  const db = await openWorldDB()
  try {
    await new Promise<void>((ok, no) => {
      const t = db.transaction('world', 'readwrite')
      t.objectStore('world').put(p, 'preferences')
      t.oncomplete = () => ok()
      t.onabort = t.onerror = () => no(t.error)
    })
  } finally {
    db.close()
  }
}
export async function storedPreferences(): Promise<Settings | undefined> {
  const db = await openWorldDB()
  try {
    return await new Promise<Settings | undefined>((ok, no) => {
      const r = db.transaction('world').objectStore('world').get('preferences')
      r.onsuccess = () => ok(r.result)
      r.onerror = () => no(r.error)
    })
  } finally {
    db.close()
  }
}
