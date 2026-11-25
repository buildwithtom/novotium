import { blocksWalking } from './collisions'
import * as T from 'three'
import { makeHouse, makeFurniture, makeCitizen } from '../art/miniatures'
import { makeLandscape, setLandscapeTime } from '../art/landscape'
import {
  plots,
  plotBy,
  localPlot,
  insideHouse,
  canEnter,
  placementIssue,
  listingSpot,
  catalog,
  COATS,
  HAIR,
  SKINS,
  type Game,
  type Placement,
  type Plot,
} from '../domain/world'
import { batch, releaseBatch, environmentPaint } from './batch'
import { makeHorizon } from './horizon'
import { garden, saleBox } from './gardens'
import { sound, type Mode, type Settings } from './settings'
export interface Target {
  type: 'plot' | 'item' | 'square' | 'stall'
  id: string
}
export interface ViewState {
  x: number
  z: number
  angle: number
  clock: number
  context: string
  inside: string
  fps?: number
  draws?: number
  triangles?: number
}
export interface Editor {
  item?: string
  paint?: string
  rotation: number
}
export interface Hooks {
  hit: (t: Target) => void
  place: (at: Placement) => void
  hud: (v: ViewState) => void
  hint: (s: string) => void
}
export class Village {
  readonly scene = new T.Scene()
  private renderer: T.WebGLRenderer
  private ortho = new T.OrthographicCamera(-25, 25, 15, -15, 0.1, 180)
  private perspective = new T.PerspectiveCamera(61, 1, 0.04, 150)
  private camera: T.Camera = this.ortho
  private hemi = new T.HemisphereLight('#fff5dd', '#8d9471', 2)
  private sun = new T.DirectionalLight('#ffefd0', 2.15)
  private land: T.Group
  private grounds = new T.Group()
  private shells = new Map<string, { roof: T.Group; front: T.Group }>()
  private items = new T.Group()
  private avatar: T.Group
  private people: T.Group[] = []
  private sceneryKey = ''
  private personKey = ''
  private tick = 0
  private sampleAt = 0
  private fps = 0
  private frames = 0
  private elapsed = 0
  private last = 0
  private raf = 0
  private clock = 9.67
  private desiredZoom = 1
  private zoomValue = 1
  private theta = 0.58
  private yaw = Math.PI
  private pitch = -0.04
  private walkAngle = 0
  private pos = new T.Vector3(-3.4, 0.05, 2.1)
  private focus = new T.Vector3(0, 0, 0)
  private targetFocus = this.focus.clone()
  private drag: { x: number; y: number; sx: number; sy: number; button: number } | null = null
  private keys = new Set<string>()
  private ray = new T.Raycaster()
  private floor = new T.Plane(new T.Vector3(0, 1, 0), -0.055)
  private resize: ResizeObserver
  private buildGrid: T.GridHelper
  private ghost = new T.Group()
  private marker = new T.Mesh(
    new T.RingGeometry(0.38, 0.46, 32),
    new T.MeshBasicMaterial({ color: '#f7e5aa', side: T.DoubleSide }),
  )
  private smoke: T.Mesh[] = []
  private birds: T.Group[] = []
  private horizon = makeHorizon()
  private hovering: Placement | null = null
  private editor: Editor | null = null

  private savedCut = ''
  private selectedPlot = ''
  private labels: HTMLElement[] = []
  private tour = 0
  private near: Target = { type: 'square', id: '' }
  private wave = 0
  private sitting = false
  private actorPose: { root: T.Group; left?: T.Object3D; right?: T.Object3D; arm?: T.Object3D }[] = []
  mode: Mode = 'World'
  blocked = false

  settings: Settings
  game: Game
  constructor(
    readonly host: HTMLElement,
    g: Game,
    prefs: Settings,
    private hooks: Hooks,
  ) {
    this.game = g
    this.settings = prefs
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = T.PCFSoftShadowMap
    this.renderer.shadowMap.autoUpdate = false
    const canvas = this.renderer.domElement
    canvas.tabIndex = 0
    canvas.setAttribute('aria-label', 'Interactive three-dimensional neighbourhood of Willowmere')
    host.prepend(canvas)
    this.scene.add(this.hemi, this.sun, this.horizon)
    this.horizon.visible = false
    this.sun.position.set(-14, 33, 13)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    Object.assign(this.sun.shadow.camera, {
      left: -26,
      right: 26,
      top: 24,
      bottom: -24,
      near: 1,
      far: 79,
    })
    this.sun.shadow.normalBias = 0.018
    this.sun.shadow.bias = -0.00032
    const shadow = new T.Mesh(new T.PlaneGeometry(260, 260), new T.ShadowMaterial({ opacity: 0.115 }))
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -2.12
    shadow.receiveShadow = true
    this.scene.add(shadow)
    this.land = batch(makeLandscape())
    this.scene.add(this.land, this.grounds, this.items, this.ghost)
    this.buildGrid = new T.GridHelper(7, 14, '#f9f0be', '#e4ddb5')
    this.buildGrid.position.y = 0.085
    this.buildGrid.visible = false
    this.scene.add(this.buildGrid)
    this.marker.rotation.x = -Math.PI / 2
    this.marker.visible = false
    this.scene.add(this.marker)
    this.avatar = new T.Group()
    this.scene.add(this.avatar)
    this.people = plots
      .filter((p) => p.resident)
      .map((p, i) => {
        const a = makeCitizen(SKINS[i % 5], HAIR[i], COATS[i], i)
        a.position.set(p.x + 1.5, 0, p.z + 2.3)
        this.scene.add(a)
        return a
      })
    const puff = new T.IcosahedronGeometry(1, 1),
      puffMat = new T.MeshBasicMaterial({
        color: '#f6eede',
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
      })
    for (let i = 0; i < 8; i++) {
      const m = new T.Mesh(puff, puffMat)
      this.smoke.push(m)
      this.scene.add(m)
    }
    const birdMat = new T.MeshBasicMaterial({ color: '#716e56', side: T.DoubleSide })
    const wings = new T.BufferGeometry()
    wings.setAttribute(
      'position',
      new T.Float32BufferAttribute(
        [-0.37, 0.12, 0, -0.05, 0, 0.04, 0, 0, -0.1, 0, 0, -0.1, 0.06, 0, 0.04, 0.36, 0.13, 0],
        3,
      ),
    )
    for (let i = 0; i < 3; i++) {
      const b = new T.Group()
      b.add(new T.Mesh(wings, birdMat))
      this.scene.add(b)
      this.birds.push(b)
    }
    this.update(g)
    this.applySettings(prefs)
    for (const id of ['A1', 'B3', 'square']) {
      const el = document.createElement('button')
      el.className = 'land-label ' + (id === 'B3' ? 'vacant' : id === 'square' ? 'square-tag' : '')
      el.dataset.land = id
      el.onclick = () => {
        if (!this.blocked && !this.editor)
          this.hooks.hit({ type: id === 'square' ? 'square' : 'plot', id })
      }
      host.append(el)
      this.labels.push(el)
    }
    this.refreshLabels()
    this.resize = new ResizeObserver(() => this.size())
    this.resize.observe(host)
    this.size()
    canvas.addEventListener('pointerdown', this.down)
    canvas.addEventListener('pointermove', this.move)
    canvas.addEventListener('pointerup', this.up)
    canvas.addEventListener('pointercancel', this.cancel)
    canvas.addEventListener('wheel', this.scroll, { passive: false })
    canvas.addEventListener('contextmenu', this.menu)
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
    window.addEventListener('blur', this.clearKeys)
    document.addEventListener('mousemove', this.lockmove)
    this.raf = requestAnimationFrame(this.animate)
  }
  private refreshLabels() {
    this.labels.forEach((el) => {
      const id = el.dataset.land!
      el.textContent =
        id === 'square'
          ? 'Willowmere Square'
          : localPlot(this.game, plotBy(id)).resident
            ? localPlot(this.game, plotBy(id)).name
            : 'Available plot'
      el.classList.toggle('vacant', id !== 'square' && !localPlot(this.game, plotBy(id)).resident)
    })
  }
  update(g: Game) {
    this.game = g
    const c = g.citizen,
      key = [c?.plot, c?.house, c?.roof].join()
    if (key !== this.sceneryKey) {
      this.sceneryKey = key
      releaseBatch(this.grounds)
      this.grounds = new T.Group()
      this.scene.add(this.grounds)
      this.shells.clear()
      const fixed = new T.Group()
      for (const base of plots) {
        const p = localPlot(g, base)
        fixed.add(garden(p, !!p.resident))
        if (!p.resident || p.style < 0) continue
        const h = makeHouse(p.style, c?.plot === p.id && c.roof ? c.roof : undefined)
        h.position.set(p.x, 0, p.z - 0.85)
        const furnishings = h.getObjectByName('furnishings')
        if (furnishings && p.id === c?.plot) furnishings.visible = false
        h.updateMatrixWorld(true)
        const detach = (name: string) => {
          const source = h.getObjectByName(name)!
          const result = batch(source)
          source.matrixWorld.decompose(result.position, result.quaternion, result.scale)
          this.grounds.add(result)
          source.visible = false
          return result
        }
        const rb = detach('roof'),
          fb = detach('frontWall')
        this.shells.set(p.id, { roof: rb, front: fb })
        fixed.add(h)
      }
      this.grounds.add(batch(fixed))
    }
    releaseBatch(this.items)
    const goods = new T.Group()
    for (const i of g.items) {
      let spot: Placement | undefined
      if (i.where === 'placed') spot = i.place
      if (i.where === 'listed') {
        const s = listingSpot(g, i)
        if (s) spot = { ...s, rotation: 0.24 }
      }
      if (!spot) continue
      const m = makeFurniture(i.kind)
      m.position.set(spot.x, 0.06, spot.z)
      m.rotation.y = spot.rotation
      goods.add(m)
      if (i.where === 'listed' && i.price === 0) {
        const box = saleBox()
        box.position.copy(m.position)
        m.position.y += 0.18
        goods.add(box)
      }
    }
    const tileGeom = new T.BoxGeometry(0.99, 0.024, 0.99)
    for (const [k, color] of Object.entries(g.ground)) {
      const [x, z] = k.split(',').map(Number)
      const tile = new T.Mesh(
        tileGeom,
        new T.MeshStandardMaterial({
          color: color === 'grass' ? '#9bad73' : color === 'sand' ? '#dac9a3' : '#aea99a',
        }),
      )
      tile.position.set(x, 0.045, z)
      goods.add(tile)
    }
    this.items = batch(goods)
    this.scene.add(this.items)
    const person = [c?.skin, c?.hair, c?.coat, c?.style].join()
    if (person !== this.personKey) {
      this.personKey = person
      this.avatar.removeFromParent()
      this.avatar = makeCitizen(
        c?.skin || SKINS[1],
        c?.hair || HAIR[0],
        c?.coat || COATS[0],
        c?.style ?? 2,
      )
      this.scene.add(this.avatar)
      this.actorPose = [this.avatar, ...this.people].map((root) => ({
        root,
        left: root.getObjectByName('leftLeg'),
        right: root.getObjectByName('rightLeg'),
        arm: root.getObjectByName('rightArm'),
      }))
    }
    this.refreshLabels()
    this.savedCut = '?'
    this.renderer.shadowMap.needsUpdate = true
  }
  private size() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h)
    this.perspective.aspect = w / h
    this.perspective.updateProjectionMatrix()
    this.lens()
  }
  private lens() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight,
      aspect = w / h
    const span = Math.max(30.2, 45.7 / aspect) / this.zoomValue
    const offset = aspect > 1.25 && !this.editor?.item ? -0.035 : 0
    this.ortho.left = (-0.5 + offset) * span * aspect
    this.ortho.right = (0.5 + offset) * span * aspect
    const top = aspect < 0.8 ? 0.456 : 0.524
    this.ortho.top = span * top
    this.ortho.bottom = span * (top - 1)
    this.ortho.updateProjectionMatrix()
  }
  applySettings(s: Settings) {
    this.settings = s
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, s.quality === 'Low' ? 1 : s.quality === 'Medium' ? 1.35 : 1.8),
    )
    this.sun.castShadow = s.quality !== 'Low'
    this.renderer.shadowMap.needsUpdate = true
    this.size()
  }
  setMode(m: Mode) {
    this.clearKeys()
    this.drag = null
    if (document.pointerLockElement) document.exitPointerLock()
    if (m === this.mode) return
    this.sitting = false
    if (this.mode === 'World' && m !== 'World') this.yaw = 0.35
    this.mode = m
    this.camera = m === 'World' ? this.ortho : this.perspective
    this.savedCut = '?'
    this.avatar.visible = m !== 'Street'
    if (m === 'World') {
      this.targetFocus.set(0, 0, 0)
      this.desiredZoom = 1
    } else this.perspective.position.set(this.pos.x, 2.4, this.pos.z + 3.4)
    this.renderer.shadowMap.needsUpdate = true
  }
  zoom(n: number) {
    if (this.mode === 'World')
      this.desiredZoom = T.MathUtils.clamp(this.desiredZoom * Math.pow(1.19, n), 0.72, 4.7)
    else {
      this.perspective.fov = T.MathUtils.clamp(this.perspective.fov - n * 4, 42, 82)
      this.perspective.updateProjectionMatrix()
    }
  }
  rotate() {
    if (this.mode === 'World') this.theta += Math.PI / 4
    else this.yaw += Math.PI / 4
  }
  resetView() {
    this.theta = 0.58
    this.desiredZoom = 1
    this.targetFocus.set(0, 0, 0)
    this.selectedPlot = ''
  }
  focusPlot(p: Plot, walk = false, inside = false) {
    this.selectedPlot = inside ? p.id : ''
    if (walk || this.mode !== 'World') {
      if (this.mode === 'World') this.setMode('Character')
      this.pos.set(p.x, 0.05, inside ? p.z + 0.35 : p.z + 3.9)
      this.yaw = 0
      this.pitch = inside ? -0.13 : -0.02
      this.walkAngle = Math.PI
    } else {
      this.targetFocus.set(p.x, 0.25, p.z)
      this.desiredZoom = 2.55
    }
    this.sitting = false
  }
  inside(p: Plot) {
    if (!canEnter(this.game, p) || !p.resident || p.style < 0) return
    this.focusPlot(p, true, true)
    this.hooks.hint('Inside ' + p.name + ' · walk through the door to leave.')
  }
  discover() {
    const p = plots.filter((p) => p.resident)[this.tour++ % 4]
    this.focusPlot(p, true)
    return p
  }
  selectRoof(id: string) {
    this.selectedPlot = this.selectedPlot === id ? '' : id
    this.savedCut = '?'
  }
  setBlocked(v: boolean) {
    this.blocked = v
    this.clearKeys()
    if (v && document.pointerLockElement) document.exitPointerLock()
  }
  edit(value: Editor | null) {
    const prior = this.editor
    this.editor = value
    if (value && this.game.citizen) {
      const p = plotBy(this.game.citizen.plot)
      if (!prior) {
        this.setMode('World')
        this.targetFocus.set(p.x, 0, p.z)
        this.desiredZoom = 2.9
      }
      this.renderer.domElement.focus({ preventScroll: true })
      this.selectedPlot = p.id
      this.buildGrid.position.set(p.x, 0.095, p.z)
      this.buildGrid.visible = true
    } else {
      this.buildGrid.visible = false
      this.selectedPlot = ''
      this.marker.visible = false
    }
    const previous = this.hovering
    this.updateGhost()
    this.savedCut = '?'
    if (value && this.game.citizen) {
      const p = plotBy(this.game.citizen.plot),
        i = this.game.items.find((i) => i.id === value.item),
        spot =
          prior && previous
            ? previous
            : i?.place || {
                x: p.x + (i?.kind === 'tree' ? 2 : -1),
                z: p.z + (i?.kind === 'tree' ? 2.5 : -1),
              }
      this.aim(spot.x, spot.z)
    }
  }
  private updateGhost() {
    releaseBatch(this.ghost)
    this.ghost = new T.Group()
    const id = this.editor?.item
    if (id) {
      const i = this.game.items.find((i) => i.id === id)
      if (i) {
        this.ghost = batch(makeFurniture(i.kind))
        this.ghost.visible = false
      }
    }
    this.scene.add(this.ghost)
    this.hovering = null
  }
  private pointer(e: PointerEvent) {
    const r = this.host.getBoundingClientRect()
    this.ray.setFromCamera(
      new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2),
      this.camera as T.PerspectiveCamera,
    )
    return this.ray.ray.intersectPlane(this.floor, new T.Vector3())
  }
  private pick(v: T.Vector3): Target | null {
    if (Math.abs(v.x - 5.85) < 1.5 && Math.abs(v.z + 2.05) < 1.3) return { type: 'stall', id: '' }
    for (const i of this.game.items) {
      const s = i.where === 'listed' ? listingSpot(this.game, i) : i.place
      if (s && Math.hypot(s.x - v.x, s.z - v.z) < 0.91) return { type: 'item', id: i.id }
    }
    const hits: { id: string; distance: number }[] = []
    for (const b of plots) {
      const p = localPlot(this.game, b)
      if (!p.resident || p.style < 0 || this.selectedPlot === p.id) continue
      const min = new T.Vector3(p.x - 2.2, 0.1, p.z - 2.75),
        max = new T.Vector3(p.x + 2.2, 3.25, p.z + 1.05)
      const point = this.ray.ray.intersectBox(new T.Box3(min, max), new T.Vector3())
      if (point) hits.push({ id: p.id, distance: point.distanceTo(this.ray.ray.origin) })
    }
    if (hits.length) return { type: 'plot', id: hits.sort((a, b) => a.distance - b.distance)[0].id }
    const p = plots.find((p) => Math.abs(v.x - p.x) < 3.55 && Math.abs(v.z - p.z) < 3.55)
    if (p) return { type: 'plot', id: p.id }
    if (Math.hypot(v.x, v.z) < 3.5) return { type: 'square', id: '' }
    return null
  }
  private down = (e: PointerEvent) => {
    if (this.blocked) return
    this.renderer.domElement.focus({ preventScroll: true })
    this.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, button: e.button }
    this.renderer.domElement.setPointerCapture(e.pointerId)
  }
  private move = (e: PointerEvent) => {
    if (this.blocked) return
    if (this.drag) {
      const dx = e.clientX - this.drag.x,
        dy = e.clientY - this.drag.y
      this.drag.x = e.clientX
      this.drag.y = e.clientY
      if (this.mode === 'World') {
        if (e.shiftKey || this.drag.button === 2) this.theta -= dx * 0.007
        else if (!this.editor) {
          const k = 32 / this.host.clientHeight / this.zoomValue
          this.targetFocus.x -= (dx * Math.cos(this.theta) + dy * Math.sin(this.theta) * 1.6) * k
          this.targetFocus.z -= (dy * Math.cos(this.theta) * 1.6 - dx * Math.sin(this.theta)) * k
          this.targetFocus.clampScalar(-16, 16)
        }
      } else if (!document.pointerLockElement) this.look(dx, dy)
    }
    if (this.editor && this.mode === 'World') {
      const v = this.pointer(e)
      if (v) this.aim(v.x, v.z)
    }
  }
  private aim(x: number, z: number) {
    const edit = this.editor
    if (!edit || !this.game.citizen) return
    const step = edit.paint ? 1 : 0.5,
      at = { x: Math.round(x / step) * step, z: Math.round(z / step) * step, rotation: edit.rotation }
    this.hovering = at
    this.ghost.position.set(at.x, 0.11, at.z)
    this.ghost.rotation.y = at.rotation
    this.ghost.visible = !!edit.item
    const item = this.game.items.find((i) => i.id === edit.item),
      p = plotBy(this.game.citizen.plot),
      invalid = item
        ? placementIssue(this.game, item, at)
        : Math.abs(at.x - p.x) > 3 || Math.abs(at.z - p.z) > 3
    this.marker.visible = true
    this.marker.position.set(at.x, 0.15, at.z)
    this.marker.material.color.set(invalid ? '#cf553b' : '#d9f1a0')
  }
  private up = (e: PointerEvent) => {
    const d = this.drag
    this.drag = null
    if (!d || this.blocked || d.button !== 0 || Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6)
      return
    if (this.mode === 'World') {
      const pos = this.pointer(e)
      if (!pos) return
      if (this.editor) {
        this.move(e)
        if (this.hovering) this.hooks.place(this.hovering)
      } else {
        const target = this.pick(pos)
        if (target) this.hooks.hit(target)
      }
    } else if (this.mode === 'Street' && e.pointerType === 'mouse') {
      try {
        const result = this.renderer.domElement.requestPointerLock()
        if (result) result.catch(() => {})
      } catch {
        /* Drag-to-look remains available. */
      }
    }
  }
  private look(dx: number, dy: number) {
    this.yaw -= dx * 0.003 * this.settings.sensitivity
    this.pitch = T.MathUtils.clamp(this.pitch - dy * 0.0026 * this.settings.sensitivity, -1, 1.05)
  }
  private lockmove = (e: MouseEvent) => {
    if (document.pointerLockElement === this.renderer.domElement && !this.blocked)
      this.look(e.movementX, e.movementY)
  }
  private scroll = (e: WheelEvent) => {
    e.preventDefault()
    if (!this.blocked) this.zoom(-Math.sign(e.deltaY) * 0.5)
  }
  private menu = (e: Event) => e.preventDefault()
  private cancel = () => {
    this.drag = null
  }
  private clearKeys = () => {
    this.keys.clear()
  }
  private keydown = (e: KeyboardEvent) => {
    if (
      this.blocked ||
      e.ctrlKey ||
      e.metaKey ||
      (e.target instanceof HTMLElement &&
        e.target.closest('input,textarea,select,[contenteditable="true"]'))
    )
      return
    const k = e.key.toLowerCase()
    if (this.editor && this.hovering) {
      const at = this.hovering,
        step = this.editor.paint ? 1 : 0.5
      const moves: Record<string, [number, number]> = {
        arrowleft: [-step, 0],
        arrowright: [step, 0],
        arrowup: [0, -step],
        arrowdown: [0, step],
      }
      if (moves[k]) {
        e.preventDefault()
        this.aim(at.x + moves[k][0], at.z + moves[k][1])
        return
      }
      if (k === 'enter' && !(e.target instanceof HTMLElement && e.target.closest('button'))) {
        e.preventDefault()
        this.hooks.place(at)
        return
      }
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      e.preventDefault()
      this.keys.add(k)
    }
    if (!e.repeat && k === 'e' && this.mode !== 'World') this.interact()
  }
  private keyup = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase())
  }
  moveTouch(k: string, down: boolean) {
    if (down) this.keys.add(k)
    else this.keys.delete(k)
  }
  interact() {
    if (!this.blocked) this.hooks.hit(this.near)
  }
  pose(kind: 'sit' | 'wave') {
    if (kind === 'sit') {
      this.sitting = !this.sitting
      this.hooks.hint(this.sitting ? 'Taking a seat. Move to stand.' : 'Back on your feet.')
    } else {
      this.wave = 2
      this.hooks.hint('You wave hello.')
    }
  }
  private context() {
    let nearest = 2.55
    this.near = { type: 'square', id: '' }
    let msg = 'Explore Willowmere'
    for (const p of plots) {
      const spot = localPlot(this.game, p)
      if (Math.abs(this.pos.x - p.x) < 3.65 && Math.abs(this.pos.z - p.z) < 3.65) {
        this.near = { type: 'plot', id: p.id }
        msg = spot.name
        break
      }
    }
    for (const i of this.game.items) {
      const s = i.where === 'listed' ? listingSpot(this.game, i) : i.place
      if (!s) continue
      if (
        plots.some((b) => {
          const p = localPlot(this.game, b)
          return (
            p.resident &&
            p.style >= 0 &&
            insideHouse(p, this.pos.x, this.pos.z) !== insideHouse(p, s.x, s.z)
          )
        })
      )
        continue
      const d = Math.hypot(s.x - this.pos.x, s.z - this.pos.z)
      if (d < nearest) {
        nearest = d
        this.near = { type: 'item', id: i.id }
        msg = catalog[i.kind].name
      }
    }
    if (Math.hypot(this.pos.x - 5.85, this.pos.z + 2.05) < 2.3) {
      this.near = { type: 'stall', id: '' }
      msg = 'Willowmere Market'
    }
    return msg
  }
  private animate = (now: number) => {
    this.raf = requestAnimationFrame(this.animate)
    const dt = Math.min((now - (this.last || now)) / 1000, 0.06)
    this.last = now
    this.elapsed += dt
    const t = this.elapsed,
      s = this.settings
    const step = 1 - Math.exp(-dt * (s.reduced ? 65 : 9)),
      left =
        Number(this.keys.has('d') || this.keys.has('arrowright')) -
        Number(this.keys.has('a') || this.keys.has('arrowleft')),
      fwd =
        Number(this.keys.has('w') || this.keys.has('arrowup')) -
        Number(this.keys.has('s') || this.keys.has('arrowdown'))
    this.frames++
    if (!this.sampleAt) this.sampleAt = now
    if (now - this.sampleAt >= 1000) {
      this.fps = Math.round((this.frames * 1000) / (now - this.sampleAt))
      this.frames = 0
      this.sampleAt = now
    }
    const walking = !!(left || fwd) && !this.blocked && this.mode !== 'World'
    if (this.mode === 'World') {
      if (!this.blocked && !this.editor && (left || fwd)) {
        this.targetFocus.x += (left * Math.cos(this.theta) - fwd * Math.sin(this.theta)) * dt * 7
        this.targetFocus.z += (-left * Math.sin(this.theta) - fwd * Math.cos(this.theta)) * dt * 7
      }
      this.zoomValue += (this.desiredZoom - this.zoomValue) * step
      this.lens()
      this.focus.lerp(this.targetFocus, step)
      const th = this.theta + (s.reduced || this.editor ? 0 : Math.sin(t * 0.038) * 0.012)
      this.ortho.position.set(
        this.focus.x + Math.sin(th) * 46,
        this.focus.y + 33,
        this.focus.z + Math.cos(th) * 46,
      )
      this.ortho.lookAt(this.focus)
    } else {
      if (walking) {
        if (this.sitting) {
          this.pos.z += 0.8
          this.pos.y = 0.05
        }
        this.sitting = false
        const norm = Math.hypot(left, fwd),
          dx = ((left * Math.cos(this.yaw) - fwd * Math.sin(this.yaw)) * dt * 3.1) / norm,
          dz = ((-left * Math.sin(this.yaw) - fwd * Math.cos(this.yaw)) * dt * 3.1) / norm
        if (!blocksWalking(this.game, this.pos.x + dx, this.pos.z)) this.pos.x += dx
        if (!blocksWalking(this.game, this.pos.x, this.pos.z + dz)) this.pos.z += dz
        this.pos.y = 0.05
        const wanted = Math.atan2(dx, dz)
        this.walkAngle +=
          Math.atan2(Math.sin(wanted - this.walkAngle), Math.cos(wanted - this.walkAngle)) * step
      }
      const eye = this.pos.clone()
      eye.y += this.sitting ? 0.94 : 1.38
      const dir = new T.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch),
      )
      if (this.mode === 'Street') {
        this.perspective.position.copy(eye)
        this.perspective.lookAt(eye.clone().add(dir))
      } else {
        const under = plots.some((p) => insideHouse(p, this.pos.x, this.pos.z))
        const desired = eye.clone().addScaledVector(dir, under ? -1.25 : -4)
        desired.y += under ? 0.52 : 1.74
        this.perspective.position.lerp(desired, step)
        this.perspective.lookAt(eye.clone().addScaledVector(dir, 0.3))
      }
    }
    this.avatar.position.copy(this.pos)
    this.avatar.position.y = this.sitting ? 0.13 : 0.05
    this.avatar.rotation.y = this.walkAngle
    this.avatar.visible = this.mode !== 'Street'
    this.wave = Math.max(0, this.wave - dt)
    this.people.forEach((p, i) => {
      const base = plots.filter((q) => q.resident)[i],
        phase = t * 0.19 + i * 2.4
      p.position.x = base.x + Math.sin(phase) * 1.5
      p.position.z = base.z + 2.55
      p.visible =
        this.mode !== 'Street' || Math.hypot(p.position.x - this.pos.x, p.position.z - this.pos.z) > 0.72
      p.rotation.y = Math.cos(phase) > 0 ? Math.PI / 2 : -Math.PI / 2
    })
    this.actorPose.forEach((a, i) => {
      const moving = i > 0 ? Math.abs(Math.cos(t * 0.19 + (i - 1) * 2.4)) > 0.3 : walking
      const stride = !s.reduced && moving ? Math.sin(t * (i ? 3.8 : 8) + i) * 0.32 : 0
      if (a.left) a.left.rotation.x = i === 0 && this.sitting ? -1.15 : stride
      if (a.right) a.right.rotation.x = i === 0 && this.sitting ? -1.15 : -stride
      if (a.arm) a.arm.rotation.z = i === 0 && this.wave ? 2.4 + Math.sin(t * 12) * 0.21 : 0.1
    })
    this.smoke.forEach((m, i) => {
      const n = i % 4,
        p = i < 4 ? plots[0] : plots[2],
        u = (t * 0.16 + n / 4) % 1
      m.position.set(p.x + 1.1 + u * 0.6, 3.9 + u * 1.7, p.z - 1.4)
      m.scale.setScalar(0.1 + u * 0.17)
      m.visible = !s.reduced && this.mode === 'World'
    })
    this.birds.forEach((b, i) => {
      b.position.set(
        -9 + i * 1.15 + Math.sin(t * 0.09) * 3.2,
        5 + i * 0.16 + Math.sin(t * 0.22) * 0.22,
        -9 - i * 0.36,
      )
      b.rotation.z = Math.sin(t * 2 + i) * 0.12
      b.visible = !s.reduced
    })
    const house = plots.find((p) => insideHouse(p, this.pos.x, this.pos.z)),
      cut = this.mode === 'World' ? this.selectedPlot : this.mode === 'Character' ? house?.id || '' : ''
    if (cut !== this.savedCut || this.tick === 0) {
      this.shells.forEach((v, id) => {
        v.roof.visible = id !== cut
        v.front.visible = id !== cut
      })
      this.savedCut = cut
      this.renderer.shadowMap.needsUpdate = true
    }
    this.clock =
      s.time === 'Cycle'
        ? (9.67 + t / 36) % 24
        : s.time === 'Morning'
          ? 9.67
          : s.time === 'Afternoon'
            ? 14.5
            : s.time === 'Evening'
              ? 17.85
              : 21
    const daylight = T.MathUtils.clamp(
      (Math.cos(((this.clock - 12) * Math.PI) / 12) + 0.37) * 1.5,
      0.06,
      1,
    )
    this.sun.intensity += (daylight * 2.05 - this.sun.intensity) * step
    this.hemi.intensity += (0.53 + daylight * 1.39 - this.hemi.intensity) * step
    this.sun.color.set(this.clock > 16 && this.clock < 20 ? '#ffb789' : '#fff0d1')
    this.hemi.color.set(daylight < 0.3 ? '#8a9dcc' : '#fffae9')
    this.horizon.visible = this.mode !== 'World'
    this.scene.background =
      this.mode === 'World' ? null : new T.Color(daylight < 0.3 ? '#526677' : '#d6e1d5')
    this.scene.fog =
      this.mode === 'World' ? null : new T.FogExp2(daylight < 0.3 ? '#526677' : '#d6e1d5', 0.019)
    environmentPaint(s.reduced ? 0 : t, daylight)
    if (!s.reduced) setLandscapeTime(t)
    this.renderer.render(this.scene, this.camera)
    if (++this.tick % 5 === 0 || this.tick === 1) {
      this.labels.forEach((el) => {
        const id = el.dataset.land!,
          p = id === 'square' ? { x: 0, z: 0 } : plotBy(id)
        const vv = new T.Vector3(p.x, id === 'square' ? 1.95 : id === 'B3' ? 1.68 : 4.45, p.z).project(
          this.camera,
        )
        el.style.left = (vv.x + 1) * 50 + '%'
        el.style.top = (1 - vv.y) * 50 + '%'
        el.hidden =
          !s.labels ||
          this.mode !== 'World' ||
          !!this.editor ||
          this.zoomValue > 1.75 ||
          this.blocked ||
          id === 'square'
      })
    }
    if (this.tick % 10 === 0) {
      this.hooks.hud({
        x: this.pos.x,
        z: this.pos.z,
        angle: (-this.theta * 180) / Math.PI,
        clock: this.clock,
        context: this.context(),
        inside:
          house && localPlot(this.game, house).resident && localPlot(this.game, house).style >= 0
            ? house.id
            : '',
        fps: this.fps,
        draws: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
      })
    }
    if (this.tick % 630 === 0 && !s.reduced) sound(s, 'bird')
  }
  sitOnBench() {
    this.pos.set(-1.98, 0.45, -1.11)
    this.walkAngle = 0.91
    this.yaw = 0.91 + Math.PI
    this.sitting = true
  }
  sitAt(at: Placement) {
    this.pos.set(at.x, 0.46, at.z)
    this.walkAngle = at.rotation
    this.yaw = at.rotation + Math.PI
    this.sitting = true
  }
  capture() {
    const source = this.renderer.domElement,
      canvas = document.createElement('canvas')
    canvas.width = source.width
    canvas.height = source.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return source.toDataURL('image/png')
    ctx.fillStyle = this.clock > 19 || this.clock < 6 ? '#b0bcb1' : '#e4eadd'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, 0, 0)
    return canvas.toDataURL('image/png')
  }
  dispose() {
    cancelAnimationFrame(this.raf)
    this.resize.disconnect()
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
    window.removeEventListener('blur', this.clearKeys)
    document.removeEventListener('mousemove', this.lockmove)
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.labels.forEach((el) => el.remove())
  }
}
