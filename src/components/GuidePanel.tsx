import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, History, Minus, Plus, Undo2, X } from 'lucide-react'
import { ThinkingOrb } from 'thinking-orbs'
import type { FactKey } from '../colors'
import { FACT_ICON, LEARNED_ICON } from '../icons'
import { LEARNED_TEXT, type Estimate, type Learned, type Sitting } from '../plan'
import { Avatar } from './Avatar'

// every line of how the guide sees you can be changed in place
export interface PersonaRow {
  id: FactKey
  label: string
  value: string
  guess?: boolean // shown as assumed until you confirm or change it
  options: { label: string; on: boolean; pick: () => void }[]
}
export interface LogEntry { id: number; text: string; cause: string; undo: () => void; added: string[]; removed: string[] }

interface Props {
  est: Estimate
  sittings: Sitting[]
  thinking: boolean
  learned: Learned[]
  onForget: (id: number) => void
  changes: LogEntry[]
  persona: { name: string; rows: PersonaRow[] }
  /** phone: jump to the path to see a change */
  onShow?: () => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// The right side of your path: your week as it stands, and the guide you shape it with.
export function GuidePanel({ est, sittings, thinking, learned, onForget, changes, persona, onShow }: Props) {
  const [editing, setEditing] = useState<FactKey | null>(null)
  // the next seven days, starting today: weekdays at your pace, weekends off
  const start = new Date().getDay()
  const days = Array.from({ length: 7 }, (_, i) => (start + i) % 7)
  const perDay = sittings.reduce((a, s) => a + s.min, 0)
  const max = Math.max(perDay, 60)

  return (
    <aside className="gpanel" aria-label="Your week and your guide">
      <section className="wk">
        <div className="wk__head">
          <span className="k">Week 1 of about {est.weeks}</span>
          <span className="wk__sum"><b>{perDay}</b> min a day</span>
        </div>
        <div className="wk__days">
          {days.map((d, i) => {
            const rest = i > 0 && (d === 0 || d === 6)
            const min = rest ? 0 : perDay
            return (
              <div key={i} className={`wday ${i === 0 ? 'is-today' : ''} ${rest ? 'is-rest' : ''}`} title={rest ? 'Off' : `${min} min`}>
                <span className="wday__bar"><motion.i animate={{ height: `${(min / max) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 24 }} /></span>
                <span className="wday__name">{i === 0 ? 'Today' : DAY_NAMES[d]}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="shape">
        <div className="shape__head">
          <Avatar name={persona.name} className="persona__me" />
          <span className="shape__title">How I see you</span>
          <span className="shape__orb" aria-hidden><ThinkingOrb state={thinking ? 'solving' : 'listening'} size={20} /></span>
        </div>
        <p className="persona__hint">Tap any line to change it</p>
        <dl className="persona">
          {persona.rows.map((r) => {
            const I = FACT_ICON[r.id]
            const open = editing === r.id
            const said = r.guess ? `${r.value} (my guess)` : r.value
            return (
              <div key={r.id} className={`persona__row is-editable ${open ? 'is-open' : ''}`}>
                <button className="persona__hit" onClick={() => setEditing(open ? null : r.id)} aria-expanded={open} aria-label={`${r.label}: ${said}. Change`}>
                  <dt><I size={13} strokeWidth={2.2} />{r.label}</dt>
                  <motion.dd key={said} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {/* a guess shows as a small tag, so the value itself never gets cut off */}
                    <span className="persona__v">{r.value}</span>{r.guess && <span className="persona__guess">Assumed</span>}
                  </motion.dd>
                  <ChevronDown className="persona__chev" size={14} strokeWidth={2.2} aria-hidden />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div className="persona__opts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                      {r.options.map((o) => (
                        <button key={o.label} className={`persona__opt ${o.on ? 'is-on' : ''}`} onClick={() => { setEditing(null); if (!o.on) o.pick() }}>
                          {o.label}{o.on && <Check size={13} strokeWidth={2.6} />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </dl>
        <span className="k persona__k">Picked up along the way</span>
        {learned.length === 0 ? (
          <p className="learned__hint">Nothing yet. After each piece, tell me how it went.</p>
        ) : (
          <div className="learned__list">
            <AnimatePresence initial={false}>
              {learned.slice(0, 4).map((x, i) => {
                const I = LEARNED_ICON[x.signal]
                return (
                  <motion.span key={x.id} layout className={`lchip lchip--${x.signal}`} initial={{ opacity: 0, scale: 0.6, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0, rotate: i === 0 ? [0, -3, 2, 0] : 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 380, damping: 16, delay: i === 0 ? 0.5 : 0 }}>
                    <I size={12} strokeWidth={2.4} /><span title={x.effect}>{LEARNED_TEXT[x.signal](x.topic)}</span>
                    <button onClick={() => onForget(x.id)} aria-label={`Forget: ${LEARNED_TEXT[x.signal](x.topic)}`}><X size={11} strokeWidth={2.6} /></button>
                  </motion.span>
                )
              })}
            </AnimatePresence>
          </div>
        )}
        {changes.length > 0 && <Changes changes={changes} onShow={onShow} />}
      </section>
    </aside>
  )
}

// Recent changes stay folded into one button. Opening it shows each change: what you did, what the
// guide did about it, which pieces left and which arrived, and what you can do next.
function Changes({ changes, onShow }: { changes: LogEntry[]; onShow?: () => void }) {
  const [open, setOpen] = useState(false)
  const list = changes.slice(0, 5)
  return (
    <div className={`changes ${open ? 'is-open' : ''}`}>
      <button className="changes__btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <History size={14} strokeWidth={2.2} />
        <span>Recent changes</span>
        <span className="changes__n">{changes.length}</span>
        <ChevronDown className="changes__chev" size={14} strokeWidth={2.2} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul className="changes__list" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
            {list.map((c) => (
              <li key={c.id} className="change">
                <small>{c.cause}</small>
                <b>{c.text}</b>
                {(c.removed.length > 0 || c.added.length > 0) && (
                  <span className="change__diff">
                    {c.removed.slice(0, 2).map((t) => <span key={'r' + t} className="change__piece is-out"><Minus size={11} strokeWidth={2.6} />{t}</span>)}
                    {c.added.slice(0, 2).map((t) => <span key={'a' + t} className="change__piece is-in"><Plus size={11} strokeWidth={2.6} />{t}</span>)}
                    {c.removed.length + c.added.length > 4 && <span className="change__more">and {c.removed.length + c.added.length - 4} more</span>}
                  </span>
                )}
                <span className="change__acts">
                  <button className="change__undo" onClick={c.undo}><Undo2 size={13} strokeWidth={2.4} />Undo</button>
                  {onShow && <button className="change__show" onClick={onShow}>See on path<ArrowRight size={13} strokeWidth={2.2} /></button>}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
