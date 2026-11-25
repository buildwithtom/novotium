import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { decode } from '../services/save'
import { type Game } from '../domain/world'
import { validSettings, type Settings } from '../game/settings'
export function download(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
}
export function Preferences({
  s,
  set,
  g,
  load,
  reset,
  notice,
  metrics,
}: {
  metrics: { fps?: number; draws?: number; triangles?: number }
  s: Settings
  set: (s: Settings) => void
  g: Game
  load: (v: unknown, p?: Settings) => void
  reset: () => void
  notice: (s: string) => void
}) {
  const file = useRef<HTMLInputElement>(null),
    [confirm, setConfirm] = useState(false),
    [imported, setImported] = useState<{ world: Game; preferences?: Settings }>()
  async function importFile(f?: File) {
    if (!f) return
    try {
      if (f.size > 10000000) throw Error('Choose a save smaller than 10 MB.')
      const raw = JSON.parse(await f.text())
      setImported(
        raw?.format === 'novotium-backup'
          ? { world: decode(raw.world), preferences: validSettings(raw.preferences) }
          : { world: decode(raw) },
      )
    } catch (e) {
      notice(e instanceof Error ? e.message : 'Could not open this save.')
    } finally {
      if (file.current) file.current.value = ''
    }
  }
  return (
    <>
      <h2>World settings</h2>
      <label>
        Time of day
        <select value={s.time} onChange={(e) => set({ ...s, time: e.target.value as Settings['time'] })}>
          {['Cycle', 'Morning', 'Afternoon', 'Evening', 'Night'].map((k) => (
            <option key={k} value={k}>
              {k === 'Cycle' ? 'Natural cycle' : k}
            </option>
          ))}
        </select>
      </label>
      <label>
        Graphics quality
        <select
          value={s.quality}
          onChange={(e) => set({ ...s, quality: e.target.value as Settings['quality'] })}
        >
          {['Low', 'Medium', 'High'].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      {(['labels', 'reduced', 'mute'] as const).map((k, i) => (
        <label className="switch" key={k}>
          {['Map labels', 'Reduced motion', 'Mute audio'][i]}
          <input type="checkbox" checked={s[k]} onChange={(e) => set({ ...s, [k]: e.target.checked })} />
        </label>
      ))}
      {(['sensitivity', 'master', 'effects', 'ambient'] as const).map((k, i) => (
        <label className="range" key={k}>
          {['Look sensitivity', 'Master volume', 'Effects volume', 'Ambient volume'][i]}
          <input
            type="range"
            min={k === 'sensitivity' ? 0.3 : 0}
            max={k === 'sensitivity' ? 2 : 1}
            step={0.05}
            value={s[k]}
            onChange={(e) => set({ ...s, [k]: +e.target.value })}
          />
        </label>
      ))}
      <details className="performance">
        <summary>Rendering details</summary>
        <p>
          {metrics.fps || '…'} fps · {metrics.draws} draw calls ·{' '}
          {(metrics.triangles || 0).toLocaleString()} triangles
        </p>
      </details>
      <h4 className="section-title">Local save</h4>
      <p>Your world lives in this browser. Export a copy to keep it or move it to another device.</p>
      <div className="row-actions">
        <button
          className="secondary"
          onClick={() => {
            const u = URL.createObjectURL(
              new Blob(
                [JSON.stringify({ format: 'novotium-backup', world: g, preferences: s }, null, 2)],
                { type: 'application/json' },
              ),
            )
            download(u, 'novotium-willowmere.json')
            setTimeout(() => URL.revokeObjectURL(u), 500)
          }}
        >
          <Download size={15} />
          Export
        </button>
        <button className="secondary" onClick={() => file.current?.click()}>
          <Upload size={15} />
          Import
        </button>
      </div>
      <input
        hidden
        ref={file}
        type="file"
        accept=".json,application/json"
        onChange={(e) => void importFile(e.target.files?.[0])}
      />
      {imported !== undefined && (
        <div className="confirm">
          <p>Replace this browser’s world with the imported save?</p>
          <button
            className="primary"
            onClick={() => {
              load(imported.world, imported.preferences)
              setImported(undefined)
            }}
          >
            Use imported world
          </button>{' '}
          <button className="text-button" onClick={() => setImported(undefined)}>
            Keep current
          </button>
        </div>
      )}
      {confirm ? (
        <div className="confirm">
          <p>Erase your citizen, home and belongings from this browser?</p>
          <button className="danger" onClick={reset}>
            Erase local world
          </button>{' '}
          <button className="text-button" onClick={() => setConfirm(false)}>
            Keep my world
          </button>
        </div>
      ) : (
        <button className="text-button muted" onClick={() => setConfirm(true)}>
          Reset local world
        </button>
      )}
    </>
  )
}
