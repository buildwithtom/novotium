import { BALANCE, accruedDays, recipes, type Recipe } from '../domain/economy'
import { useState } from 'react'
import { Armchair, Coins, Gift, Package, ShoppingBag, Stamp, Store } from 'lucide-react'
import { catalog, dayOf, stock, type Game, type Item, type Action, type Kind } from '../domain/world'
import { Preview } from './Preview'
export type Do = (action: Action, message: string, after?: () => void) => void
export function ItemRow({
  item,
  onClick,
  detail,
  end,
}: {
  item: Kind
  onClick: () => void
  detail: string
  end?: string
}) {
  return (
    <button className="item-row" onClick={onClick}>
      <Preview kind={item} label={catalog[item].name} />
      <span>
        <b>{catalog[item].name}</b>
        <small>{detail}</small>
      </span>
      {end && <em>{end}</em>}
    </button>
  )
}
export function Collection({
  g,
  inspect,
  build,
}: {
  g: Game
  inspect: (id: string) => void
  build: boolean
}) {
  const [filter, setFilter] = useState('All'),
    items = g.items.filter(
      (i) => i.owner === g.citizen?.id && (filter === 'All' || catalog[i.kind].category === filter),
    )
  return (
    <>
      <h2>{build ? 'Build & decorate' : 'Your satchel'}</h2>
      <p>
        {build
          ? 'Choose a belonging to place or move on your square.'
          : 'Your belongings, wherever you have put them.'}
      </p>
      <div className="tabs">
        {['All', 'Furniture', 'Garden', 'Furnishings'].map((n) => (
          <button key={n} className={filter === n ? 'active' : ''} onClick={() => setFilter(n)}>
            {n}
          </button>
        ))}
      </div>
      {items.length ? (
        items.map((i) => (
          <ItemRow
            key={i.id}
            item={i.kind}
            onClick={() => inspect(i.id)}
            detail={
              i.where === 'inventory'
                ? 'In your satchel'
                : i.where === 'placed'
                  ? 'Placed at home'
                  : 'On the doorstep'
            }
            end="Inspect"
          />
        ))
      ) : (
        <p>No belongings in this category.</p>
      )}
    </>
  )
}
export function Market({
  g,
  inspect,
  act,
  join,
}: {
  g: Game
  inspect: (id: string) => void
  act: Do
  join: () => void
}) {
  const [tab, setTab] = useState('Doorsteps'),
    [chosen, setChosen] = useState<Kind | null>(null)
  return (
    <>
      <h2>Willowmere Market</h2>
      <p>Second-hand finds and new things for home.</p>
      <div className="tabs">
        {['Doorsteps', 'Free box', 'Stall', 'Workshop', 'Ledger'].map((t) => (
          <button
            key={t}
            className={t === tab ? 'active' : ''}
            onClick={() => {
              setTab(t)
              setChosen(null)
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Workshop' ? (
        <>
          <p>Use your materials to make a new belonging.</p>
          {g.citizen && (
            <div className="resources">
              <span>{g.materials.wood} wood</span>
              <span>{g.materials.stone} stone</span>
              <span>{g.materials.seeds} seeds</span>
            </div>
          )}
          {(Object.keys(recipes) as Recipe[]).map((k) => (
            <ItemRow
              key={k}
              item={k}
              detail={Object.entries(recipes[k])
                .map(([a, b]) => b + ' ' + a)
                .join(' · ')}
              end="Make"
              onClick={() =>
                g.citizen
                  ? act({ type: 'craft', kind: k }, 'Handmade and stored in your satchel.')
                  : join()
              }
            />
          ))}
        </>
      ) : tab === 'Stall' ? (
        chosen ? (
          <>
            <div className="item-hero">
              <Preview kind={chosen} label={catalog[chosen].name} />
            </div>
            <h3>{catalog[chosen].name}</h3>
            <p>{catalog[chosen].description}</p>
            <button
              className="primary wide"
              onClick={() =>
                g.citizen
                  ? act({ type: 'shop', kind: chosen }, 'The marketkeeper tucked it into your satchel.')
                  : join()
              }
            >
              <ShoppingBag size={16} />
              Buy for {catalog[chosen].price} coins
            </button>
            <button className="text-button" onClick={() => setChosen(null)}>
              Back to stall
            </button>
          </>
        ) : (
          stock().map((k) => (
            <ItemRow
              key={k}
              item={k}
              detail={catalog[k].category}
              end={catalog[k].price + ' coins'}
              onClick={() => setChosen(k)}
            />
          ))
        )
      ) : tab === 'Ledger' ? (
        <>
          {g.trades.length ? (
            g.trades
              .slice()
              .reverse()
              .map((t, i) => (
                <div className="list-note" key={i}>
                  <Coins size={16} />
                  <div>
                    <b>{catalog[g.items.find((it) => it.id === t.item)!.kind].name}</b>
                    <small>
                      {t.to === g.citizen?.id
                        ? 'Received from ' + t.from
                        : 'Transferred to ' + t.to + ' (simulated)'}{' '}
                      · {t.price} coins
                    </small>
                  </div>
                </div>
              ))
          ) : (
            <p>Your completed doorstep exchanges will appear here.</p>
          )}
        </>
      ) : (
        <>
          {g.items
            .filter((i) => i.where === 'listed' && (tab === 'Free box' ? i.price === 0 : i.price! > 0))
            .map((i) => (
              <ItemRow
                key={i.id}
                item={i.kind}
                detail={i.owner === g.citizen?.id ? 'Your doorstep' : i.owner + ' · simulated resident'}
                end={i.price ? i.price + ' coins' : 'Free'}
                onClick={() => inspect(i.id)}
              />
            ))}
          {!g.items.some(
            (i) => i.where === 'listed' && (tab === 'Free box' ? i.price === 0 : i.price! > 0),
          ) && <p>The {tab === 'Free box' ? 'free box' : 'doorstep'} is empty.</p>}
          {tab === 'Free box' && <p className="fine">Collect up to three gifts each day.</p>}
        </>
      )}
      {g.citizen && (
        <div className="allowance">
          <span>
            <Coins size={16} />
            {g.coins} coins
          </span>
          <button
            disabled={g.reward >= dayOf()}
            onClick={() =>
              act({ type: 'reward' }, 'Coins, wood, stone and seeds added to your supplies.')
            }
          >
            {g.reward >= dayOf()
              ? 'Allowance collected'
              : 'Collect allowance · ' +
                BALANCE.allowance.coins *
                  accruedDays(g.reward, dayOf(new Date(g.citizen.arrived)), dayOf()) +
                ' coins'}
          </button>
        </div>
      )}
    </>
  )
}
export function ItemBook({
  g,
  item: i,
  act,
  place,
  join,
  close,
  sit,
}: {
  g: Game
  item: Item
  act: Do
  place: () => void
  join: () => void
  close: () => void
  sit: () => void
}) {
  const [price, setPrice] = useState('9'),
    owned = g.citizen?.id === i.owner
  return (
    <>
      <div className="eyebrow">
        <Stamp size={13} />
        OBJECT PASSPORT
      </div>
      <h2>{catalog[i.kind].name}</h2>
      <div className="item-hero">
        <Preview kind={i.kind} label={catalog[i.kind].name} />
      </div>
      <p>{catalog[i.kind].description}</p>
      <dl className="record">
        <dt>Item number</dt>
        <dd>{i.id.slice(0, 8).toUpperCase()}</dd>
        <dt>Owner</dt>
        <dd>{owned ? g.citizen?.name : i.owner + ' (simulated)'}</dd>
        <dt>Location</dt>
        <dd>
          {i.where === 'listed'
            ? i.price
              ? 'Doorstep sale'
              : 'Free Stuff Box'
            : i.where === 'placed'
              ? 'At home'
              : 'Satchel'}
        </dd>
      </dl>
      {i.where === 'listed' && !owned ? (
        <button
          className="primary wide"
          onClick={() =>
            g.citizen
              ? act({ type: 'buy', id: i.id }, 'Added to your satchel. Its story comes with it.', close)
              : join()
          }
        >
          {i.price ? <Coins size={16} /> : <Gift size={16} />}{' '}
          {i.price ? 'Purchase for ' + i.price + ' coins' : 'Collect free item'}
        </button>
      ) : owned && i.where === 'listed' ? (
        <>
          <button
            className="primary wide"
            onClick={() =>
              act(
                { type: 'simulate', id: i.id },
                'Robin, a simulated neighbour, collected your listing.',
                close,
              )
            }
          >
            <Store size={16} />
            Simulate neighbour collection
          </button>
          <button
            className="secondary wide"
            onClick={() => act({ type: 'cancel', id: i.id }, 'Listing cancelled.', close)}
          >
            Cancel listing
          </button>
        </>
      ) : owned ? (
        <>
          <button className="primary wide" onClick={place}>
            <Armchair size={16} />
            {i.where === 'placed' ? 'Move belonging' : 'Place at home'}
          </button>
          {i.where === 'placed' ? (
            <>
              <button
                className="secondary wide"
                onClick={() => act({ type: 'store', id: i.id }, 'Stored in your satchel.', close)}
              >
                <Package size={16} />
                Store in satchel
              </button>
              {['chair', 'bench'].includes(i.kind) && (
                <button className="secondary wide" onClick={sit}>
                  Sit here
                </button>
              )}
            </>
          ) : (
            <div className="sell-row">
              <label>
                Asking price
                <input
                  type="number"
                  min={0}
                  max={9999}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
              <button
                className="secondary"
                onClick={() =>
                  act(
                    { type: 'list', id: i.id, price: price === '' ? NaN : Number(price) },
                    'Displayed on your doorstep.',
                    close,
                  )
                }
              >
                <Store size={15} />
                {Number(price) === 0 ? 'Give away' : 'List for sale'}
              </button>
            </div>
          )}
        </>
      ) : null}
      <h4 className="section-title">Ownership history</h4>
      {i.history.map((h, n) => (
        <div className="list-note" key={n}>
          <span className="history-dot" />
          <div>
            <b>{h.owner === g.citizen?.id ? g.citizen.name : h.owner}</b>
            <small>{h.note}</small>
          </div>
        </div>
      ))}
    </>
  )
}
