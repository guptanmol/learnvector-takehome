import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CloudDownload, Check, LoaderCircle, Plus, X } from 'lucide-react'
import { OFFLINE_LABEL, type Offline } from '../guide'
import { useDismiss } from '../hooks'
import { LATER, MINUTE_STOPS, type Item, type Sitting } from '../plan'

interface SegProps<T extends string | number> {
  id: string
  options: { value: T; label: string }[]
  value: T | null
  guess?: boolean
  onChange: (v: T) => void
  label?: string
}

// A segmented control with a thumb that slides to the choice.
function Segmented<T extends string | number>({ id, options, value, guess, onChange, label }: SegProps<T>) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button key={o.value} role="radio" aria-checked={on} className={`seg__opt ${on ? 'is-on' : ''}`} onClick={() => onChange(o.value)}>
            {on && <motion.span layoutId={`thumb-${id}`} className={`seg__thumb ${guess ? 'is-guess' : ''}`} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="seg__label">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const OFFLINE_ICON: Record<Offline, JSX.Element> = {
  no: <CloudDownload size={16} strokeWidth={2} />,
  saving: <LoaderCircle className="spin" size={16} strokeWidth={2.2} />,
  saved: <Check size={16} strokeWidth={2.4} />,
}

interface DockProps {
  items: Item[]
  sittings: Sitting[]
  guess: boolean
  onMinutes: (id: string, m: number) => void
  onAdd: (when: string) => void
  onRemove: (id: string) => void
  onStart: () => void
  offline: Offline
  onOffline: () => void
}

// Time comes in sittings, not days: ten minutes now, twenty after lunch. "Right now" is what Start
// plays; later sittings hold the next pieces, and you can add or drop them as your day changes.
export function Dock({ items, sittings, guess, onMinutes, onAdd, onRemove, onStart, offline, onOffline }: DockProps) {
  const [now, ...later] = sittings
  const nowItems = items.filter((it) => it.slot === 0)
  const used = nowItems.reduce((a, it) => a + it.m.min, 0)
  const free = LATER.filter((w) => !sittings.some((s) => s.when === w))
  return (
    <div className="dock">
      <div className="dock__in">
        <div className="dock__time">
          <span className="dock__label">Right now</span>
          <Segmented id="time" label="How much time you have right now" options={MINUTE_STOPS.map((m) => ({ value: m, label: `${m} min` }))} value={now.min} guess={guess} onChange={(m) => onMinutes(now.id, m)} />
        </div>

        <div className="sittings" aria-label="Later today">
          <AnimatePresence initial={false}>
            {later.map((s) => (
              <SittingChip key={s.id} s={s} count={items.filter((it) => it.slot === sittings.indexOf(s)).length} onMinutes={(m) => onMinutes(s.id, m)} onRemove={() => onRemove(s.id)} />
            ))}
          </AnimatePresence>
          {free.length > 0 && <AddLater options={free} onAdd={onAdd} compact={later.length > 0} />}
        </div>

        <span className="dock__fill" />
        {/* for the train, or anywhere the signal drops: today's pieces kept on this device */}
        <button className={`dock__save ${offline !== 'no' ? 'is-on' : ''}`} onClick={onOffline} disabled={offline === 'saving' || !nowItems.length} aria-label={offline === 'saved' ? 'Saved for offline' : 'Save today for offline'} title="Keep today’s pieces on this device, for when the signal drops">
          {OFFLINE_ICON[offline]}
          <span>{OFFLINE_LABEL[offline]}</span>
        </button>
        <button className="btn btn--primary" disabled={!nowItems.length} onClick={onStart}>
          Start · {used} min
          <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  )
}

function SittingChip({ s, count, onMinutes, onRemove }: { s: Sitting; count: number; onMinutes: (m: number) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)
  useDismiss(open, useCallback(() => setOpen(false), []), box)
  return (
    <motion.span ref={box} layout className="sitting" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
      <button className="sitting__hit" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <b>{s.when}</b><span>{s.min} min · {count} {count === 1 ? 'piece' : 'pieces'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="sitting__menu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.16 }}>
            <div className="sitting__mins">
              {MINUTE_STOPS.map((m) => <button key={m} className={m === s.min ? 'is-on' : ''} onClick={() => onMinutes(m)}>{m}</button>)}
            </div>
            <button className="sitting__drop" onClick={onRemove}><X size={13} strokeWidth={2.2} />Not today</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.span>
  )
}

function AddLater({ options, onAdd, compact }: { options: string[]; onAdd: (w: string) => void; compact: boolean }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)
  useDismiss(open, useCallback(() => setOpen(false), []), box)
  return (
    <span className="sitting sitting--add" ref={box}>
      <button className="sitting__hit" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Add time later today">
        <Plus size={14} strokeWidth={2.2} />{!compact && <span>More time later</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="sitting__menu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.16 }}>
            {options.map((w) => <button key={w} className="sitting__opt" onClick={() => { onAdd(w); setOpen(false) }}>{w}</button>)}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
