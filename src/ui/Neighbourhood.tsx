import {
  MapIcon,
  Footprints,
  ChevronRight,
  LandPlot,
  Stamp,
  DoorOpen,
  Layers3,
  Hammer,
  ShoppingBasket,
} from 'lucide-react'
import { DistrictMap } from '../art/Atlas'
import { canEnter, catalog, localPlot, plots, type Game, type Plot } from '../domain/world'
import { type ViewState } from '../game/engine'
import { Preview } from './Preview'
export function AtlasSheet({
  game,
  hud,
  walk,
  focus,
}: {
  game: Game
  hud: ViewState
  walk: () => void
  focus: (id: string) => void
}) {
  const c = game.citizen
  return (
    <>
      <div className="eyebrow">
        <MapIcon size={14} />
        NEIGHBOURHOOD ATLAS
      </div>
      <h2>Explore Willowmere</h2>
      <div className="map-large">
        <DistrictMap x={hud.x} z={hud.z} homePlot={c && c.house >= 0 ? c.plot : undefined} />
      </div>
      <button className="primary wide" onClick={walk}>
        <Footprints size={16} />
        Take a walk
      </button>
      <h4 className="section-title">Plot directory</h4>
      {plots.map((base) => {
        const q = localPlot(game, base)
        return (
          <button className="directory" key={q.id} onClick={() => focus(q.id)}>
            <span className="address">{q.id}</span>
            <span>
              <b>{q.name}</b>
              <small>
                {q.id === c?.plot
                  ? 'Your home'
                  : q.resident
                    ? q.resident + ' · simulated resident'
                    : 'Available to claim'}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
        )
      })}
    </>
  )
}
export function PlotSheet({
  game,
  p,
  open,
  visit,
  inspect,
  cutaway,
}: {
  game: Game
  p: Plot
  open: (p: 'join' | 'build' | 'deed') => void
  visit: (p: Plot, inside?: boolean) => void
  inspect: (id: string) => void
  cutaway: () => void
}) {
  const c = game.citizen
  return (
    <>
      <div className="eyebrow">
        <LandPlot size={14} /> PLOT {p.id} · WILLOWMERE
      </div>
      <h2>{p.name}</h2>
      <p>
        {p.id === c?.plot
          ? 'Your little corner of Novotium.'
          : p.resident
            ? 'Home of ' + p.resident + ', a simulated Novotian.'
            : 'An unclaimed square of meadow in Willowmere.'}
      </p>
      {p.resident && p.style >= 0 && (
        <div className="house-preview">
          <Preview house={p.style} label={p.name} />
        </div>
      )}
      <div className="info-line">
        <LandPlot size={16} />
        One square<span>{p.resident ? p.access : 'Available'}</span>
      </div>
      {!p.resident && !c && (
        <button className="primary wide" onClick={() => open('join')}>
          <Stamp size={16} />
          Claim this plot
        </button>
      )}
      {p.resident && p.style >= 0 && canEnter(game, p) && (
        <button className="primary wide" onClick={() => visit(p, true)}>
          <DoorOpen size={16} />
          Enter house
        </button>
      )}
      <button className="secondary wide" onClick={() => visit(p)}>
        <Footprints size={16} />
        Visit doorstep
      </button>
      {p.resident && p.style >= 0 && canEnter(game, p) && (
        <button className="secondary wide" onClick={cutaway}>
          <Layers3 size={16} />
          Look inside
        </button>
      )}
      {p.id === c?.plot && (
        <>
          <button className="secondary wide" onClick={() => open('build')}>
            <Hammer size={16} />
            Decorate home
          </button>
          <button className="secondary wide" onClick={() => open('deed')}>
            <Stamp size={16} />
            View plot certificate
          </button>
        </>
      )}
      {game.items
        .filter((i) => i.where === 'listed' && i.owner === (p.id === c?.plot ? c?.id : p.resident))
        .map((i) => (
          <button key={i.id} className="directory" onClick={() => inspect(i.id)}>
            <ShoppingBasket size={18} />
            <span>
              <b>{catalog[i.kind].name}</b>
              <small>{i.price ? i.price + ' coins · doorstep sale' : 'Free Stuff Box'}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
    </>
  )
}
export function FieldGuide() {
  return (
    <>
      <h2>Field controls</h2>
      {[
        ['Pan the map', 'Drag'],
        ['Orbit the map', 'Shift + drag'],
        ['Zoom', 'Scroll or + / −'],
        ['Change camera', '1 / 2 / 3'],
        ['Walk', 'WASD or arrows'],
        ['Look around', 'Drag in Character or Street'],
        ['Free look', 'Click in Street view'],
        ['Inspect nearby', 'E'],
        ['Build or decorate', 'B'],
        ['Rotate belonging', 'R'],
        ['Store selected belonging', 'Delete'],
        ['Undo / redo', 'Ctrl or ⌘ + Z / Shift + Z'],
        ['Photography mode', 'P'],
        ['Close or cancel', 'Escape'],
      ].map(([a, b]) => (
        <div className="guide-row" key={a}>
          <span>{a}</span>
          <kbd>{b}</kbd>
        </div>
      ))}
    </>
  )
}
