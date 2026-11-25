import * as T from 'three'
import { box, group, oval, rod } from './modelTools'
let print: T.MeshStandardMaterial | undefined
function landscapePrint() {
  if (print) return print
  print = new T.MeshStandardMaterial({ color: '#fffbec', roughness: 1 })
  if (typeof document === 'undefined') return print
  const c = document.createElement('canvas')
  c.width = 300
  c.height = 210
  const ctx = c.getContext('2d')
  if (!ctx) return print
  ctx.fillStyle = '#e7d7b4'
  ctx.fillRect(0, 0, 300, 210)
  ctx.fillStyle = '#c59b63'
  ctx.beginPath()
  ctx.arc(215, 58, 24, 0, Math.PI * 2)
  ctx.fill()
  for (let j = 0; j < 3; j++) {
    ctx.fillStyle = ['#a6b3a0', '#839981', '#607b65'][j]
    ctx.beginPath()
    ctx.moveTo(0, 210)
    for (let x = 0; x <= 300; x += 3)
      ctx.lineTo(x, 95 + j * 30 + Math.sin(x * 0.019 + j * 1.9) * 22 + Math.cos(x * 0.052 + j) * 6)
    ctx.lineTo(300, 210)
    ctx.fill()
  }
  for (let i = 0; i < 13; i++) {
    const x = (i * 37) % 300,
      y = 134 + ((i * 17) % 65),
      h = 12 + ((i * 11) % 28)
    ctx.fillStyle = i % 2 ? '#475e4e' : '#6a8065'
    ctx.fillRect(x - 1, y - 3, 2, 8)
    for (let j = 0; j < 3; j++) {
      ctx.beginPath()
      ctx.moveTo(x, y - h + j * h * 0.22)
      ctx.lineTo(x - h * (0.15 + j * 0.04), y - h * 0.55 + j * h * 0.23)
      ctx.lineTo(x + h * (0.15 + j * 0.04), y - h * 0.55 + j * h * 0.23)
      ctx.fill()
    }
  }
  const tex = new T.CanvasTexture(c)
  tex.colorSpace = T.SRGBColorSpace
  print.map = tex
  return print
}
export function dressInterior(house: T.Group, style: number) {
  const g = group(house, 0, 0, 0, 'interiorTrim'),
    wainscot = ['#93a08a', '#a2ab9b', '#9aafae', '#a2ad91'][style % 4],
    frame = '#81684d'
  box(g, wainscot, 0, 0.47, -1.744, 4.12, 0.73, 0.045)
  for (let j = 0; j < 18; j++) box(g, '#87967e', -1.98 + j * 0.234, 0.47, -1.715, 0.015, 0.67, 0.012)
  box(g, frame, 0, 0.85, -1.713, 4.13, 0.07, 0.07)
  box(g, frame, 0, 0.145, -1.71, 4.13, 0.085, 0.075)
  for (const sign of [-1, 1]) {
    box(g, wainscot, sign * 2.041, 0.47, 0, 0.035, 0.73, 3.48)
    box(g, frame, sign * 2.016, 0.85, 0, 0.055, 0.07, 3.49)
    box(g, frame, sign * 2.016, 0.145, 0, 0.06, 0.09, 3.49)
  }
  // Reverse window frames, small curtain folds, and a sill are visible from the room.
  for (const x of [-1.03, 1.03]) {
    box(g, frame, x, 1.34, -1.732, 0.91, 0.91, 0.05)
    box(g, '#b0c9bf', x, 1.34, -1.695, 0.76, 0.75, 0.036)
    box(g, '#f1e6c9', x, 1.34, -1.66, 0.046, 0.78, 0.035)
    box(g, '#f1e6c9', x, 1.34, -1.66, 0.75, 0.045, 0.035)
    box(g, frame, x, 0.929, -1.65, 1.04, 0.069, 0.21)
    box(g, frame, x, 1.86, -1.62, 1.11, 0.045, 0.046)
    for (const side of [-1, 1])
      for (let f = 0; f < 3; f++) {
        const drape = oval(
          g,
          f % 2 ? '#d1ad84' : '#e4ccac',
          x + side * (0.38 + f * 0.056),
          1.43,
          -1.61 + f * 0.018,
          0.13,
          0.83 - f * 0.044,
          0.09,
        )
        drape.rotation.z = side * 0.09
      }
  }
  box(g, frame, 0, 1.55, -1.68, 0.77, 0.57, 0.09)
  box(g, '#e1c899', 0, 1.55, -1.625, 0.69, 0.49, 0.035)
  const art = new T.Mesh(new T.PlaneGeometry(0.59, 0.4), landscapePrint())
  art.position.set(0, 1.55, -1.603)
  g.add(art)
  const roof = house.getObjectByName('roof')!
  for (const z of [-1.55, 0, 1.55]) {
    box(roof, frame, 0, 2.3, z, 4.2, 0.12, 0.12)
    for (const sign of [-1, 1]) rod(roof, frame, [sign * 2, 2.32, z], [sign * 1.53, 2.78, z], 0.075)
  }
}
