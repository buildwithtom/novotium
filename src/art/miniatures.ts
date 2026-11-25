import * as THREE from 'three'
import { box, geometry, group, oval, part, rod, seeded, taper, tileGeometry, tone } from './modelTools'
import { dressInterior } from './modelInterior'
import { flowerPot } from './modelGarden'
import { makeFurniture } from './modelContents'
export { makeTree } from './modelGarden'
export { makeCitizen, makeFurniture } from './modelContents'

const schemes = [
  {
    wall: '#e7d9b8',
    roof: '#ba7050',
    shutter: '#758878',
    timber: '#896549',
    trim: '#eadcbc',
    chimney: '#a87861',
  },
  {
    wall: '#b9c5b3',
    roof: '#657f82',
    shutter: '#637f79',
    timber: '#786a55',
    trim: '#eee0bf',
    chimney: '#ad8970',
  },
  {
    wall: '#efdbb6',
    roof: '#ad664b',
    shutter: '#72929a',
    timber: '#856548',
    trim: '#ecdbb5',
    chimney: '#a66d55',
  },
  {
    wall: '#e2bd9e',
    roof: '#708777',
    shutter: '#637b78',
    timber: '#815f4a',
    trim: '#e8d5af',
    chimney: '#ad826a',
  },
  {
    wall: '#e1ce94',
    roof: '#79838a',
    shutter: '#a76c53',
    timber: '#876c56',
    trim: '#efdcaf',
    chimney: '#ac806a',
  },
  {
    wall: '#d5dbc5',
    roof: '#ab7554',
    shutter: '#667f8a',
    timber: '#86725a',
    trim: '#eee2be',
    chimney: '#aa7960',
  },
]
type Scheme = (typeof schemes)[number]

function gableShape() {
  return geometry('cottage-gable', () => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.5, 0)
    shape.lineTo(0.5, 0)
    shape.lineTo(0, 1)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 1 })
  })
}
function windowBox(parent: THREE.Object3D, width: number, flowers: string) {
  box(parent, '#a77850', 0, -0.44, 0.135, width + 0.12, 0.18, 0.22)
  box(parent, '#bc936c', 0, -0.35, 0.145, width + 0.18, 0.055, 0.25)
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * width * 0.19,
      y = -0.265 + (i % 2) * 0.035
    oval(parent, i % 2 ? '#70865a' : '#809168', x, y, 0.16, 0.19, 0.16, 0.15)
    if (i % 2 === 0) oval(parent, flowers, x + 0.014, y + 0.071, 0.19, 0.095, 0.085, 0.073)
  }
}

/** Window geometry faces local +Z. The same frame works on all four walls. */
function windowFrame(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  yaw: number,
  width: number,
  height: number,
  s: Scheme,
  shutters: boolean,
  flowers: boolean,
) {
  const g = group(parent, x, y, z)
  g.rotation.y = yaw
  box(g, s.timber, 0, 0, 0.008, width + 0.16, height + 0.15, 0.089)
  box(g, '#759599', 0, 0, 0.06, width, height, 0.055)
  box(g, '#a4b6aa', -width * 0.255, height * 0.235, 0.094, width * 0.4, height * 0.39, 0.013)
  box(g, '#a3aaa0', width * 0.245, -height * 0.23, 0.094, width * 0.4, height * 0.39, 0.013)
  box(g, s.trim, 0, 0, 0.101, 0.05, height + 0.02, 0.052)
  box(g, s.trim, 0, 0, 0.102, width + 0.03, 0.047, 0.054)
  box(g, s.trim, 0, height / 2 + 0.03, 0.072, width + 0.17, 0.074, 0.134)
  box(g, s.trim, 0, -height / 2 - 0.04, 0.095, width + 0.24, 0.093, 0.18)
  if (shutters)
    for (const sign of [-1, 1]) {
      const sx = sign * (width / 2 + 0.188)
      box(g, s.shutter, sx, 0, 0.025, 0.24, height + 0.025, 0.068)
      for (const yy of [-0.26, -0.12, 0.02, 0.16, 0.3]) {
        if (Math.abs(yy) < height * 0.42)
          box(g, tone(s.shutter, 0.035), sx, yy, 0.065, 0.21, 0.035, 0.038)
      }
    }
  if (flowers) windowBox(g, width, '#c99181')
}

function tiledRoof(
  parent: THREE.Object3D,
  halfWidth: number,
  depth: number,
  rise: number,
  eave: number,
  roofColor: string,
  trim: string,
  timber: string,
  seed: number,
) {
  const width = halfWidth + 0.26,
    slope = Math.atan2(rise, halfWidth),
    length = width / Math.cos(slope)
  const ridge = eave + rise,
    outerDepth = depth + 0.48,
    random = seeded(seed)
  const palette = [-0.028, -0.012, 0, 0.014, 0.028].map((n) => tone(roofColor, n))
  for (const dir of [-1, 1]) {
    const side = group(parent, 0, ridge, 0)
    side.rotation.y = dir === -1 ? Math.PI : 0
    const flat = group(side)
    flat.rotation.z = -slope
    box(flat, tone(roofColor, -0.05), length / 2, 0, 0, length, 0.13, outerDepth)
    // Individual overlapping courses are staggered like hand-laid slate.
    const rows = 5,
      columns = 8,
      step = length / rows,
      cw = outerDepth / columns
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 1 ? cw / 2 : 0
      for (let c = -1; c < columns; c++) {
        const left = Math.max(-outerDepth / 2, -outerDepth / 2 + c * cw + offset)
        const right = Math.min(outerDepth / 2, -outerDepth / 2 + (c + 1) * cw + offset)
        if (right - left < 0.09) continue
        const tile = part(
          flat,
          tileGeometry(),
          palette[Math.floor(random() * palette.length)],
          (r + 0.52) * step,
          0.084 + (rows - r) * 0.01,
          (left + right) / 2,
          step * 1.07,
          0.076,
          right - left - 0.015,
        )
        tile.rotation.z = -0.047
      }
    }
    // Exposed bargeboards and rafter tails stand out against the clay courses.
    for (const z of [-outerDepth / 2, outerDepth / 2]) {
      box(flat, timber, length / 2, -0.073, z, length + 0.035, 0.155, 0.096)
      box(flat, trim, length / 2, -0.095, z + Math.sign(z) * 0.052, length + 0.07, 0.085, 0.046)
    }
    box(flat, timber, length - 0.005, -0.075, 0, 0.13, 0.19, outerDepth + 0.13)
    for (let i = 0; i < 7; i++)
      box(flat, timber, length - 0.2, -0.16, ((i - 3) * outerDepth) / 7, 0.37, 0.12, 0.09)
  }
  for (let i = 0; i < 9; i++) {
    const cap = taper(
      parent,
      palette[2 + (i % 3)],
      0,
      ridge + 0.138,
      -outerDepth / 2 + ((i + 0.5) * outerDepth) / 9,
      0.13,
      0.112,
      outerDepth / 9 + 0.037,
      8,
    )
    cap.rotation.x = Math.PI / 2
  }
}

function dormer(parent: THREE.Object3D, s: Scheme, x: number, z: number, y: number, yaw: number) {
  const g = group(parent, x, y, z)
  g.rotation.y = yaw
  box(g, s.wall, 0, 0.22, 0, 0.76, 0.57, 0.65)
  part(g, gableShape(), s.wall, 0, 0.49, 0.29, 0.77, 0.45, 0.055)
  windowFrame(g, 0, 0.23, 0.33, 0, 0.36, 0.36, s, false, false)
  for (const sign of [-1, 1]) {
    const m = box(g, tone(s.roof, -0.018), sign * 0.23, 0.7, 0.01, 0.66, 0.105, 0.86)
    m.rotation.z = -sign * 0.78
    const edge = box(g, s.trim, sign * 0.23, 0.68, 0.46, 0.67, 0.075, 0.069)
    edge.rotation.z = -sign * 0.78
  }
}
function chimney(parent: THREE.Group, s: Scheme, x: number, z: number, top: number, seed: number) {
  const g = group(parent, x, top, z)
  const height = 1.32
  box(g, s.chimney, 0, -height / 2, 0, 0.48, height, 0.51)
  for (let row = 0; row < 5; row++) {
    const shift = (row % 2) * 0.12
    box(g, tone(s.chimney, 0.075), -0.1 + shift, -0.17 - row * 0.225, 0.26, 0.2, 0.09, 0.032)
    box(g, tone(s.chimney, -0.04), 0.243, -0.25 - row * 0.225, 0.08 - shift, 0.031, 0.093, 0.22)
  }
  box(g, '#8c6d57', 0, -0.02, 0, 0.6, 0.15, 0.63)
  box(g, '#bc9c7c', 0, 0.085, 0, 0.66, 0.105, 0.695)
  if (seed % 2) {
    for (const xx of [-0.14, 0.14]) {
      taper(g, '#ad765a', xx, 0.24, 0, 0.111, 0.136, 0.22, 10)
      taper(g, '#bd8870', xx, 0.37, 0, 0.15, 0.15, 0.07, 10)
      taper(g, '#594a40', xx, 0.411, 0, 0.103, 0.103, 0.015, 10)
    }
  } else box(g, '#64554a', 0, 0.147, 0, 0.36, 0.022, 0.385)
}

function frontDetails(front: THREE.Group, s: Scheme, style: number, eave: number) {
  for (const x of [-1.12, 1.12])
    windowFrame(front, x, 1.33, 1.91, 0, 0.61, 0.7, s, style % 3 !== 1, true)
  for (const x of [-0.625, 0.625]) box(front, s.timber, x, 1.04, 1.91, 0.115, 2.05, 0.18)
  box(front, s.timber, 0, 2.025, 1.925, 1.35, 0.14, 0.19)
  // The door is fixed open along the inner jamb, leaving a traversable opening.
  const door = group(front, -0.569, 0.1, 1.86, 'openDoor')
  door.rotation.y = Math.PI * 0.51
  box(door, s.shutter, 0.53, 0.915, 0, 1.06, 1.83, 0.082)
  for (let i = 0; i < 4; i++)
    box(door, tone(s.shutter, 0.03), 0.15 + i * 0.25, 0.91, 0.045, 0.042, 1.6, 0.018)
  oval(door, '#c4a363', 0.94, 0.9, -0.076, 0.078, 0.08, 0.07)
  // A slim weatherboard canopy shelters the entry.
  if (style % 3 === 0 || style % 3 === 2) {
    const hood = box(front, s.roof, 0, 2.15, 2.13, 1.52, 0.115, 0.73)
    hood.rotation.x = 0.27
    for (const x of [-0.6, 0.6]) rod(front, s.timber, [x, 1.8, 1.95], [x, 2.09, 2.39], 0.045)
  }
  const lamp = group(front, 0.75, 1.79, 1.99)
  box(lamp, s.timber, 0, 0.04, 0, 0.06, 0.16, 0.23)
  box(lamp, '#e3bc7d', 0, -0.035, 0.11, 0.12, 0.155, 0.12)
  taper(lamp, '#526057', 0, 0.066, 0.11, 0.114, 0.047, 0.057, 4).rotation.y = Math.PI / 4
  if (style % 2 === 0) box(front, s.timber, 0, eave - 0.09, 1.93, 4.4, 0.11, 0.115)
}
function interiors(house: THREE.Group, style: number) {
  const furniture = group(house, 0, 0.105, 0, 'furnishings')
  const add = (kind: string, x: number, z: number, yaw = 0) => {
    const obj = makeFurniture(kind)
    obj.position.set(x, 0, z)
    obj.rotation.y = yaw
    furniture.add(obj)
  }
  add('rug', 0.1, -0.23, Math.PI / 2)
  if (style % 3 === 1) {
    add('bookshelf', -1.37, -1.5)
    add('bookshelf', 0.12, -1.5)
    add('chair', 1.22, 0.13, -Math.PI / 2)
    add('lamp', 1.6, -1.21)
  } else {
    add('bed', -1.45, -0.86)
    add('table', 1.16, -0.96)
    add('chair', 1.27, 0.12, Math.PI)
    const plant = flowerPot(furniture, 1.15, 0.83, -0.96, 0.48)
    plant.rotation.y = 0.45
  }
}
export function makeHouse(style: number, roofColor?: string) {
  const house = new THREE.Group(),
    k = ((Math.floor(style) % schemes.length) + schemes.length) % schemes.length
  const s = { ...schemes[k] }
  if (roofColor) s.roof = roofColor
  const front = group(house, 0, 0, 0, 'frontWall'),
    roof = group(house, 0, 0, 0, 'roof')
  const eave = [2.32, 2.41, 2.3, 2.32, 2.48, 2.41][k]
  const rise = [1.49, 1.32, 1.74, 1.46, 1.46, 1.66][k]
  const sideways = k % 3 !== 0
  const stone = ['#a9a08b', '#a5967e', '#b3a38c'][k % 3]
  // A continuous low floor and three solid walls leave the front entrance open.
  box(house, stone, 0, 0.053, 0, 4.45, 0.106, 3.85)
  for (let i = 0; i < 11; i++)
    box(house, i % 3 === 0 ? '#c39b70' : '#d0ad81', -2 + i * 0.4, 0.092, 0, 0.389, 0.026, 3.56)
  box(house, s.wall, 0, eave / 2, -1.83, 4.4, eave, 0.14)
  for (const x of [-2.13, 2.13]) box(house, s.wall, x, eave / 2, 0, 0.14, eave, 3.8)
  for (const x of [-1.4, 1.4]) box(front, s.wall, x, eave / 2, 1.83, 1.6, eave, 0.14)
  box(front, s.wall, 0, (eave + 2.03) / 2, 1.83, 1.2, eave - 2.03, 0.14)
  for (const x of [-1.4, 1.4]) box(front, stone, x, 0.2, 1.926, 1.6, 0.21, 0.09)
  for (const x of [-2.2, 2.2]) box(house, stone, x, 0.19, 0, 0.09, 0.21, 3.82)
  for (const x of [-2.15, 2.15])
    for (const z of [-1.86, 1.86]) {
      box(z > 0 ? front : house, s.timber, x, eave / 2, z, 0.155, eave, 0.16)
    }
  for (const sign of [-1, 1]) {
    if (k % 2 === 1) {
      // Painted lap siding with a shadowed lower edge.
      for (let i = 0; i < 9; i++)
        box(house, tone(s.wall, -0.018), sign * 2.208, 0.38 + i * 0.217, 0, 0.03, 0.035, 3.58)
    } else {
      box(house, s.timber, sign * 2.215, 1.2, 0, 0.082, 2.24, 0.105)
      box(house, s.timber, sign * 2.215, eave - 0.09, 0, 0.096, 0.11, 3.7)
    }
    for (const z of [-0.93, 0.92])
      windowFrame(
        house,
        sign * 2.222,
        1.37,
        z,
        (sign * Math.PI) / 2,
        0.68,
        0.75,
        s,
        k % 2 === 0,
        k % 2 === 1 && z > 0,
      )
  }
  for (const x of [-1.03, 1.03]) windowFrame(house, x, 1.31, -1.91, Math.PI, 0.67, 0.71, s, false, false)
  frontDetails(front, s, k, eave)
  const rotated = group(roof)
  if (sideways) rotated.rotation.y = Math.PI / 2
  const halfWidth = sideways ? 1.9 : 2.2,
    depth = sideways ? 4.4 : 3.8
  for (const sign of [-1, 1]) {
    const end = group(rotated, 0, eave, (sign * depth) / 2)
    if (sign === -1) end.rotation.y = Math.PI
    part(end, gableShape(), s.wall, 0, 0, -0.1, 2 * halfWidth, rise, 0.1)
    box(end, s.timber, 0, 0.025, 0.025, 2 * halfWidth, 0.12, 0.09)
    box(end, s.timber, 0, rise * 0.49, 0.03, 0.1, rise * 0.94, 0.07)
    if (k % 2 === 0) {
      for (const side of [-1, 1]) {
        const beam = box(
          end,
          s.timber,
          side * halfWidth * 0.4,
          rise * 0.24,
          0.029,
          0.082,
          rise * 0.55,
          0.06,
        )
        beam.rotation.z = -side * 0.51
      }
    }
    const trim = taper(end, s.trim, 0, rise * 0.39, 0.077, 0.235, 0.235, 0.08, 16)
    trim.rotation.x = Math.PI / 2
    const glass = taper(end, '#729093', 0, rise * 0.39, 0.126, 0.174, 0.174, 0.03, 16)
    glass.rotation.x = Math.PI / 2
    box(end, s.trim, 0, rise * 0.39, 0.153, 0.032, 0.33, 0.023)
    box(end, s.trim, 0, rise * 0.39, 0.154, 0.33, 0.034, 0.023)
  }
  tiledRoof(rotated, halfWidth, depth, rise, eave, s.roof, s.trim, s.timber, k + 1)
  if (sideways) {
    dormer(roof, s, -0.75, 0.97, eave + rise * 0.47, 0)
    if (k === 4) dormer(roof, s, 0.78, 0.97, eave + rise * 0.47, 0)
  } else if (k === 0) {
    dormer(roof, s, 1.2, 0.12, eave + rise * 0.43, Math.PI / 2)
  }
  chimney(roof, s, sideways ? 1.24 : -0.69, sideways ? -0.35 : -0.92, eave + rise + 0.43, k)
  // Stone step and a smaller, lower tread remain walkable at the opening.
  box(house, '#c2b49c', 0, 0.071, 2.01, 1.48, 0.14, 0.38)
  box(house, '#b8aa93', 0, 0.036, 2.26, 1.54, 0.07, 0.18)
  if (k % 2 === 1 || k === 0) flowerPot(house, -0.98, 0, 2.18, 0.68)
  dressInterior(house, k)
  interiors(house, k)
  return house
}
