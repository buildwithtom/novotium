import * as T from 'three'
import { makeTree } from './miniatures'
import {
  ball,
  box,
  creekInner,
  creekOuter,
  disc,
  flat,
  footbridge,
  pier,
  islandOutline,
  meadow,
  bankLand,
  paint,
  pastureMaterial,
  path,
  ribbon,
  rng,
  type Point,
} from './landForms'
import { bench, bridge, fishingPier, fountain, lantern, market, signpost } from './landScenery'
export { isWater, isOnIsland } from './landForms'

const trees: [number, number, number, number][] = [
  [-15.6, -8.6, 0, 1.03],
  [-14.85, -11.0, 1, 1.25],
  [-12.95, -11.84, 1, 1.15],
  [-11.65, -12.25, 0, 1.04],
  [-8.65, -12.25, 2, 0.96],
  [-6.75, -11.8, 0, 1.18],
  [-4.65, -12.38, 1, 1.14],
  [-3.2, -12.66, 1, 0.92],
  [0.9, -12.6, 0, 1.21],
  [3.3, -12.1, 2, 1.0],
  [5.6, -12.7, 1, 1.2],
  [7.35, -12.0, 1, 0.95],
  [10.6, -12.1, 0, 0.94],
  [13.1, -11.5, 0, 1.04],
  [14.2, -9.8, 1, 1.0],
  [-15.65, -4.8, 2, 0.94],
  [-15.03, 2.7, 0, 0.92],
  [-15.45, 5.9, 1, 0.83],
  [13.95, 2.3, 1, 0.81],
  [13.92, 4.65, 0, 0.82],
  [-11.1, 12.87, 0, 0.61],
  [8.15, 13.49, 1, 0.66],
  [9.35, 13.17, 1, 0.48],
  [16.7, 0.2, 1, 0.63],
]
const lamps: Point[] = [
  [-11.7, 0.95],
  [-4.3, -0.93],
  [3.55, 0.78],
  [11.4, -0.9],
  [-5.6, 8.7],
  [9.8, 9.22],
]
const benches: [number, number, number][] = [
  [-1.98, -1.11, 0.91],
  [2.16, 1.36, -2.25],
  [0.95, 10.5, Math.PI],
]
const marketSite: Point = [5.85, -2.05]
const obstacles: [number, number, number][] = [
  [0, 0, 1.11],
  ...trees.map(([x, z, , ,]) => [x, z, 0.28] as [number, number, number]),
  ...lamps.map(([x, z]) => [x, z, 0.13] as [number, number, number]),
]
export function blocksPublicMovement(x: number, z: number, radius = 0.22) {
  if (obstacles.some(([a, b, r]) => Math.hypot(x - a, z - b) < r + radius)) return true
  if (Math.abs(x - marketSite[0]) < 1.28 + radius && Math.abs(z - marketSite[1]) < 0.64 + radius)
    return true
  return benches.some(([a, b, yaw]) => {
    const dx = x - a,
      dz = z - b,
      s = Math.sin(yaw),
      c = Math.cos(yaw)
    return Math.abs(c * dx - s * dz) < 0.8 + radius && Math.abs(s * dx + c * dz) < 0.27 + radius
  })
}
function edgeTerrain(root: T.Group, points: Point[], seed: number) {
  const random = rng(seed)
  const rock = (scale: number): Point[] => points.map(([x, z]) => [x * scale, z * scale])
  const shaped = (scale: number, noise: number): Point[] =>
    points.map(([x, z]) => {
      const shift = scale + (random() - 0.5) * noise
      return [x * shift, z * shift]
    })
  const low = rock(0.978),
    foot = shaped(0.989, 0.005),
    shoulder = shaped(1.001, 0.004),
    seam = shaped(0.997, 0.003)
  ribbon(root, low, foot, -1.54, -1.39, paint('#937d64'), true)
  ribbon(root, foot, shoulder, -1.39, -0.89, paint('#b29876'), true)
  ribbon(root, shoulder, seam, -0.89, -0.83, paint('#c4ab85'), true)
  ribbon(root, seam, rock(1), -0.83, -0.34, paint('#b9a07a'), true)
  flat(root, low, -1.54, paint('#938166'))
  for (let i = 1; i < points.length; i += 3) {
    if (random() > 0.56) continue
    const [x, z] = points[i],
      a = points[i - 1],
      b = points[(i + 1) % points.length]
    const s = 0.1 + random() * 0.25,
      h = 0.045 + random() * 0.08
    const pebble = ball(
      root,
      ['#a98e71', '#c2a989', '#a68a6a', '#ccb390'][i % 4],
      x * 0.998,
      -0.62 - random() * 0.66,
      z * 0.998,
      s,
      h,
      0.06,
      true,
    )
    pebble.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0])
  }
}
const streamTime = { value: 0 }
export function setLandscapeTime(seconds: number) {
  streamTime.value = seconds
}
const waterMaterials = new Map<string, T.MeshStandardMaterial>()
function streamPaint(color: string) {
  let material = waterMaterials.get(color)
  if (material) return material
  material = paint(color).clone()
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uStreamTime = streamTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWaterPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWaterPosition = position.xz;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 vWaterPosition;\nuniform float uStreamTime;',
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float brokenLight = sin(vWaterPosition.x*2.3 + vWaterPosition.y*1.8 + uStreamTime*.52);
        float wave = sin(vWaterPosition.y*22.0 + vWaterPosition.x*6.8
                   + sin(vWaterPosition.x*3.2 - uStreamTime*.46)*1.7 - uStreamTime*1.1);
        diffuseColor.rgb += vec3(.037,.045,.035)*smoothstep(.87,1.0,wave)*smoothstep(.18,.75,brokenLight);
      `,
      )
  }
  waterMaterials.set(color, material)
  return material
}
function terrain(root: T.Group) {
  const turf = pastureMaterial()
  edgeTerrain(root, islandOutline, 725)
  for (const poly of [meadow, bankLand]) {
    ribbon(root, poly, poly, -0.34, -0.17, paint('#b6a080'), true)
    ribbon(root, poly, poly, -0.17, -0.075, paint('#7e885d'), true)
    ribbon(root, poly, poly, -0.075, -0.002, paint('#97a86e'), true)
    flat(root, poly, 0, turf)
  }
  for (let i = 0; i < 4; i++) {
    const t0 = i / 4,
      t1 = (i + 1) / 4
    const mix = (t: number) =>
      creekInner.map(
        ([x, z], idx) =>
          [
            T.MathUtils.lerp(x, creekOuter[idx][0], t),
            T.MathUtils.lerp(z, creekOuter[idx][1], t),
          ] as Point,
      )
    ribbon(
      root,
      mix(t0),
      mix(t1),
      -0.285,
      -0.285,
      streamPaint(['#9ac4b8', '#83b8b2', '#7aafa9', '#94bfb0'][i]),
    )
  }
  // At the two river mouths the water is visible through the cut clay edge.
  for (const i of [0, creekInner.length - 1]) {
    ribbon(
      root,
      [creekInner[i], creekOuter[i]],
      [creekInner[i], creekOuter[i]],
      -0.285,
      -0.35,
      paint('#78a69f'),
    )
  }
}
function lanes(root: T.Group) {
  path(
    root,
    [
      [-16.7, 0.3],
      [-13.0, -0.38],
      [-9.0, -0.1],
      [-5.4, 0.06],
      [-2.6, 0.29],
      [0, 0],
      [3, 0],
      [6.1, -0.2],
      [9, 0.38],
      [12.0, 0.18],
      [14.5, -0.25],
    ],
    1.4,
    18,
  )
  path(
    root,
    [
      [-5, -10.8],
      [-5.25, -8.3],
      [-4.8, -6.1],
      [-5, -3.2],
      [-5.27, -0.1],
      [-5.15, 3.8],
      [-4.78, 6.5],
      [-4.72, 10.65],
    ],
    0.91,
    25,
  )
  path(
    root,
    [
      [4.65, -10.5],
      [4.9, -8.6],
      [4.69, -5.2],
      [4.82, -3.55],
      [4.32, -0.2],
      [4.83, 2.85],
      [5.22, 6.25],
      [4.93, 9.8],
    ],
    0.97,
    26,
  )
  path(
    root,
    [
      [-13.55, 9.12],
      [-10.85, 9.36],
      [-8.6, 9.75],
      [-5.0, 9.81],
      [-2.22, 9.58],
      [0.35, 9.75],
      [3.05, 9.89],
      [5, 9.81],
      [8.16, 9.55],
      [10.65, 9.22],
      [12.6, 9.21],
    ],
    0.86,
    150,
  )
  path(
    root,
    [
      [-4.65, 9.8],
      [-4.75, 10.61],
      [-4.65, 11.68],
    ],
    0.91,
    8,
  )
  for (const cx of [-10, 0, 10]) {
    path(
      root,
      [
        [cx, -5.0],
        [cx - 0.2, -3.32],
        [cx + 0.22, -2.05],
        [cx + 0.1, -0.05],
      ],
      0.86,
      17 + cx,
    )
    path(
      root,
      [
        [cx, 7.16],
        [cx + 0.1, 8.07],
        [cx - 0.24, 8.86],
        [cx - 0.06, 9.7],
      ],
      0.78,
      73 + cx,
    )
  }
  const surface = '#dfd0ae'
  disc(root, '#ac9f81', 0, 0.015, 0, 2.14, 0.04, 30)
  disc(root, surface, 0, 0.041, 0, 2.07, 0.042, 30)
  for (let i = 0; i < 36; i++) {
    const a = (i * 2 * Math.PI) / 36
    box(
      root,
      i % 3 === 0 ? '#c5b695' : '#d2c3a0',
      Math.sin(a) * 1.99,
      0.068,
      Math.cos(a) * 1.99,
      0.29,
      0.03,
      0.123,
    ).rotation.y = a
  }
  const r = rng(717)
  for (let i = 0; i < 140; i++) {
    const x = -15 + 29 * r(),
      z = 0.19 * Math.sin(x / 2) + (r() - 0.5) * 0.92
    if (Math.hypot(x, z) < 2.2) continue
    const mark = ball(
      root,
      i % 3 ? '#d0bc96' : '#e9d9ae',
      x,
      0.035,
      z,
      0.02 + r() * 0.08,
      0.008,
      0.016 + r() * 0.035,
      true,
    )
    mark.castShadow = false
  }
}
function reeds(root: T.Group, x: number, z: number, r: () => number) {
  for (let i = 0; i < 4; i++) {
    const dx = x + (r() - 0.5) * 0.21,
      dz = z + (r() - 0.5) * 0.18,
      h = 0.2 + r() * 0.32
    const blade = ball(
      root,
      ['#8e9b5e', '#6c8c65', '#a4ad68'][i % 3],
      dx,
      h * 0.38 - 0.025,
      dz,
      0.022,
      h * 0.5,
      0.025,
    )
    blade.rotation.z = (r() - 0.5) * 0.6
    blade.rotation.x = (r() - 0.5) * 0.6
    if (i % 3 === 0) {
      disc(root, '#7b8557', dx, h * 0.4, dz, 0.012, h * 0.9, 5)
      ball(root, '#946e4e', dx, h * 0.87, dz, 0.028, 0.071, 0.03)
    }
  }
}
function waterDetail(root: T.Group) {
  const r = rng(1386)
  for (let i = 1; i < creekInner.length - 1; i++) {
    const a = creekInner[i],
      b = creekOuter[i],
      n = creekInner[i + 1],
      frac = 0.08 + 0.83 * r()
    const x = T.MathUtils.lerp(a[0], b[0], frac),
      z = T.MathUtils.lerp(a[1], b[1], frac)
    if (i % 2 === 0) {
      const mark = ball(
        root,
        i % 3 ? '#b0d3c1' : '#c0ddcb',
        x,
        -0.274,
        z,
        0.13 + r() * 0.23,
        0.009,
        0.02 + r() * 0.015,
      )
      mark.rotation.y = -Math.atan2(n[1] - a[1], n[0] - a[0])
      mark.castShadow = false
    }
    if (i % 3 === 0) {
      const side = i % 2 ? b : a,
        mid = i % 2 ? a : b,
        dist = 0.04 + r() * 0.11
      const px = T.MathUtils.lerp(side[0], mid[0], dist),
        pz = T.MathUtils.lerp(side[1], mid[1], dist)
      const s = 0.09 + r() * 0.19
      ball(
        root,
        ['#a1ab98', '#bdbaa0', '#909e90'][i % 3],
        px,
        -0.23,
        pz,
        s,
        s * 0.63,
        s * 0.77,
        true,
      ).rotation.y = r() * 6
      if (Math.abs(px - footbridge.x) > 1 && i % 2 === 0) reeds(root, side[0], side[1], r)
    }
  }
}
function flowers(root: T.Group, x: number, z: number, seed: number, variant: number) {
  const r = rng(seed),
    hues = [
      ['#e5bb76', '#f3cc87'],
      ['#d69c99', '#e7b4a0'],
      ['#b49bb6', '#cabaC8'],
      ['#e5e3c1', '#f5edcf'],
    ][variant % 4]
  for (let i = 0; i < 7; i++) {
    const u = x + (r() - 0.5) * 0.92,
      v = z + (r() - 0.5) * 0.65,
      h = 0.1 + r() * 0.17
    const foliage = ball(root, i % 2 ? '#879664' : '#779265', u, h * 0.37, v, 0.075, h * 0.5, 0.065)
    foliage.rotation.z = (r() - 0.5) * 0.5
    const head = ball(root, hues[i % 2], u, h * 0.95, v, 0.065, 0.045, 0.066)
    head.rotation.y = r() * 6
    if (variant === 3) ball(root, '#c6a763', u, h * 0.95 + 0.034, v, 0.03, 0.022, 0.03)
  }
}
function gardens(root: T.Group) {
  trees.forEach(([x, z, kind, size], i) => {
    const tree = makeTree(kind, 101 + i * 11)
    tree.scale.setScalar(size)
    tree.position.set(x, 0, z)
    tree.rotation.y = i * 1.7
    root.add(tree)
  })
  const locations: Point[] = [
    [-14.33, -8.8],
    [-14.85, -6.05],
    [-14.2, 3.45],
    [-16.2, 5.14],
    [-13.8, 7.45],
    [-7.8, -11.4],
    [-5.77, -8.6],
    [-5.7, -6.75],
    [-4.1, -1.66],
    [-6.24, 0.8],
    [-3.05, 1.65],
    [1.83, -1.53],
    [3.05, -1.1],
    [7.64, -1.64],
    [4.18, 3.65],
    [5.85, 6.4],
    [14.03, -2.27],
    [13.92, 1.03],
    [12.85, 10.1],
    [8.05, 10.3],
    [6.8, 10.62],
    [5.65, 10.74],
    [2.24, 10.3],
    [-2.43, 10.52],
    [-6.43, 10.53],
    [-8.68, 10.32],
    [-15.5, 8.38],
    [-0.15, 14.22],
    [-5.84, 14.1],
    [-7.8, 13.63],
    [-11.95, 13.0],
    [6.95, 14.2],
    [10.75, 12.85],
    [16.86, 3.64],
    [17.62, -2.15],
  ]
  locations.forEach(([x, z], i) => flowers(root, x, z, i * 91 + 2, i % 4))
  const r = rng(9328)
  for (let i = 0; i < 36; i++) {
    const [x, z] = locations[i % locations.length],
      dx = (r() - 0.5) * 0.6,
      dz = (r() - 0.5) * 0.32
    if (i % 3 === 0) {
      const s = 0.12 + r() * 0.24
      ball(root, '#a4a690', x + dx, 0.06, z + dz, s, s * 0.58, s * 0.8, true).rotation.y = r() * 5
    }
    const px = x + dx + 0.22,
      pz = z + dz + 0.12
    for (let j = 0; j < 3; j++) {
      const leaf = ball(
        root,
        j % 2 ? '#95a46f' : '#859864',
        px + j * 0.06,
        0.09,
        pz,
        0.033,
        0.105 + j * 0.015,
        0.029,
      )
      leaf.rotation.z = (j - 1) * 0.4
    }
  }
}
export function makeLandscape(): T.Group {
  const root = new T.Group()
  root.name = 'Willow District landscape'
  terrain(root)
  lanes(root)
  waterDetail(root)
  gardens(root)
  fountain(root)
  bridge(root, footbridge.x, footbridge.z)
  fishingPier(root, pier.x, pier.z)
  market(root, ...marketSite)
  signpost(root, -3.5, 0.91)
  benches.forEach(([x, z, y]) => bench(root, x, z, y))
  lamps.forEach(([x, z]) => lantern(root, x, z))
  return root
}
