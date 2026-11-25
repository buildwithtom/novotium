import * as T from 'three'
import { ball, box, disc, mesh, paint, rod } from './landForms'

const wood = '#92724f',
  edge = '#644f40',
  pale = '#c7a981',
  iron = '#4c6055'
export function bench(root: T.Group, x: number, z: number, yaw: number) {
  const g = new T.Group()
  g.position.set(x, 0, z)
  g.rotation.y = yaw
  root.add(g)
  for (const s of [-0.66, 0.66]) {
    box(g, iron, s, 0.26, 0, 0.105, 0.51, 0.48)
    rod(g, iron, [s, 0.22, -0.15], [s, 0.88, -0.27], 0.045)
  }
  for (let i = 0; i < 3; i++) box(g, wood, 0, 0.49, -0.16 + i * 0.145, 1.6, 0.09, 0.12)
  for (let i = 0; i < 2; i++) {
    const q = box(g, pale, 0, 0.68 + i * 0.16, -0.24 - i * 0.03, 1.59, 0.12, 0.075)
    q.rotation.x = -0.15
  }
}
export function lantern(root: T.Group, x: number, z: number) {
  const g = new T.Group()
  g.position.set(x, 0, z)
  root.add(g)
  disc(g, '#879083', 0, 0.07, 0, 0.22, 0.14, 8)
  disc(g, iron, 0, 0.24, 0, 0.13, 0.28, 8)
  disc(g, iron, 0, 1.23, 0, 0.065, 1.85, 8)
  disc(g, iron, 0, 2.15, 0, 0.18, 0.1, 4).rotation.y = Math.PI / 4
  box(g, '#ffe1a3', 0, 2.36, 0, 0.23, 0.35, 0.23)
  for (const a of [-0.116, 0.116])
    for (const b of [-0.116, 0.116]) box(g, iron, a, 2.36, b, 0.028, 0.36, 0.028)
  mesh(g, new T.ConeGeometry(0.29, 0.23, 4), paint(iron), 0, 2.65, 0).rotation.y = Math.PI / 4
  ball(g, iron, 0, 2.8, 0, 0.045, 0.07, 0.045)
}
export function market(root: T.Group, x: number, z: number) {
  const g = new T.Group()
  g.position.set(x, 0, z)
  g.rotation.y = -0.12
  root.add(g)
  for (const sx of [-1.25, 1.25])
    for (const sz of [-0.63, 0.63]) box(g, wood, sx, 0.95, sz, 0.1, 1.9, 0.1)
  box(g, edge, 0, 0.52, 0, 2.6, 0.87, 1.22)
  for (let i = 0; i < 14; i++)
    box(g, i % 3 === 0 ? '#b99566' : '#c8a776', -1.22 + i * 0.188, 0.51, 0.622, 0.17, 0.8, 0.046)
  box(g, pale, 0, 0.93, 0, 2.8, 0.13, 1.39)
  box(g, wood, 0, 0.15, 0.665, 2.72, 0.09, 0.08)
  box(g, wood, 0, 0.89, 0.67, 2.73, 0.1, 0.08)
  const colors = ['#c97550', '#f4d9a2']
  const plates: [number, number, number, number][] = [
    [-0.45, 2.05, 0.78, -0.27],
    [0.35, 2.05, 0.87, 0.26],
  ]
  for (let i = 0; i < 10; i++) {
    const dx = -1.32 + i * 0.294,
      c = colors[i % 2]
    for (const [dz, y, d, tilt] of plates) {
      box(g, c, dx, y, dz, 0.295, 0.075, d).rotation.x = tilt
    }
    box(g, c, dx, 1.85, 0.77, 0.295, 0.18, 0.055)
    ball(g, c, dx, 1.775, 0.77, 0.147, 0.085, 0.03)
  }
  // Brocante: spines, turned ceramic jugs and neatly folded textiles.
  const spines = ['#9e5948', '#839798', '#c39d56', '#778965', '#bc886a']
  for (let i = 0; i < 7; i++)
    box(g, spines[i % 5], -0.98 + i * 0.113, 1.16, 0.12, 0.094, 0.27 + (i % 3) * 0.08, 0.28).rotation.z =
      i === 6 ? -0.16 : 0
  for (const [dx, c] of [
    [0.32, '#c18361'],
    [0.66, '#748e8b'],
  ] as const) {
    ball(g, c, dx, 1.19, 0.1, 0.16, 0.22, 0.16)
    disc(g, c, dx, 1.39, 0.1, 0.078, 0.12, 12)
    disc(g, '#5e5749', dx, 1.455, 0.1, 0.061, 0.01, 12)
  }
  for (let i = 0; i < 3; i++) box(g, spines[4 - i], 1, 1.05 + i * 0.075, 0.19, 0.36, 0.07, 0.29)
  box(g, edge, -1.23, 1.8, 0.5, 0.08, 0.5, 0.05)
  box(g, '#426457', -1.24, 1.52, 0.51, 0.38, 0.36, 0.07)
  const motif = box(g, '#e8cb86', -1.24, 1.52, 0.556, 0.15, 0.15, 0.016)
  motif.rotation.z = 0.785
}
export function fountain(root: T.Group) {
  const g = new T.Group()
  root.add(g)
  disc(g, '#bab7a4', 0, 0.07, 0, 1.21, 0.14, 32)
  disc(g, '#a29f91', 0, 0.19, 0, 1.13, 0.15, 32)
  disc(g, '#80b6b2', 0, 0.285, 0, 0.99, 0.038, 40)
  for (let i = 0; i < 20; i++) {
    const a = (i * Math.PI) / 10
    box(
      g,
      ['#d9d0b8', '#c7bea9', '#d2c7ad'][i % 3],
      Math.sin(a) * 1.055,
      0.35,
      Math.cos(a) * 1.055,
      0.345,
      0.21,
      0.16,
    ).rotation.y = a
  }
  disc(g, '#c4c1ac', 0, 0.43, 0, 0.38, 0.28, 12)
  disc(g, '#c9c7af', 0, 0.72, 0, 0.19, 0.5, 12)
  mesh(g, new T.CylinderGeometry(0.54, 0.22, 0.22, 20), paint('#d6d1b8'), 0, 1.05, 0)
  disc(g, '#8fbbb3', 0, 1.17, 0, 0.47, 0.02, 20)
  disc(g, '#b6beae', 0, 1.32, 0, 0.11, 0.31, 10)
  ball(g, '#dad7b8', 0, 1.52, 0, 0.15, 0.2, 0.15)
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.1,
      sx = Math.cos(a),
      sz = Math.sin(a)
    const c = new T.QuadraticBezierCurve3(
      new T.Vector3(sx * 0.44, 1.16, sz * 0.44),
      new T.Vector3(sx * 0.71, 1.15, sz * 0.71),
      new T.Vector3(sx * 0.8, 0.31, sz * 0.8),
    )
    mesh(g, new T.TubeGeometry(c, 7, 0.014, 4, false), paint('#c7e1cf'), 0, 0, 0)
  }
}
export function bridge(root: T.Group, x: number, z: number) {
  const g = new T.Group()
  g.position.set(x, 0, z)
  root.add(g)
  const arch = (dz: number) => 0.18 * (1 - Math.min(1, (dz / 1.81) ** 2)) + 0.035
  for (const sx of [-0.52, 0.52]) box(g, edge, sx, 0.035, 0, 0.15, 0.18, 3.7)
  for (let i = 0; i < 20; i++) {
    const dz = -1.76 + i * 0.185
    box(g, ['#bc956a', '#cfaa78', '#c49c71'][i % 3], 0, arch(dz), dz, 1.5, 0.1, 0.172)
  }
  for (const sx of [-0.71, 0.71]) {
    let prev: number | undefined
    for (const dz of [-1.73, -0.87, 0, 0.87, 1.73]) {
      box(g, wood, sx, arch(dz) + 0.42, dz, 0.09, 0.92, 0.09)
      ball(g, pale, sx, arch(dz) + 0.9, dz, 0.075, 0.073, 0.075)
      if (prev !== undefined)
        for (const h of [0.42, 0.78]) {
          rod(
            g,
            h > 0.5 ? wood : pale,
            [sx, arch(prev) + h, prev],
            [sx, arch(dz) + h, dz],
            h > 0.5 ? 0.048 : 0.026,
          )
        }
      prev = dz
    }
  }
}
export function signpost(root: T.Group, x: number, z: number) {
  const g = new T.Group()
  g.position.set(x, 0, z)
  root.add(g)
  box(g, wood, 0, 0.82, 0, 0.105, 1.64, 0.105)
  const make = (yaw: number, y: number, side: number) => {
    const board = new T.Group()
    g.add(board)
    board.rotation.y = yaw
    box(board, '#c8a271', side * 0.23, y, 0.03, 0.63, 0.18, 0.065)
    const tip = box(board, '#c8a271', side * 0.54, y, 0.03, 0.13, 0.13, 0.065)
    tip.rotation.z = 0.785
    for (let i = 0; i < 3; i++)
      box(board, '#7b6144', side * (0.14 + i * 0.1), y, 0.07, 0.052, 0.042, 0.018)
  }
  make(-0.1, 1.45, -1)
  make(0.55, 1.21, 1)
}

export function fishingPier(root: T.Group, x: number, z: number) {
  const g = new T.Group()
  g.position.set(x, 0, z)
  root.add(g)
  for (const dz of [-0.42, 0.42]) {
    box(g, edge, 0, -0.03, dz, 2.0, 0.12, 0.1)
    for (const dx of [-0.75, 0.85]) disc(g, wood, dx, -0.12, dz, 0.078, 0.65, 9)
  }
  for (let i = 0; i < 12; i++)
    box(g, ['#c39e75', '#b8956d', '#d1b18b'][i % 3], -0.9 + i * 0.164, 0.085, 0, 0.154, 0.1, 1.1)
  const g2 = new T.Group()
  g2.position.set(0.63, 0.14, -0.32)
  g.add(g2)
  disc(g2, '#78918b', 0, 0.105, 0, 0.12, 0.205, 11)
  disc(g2, '#a7b6a2', 0, 0.213, 0, 0.125, 0.019, 11)
  disc(g2, '#687c71', 0, 0.226, 0, 0.102, 0.009, 11)
  const handle = new T.TorusGeometry(0.105, 0.012, 4, 12, Math.PI)
  mesh(g2, handle, paint(iron), 0, 0.203, 0)
}
