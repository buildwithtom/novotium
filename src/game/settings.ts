export type Mode = 'World' | 'Character' | 'Street'
export type Time = 'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Cycle'
export interface Settings {
  time: Time
  quality: 'Low' | 'Medium' | 'High'
  reduced: boolean
  labels: boolean
  mute: boolean
  master: number
  effects: number
  ambient: number
  sensitivity: number
}
const defaults: Settings = {
  time: 'Cycle',
  quality: 'Medium',
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  labels: true,
  mute: true,
  master: 0.5,
  effects: 0.6,
  ambient: 0.3,
  sensitivity: 1,
}
export function validSettings(input: unknown): Settings {
  const s = { ...defaults }
  if (!input || typeof input !== 'object') return s
  const o = input as Record<string, unknown>
  if (['Low', 'Medium', 'High'].includes(String(o.quality))) s.quality = o.quality as Settings['quality']
  if (['Cycle', 'Morning', 'Afternoon', 'Evening', 'Night'].includes(String(o.time)))
    s.time = o.time as Time
  for (const k of ['mute', 'reduced', 'labels'] as const) if (typeof o[k] === 'boolean') s[k] = o[k]
  for (const k of ['master', 'ambient', 'effects', 'sensitivity'] as const)
    if (typeof o[k] === 'number' && Number.isFinite(o[k]))
      s[k] = Math.max(k === 'sensitivity' ? 0.3 : 0, Math.min(k === 'sensitivity' ? 2 : 1, o[k]))
  return s
}
export function readCachedSettings(): Settings | undefined {
  try {
    const raw = localStorage.getItem('novotium-preferences')
    return raw ? validSettings(JSON.parse(raw)) : undefined
  } catch {
    return undefined
  }
}
export function readSettings(): Settings {
  return readCachedSettings() ?? defaults
}
export function saveSettings(p: Settings) {
  try {
    localStorage.setItem('novotium-preferences', JSON.stringify(p))
  } catch {
    /* An IndexedDB copy is also written by the application. */
  }
}
let audio: AudioContext | undefined
export function sound(p: Settings, type: 'select' | 'trade' | 'place' | 'bird' = 'select') {
  if (p.mute || !(type === 'bird' ? p.ambient : p.effects)) return
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
    const t = audio.currentTime,
      o = audio.createOscillator(),
      v = audio.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(
      type === 'bird' ? 1500 : type === 'trade' ? 550 : type === 'place' ? 300 : 440,
      t,
    )
    o.frequency.exponentialRampToValueAtTime(
      type === 'bird' ? 2270 : type === 'trade' ? 810 : 230,
      t + 0.12,
    )
    v.gain.setValueAtTime(0.0001, t)
    v.gain.exponentialRampToValueAtTime(
      Math.max(0.00015, p.master * (type === 'bird' ? p.ambient * 0.036 : p.effects * 0.09)),
      t + 0.015,
    )
    v.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    o.connect(v).connect(audio.destination)
    o.start(t)
    o.stop(t + 0.24)
  } catch {
    /* Silent mode on devices without Web Audio. */
  }
}
