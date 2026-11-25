import * as T from 'three'
/** Distant painted hills surround the walking cameras, below the atlas viewpoint. */
export function makeHorizon() {
  const group = new T.Group()
  for (let layer = 0; layer < 3; layer++) {
    const radius = 38 + layer * 16,
      points: number[] = [],
      indices: number[] = []
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2,
        h =
          2.6 +
          layer * 1.8 +
          Math.sin(a * (4 + layer) + layer) * 2.3 +
          Math.cos(a * 8 + layer * 1.7) * 1.25
      points.push(
        Math.cos(a) * radius,
        -10,
        Math.sin(a) * radius,
        Math.cos(a) * radius,
        h,
        Math.sin(a) * radius,
      )
      if (i) {
        const n = i * 2
        indices.push(n - 2, n - 1, n, n, n - 1, n + 1)
      }
    }
    const geo = new T.BufferGeometry()
    geo.setAttribute('position', new T.Float32BufferAttribute(points, 3))
    geo.setIndex(indices)
    group.add(
      new T.Mesh(
        geo,
        new T.MeshBasicMaterial({ color: ['#98ad8e', '#b0c2a7', '#becbb6'][layer], side: T.DoubleSide }),
      ),
    )
  }
  const ground = new T.Mesh(new T.CircleGeometry(90, 80), new T.MeshBasicMaterial({ color: '#acb899' }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.65
  group.add(ground)
  return group
}
