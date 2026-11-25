import * as T from 'three'

export type Point = [number, number]
export function rng(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}
export function curve(points: Point[], segments: number, closed = false): Point[] {
  const spline = new T.CatmullRomCurve3(
    points.map(([x, z]) => new T.Vector3(x, 0, z)),
    closed,
  )
  const path = spline.getSpacedPoints(segments).map(({ x, z }) => [x, z] as Point)
  if (closed) path.pop()
  return path
}

// The stream divides the main meadow from a narrow wild bank. All three pieces
// share their vertices, so the stream meets the cut edge of the diorama cleanly.
const inner = curve(
  [
    [16.5, -9.8],
    [15.6, -7.25],
    [15.45, -4.6],
    [15.55, -2.1],
    [15.1, 0.75],
    [15.0, 4.0],
    [14.35, 7.9],
    [12.9, 9.9],
    [10.8, 10.4],
    [8.8, 10.5],
    [6.1, 11.45],
    [3.7, 12.0],
    [0.9, 11.35],
    [-2, 11.1],
    [-4.5, 11.65],
    [-7.4, 11.4],
    [-10.5, 10.65],
    [-13, 10.1],
    [-16.25, 9.35],
  ],
  124,
)
function normal(points: Point[], i: number): Point {
  const a = points[Math.max(0, i - 1)],
    b = points[Math.min(points.length - 1, i + 1)]
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    d = Math.hypot(dx, dz) || 1
  return [dz / d, -dx / d]
}
function offset(points: Point[], amount: (i: number) => number): Point[] {
  return points.map(([x, z], i) => {
    const n = normal(points, i),
      w = amount(i)
    return [x + n[0] * w, z + n[1] * w]
  })
}
const outer = offset(inner, (i) => 1.48 + 0.29 * Math.sin(i * 0.12) + 0.14 * Math.sin(i * 0.29))
const bank = offset(inner, (i) => 3.15 + 0.54 * Math.sin(i * 0.1) + 0.37 * Math.cos(i * 0.175))
const back = curve(
  [
    inner[inner.length - 1],
    [-17.3, 7.3],
    [-17.35, 4.4],
    [-18.15, 1.8],
    [-17.65, -1.3],
    [-17.8, -5.4],
    [-16.75, -9.25],
    [-15.35, -11.7],
    [-12.15, -13.05],
    [-9.35, -13.6],
    [-6.9, -13.1],
    [-3.15, -14.1],
    [-0.8, -13.85],
    [2.9, -14.35],
    [6.15, -14.15],
    [9, -13.5],
    [12, -13.45],
    [14.6, -12.15],
    inner[0],
  ],
  118,
)

export const meadow = [...back.slice(0, -1), ...inner.slice(0, -1)]
export const bankLand = [...outer, ...bank.slice().reverse()]
export const creek = [...inner, ...outer.slice().reverse()]
export const islandOutline = [...back, ...bank, inner[inner.length - 1]]
export const creekInner = inner
export const creekOuter = outer
export const creekBank = bank
export function contains(poly: Point[], x: number, z: number) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [a, b] = poly[i],
      [c, d] = poly[j]
    if (b > z !== d > z && x < ((c - a) * (z - b)) / (d - b) + a) inside = !inside
  }
  return inside
}
export const footbridge = { x: -4.65, z: 12.45, width: 1.42, length: 3.9 }
export function isBridge(x: number, z: number) {
  return (
    Math.abs(x - footbridge.x) < footbridge.width * 0.48 &&
    Math.abs(z - footbridge.z) < footbridge.length * 0.5
  )
}
export const pier = { x: 15.44, z: 1.4, width: 1.1, length: 1.98 }
function isOnPier(x: number, z: number) {
  return Math.abs(x - pier.x) < pier.length * 0.49 && Math.abs(z - pier.z) < pier.width * 0.47
}
export function isWater(x: number, z: number) {
  return contains(creek, x, z) && !isBridge(x, z) && !isOnPier(x, z)
}
export function isOnIsland(x: number, z: number) {
  return contains(islandOutline, x, z)
}

const mats = new Map<string, T.MeshStandardMaterial>()
export function paint(color: string) {
  let mat = mats.get(color)
  if (!mat) {
    mat = new T.MeshStandardMaterial({ color, roughness: 0.93, side: T.DoubleSide })
    mats.set(color, mat)
  }
  return mat
}
const cube = new T.BoxGeometry(1, 1, 1)
const stone = new T.IcosahedronGeometry(1, 0)
const leafShape = new T.SphereGeometry(1, 7, 5)
const cylinders = new Map<number, T.CylinderGeometry>()
export function mesh(
  parent: T.Object3D,
  geometry: T.BufferGeometry,
  material: T.Material,
  x: number,
  y: number,
  z: number,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const m = new T.Mesh(geometry, material)
  m.position.set(x, y, z)
  m.scale.set(sx, sy, sz)
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  return m
}
export function box(
  p: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  return mesh(p, cube, paint(c), x, y, z, w, h, d)
}
export function ball(
  p: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  rock = false,
) {
  return mesh(p, rock ? stone : leafShape, paint(c), x, y, z, w, h, d)
}
export function disc(
  p: T.Object3D,
  c: string,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  sides = 14,
) {
  let shape = cylinders.get(sides)
  if (!shape) {
    shape = new T.CylinderGeometry(1, 1, 1, sides)
    cylinders.set(sides, shape)
  }
  return mesh(p, shape, paint(c), x, y, z, r, h, r)
}
export function rod(
  p: T.Object3D,
  c: string,
  a: [number, number, number],
  b: [number, number, number],
  r: number,
) {
  const aa = new T.Vector3(...a),
    bb = new T.Vector3(...b),
    dir = bb.clone().sub(aa)
  const m = disc(p, c, (aa.x + bb.x) / 2, (aa.y + bb.y) / 2, (aa.z + bb.z) / 2, r, dir.length(), 7)
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize())
  return m
}
export function flat(p: T.Object3D, points: Point[], h: number, material: T.Material) {
  const vertices = points.flatMap(([x, z]) => [x, h, z])
  const idx = T.ShapeUtils.triangulateShape(
    points.map(([x, z]) => new T.Vector2(x, z)),
    [],
  ).flat()
  const geo = new T.BufferGeometry()
  geo.setAttribute('position', new T.Float32BufferAttribute(vertices, 3))
  geo.setAttribute(
    'uv',
    new T.Float32BufferAttribute(
      points.flatMap(([x, z]) => [x / 6, z / 6]),
      2,
    ),
  )
  geo.setIndex(idx)
  geo.computeVertexNormals()
  const normals = geo.getAttribute('normal')
  if (normals.getY(0) < 0) {
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]
    geo.setIndex(idx)
    geo.computeVertexNormals()
  }
  const m = mesh(p, geo, material, 0, 0, 0)
  m.castShadow = false
  return m
}
export function ribbon(
  p: T.Object3D,
  a: Point[],
  b: Point[],
  yA: number,
  yB: number,
  material: T.Material,
  closed = false,
) {
  const pos: number[] = [],
    uv: number[] = [],
    idx: number[] = []
  for (let i = 0; i < a.length; i++) {
    pos.push(a[i][0], yA, a[i][1], b[i][0], yB, b[i][1])
    uv.push(a[i][0] / 6, a[i][1] / 6, b[i][0] / 6, b[i][1] / 6)
    if (i || closed) {
      const j = ((i + a.length - 1) % a.length) * 2,
        k = i * 2
      idx.push(j, k, k + 1, j, k + 1, j + 1)
    }
  }
  const geo = new T.BufferGeometry()
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return mesh(p, geo, material, 0, 0, 0)
}
export function path(p: T.Object3D, pts: Point[], width: number, seed: number) {
  const c = curve(pts, Math.max(16, Math.round(pts.length * 6)))
  const widthAt = (i: number) =>
    width * 0.5 * (1 + 0.048 * Math.sin(i * 0.39 + seed) + 0.023 * Math.sin(i * 1.17))
  ribbon(
    p,
    offset(c, (i) => -widthAt(i) - 0.085),
    offset(c, (i) => widthAt(i) + 0.085),
    0.012,
    0.012,
    paint('#b6aa7d'),
  )
  ribbon(
    p,
    offset(c, (i) => -widthAt(i)),
    offset(c, (i) => widthAt(i)),
    0.024,
    0.024,
    paint('#e2cca0'),
  )
}
export function pastureMaterial() {
  const mat = paint('#ffffff').clone()
  if (typeof document === 'undefined') {
    mat.color.set('#a4b077')
    return mat
  }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    mat.color.set('#a4b077')
    return mat
  }
  const rand = rng(1924)
  ctx.fillStyle = '#a7b77c'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 600; i++) {
    const x = rand() * 256,
      z = rand() * 256,
      r = 3 + rand() * 21
    const tone = rand() < 0.5 ? '159,176,112' : '187,194,132'
    ctx.fillStyle = `rgba(${tone},0.13)`
    for (const dx of [-256, 0, 256])
      for (const dz of [-256, 0, 256]) {
        ctx.beginPath()
        ctx.ellipse(x + dx, z + dz, r, r * 0.59, 0, 0, Math.PI * 2)
        ctx.fill()
      }
  }
  for (let i = 0; i < 5600; i++) {
    ctx.fillStyle = rand() < 0.52 ? 'rgba(65,91,52,0.13)' : 'rgba(239,226,159,0.17)'
    const x = rand() * 256,
      z = rand() * 256
    ctx.fillRect(x, z, 0.45 + rand() * 2, 0.35 + rand() * 1.2)
  }
  const texture = new T.CanvasTexture(canvas)
  texture.colorSpace = T.SRGBColorSpace
  texture.wrapS = texture.wrapT = T.RepeatWrapping
  mat.map = texture
  mat.needsUpdate = true
  return mat
}
