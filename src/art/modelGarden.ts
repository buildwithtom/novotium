import * as THREE from 'three'
import { box, geometry, group, oval, part, rod, seeded, taper } from './modelTools'

const bark = '#805940'
const leaves = [
  ['#779851', '#93ae62', '#a4b96c', '#66884c'],
  ['#4e7357', '#62835c', '#809769', '#749064'],
  ['#ce9187', '#dda098', '#e8b2a1', '#dba79c'],
  ['#9b9f52', '#b0ae62', '#bcb975', '#949d55'],
]

function crown(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  rotation: number,
) {
  const form = geometry('canopy', () => {
    const geo = new THREE.IcosahedronGeometry(1, 1)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i),
        py = pos.getY(i),
        pz = pos.getZ(i)
      const r = 1 + 0.045 * Math.sin(px * 8.7 + py * 6.1) * Math.cos(pz * 9.1)
      pos.setXYZ(i, px * r, py * r, pz * r)
    }
    // Icosahedral faces retain soft lighting across the lumps in the canopy.
    const normal = pos.clone()
    for (let i = 0; i < normal.count; i++) {
      const n = new THREE.Vector3().fromBufferAttribute(pos, i).normalize()
      normal.setXYZ(i, n.x, n.y, n.z)
    }
    geo.setAttribute('normal', normal)
    geo.userData.foliage = true
    return geo
  })
  const mesh = part(parent, form, color, x, y, z, w, h, d)
  mesh.rotation.y = rotation
  mesh.rotation.z = Math.sin(rotation) * 0.12
  return mesh
}

function pineSkirt() {
  return geometry('fir-boughs', () => {
    const outline = [
      [0.0, 0.68],
      [0.27, 0.21],
      [0.59, -0.04],
      [0.88, -0.23],
      [1.0, -0.36],
      [0.62, -0.4],
      [0.02, -0.31],
    ]
    const n = 20,
      coords: number[] = [],
      faces: number[] = []
    for (const [r, y] of outline) {
      for (let i = 0; i < n; i++) {
        const phi = (2 * Math.PI * i) / n
        const flute = i % 2 === 0 ? 1 : 0.82
        coords.push(
          Math.cos(phi) * r * flute,
          y + (i % 2 === 0 ? -0.045 : 0.06) * r,
          Math.sin(phi) * r * flute,
        )
      }
    }
    for (let j = 0; j < outline.length - 1; j++)
      for (let i = 0; i < n; i++) {
        const a = j * n + i,
          b = j * n + ((i + 1) % n),
          c = b + n,
          d = a + n
        faces.push(a, b, d, b, c, d)
      }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3))
    geo.setIndex(faces)
    geo.computeVertexNormals()
    geo.userData.foliage = true
    return geo
  })
}

export function makeTree(kind: number, seed: number) {
  const tree = new THREE.Group(),
    random = seeded(seed)
  const k = ((Math.floor(kind) % 4) + 4) % 4
  const tilt = (random() - 0.5) * 0.26
  const scale = 0.89 + random() * 0.23
  tree.scale.setScalar(scale)
  if (k === 1) {
    taper(tree, '#765c45', 0, 0.85, 0, 0.17, 0.1, 1.7, 9)
    const needles = ['#57775c', '#628569', '#729371', '#86a078']
    const pine = pineSkirt()
    for (let i = 0; i < 4; i++) {
      const w = 1.12 - i * 0.22
      const layer = part(
        tree,
        pine,
        needles[i],
        (tilt * i) / 4,
        1.55 + i * 0.65,
        0,
        w,
        1.85 - i * 0.23,
        w,
      )
      layer.rotation.y = i * 0.65
    }
    return tree
  }
  const colors = leaves[k]
  const tall = k === 3
  const trunk = tall ? '#c3af8d' : bark
  rod(tree, trunk, [0, 0, 0], [tilt, 1.4, 0.04], 0.21, 0.145)
  rod(tree, trunk, [tilt, 1.33, 0.04], [-tilt / 2, 2.62 + Number(tall) * 0.35, 0], 0.15, 0.075)
  for (let i = 0; i < 5; i++) {
    const a = i * 2.39 + seed * 0.7
    const x = Math.cos(a) * (tall ? 0.56 : 0.85),
      z = Math.sin(a) * (tall ? 0.58 : 0.82)
    const y = 1.9 + i * 0.16
    rod(tree, trunk, [tilt, 1.07 + i * 0.16, 0.04], [x, y + 0.22, z], 0.12 - i * 0.008, 0.045)
    crown(
      tree,
      colors[i % 4],
      x,
      y + 0.56,
      z,
      0.88 + random() * 0.22,
      0.91 + random() * 0.26 + Number(tall) * 0.17,
      0.88 + random() * 0.23,
      a,
    )
  }
  // Smaller crownlets break up broad silhouettes, like clustered tufts of dyed wool.
  for (let i = 0; i < 19; i++) {
    const a = i * 2.399 + seed * 0.31,
      y = 1.96 + (i % 5) * 0.38,
      r = (tall ? 0.8 : 1.2) * (1 - Math.max(0, y - 2.87) * 0.46)
    const size = 0.29 + random() * 0.19
    crown(
      tree,
      colors[(i + 1) % 4],
      Math.cos(a) * r,
      y,
      Math.sin(a) * r,
      size,
      size * 0.85,
      size * 0.92,
      a,
    )
  }
  crown(
    tree,
    colors[2],
    -tilt,
    3.3 + Number(tall) * 0.61,
    0.02,
    tall ? 0.79 : 1.08,
    tall ? 1.29 : 0.99,
    tall ? 0.82 : 1.04,
    seed,
  )
  if (tall) {
    for (let i = 0; i < 4; i++) {
      const scar = box(
        tree,
        '#8e806c',
        0.02,
        0.35 + i * 0.27,
        0.15 - i * 0.012,
        0.12 - (i % 2) * 0.04,
        0.033,
        0.018,
      )
      scar.rotation.z = i % 2 ? 0.15 : -0.1
    }
  }
  return tree
}

export function flowerPot(parent: THREE.Object3D, x: number, y: number, z: number, size = 1) {
  const g = group(parent, x, y, z)
  g.scale.setScalar(size)
  taper(g, '#bb785c', 0, 0.22, 0, 0.22, 0.3, 0.44)
  taper(g, '#d19571', 0, 0.43, 0, 0.32, 0.32, 0.08)
  taper(g, '#675640', 0, 0.477, 0, 0.27, 0.27, 0.014)
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399
    const r = i === 6 ? 0 : 0.14
    const h = 0.68 + (i % 3) * 0.1
    const lx = Math.cos(a) * r,
      lz = Math.sin(a) * r
    const leaf = oval(g, ['#537554', '#708550', '#879758'][i % 3], lx, h, lz, 0.19, 0.52, 0.12)
    leaf.rotation.order = 'YXZ'
    leaf.rotation.y = -a + Math.PI / 2
    leaf.rotation.x = i === 6 ? 0 : 0.63
  }
  return g
}
