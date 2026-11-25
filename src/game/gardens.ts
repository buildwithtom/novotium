import * as T from 'three'
import { type Plot } from '../domain/world'
import { makeTree } from '../art/miniatures'
const box = new T.BoxGeometry(),
  sphere = new T.IcosahedronGeometry(1, 0),
  cyl = new T.CylinderGeometry(0.48, 0.54, 1, 10)
const mats = new Map<string, T.MeshStandardMaterial>()
function piece(
  g: T.Group,
  geo: T.BufferGeometry,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  c: string,
) {
  if (!mats.has(c)) mats.set(c, new T.MeshStandardMaterial({ color: c, roughness: 0.92 }))
  const m = new T.Mesh(geo, mats.get(c))
  m.position.set(x, y, z)
  m.scale.set(sx, sy, sz)
  m.castShadow = m.receiveShadow = true
  g.add(m)
  return m
}
function rail(g: T.Group, ax: number, az: number, bx: number, bz: number, c: string) {
  const length = Math.hypot(ax - bx, az - bz),
    ang = Math.atan2(bx - ax, bz - az),
    n = Math.round(length / 0.65)
  for (let i = 0; i <= n; i++) {
    const x = ax + ((bx - ax) * i) / n,
      z = az + ((bz - az) * i) / n
    piece(g, box, x, 0.38, z, 0.15, 0.74, 0.15, c)
    piece(g, sphere, x, 0.77, z, 0.115, 0.14, 0.115, c)
  }
  for (const y of [0.24, 0.51])
    piece(g, box, (ax + bx) / 2, y, (az + bz) / 2, 0.095, 0.115, length, c).rotation.y = ang
}
export function garden(p: Plot, occupied: boolean) {
  const g = new T.Group(),
    seed = p.x + 3 * p.z
  const fence = p.style % 2 ? '#bfa37c' : '#e4d6ac'
  rail(g, -3.35, -3.35, -3.35, 3.25, fence)
  rail(g, -3.35, -3.35, 2.5, -3.35, fence)
  rail(g, -3.35, 3.25, -1.35, 3.25, fence)
  rail(g, 1.12, 3.25, 3.35, 3.25, fence)
  if (!occupied) {
    const sign = piece(g, box, 0.25, 0.72, 1.1, 0.14, 1.4, 0.15, '#765e43')
    sign.rotation.z = -0.05
    piece(g, box, 0.25, 1.27, 1.1, 1.2, 0.57, 0.14, '#e7d5a8')
    for (let i = 0; i < 3; i++)
      piece(g, box, 0.25, 1.42 - i * 0.11, 1.181, 0.62 - i * 0.1, 0.035, 0.016, '#809363')
  }
  for (let i = 0; i < 5; i++) {
    const s = piece(
      g,
      cyl,
      Math.sin(i * 2.6 + seed) * 0.16,
      0.035,
      1.4 + i * 0.48,
      0.78,
      0.075,
      0.55,
      i % 2 ? '#c6b798' : '#d8c8a9',
    )
    s.rotation.y = i * 1.6
  }
  const palette = ['#f3cd71', '#d59086', '#d1accc', '#e5dbad']
  for (let i = 0; i < 34; i++) {
    const x = (i % 2 ? 1 : -1) * (2.45 + 0.62 * (Math.sin(i * 13.9 + seed) * 0.5 + 0.5)),
      z = -2.6 + ((i * 0.731) % 1) * 5.7,
      y = 0.2 + ((i * 0.39) % 1) * 0.18
    piece(g, sphere, x, 0.11, z, 0.22, 0.16, 0.22, i % 3 ? '#819558' : '#99ad67')
    if (i % 3 !== 0) {
      piece(g, cyl, x, y / 2, z, 0.037, y, 0.037, '#75884e')
      piece(g, sphere, x, y + 0.05, z, 0.11, 0.082, 0.1, palette[(i + p.style) % 4])
    }
  }
  // Meadow flowers and vegetable rows give each unclaimed square its own silhouette.
  if (!occupied) {
    for (let i = 0; i < 42; i++) {
      const x = -1.1 + Math.sin(i * 2.67 + seed) * 1.63,
        z = -1.05 + Math.cos(i * 3.81) * 1.39
      const h = 0.12 + (i % 4) * 0.04
      piece(g, sphere, x, h * 0.43, z, 0.14, h * 0.55, 0.13, i % 3 ? '#8da86c' : '#95a665')
      piece(
        g,
        sphere,
        x,
        h + 0.026,
        z,
        0.052,
        0.04,
        0.052,
        ['#d9bb7c', '#ead899', '#d7c4a0', '#b9abc5'][i % 4],
      )
    }
  } else if (p.id === 'A2') {
    piece(g, box, -2.69, 0.42, 0.78, 0.72, 0.8, 0.48, '#876b4c')
    piece(g, box, -2.69, 0.87, 0.78, 0.88, 0.1, 0.6, '#788c83')
    for (let i = 0; i < 5; i++)
      piece(
        g,
        box,
        -2.91 + i * 0.105,
        0.55,
        1.035,
        0.08,
        0.32 + (i % 2) * 0.05,
        0.07,
        ['#9e6c55', '#a39361', '#728f83'][i % 3],
      )
  } else if (p.id === 'B2') {
    for (let j = 0; j < 2; j++) {
      piece(g, box, 2.67, 0.085, -0.75 + j * 1.48, 0.84, 0.15, 1.3, '#9a785a')
      for (let i = 0; i < 6; i++) {
        const x = 2.47 + (i % 2) * 0.35,
          z = -1.18 + j * 1.48 + Math.floor(i / 2) * 0.41
        piece(g, sphere, x, 0.21, z, 0.21, 0.16, 0.2, i % 2 ? '#82966b' : '#657f57')
        piece(g, sphere, x + 0.04, 0.29, z - 0.02, 0.12, 0.08, 0.1, '#a0b385')
      }
    }
  }
  const t = makeTree(occupied ? (p.style + 1) % 4 : 0, Math.abs(seed) + 8)
  t.position.set(2.7, 0, -2.55)
  t.scale.setScalar(occupied ? 0.62 : 0.77)
  g.add(t)
  if (occupied) {
    piece(g, box, 1, 0.46, 2.72, 0.13, 0.92, 0.15, '#82674e')
    piece(g, box, 1, 0.99, 2.72, 0.46, 0.32, 0.42, '#718d87')
    piece(g, box, 1, 1, 2.945, 0.23, 0.035, 0.02, '#3c5149')
  }
  g.position.set(p.x, 0, p.z)
  return g
}
export function saleBox() {
  const g = new T.Group()
  piece(g, box, 0, 0.09, 0, 0.94, 0.13, 0.72, '#8f7353')
  for (let i = 0; i < 2; i++) {
    const z = i ? 0.34 : -0.34
    for (const y of [0.19, 0.34]) piece(g, box, 0, y, z, 0.94, 0.13, 0.07, '#b68c5f')
    for (const y of [0.19, 0.34]) piece(g, box, i ? 0.44 : -0.44, y, 0, 0.07, 0.13, 0.69, '#b68c5f')
  }
  return g
}
