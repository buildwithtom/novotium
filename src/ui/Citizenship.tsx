import { useState } from 'react'
import { BookOpen, Check, Flower2, Home, MapPin, Stamp } from 'lucide-react'
import {
  COATS,
  HAIR,
  SKINS,
  plots,
  catalog,
  type Arrival,
  type Citizen,
  type Kind,
} from '../domain/world'
import { Postmark } from '../art/Atlas'
import { Preview } from './Preview'
export function Colours({
  title,
  colors,
  value,
  set,
}: {
  title: string
  colors: string[]
  value: string
  set: (v: string) => void
}) {
  return (
    <fieldset className="colour-field">
      <legend>{title}</legend>
      <div className="swatches">
        {colors.map((c, i) => (
          <button
            type="button"
            key={c}
            aria-label={title + ' ' + (i + 1)}
            aria-pressed={value === c}
            style={{ background: c }}
            onClick={() => set(c)}
          >
            {value === c && <Check size={13} />}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
export function ArrivalForm({ join, plot }: { join: (a: Arrival) => void; plot?: string }) {
  const [step, setStep] = useState(0),
    [v, set] = useState<Arrival>({
      name: '',
      home: 'Fern Cottage',
      plot: plot || 'B1',
      skin: SKINS[1],
      hair: HAIR[0],
      coat: COATS[0],
      style: 2,
      house: 0,
      gift: 'plant',
    })
  const setVal = <K extends keyof Arrival>(k: K, val: Arrival[K]) => set({ ...v, [k]: val })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!step) setStep(1)
        else join(v)
      }}
    >
      <div className="progress-line">
        <span className={!step ? 'active' : ''}>01 · Citizen</span>
        <i />
        <span className={step ? 'active' : ''}>02 · Residence</span>
      </div>
      {!step ? (
        <>
          <h2>Become a Novotian</h2>
          <p>Choose the name your neighbours will know you by.</p>
          <div className="portrait-tile">
            <Preview person={v} label="Your Novotian figurine" />
            <span>Citizen portrait</span>
          </div>
          <label>
            Citizen name
            <input
              maxLength={32}
              value={v.name}
              placeholder="Your name in Novotium"
              required
              autoFocus
              onChange={(e) => setVal('name', e.target.value)}
            />
          </label>
          <Colours title="Skin tone" colors={SKINS} value={v.skin} set={(s) => setVal('skin', s)} />
          <Colours title="Hair colour" colors={HAIR} value={v.hair} set={(s) => setVal('hair', s)} />
          <Colours title="Coat colour" colors={COATS} value={v.coat} set={(s) => setVal('coat', s)} />
          <label>
            Hair & accessories
            <select value={v.style} onChange={(e) => setVal('style', +e.target.value)}>
              {['Short crop', 'Tied bun', 'Straw hat', 'Bob cut'].map((s, i) => (
                <option key={s} value={i}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button className="primary wide" disabled={!v.name.trim()}>
            <MapPin size={16} />
            Choose a plot
          </button>
        </>
      ) : (
        <>
          <h2>A place of your own</h2>
          <p>Every Novotian can claim one equal square in Willowmere.</p>
          <label>
            Your plot
            <select value={v.plot} onChange={(e) => setVal('plot', e.target.value)}>
              {plots
                .filter((p) => !p.resident)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Home name
            <input
              required
              value={v.home}
              maxLength={40}
              onChange={(e) => setVal('home', e.target.value)}
            />
          </label>
          <label>
            Starter home
            <select value={v.house} onChange={(e) => setVal('house', +e.target.value)}>
              <option value={0}>Country cottage</option>
              <option value={1}>Timber cottage</option>
              <option value={-1}>Empty meadow</option>
            </select>
          </label>
          {v.house >= 0 && (
            <div className="house-preview">
              <Preview house={v.house} label="Starter home" />
            </div>
          )}
          <label>
            Housewarming gift
            <select value={v.gift} onChange={(e) => setVal('gift', e.target.value as Kind)}>
              {(['plant', 'rug', 'lamp'] as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {catalog[k].name}
                </option>
              ))}
            </select>
          </label>
          <div className="row-actions">
            <button type="button" className="secondary" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="primary" disabled={!v.home.trim()}>
              <Stamp size={16} />
              Claim my square
            </button>
          </div>
        </>
      )}
    </form>
  )
}
export function Passport({ c, edit }: { c: Citizen; edit: () => void }) {
  return (
    <>
      <div className="passport">
        <div className="passport-top">
          <BookOpen size={23} />
          <span>DEPARTMENT OF CITIZENSHIP</span>
        </div>
        <h2>Novotian passport</h2>
        <div className="passport-person">
          <Preview person={c} label={c.name + '’s portrait'} />
          <div>
            <small>CITIZEN NAME</small>
            <h3>{c.name}</h3>
            <span>Novotian</span>
          </div>
        </div>
        <dl>
          <dt>Home</dt>
          <dd>{c.home}</dd>
          <dt>Residence</dt>
          <dd>Willowmere · {c.plot}</dd>
          <dt>Entitlement</dt>
          <dd>One square</dd>
          <dt>Arrived</dt>
          <dd>
            {new Date(c.arrived).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </dd>
          <dt>Local citizen ID</dt>
          <dd>{c.id.slice(0, 8).toUpperCase()}</dd>
        </dl>
        {c.bio && <p>{c.bio}</p>}
        <Postmark />
      </div>
      <button className="secondary wide" onClick={edit}>
        <Flower2 size={15} />
        Edit citizen & home
      </button>
    </>
  )
}
export function ProfileForm({ c, save }: { c: Citizen; save: (v: Partial<Citizen>) => void }) {
  const [v, set] = useState({ ...c })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const { name, home, bio, access, coat, hair, skin, style, house, roof } = v
        save({ name, home, bio, access, coat, hair, skin, style, house, roof })
      }}
    >
      <h2>Citizen & home</h2>
      <label>
        Citizen name
        <input
          required
          maxLength={32}
          value={v.name}
          onChange={(e) => set({ ...v, name: e.target.value })}
        />
      </label>
      <label>
        Home name
        <input
          required
          maxLength={40}
          value={v.home}
          onChange={(e) => set({ ...v, home: e.target.value })}
        />
      </label>
      <label>
        Biography
        <textarea maxLength={200} value={v.bio} onChange={(e) => set({ ...v, bio: e.target.value })} />
      </label>
      <label>
        Visitor access
        <select
          value={v.access}
          onChange={(e) => set({ ...v, access: e.target.value as Citizen['access'] })}
        >
          {['Open house', 'Garden only', 'Private'].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </label>
      <label>
        Architecture
        <select value={v.house} onChange={(e) => set({ ...v, house: +e.target.value })}>
          <option value={0}>Country cottage</option>
          <option value={1}>Timber cottage</option>
          <option value={-1}>Empty meadow</option>
        </select>
      </label>
      <Colours
        title="Roof paint"
        colors={['#ae674d', '#778c79', '#80939a', '#9e825f']}
        value={v.roof}
        set={(roof) => set({ ...v, roof })}
      />
      <Colours title="Coat colour" colors={COATS} value={v.coat} set={(coat) => set({ ...v, coat })} />
      <Colours title="Skin tone" colors={SKINS} value={v.skin} set={(skin) => set({ ...v, skin })} />
      <Colours title="Hair colour" colors={HAIR} value={v.hair} set={(hair) => set({ ...v, hair })} />
      <label>
        Hairstyle
        <select value={v.style} onChange={(e) => set({ ...v, style: +e.target.value })}>
          {['Short crop', 'Tied bun', 'Straw hat', 'Bob cut'].map((n, i) => (
            <option key={n} value={i}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button className="primary wide">
        <Home size={15} />
        Save changes
      </button>
    </form>
  )
}
