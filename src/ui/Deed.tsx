import { Landmark } from 'lucide-react'
import { Postmark } from '../art/Atlas'
import type { Citizen } from '../domain/world'
export function Deed({ citizen: c }: { citizen: Citizen }) {
  return (
    <section className="deed">
      <Landmark size={25} />
      <small>NOVOTIUM LAND REGISTRY</small>
      <h2>Certificate of residence</h2>
      <p>This square in Willowmere is entrusted to</p>
      <h3>{c.name}</h3>
      <div className="deed-divider" />
      <b>{c.home}</b>
      <p>Plot {c.plot} · One square</p>
      <Postmark />
      <small>
        ISSUED{' '}
        {new Date(c.arrived)
          .toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
          .toUpperCase()}
      </small>
      <span>Local register · {c.id.slice(0, 8).toUpperCase()}</span>
    </section>
  )
}
