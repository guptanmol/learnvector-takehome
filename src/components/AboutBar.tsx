import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Pencil } from 'lucide-react'
import { useDismiss } from '../hooks'
import { FACT_ICON } from '../icons'

export interface Fact {
  id: 'goal' | 'level' | 'context'
  value: string
  options: [string, string][] // [key, label]
  current: string
  why?: string // set when it's the guide's guess
}

const TITLE: Record<Fact['id'], string> = { goal: 'Your goal', level: 'Your experience', context: 'Approvals' }

// What the guide understands about you, as one quiet bar in the header. Each item opens its own
// menu: switch it, see why it was assumed, or go back and change your answer.
export function AboutBar({ facts, onFix, onEdit }: {
  facts: Fact[]
  onFix: (id: Fact['id'], key: string) => void
  onEdit: () => void
}) {
  const [open, setOpen] = useState<Fact['id'] | null>(null)
  const bar = useRef<HTMLDivElement>(null)
  // a click outside the bar closes it (a fixed catcher can't escape the bar's frosted layer)
  const close = useCallback(() => setOpen(null), [])
  useDismiss(!!open, close, bar)
  if (!facts.length) return null
  return (
    <div ref={bar} className="aboutbar" aria-label="What your guide understands about you">
      <span className="aboutbar__label">I understand</span>
      {facts.map((f) => {
        const I = FACT_ICON[f.id]
        const conf = f.why ? 'assumed' : 'confirmed'
        return (
          <span key={f.id} className="aitem">
            <button className={`aitem__hit ${open === f.id ? 'is-open' : ''}`} onClick={() => setOpen(open === f.id ? null : f.id)} aria-expanded={open === f.id} aria-label={`${TITLE[f.id]}: ${f.value}, ${conf}. Change`}>
              <I size={14} strokeWidth={2.1} />
              <b>{f.value}</b>
              <span className="aitem__conf">{conf}</span>
              <ChevronDown size={13} strokeWidth={2.2} className="aitem__chev" />
            </button>
            <AnimatePresence>
              {open === f.id && (
                <motion.div className="amenu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                  <p className="amenu__title">{TITLE[f.id]}</p>
                  {f.options.map(([k, label]) => (
                    <button key={k} className={`amenu__opt ${k === f.current ? 'is-on' : ''}`} onClick={() => { onFix(f.id, k); setOpen(null) }}>
                      {label}{k === f.current && <Check size={14} strokeWidth={2.4} />}
                    </button>
                  ))}
                  {f.why && <p className="amenu__from">Assumed {f.why}</p>}
                  <button className="amenu__edit" onClick={() => { setOpen(null); onEdit() }}><Pencil size={13} strokeWidth={2} /> Change my answer</button>
                </motion.div>
              )}
            </AnimatePresence>
          </span>
        )
      })}
    </div>
  )
}
