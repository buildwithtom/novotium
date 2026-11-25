import { useEffect, useState } from 'react'
import * as T from 'three'
import { makeCitizen, makeFurniture, makeHouse } from '../art/miniatures'
import type { Kind } from '../domain/world'
let render: T.WebGLRenderer | undefined
const cache = new Map<string, string>()
type PreviewProps = {
  kind?: Kind
  house?: number
  person?: { skin: string; coat: string; hair: string; style: number }
  label: string
}
function renderPreview({ kind, person, house }: PreviewProps) {
  render ??= new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  render.setSize(172, 154)
  render.setClearColor(0, 0)
  const scene = new T.Scene()
  scene.add(new T.HemisphereLight('#fff7df', '#a09d88', 2.25))
  const light = new T.DirectionalLight('#ffe9ce', 2.3)
  light.position.set(-2, 4, 4)
  scene.add(light)
  const model = person
    ? makeCitizen(person.skin, person.hair, person.coat, person.style)
    : house !== undefined
      ? makeHouse(house)
      : makeFurniture(kind || 'chair')
  scene.add(model)
  const bounds = new T.Box3().setFromObject(model),
    center = bounds.getCenter(new T.Vector3()),
    size = bounds.getSize(new T.Vector3()),
    d = Math.max(size.y, size.x, size.z) * 0.72
  const camera = new T.OrthographicCamera(-d * 1.12, d * 1.12, d, -d, 0.01, 80)
  camera.position
    .copy(center)
    .add(new T.Vector3(person ? 0.6 : 3, person ? 0.7 : 2.5, 5).normalize().multiplyScalar(15))
  camera.lookAt(center)
  render.render(scene, camera)
  return render.domElement.toDataURL()
}
export function Preview(props: PreviewProps) {
  const key = JSON.stringify([
      props.kind,
      props.house,
      props.person?.skin,
      props.person?.coat,
      props.person?.hair,
      props.person?.style,
    ]),
    [src, set] = useState<string>()
  useEffect(() => {
    try {
      if (!cache.has(key)) cache.set(key, renderPreview(props))
      set(cache.get(key))
    } catch {
      set(undefined)
    }
  }, [key])
  return <span className="preview">{src && <img alt={props.label} src={src} />}</span>
}
