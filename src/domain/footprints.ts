/** Width, depth and height of the placeable object. Saplings reserve their trunk and root bed. */
export const dimensions = {
  chair: [0.65, 0.63, 1.18],
  table: [1.24, 1.24, 0.82],
  plant: [0.65, 0.65, 1.16],
  tree: [1.12, 1.12, 2.4],
  rug: [1.36, 2.06, 0.07],
  lamp: [0.78, 0.78, 1.9],
  bench: [1.76, 0.64, 1.18],
  bookshelf: [1.25, 0.52, 1.84],
  bed: [1.12, 1.93, 1.13],
} as const
export function footprint(kind: keyof typeof dimensions, rotation: number) {
  const [w, d] = dimensions[kind],
    cos = Math.abs(Math.cos(rotation)),
    sin = Math.abs(Math.sin(rotation))
  return { halfX: (w * cos + d * sin) / 2, halfZ: (w * sin + d * cos) / 2 }
}
