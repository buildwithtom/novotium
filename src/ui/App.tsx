import { IconBtn, Drawer } from './Drawer'
import { AtlasSheet, PlotSheet, FieldGuide } from './Neighbourhood'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  Armchair,
  Backpack,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronRight,
  Coins,
  Compass as CompassIcon,
  Expand,
  Eye,
  Footprints,
  Hammer,
  Hand,
  Home,
  LandPlot,
  Layers3,
  Map as MapIcon,
  Minus,
  Mouse,
  PersonStanding,
  Plus,
  Redo2,
  RotateCw,
  Settings2,
  Signpost,
  Sprout,
  Stamp,
  Store,
  Sun,
  Sunset,
  Moon,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { BrandMark, Compass, DistrictMap, Postmark } from '../art/Atlas'
import { Village, type ViewState, type Editor, type Target } from '../game/engine'
import {
  readSettings,
  readCachedSettings,
  validSettings,
  saveSettings,
  sound,
  type Settings,
  type Mode,
} from '../game/settings'
import {
  catalog,
  fresh,
  localPlot,
  placementIssue,
  plotBy,
  plots,
  type Action,
  type Placement,
  type Plot,
} from '../domain/world'
import { persistPreferences, storedPreferences } from '../services/preferences'
import { change, start, useGame } from '../services/gameStore'
import { ArrivalForm, Passport, ProfileForm } from './Citizenship'
import { Collection, ItemBook, Market } from './Collections'
import { Preferences, download } from './Preferences'
import { Deed } from './Deed'
type Panel =
  | 'deed'
  | 'join'
  | 'passport'
  | 'profile'
  | 'atlas'
  | 'plot'
  | 'item'
  | 'market'
  | 'satchel'
  | 'build'
  | 'settings'
  | 'square'
  | 'guide'
  | null
const modes: Mode[] = ['World', 'Character', 'Street'],
  camIcons = [Layers3, PersonStanding, Eye]
export default function App() {
  const game = useGame(),
    c = game.citizen,
    host = useRef<HTMLDivElement>(null),
    engine = useRef<Village | null>(null)
  const [ready, setReady] = useState(false),
    [fault, setFault] = useState(''),
    [prefs, setPrefs] = useState(readSettings),
    [mode, setMode] = useState<Mode>('World'),
    [panel, setPanel] = useState<Panel>(null),
    [welcome, setWelcome] = useState(true),
    [photo, setPhoto] = useState(false),
    [editor, setEditor] = useState<Editor | null>(null)
  const [plotID, setPlotID] = useState('B1'),
    [itemID, setItemID] = useState(''),
    [note, setNote] = useState(''),
    [hud, setHud] = useState<ViewState>({
      x: -3.4,
      z: 2.1,
      angle: -33,
      clock: 9.67,
      context: 'Willowmere Square',
      inside: '',
    })
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    busy = useRef(false)
  const notify = useCallback((s: string) => {
    setNote(s)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setNote(''), 4300)
  }, [])
  useEffect(() => {
    let alive = true
    void Promise.all([start(), storedPreferences().catch(() => undefined)]).then(([msg, settings]) => {
      if (alive) {
        if (settings) setPrefs(readCachedSettings() ?? validSettings(settings))
        setReady(true)
        if (msg) notify(msg)
      }
    })
    return () => {
      alive = false
    }
  }, [])
  function close() {
    setPanel(null)
  }
  function open(p: Panel) {
    setEditor(null)
    setPanel(p)
    sound(prefs)
  }
  function chooseMode(m: Mode) {
    setEditor(null)
    setPanel(null)
    setMode(m)
    engine.current?.setMode(m)
    if (m !== 'World') setWelcome(false)
  }
  function visit(p: Plot, interior = false) {
    setEditor(null)
    close()
    setWelcome(false)
    setMode('Character')
    engine.current?.setMode('Character')
    if (interior) engine.current?.inside(p)
    else engine.current?.focusPlot(p, true)
  }
  function inspect(id: string) {
    setItemID(id)
    open('item')
  }
  function look(t: Target) {
    if (t.type === 'stall') open('market')
    else if (t.type === 'item') inspect(t.id)
    else if (t.type === 'plot') {
      setPlotID(t.id)
      open('plot')
    } else open('square')
  }
  function perform(
    a: Action | 'undo' | 'redo' | { type: 'replace'; value: unknown },
    msg: string,
    after?: () => void,
  ) {
    if (busy.current) return
    busy.current = true
    void change(a)
      .then(() => {
        sound(
          prefs,
          typeof a === 'object' && (a.type === 'buy' || a.type === 'shop') ? 'trade' : 'place',
        )
        if (msg) notify(msg)
        after?.()
      })
      .catch((e) => notify(e.message))
      .finally(() => {
        busy.current = false
      })
  }
  function place(at: Placement) {
    if (!editor) return
    if (editor.paint) {
      perform({ type: 'paint', x: at.x, z: at.z, color: editor.paint }, 'Terrain painted.')
      return
    }
    const i = game.items.find((i) => i.id === editor.item)
    if (i) {
      const issue = placementIssue(game, i, at)
      if (issue) return notify(issue)
      perform({ type: 'place', id: i.id, at }, 'Placed at home.', () => {
        setEditor(null)
        open('build')
      })
    }
  }
  const callbacks = useRef({ look, place })
  callbacks.current = { look, place }
  useEffect(() => {
    if (!ready || !host.current) return
    try {
      const e = new Village(host.current, game, prefs, {
        hit: (t) => callbacks.current.look(t),
        place: (a) => callbacks.current.place(a),
        hud: setHud,
        hint: notify,
      })
      engine.current = e
      return () => {
        e.dispose()
        engine.current = null
      }
    } catch (err) {
      setFault(err instanceof Error ? err.message : 'WebGL unavailable')
    }
  }, [ready])
  useEffect(() => {
    engine.current?.update(game)
  }, [game])
  useEffect(() => {
    if (!ready) return
    engine.current?.applySettings(prefs)
  }, [prefs, ready])
  useEffect(() => {
    engine.current?.setBlocked(!!panel)
  }, [panel])
  useEffect(() => {
    engine.current?.edit(editor)
  }, [editor])
  const adjust = (s: Settings) => {
    // Save the preference synchronously even if the very next action is a reload.
    saveSettings(s)
    void persistPreferences(s).catch(() => {})
    setPrefs(s)
    sound(s)
  }
  const home = () => {
    if (c) {
      const p = localPlot(game, plotBy(c.plot))
      setPlotID(p.id)
      engine.current?.focusPlot(p, mode !== 'World')
      open('plot')
    } else open('join')
  }
  const beginEdit = (value: Editor) => {
    setPanel(null)
    setWelcome(false)
    setMode('World')
    engine.current?.setMode('World')
    setEditor(value)
  }
  const atlas = () => open('atlas')
  const walk = () => {
    setWelcome(false)
    close()
    setEditor(null)
    setMode('Character')
    const p = engine.current?.discover()
    if (p) notify('Your walk begins at ' + p.name + '.')
  }
  const explore = () => {
    setWelcome(false)
    open('atlas')
  }
  const keys = useRef<(e: KeyboardEvent) => void>(() => {})
  keys.current = (e) => {
    if (e.key === 'Escape') {
      if (photo) setPhoto(false)
      else if (panel) close()
      else if (editor) setEditor(null)
      return
    }
    if (photo && e.key.toLowerCase() !== 'p') return
    if (
      panel ||
      (e.target instanceof HTMLElement && e.target.closest('input,select,textarea,[contenteditable]'))
    )
      return
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && c) {
      e.preventDefault()
      perform(e.shiftKey ? 'redo' : 'undo', e.shiftKey ? 'Edit restored.' : 'Edit undone.')
      return
    }
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
    if (editor && e.key.toLowerCase() === 'r')
      setEditor({ ...editor, rotation: (editor.rotation + Math.PI / 2) % (2 * Math.PI) })
    if (editor?.item && ['Delete', 'Backspace'].includes(e.key)) {
      e.preventDefault()
      perform({ type: 'store', id: editor.item }, 'Stored in your satchel.', () => setEditor(null))
    }
    if (e.key.toLowerCase() === 'b') {
      if (editor) setEditor(null)
      else open(c ? 'build' : 'join')
    }
    if (e.key.toLowerCase() === 'p') setPhoto(!photo)
    const idx = Number(e.key) - 1
    if (idx >= 0 && idx < 3) chooseMode(modes[idx])
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => keys.current(e)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const p = localPlot(game, plotBy(plotID) || plots[0]),
    it = game.items.find((i) => i.id === itemID)
  const hour = Math.floor(hud.clock),
    minute = Math.floor((hud.clock % 1) * 60),
    timeLabel =
      hour < 6 || hour >= 20 ? 'Night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening',
    ClockIcon = timeLabel === 'Night' ? Moon : timeLabel === 'Evening' ? Sunset : Sun
  const showWelcome = welcome && !c && !panel && !editor && mode === 'World',
    navItems = [
      {
        name: 'Explore',
        icon: CompassIcon,
        action: atlas,
        sel: !panel || panel === 'atlas' || panel === 'plot',
      },
      {
        name: 'Build',
        icon: Hammer,
        action: () => open(c ? 'build' : 'join'),
        sel: panel === 'build' || !!editor,
      },
      {
        name: 'Satchel',
        icon: Backpack,
        action: () => open(c ? 'satchel' : 'join'),
        sel: panel === 'satchel',
      },
      { name: 'Market', icon: Store, action: () => open('market'), sel: panel === 'market' },
      { name: 'Home', icon: Home, action: home, sel: false },
    ]
  return (
    <main
      className={
        'app ' +
        (photo ? 'photo ' : '') +
        (mode === 'World' ? 'world' : 'walking') +
        (timeLabel === 'Night' ? ' night' : '')
      }
    >
      {!photo && (
        <header className="mast">
          <button
            className="brand"
            title="Return to world view"
            onClick={() => {
              chooseMode('World')
              engine.current?.resetView()
            }}
          >
            <BrandMark />
            <span>
              novotium<span className="brand-dot">.</span>
            </span>
          </button>
          <span className="mast-rule" />
          <button className="atlas-link" onClick={atlas}>
            <MapIcon size={16} />
            World atlas
            <ChevronDown size={13} />
          </button>
          <div className="mast-right">
            <button title="Change time of day" className="weather" onClick={() => open('settings')}>
              <ClockIcon size={22} />
              <span>
                {(hour % 12 || 12) + ':' + String(minute).padStart(2, '0')}{' '}
                <small>{hour < 12 ? 'AM' : 'PM'}</small>
              </span>
              <i /> {timeLabel}
            </button>
            {c && (
              <span className="wallet">
                <Coins size={16} />
                {game.coins}
              </span>
            )}
            <span className="mast-rule" />
            <IconBtn
              label={prefs.mute ? 'Unmute audio' : 'Mute audio'}
              onClick={() => adjust({ ...prefs, mute: !prefs.mute })}
            >
              {prefs.mute ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </IconBtn>
            <IconBtn label="Settings" onClick={() => open('settings')}>
              <Settings2 size={18} />
            </IconBtn>
            <button className="pass-button" onClick={() => open(c ? 'passport' : 'join')}>
              <BookOpen size={16} />
              {c ? 'Passport' : 'Visitor pass'}
            </button>
          </div>
        </header>
      )}
      <section className="world-stage" aria-label="Willowmere neighbourhood">
        <div className="contours" aria-hidden="true" />
        <div ref={host} className={'scene' + (editor ? ' editing' : '')} />
        {!ready && !fault && (
          <div className="loading">
            <Sprout />
            Opening Willowmere…
          </div>
        )}
        {fault && (
          <div className="engine-error paper">
            <h3>3D view unavailable</h3>
            <p>
              This browser could not open WebGL. Enable hardware acceleration and reload to walk through
              Willowmere.
            </p>
            <button className="secondary" onClick={() => location.reload()}>
              Reload world
            </button>
          </div>
        )}
        {!photo && (
          <>
            <div className="district-title">
              <div className="eyebrow">
                <span className="tiny-rule" /> NEIGHBOURHOOD 01
              </div>
              <h1>
                Willowmere<span>.</span>
              </h1>
              <div className="district-data">
                <span>
                  <LandPlot />6 plots
                </span>
                <i />
                <span>
                  <span className="status-dot" />
                  {c ? 1 : 2} available
                </span>
              </div>
            </div>
            <div className="cameras" aria-label="Camera mode">
              {modes.map((m, i) => {
                const Icon = camIcons[i]
                return (
                  <button
                    key={m}
                    title={m + ' view (' + (i + 1) + ')'}
                    aria-pressed={mode === m}
                    onClick={() => chooseMode(m)}
                  >
                    <Icon size={15} />
                    <span>{m}</span>
                  </button>
                )
              })}
            </div>
            <button
              className="compass"
              aria-label="Reset map orientation"
              title="Reset map orientation"
              onClick={() => {
                chooseMode('World')
                engine.current?.resetView()
              }}
            >
              <Compass angle={hud.angle} />
            </button>
            <div className="map-tools">
              <IconBtn label="Zoom in" onClick={() => engine.current?.zoom(1)}>
                <Plus size={18} />
              </IconBtn>
              <IconBtn label="Zoom out" onClick={() => engine.current?.zoom(-1)}>
                <Minus size={18} />
              </IconBtn>
              <i />
              <IconBtn label="Rotate view" onClick={() => engine.current?.rotate()}>
                <RotateCw size={17} />
              </IconBtn>
              <IconBtn
                label="Photography mode"
                onClick={() => {
                  close()
                  setPhoto(true)
                }}
              >
                <Camera size={17} />
              </IconBtn>
            </div>
            {showWelcome && (
              <article className="welcome paper">
                <div className="welcome-top">
                  <div className="eyebrow">
                    <span className="post-line" /> CITIZEN SERVICES
                  </div>
                  <button aria-label="Dismiss welcome" onClick={() => setWelcome(false)}>
                    <X size={14} />
                  </button>
                </div>
                <div className="welcome-seal">
                  <Postmark />
                </div>
                <h2>
                  A new little <br />
                  <em>life begins.</em>
                </h2>
                <p>
                  Somewhere in this little world, <br />
                  there is a place for you.
                </p>
                <button className="primary join-cta" onClick={() => open('join')}>
                  <Stamp size={16} />
                  Become a Novotian
                </button>
                <button className="explore-cta" onClick={explore}>
                  Explore Novotium <ChevronRight size={13} />
                </button>
              </article>
            )}
            {!panel && !editor && mode === 'World' && (
              <button className="minimap paper" aria-label="Open neighbourhood map" onClick={atlas}>
                <span className="minimap-title">
                  <MapIcon size={13} /> District map <Expand size={12} />
                </span>
                <DistrictMap x={hud.x} z={hud.z} homePlot={c && c.house >= 0 ? c.plot : undefined} />
              </button>
            )}
            {!panel && !editor && mode !== 'World' && (
              <button className="context-prompt" onClick={() => engine.current?.interact()}>
                <kbd>E</kbd>
                {hud.context}
                {hud.inside ? ' · Inside' : ''}
                <ChevronRight size={14} />
              </button>
            )}
            {!panel && !editor && mode !== 'World' && (
              <div className="touch-pad">
                {[ArrowLeft, ArrowUp, ArrowDown, ArrowRight].map((I, i) => (
                  <button
                    key={i}
                    aria-label={'Walk ' + ['left', 'forward', 'back', 'right'][i]}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId)
                      engine.current?.moveTouch(['a', 'w', 's', 'd'][i], true)
                    }}
                    onPointerCancel={() => engine.current?.moveTouch(['a', 'w', 's', 'd'][i], false)}
                    onPointerUp={() => engine.current?.moveTouch(['a', 'w', 's', 'd'][i], false)}
                  >
                    <I size={18} />
                  </button>
                ))}
              </div>
            )}
            {editor ? (
              <div className="editor-bar paper">
                <div>
                  <b>
                    {editor.paint
                      ? 'Paint ' + editor.paint
                      : catalog[game.items.find((i) => i.id === editor.item)?.kind || 'chair'].name}
                  </b>
                  <small>Click a spot · Arrow keys + Enter</small>
                </div>
                {!editor.paint && (
                  <IconBtn
                    label="Rotate object"
                    onClick={() => setEditor({ ...editor, rotation: editor.rotation + Math.PI / 2 })}
                  >
                    <RotateCw size={17} />
                  </IconBtn>
                )}
                <IconBtn label="Undo edit" onClick={() => perform('undo', 'Edit undone.')}>
                  <Undo2 size={17} />
                </IconBtn>
                <IconBtn label="Cancel placement" onClick={() => setEditor(null)}>
                  <X size={17} />
                </IconBtn>
              </div>
            ) : (
              <nav className="dock" aria-label="Game tools">
                {navItems.map(({ name, icon: I, action, sel }) => (
                  <button key={name} onClick={action} className={sel ? 'selected' : ''}>
                    <I size={19} />
                    <span>{name}</span>
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
        {photo && (
          <div className="photo-tools">
            <button
              className="secondary"
              onClick={() => {
                const url = engine.current?.capture()
                if (url) download(url, 'Willowmere.png')
              }}
            >
              <Camera size={15} />
              Save photo
            </button>
            <button className="secondary" onClick={() => setPhoto(false)}>
              Exit photo mode
            </button>
          </div>
        )}
        {panel && !photo && (
          <>
            <div className="scrim" onClick={close} />
            <Drawer key={panel} title={panel === 'join' ? 'Become a Novotian' : panel} close={close}>
              {panel === 'join' && (
                <ArrivalForm
                  plot={p.resident ? undefined : p.id}
                  join={(v) =>
                    perform({ type: 'join', profile: v }, 'Welcome home, Novotian.', () => {
                      setWelcome(false)
                      setPlotID(v.plot)
                      open('passport')
                    })
                  }
                />
              )}
              {panel === 'passport' && c && <Passport c={c} edit={() => open('profile')} />}
              {panel === 'profile' && c && (
                <ProfileForm
                  c={c}
                  save={(v) =>
                    perform({ type: 'profile', values: v }, 'Citizen record updated.', () =>
                      open('passport'),
                    )
                  }
                />
              )}
              {panel === 'settings' && (
                <Preferences
                  s={prefs}
                  set={adjust}
                  g={game}
                  metrics={hud}
                  notice={notify}
                  load={(v, p) =>
                    perform({ type: 'replace', value: v }, 'Your world is restored.', () => {
                      if (p) adjust(p)
                      close()
                    })
                  }
                  reset={() =>
                    perform({ type: 'replace', value: fresh() }, 'Local world reset.', () => {
                      setWelcome(true)
                      chooseMode('World')
                      engine.current?.resetView()
                    })
                  }
                />
              )}
              {panel === 'atlas' && (
                <AtlasSheet
                  game={game}
                  hud={hud}
                  walk={walk}
                  focus={(id) => {
                    setPlotID(id)
                    open('plot')
                  }}
                />
              )}
              {panel === 'plot' && (
                <PlotSheet
                  game={game}
                  p={p}
                  open={open}
                  visit={visit}
                  inspect={inspect}
                  cutaway={() => {
                    chooseMode('World')
                    engine.current?.focusPlot(p)
                    engine.current?.selectRoof(p.id)
                  }}
                />
              )}
              {panel === 'deed' && c && <Deed citizen={c} />}
              {panel === 'square' && (
                <>
                  <div className="eyebrow">
                    <Signpost size={14} />
                    COMMUNITY NOTICEBOARD
                  </div>
                  <h2>Willowmere Square</h2>
                  <p>
                    Four simulated neighbours call Willowmere home. The market is open, and visitors are
                    welcome at the cottages marked Open house.
                  </p>
                  <button className="primary wide" onClick={() => open('market')}>
                    <Store size={16} />
                    Browse the market
                  </button>
                  <button className="secondary wide" onClick={walk}>
                    <Footprints size={16} />
                    Discover a cottage
                  </button>
                  <button
                    className="secondary wide"
                    onClick={() => {
                      chooseMode('Character')
                      engine.current?.pose('wave')
                    }}
                  >
                    <Hand size={16} />
                    Wave hello
                  </button>
                  <button
                    className="secondary wide"
                    onClick={() => {
                      chooseMode('Character')
                      engine.current?.sitOnBench()
                    }}
                  >
                    <Armchair size={16} />
                    Sit by the fountain
                  </button>
                </>
              )}
              {(panel === 'satchel' || panel === 'build') && (
                <>
                  <Collection g={game} inspect={inspect} build={panel === 'build'} />
                  {panel === 'build' && (
                    <>
                      <h4 className="section-title">Paint the ground</h4>
                      <div className="tabs">
                        {['grass', 'sand', 'stone'].map((p) => (
                          <button key={p} onClick={() => beginEdit({ paint: p, rotation: 0 })}>
                            {p}
                          </button>
                        ))}
                      </div>
                      <div className="row-actions">
                        <button className="secondary" onClick={() => perform('undo', 'Edit undone.')}>
                          <Undo2 size={15} />
                          Undo
                        </button>
                        <button className="secondary" onClick={() => perform('redo', 'Edit restored.')}>
                          <Redo2 size={15} />
                          Redo
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
              {panel === 'market' && (
                <Market g={game} inspect={inspect} act={perform} join={() => open('join')} />
              )}
              {panel === 'item' && it && (
                <ItemBook
                  g={game}
                  item={it}
                  act={perform}
                  join={() => open('join')}
                  close={close}
                  place={() => beginEdit({ item: it.id, rotation: it.place?.rotation || 0 })}
                  sit={() => {
                    chooseMode('Character')
                    if (it.place) engine.current?.sitAt(it.place)
                  }}
                />
              )}
              {panel === 'guide' && <FieldGuide />}
            </Drawer>
          </>
        )}
        {note && (
          <div className="toast" role="status">
            <Sprout size={15} />
            {note}
            <button aria-label="Dismiss notice" onClick={() => setNote('')}>
              <X size={13} />
            </button>
          </div>
        )}
      </section>
      {!photo && (
        <footer className="statusbar">
          <span className="local">
            <i className="status-dot" />
            Local world
          </span>
          <span className="footer-sep" />
          <span>{c ? 'Saved in this browser' : 'Visitor mode'}</span>
          <div className="controls-hint">
            {mode === 'World' ? (
              <>
                <Mouse size={13} />
                Drag to pan<span>·</span>Scroll to zoom<span>·</span>Shift + drag to orbit
              </>
            ) : (
              <>
                <Footprints size={14} />
                WASD to walk<span>·</span>Drag to look<span>·</span>E to interact
              </>
            )}
          </div>
          <button onClick={() => open('guide')}>
            <span className="key-icon">?</span>Controls
          </button>
        </footer>
      )}
    </main>
  )
}
