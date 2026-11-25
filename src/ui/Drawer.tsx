import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { BrandMark } from '../art/Atlas'
export function IconBtn({
  label,
  onClick,
  children,
  active = false,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  active?: boolean
}) {
  return (
    <button
      className={'icon-btn' + (active ? ' on' : '')}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
export function Drawer({
  title,
  close,
  children,
}: {
  title: string
  close: () => void
  children: ReactNode
}) {
  const root = useRef<HTMLElement>(null),
    latest = useRef(close)
  latest.current = close
  useEffect(() => {
    const last = document.activeElement as HTMLElement
    const el = root.current
    const auto = el?.querySelector<HTMLElement>('input[autofocus],button')
    auto?.focus({ preventScroll: true })
    function trap(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !el) return
      const all = Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled):not([hidden]),select,textarea,[tabindex="0"]',
        ),
      ).filter((e) => e.offsetParent !== null)
      if (!all.length) return
      const i = all.indexOf(document.activeElement as HTMLElement)
      if ((e.shiftKey && i <= 0) || (!e.shiftKey && i === all.length - 1)) {
        e.preventDefault()
        all[e.shiftKey ? all.length - 1 : 0].focus()
      }
    }
    el?.addEventListener('keydown', trap)
    return () => {
      el?.removeEventListener('keydown', trap)
      if (last?.isConnected) last.focus({ preventScroll: true })
    }
  }, [])
  return (
    <aside className="drawer paper" role="dialog" aria-modal="true" aria-label={title} ref={root}>
      <div className="drawer-head">
        <span>
          <BrandMark /> WILLOWMERE
        </span>
        <IconBtn label="Close panel" onClick={close}>
          <X size={18} />
        </IconBtn>
      </div>
      <div className="drawer-body">{children}</div>
    </aside>
  )
}
