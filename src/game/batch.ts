import * as T from 'three'
const white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })
const doubleWhite = white.clone()
doubleWhite.side = T.DoubleSide
const foliage = white.clone(),
  windowGlass = white.clone()
const wind = { value: 0 }
foliage.onBeforeCompile = (shader) => {
  shader.uniforms.novotiumWind = wind
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float novotiumWind;')
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
 #ifdef USE_INSTANCING
 transformed.x+=.024*sin(instanceMatrix[3].x*.6+instanceMatrix[3].z*.3+novotiumWind*1.2)*(position.y*.4+.6);
 #endif`,
    )
}
const luminous = new Set(['759599', 'a4b6aa', 'a3aaa0', 'b0c9bf', 'ffe1a3', 'e3bc7d'])
export function environmentPaint(time: number, daylight: number) {
  wind.value = time
  windowGlass.emissive.set('#efaa52')
  windowGlass.emissiveIntensity = (1 - daylight) * 1.28
}
/** Reuse geometry across paint colours. Each instance retains its own original colour. */
export function batch(root: T.Object3D) {
  root.updateWorldMatrix(true, true)
  const inv = new T.Matrix4().copy(root.matrixWorld).invert(),
    groups = new Map<
      string,
      {
        geometry: T.BufferGeometry
        material: T.Material | T.Material[]
        matrices: T.Matrix4[]
        colors: T.Color[]
        cast: boolean
      }
    >()
  root.traverseVisible((o) => {
    if (!(o instanceof T.Mesh)) return
    const m = o.material,
      paint =
        m instanceof T.MeshStandardMaterial &&
        !m.map &&
        !m.transparent &&
        !m.vertexColors &&
        m.onBeforeCompile === T.Material.prototype.onBeforeCompile &&
        m.emissive.getHex() === 0
    const mat = paint
      ? o.geometry.userData.foliage
        ? foliage
        : luminous.has(m.color.getHexString())
          ? windowGlass
          : m.side === T.DoubleSide
            ? doubleWhite
            : white
      : m
    const key =
      o.geometry.uuid +
      ':' +
      (Array.isArray(mat) ? mat.map((a) => a.uuid).join() : mat.uuid) +
      ':' +
      o.castShadow
    let p = groups.get(key)
    if (!p) {
      p = { geometry: o.geometry, material: mat, matrices: [], colors: [], cast: o.castShadow }
      groups.set(key, p)
    }
    const transform = inv.clone().multiply(o.matrixWorld)
    if (o instanceof T.InstancedMesh) {
      for (let n = 0; n < o.count; n++) {
        const local = new T.Matrix4()
        o.getMatrixAt(n, local)
        p.matrices.push(transform.clone().multiply(local))
        if (paint) {
          const col = m.color.clone()
          if (o.instanceColor) {
            const tint = new T.Color()
            o.getColorAt(n, tint)
            col.multiply(tint)
          }
          p.colors.push(col)
        }
      }
    } else {
      p.matrices.push(transform)
      if (paint) p.colors.push(m.color)
    }
  })
  const out = new T.Group()
  for (const p of groups.values()) {
    const m = new T.InstancedMesh(p.geometry, p.material, p.matrices.length)
    p.matrices.forEach((v, i) => m.setMatrixAt(i, v))
    p.colors.forEach((v, i) => m.setColorAt(i, v))
    m.castShadow = p.cast
    m.receiveShadow = true
    m.computeBoundingSphere()
    out.add(m)
  }
  return out
}
export function releaseBatch(root: T.Object3D) {
  root.traverse((o) => {
    if (o instanceof T.InstancedMesh) o.dispose()
  })
  root.removeFromParent()
}
