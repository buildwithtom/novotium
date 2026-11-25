import * as THREE from 'three'
import { box, geometry, group, oval, part, rod, taper } from './modelTools'
import { flowerPot, makeTree } from './modelGarden'

const wood = '#926342',
  oak = '#ba8a5b',
  edge = '#d1a679',
  dark = '#6e4938'
const cream = '#ecdbb4',
  green = '#758d72',
  fabric = '#b8775d'

function legs(g: THREE.Group, w: number, bottom: number, h: number, d: number, color = wood) {
  for (const x of [-w / 2, w / 2])
    for (const z of [-d / 2, d / 2])
      rod(g, color, [x * 1.07, bottom, z * 1.07], [x, bottom + h, z], 0.048, 0.067)
}

function chair(g: THREE.Group) {
  legs(g, 0.5, 0.02, 0.47, 0.46)
  box(g, oak, 0, 0.5, 0, 0.64, 0.095, 0.61)
  for (const x of [-0.24, 0.24]) rod(g, wood, [x, 0.45, -0.22], [x * 1.17, 1.18, -0.29], 0.045, 0.056)
  for (const x of [-0.12, 0, 0.12]) rod(g, oak, [x, 0.55, -0.24], [x * 1.12, 1.06, -0.29], 0.025)
  box(g, edge, 0, 1.11, -0.28, 0.61, 0.13, 0.095)
  for (const x of [-0.26, 0.26]) rod(g, wood, [x, 0.22, 0.25], [x, 0.22, -0.25], 0.025)
}
export function makeFurniture(kind: string) {
  const g = new THREE.Group()
  g.name = kind
  switch (kind) {
    case 'tree': {
      const sapling = makeTree(0, 7)
      sapling.scale.multiplyScalar(0.6)
      g.add(sapling)
      return g
    }
    case 'plant':
      flowerPot(g, 0, 0, 0, 1.03)
      break
    case 'chair':
      chair(g)
      break
    case 'bench':
      legs(g, 1.31, 0.02, 0.48, 0.38, '#596959')
      for (let i = 0; i < 3; i++) box(g, oak, 0, 0.54, -0.21 + i * 0.21, 1.75, 0.1, 0.185)
      for (const x of [-0.65, 0.65]) rod(g, '#596959', [x, 0.42, -0.21], [x, 1.16, -0.3], 0.056)
      for (let i = 0; i < 2; i++) box(g, edge, 0, 0.85 + i * 0.21, -0.28, 1.75, 0.155, 0.08)
      break
    case 'table':
      taper(g, edge, 0, 0.76, 0, 0.62, 0.62, 0.12, 24)
      taper(g, oak, 0, 0.675, 0, 0.45, 0.52, 0.09, 16)
      taper(g, wood, 0, 0.43, 0, 0.11, 0.085, 0.48)
      taper(g, oak, 0, 0.45, 0, 0.14, 0.12, 0.11)
      for (let i = 0; i < 3; i++)
        rod(
          g,
          wood,
          [0, 0.25, 0],
          [Math.cos(i * 2.094) * 0.4, 0.065, Math.sin(i * 2.094) * 0.4],
          0.1,
          0.065,
        )
      break
    case 'rug':
      box(g, '#a5604c', 0, 0.02, 0, 1.36, 0.035, 1.85)
      box(g, '#c78465', 0, 0.042, 0, 1.19, 0.012, 1.65)
      for (const z of [-0.64, 0.64]) box(g, '#e4bb8e', 0, 0.052, z, 1.06, 0.01, 0.065)
      for (const x of [-0.35, 0, 0.35]) {
        const motif = box(g, cream, x, 0.053, 0, 0.19, 0.01, 0.19)
        motif.rotation.y = Math.PI / 4
      }
      for (let i = 0; i < 11; i++)
        for (const z of [-0.97, 0.97]) box(g, cream, -0.58 + i * 0.115, 0.023, z, 0.041, 0.025, 0.12)
      break
    case 'lamp':
      taper(g, '#8d774e', 0, 0.07, 0, 0.25, 0.2, 0.13)
      taper(g, '#a88a57', 0, 0.76, 0, 0.046, 0.039, 1.35)
      taper(g, '#d1a95e', 0, 1.29, 0, 0.088, 0.06, 0.21)
      taper(g, '#e3ba80', 0, 1.56, 0, 0.39, 0.2, 0.47)
      taper(g, cream, 0, 1.33, 0, 0.39, 0.38, 0.046)
      oval(g, '#9b7a47', 0, 1.83, 0, 0.1, 0.12, 0.1)
      break
    case 'bookshelf':
    case 'cabinet':
      box(g, dark, 0, 0.9, -0.17, 1.08, 1.64, 0.09)
      for (const x of [-0.53, 0.53]) box(g, wood, x, 0.9, 0, 0.095, 1.7, 0.43)
      for (let i = 0; i < 4; i++) {
        box(g, oak, 0, 0.12 + i * 0.54, 0, 1.18, 0.1, 0.47)
        if (i === 3) break
        const colors = ['#897759', '#798d8c', '#ae7459', '#b4a172', '#647e70', '#bb967f']
        for (let j = 0; j < (i % 2 ? 4 : 6); j++) {
          const h = 0.26 + ((j + 2 * i) % 3) * 0.072,
            x = -0.4 + j * 0.142
          box(g, colors[(2 * i + j) % 6], x, 0.175 + i * 0.54 + h / 2, 0.02, 0.122, h, 0.26)
          box(g, cream, x, 0.22 + i * 0.54, 0.155, 0.083, 0.022, 0.015)
        }
      }
      box(g, edge, 0, 1.79, 0, 1.25, 0.1, 0.52)
      break
    case 'bed':
      legs(g, 0.85, 0.02, 0.3, 1.55)
      box(g, wood, 0, 0.34, 0, 1.07, 0.22, 1.8)
      box(g, cream, 0, 0.49, 0, 1.02, 0.19, 1.73)
      box(g, green, 0, 0.6, 0.24, 1.05, 0.13, 1.23)
      for (const x of [-0.33, 0.33]) box(g, '#a3ae7f', x, 0.675, 0.23, 0.06, 0.012, 1.18)
      box(g, '#a2ac89', 0, 0.676, -0.26, 1.055, 0.025, 0.13)
      oval(g, '#e8d8b5', 0, 0.64, -0.6, 0.83, 0.2, 0.4)
      box(g, oak, 0, 0.75, -0.9, 1.11, 0.72, 0.1)
      break
    case 'sofa':
      legs(g, 1.35, 0.02, 0.25, 0.55)
      box(g, fabric, 0, 0.43, 0, 1.66, 0.38, 0.82)
      box(g, fabric, 0, 0.75, -0.32, 1.58, 0.64, 0.18)
      for (const x of [-0.71, 0.71]) oval(g, '#c68a6b', x, 0.64, 0, 0.33, 0.43, 0.81)
      for (const x of [-0.33, 0.33]) box(g, '#cb9273', x, 0.66, 0.035, 0.62, 0.12, 0.59)
      break
    default:
      chair(g)
  }
  return g
}

export function makeCitizen(skin: string, hair: string, coat: string, style = 0) {
  const g = new THREE.Group()
  for (const [name, x] of [
    ['leftLeg', -0.115],
    ['rightLeg', 0.115],
  ] as const) {
    const leg = group(g, x, 0.44, 0, name)
    oval(leg, '#4e5d62', 0, -0.15, 0, 0.2, 0.39, 0.21)
    oval(leg, dark, 0, -0.35, 0.035, 0.205, 0.15, 0.3)
    box(leg, '#ac8b6e', 0, -0.405, 0.04, 0.17, 0.03, 0.21)
  }
  // A flattened bell shape gives the coat the proportions of a painted peg doll.
  const shape = geometry(
    'coat',
    () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0, 0.43),
          new THREE.Vector2(0.21, 0.43),
          new THREE.Vector2(0.27, 0.49),
          new THREE.Vector2(0.245, 0.77),
          new THREE.Vector2(0.214, 0.89),
          new THREE.Vector2(0.14, 0.99),
          new THREE.Vector2(0, 1.0),
        ],
        14,
      ),
  )
  part(g, shape, coat, 0, 0, 0, 1, 1, 0.78)
  for (const [name, x] of [
    ['leftArm', -0.23],
    ['rightArm', 0.23],
  ] as const) {
    const arm = group(g, x, 0.86, 0, name)
    arm.rotation.z = x < 0 ? -0.11 : 0.11
    oval(arm, coat, 0, -0.13, 0, 0.153, 0.36, 0.165)
    oval(arm, skin, 0, -0.32, 0.012, 0.123, 0.155, 0.136)
  }
  for (const y of [0.63, 0.76, 0.88]) oval(g, '#d6b775', 0, y, 0.191, 0.037, 0.037, 0.022)
  const head = group(g, 0, 1.26, 0, 'head')
  oval(head, skin, 0, 0, 0, 0.62, 0.61, 0.54)
  for (const x of [-0.294, 0.294]) oval(head, skin, x, -0.012, -0.006, 0.078, 0.13, 0.092)
  for (const x of [-0.105, 0.105]) {
    oval(head, '#413c38', x, 0.013, 0.246, 0.038, 0.055, 0.027)
    oval(head, '#d59980', x * 1.65, -0.059, 0.214, 0.063, 0.035, 0.024)
  }
  oval(head, skin, 0, -0.038, 0.274, 0.081, 0.074, 0.082)
  const cap = geometry(
    'hairCap',
    () => new THREE.SphereGeometry(1, 16, 9, 0, Math.PI * 2, 0, Math.PI * 0.57),
  )
  const crown = part(head, cap, hair, 0, 0.036, -0.027, 0.32, 0.285, 0.27)
  crown.rotation.x = -0.22
  for (let i = 0; i < 3; i++) {
    const tuft = oval(head, hair, -0.126 + i * 0.11, 0.189, 0.174, 0.2, 0.13, 0.123)
    tuft.rotation.z = -0.25 + i * 0.05
  }
  if (style % 4 === 1) {
    oval(head, hair, 0.04, 0.23, -0.222, 0.27, 0.24, 0.25)
    oval(head, hair, -0.235, -0.025, -0.034, 0.15, 0.31, 0.14)
  } else if (style % 4 === 2) {
    taper(head, '#ba995f', 0, 0.218, 0, 0.39, 0.37, 0.05, 22)
    taper(head, '#d5b478', 0, 0.306, 0, 0.265, 0.217, 0.16, 18)
    taper(head, '#90604d', 0, 0.25, 0, 0.267, 0.254, 0.059, 18)
  } else if (style % 4 === 3) {
    oval(head, hair, 0.26, 0.045, -0.04, 0.15, 0.27, 0.16)
    oval(head, hair, -0.26, 0.045, -0.04, 0.15, 0.27, 0.16)
  }
  return g
}
