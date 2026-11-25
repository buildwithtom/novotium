import * as THREE from 'three'

const geometries = new Map<string, THREE.BufferGeometry>()
const materials = new Map<string, THREE.MeshStandardMaterial>()

export function geometry(key: string, build: () => THREE.BufferGeometry) {
  let value = geometries.get(key)
  if (!value) {
    value = build()
    geometries.set(key, value)
  }
  return value
}
export function paint(color: string) {
  let value = materials.get(color)
  if (!value) {
    value = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 })
    materials.set(color, value)
  }
  return value
}
export function group(parent: THREE.Object3D, x = 0, y = 0, z = 0, name = '') {
  const result = new THREE.Group()
  result.position.set(x, y, z)
  result.name = name
  parent.add(result)
  return result
}
export function part(
  parent: THREE.Object3D,
  shape: THREE.BufferGeometry,
  color: string,
  x: number,
  y: number,
  z: number,
  w = 1,
  h = 1,
  d = 1,
) {
  const mesh = new THREE.Mesh(shape, paint(color))
  mesh.position.set(x, y, z)
  mesh.scale.set(w, h, d)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}
export function box(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  return part(
    parent,
    geometry('block', () => new THREE.BoxGeometry()),
    color,
    x,
    y,
    z,
    w,
    h,
    d,
  )
}
export function oval(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  return part(
    parent,
    geometry('egg', () => new THREE.SphereGeometry(0.5, 12, 8)),
    color,
    x,
    y,
    z,
    w,
    h,
    d,
  )
}
export function taper(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  bottomR: number,
  topR: number,
  height: number,
  sides = 12,
) {
  const ratio = topR / bottomR
  const geo = geometry(
    'taper' + ratio.toFixed(3) + '-' + sides,
    () => new THREE.CylinderGeometry(ratio, 1, 1, sides),
  )
  return part(parent, geo, color, x, y, z, bottomR, height, bottomR)
}
export type Point = [number, number, number]
export function rod(
  parent: THREE.Object3D,
  color: string,
  a: Point,
  b: Point,
  radius: number,
  endRadius = radius,
) {
  const start = new THREE.Vector3(...a)
  const end = new THREE.Vector3(...b)
  const dir = end.clone().sub(start)
  const mid = start.addScaledVector(dir, 0.5)
  const mesh = taper(parent, color, mid.x, mid.y, mid.z, radius, endRadius, dir.length(), 7)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return mesh
}
export function seeded(seed: number) {
  let s = (Math.floor(seed * 1201) ^ 0x65c8ad) >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}
export function tone(base: string, light: number) {
  return '#' + new THREE.Color(base).offsetHSL(0, 0, light).getHexString()
}

/** A shingle with two clipped corners, front lip and a broad flat face. Local +X is downhill. */
export function tileGeometry() {
  return geometry('shingle', () => {
    const pts = [
      [-0.5, -0.5],
      [0.4, -0.5],
      [0.5, -0.33],
      [0.5, 0.31],
      [0.4, 0.5],
      [-0.5, 0.5],
    ]
    const arr: number[] = []
    const tri = (a: number[], b: number[], c: number[]) => arr.push(...a, ...b, ...c)
    const vert = (i: number, top: boolean) => [pts[i][0], top ? 0.5 : -0.5, pts[i][1]]
    for (let i = 1; i < pts.length - 1; i++) {
      tri(vert(0, true), vert(i + 1, true), vert(i, true))
      tri(vert(0, false), vert(i, false), vert(i + 1, false))
    }
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length
      tri(vert(i, true), vert(j, true), vert(j, false))
      tri(vert(i, true), vert(j, false), vert(i, false))
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
    geo.computeVertexNormals()
    return geo
  })
}
