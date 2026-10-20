import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Frown, Smile } from 'lucide-react'
import { ThinkingOrb } from 'thinking-orbs'
import { actionsFor, type Act } from '../actions'
import { useDark, useDismiss } from '../hooks'
import { materialsOf } from '../materials'
import { isSignal, type Ask, type Item, type Signal } from '../plan'
import { KindBadge, TimeBadge } from './Badges'
import { MaterialTile } from './Builder'
import { PhonePortal } from './PhonePortal'

// The gist of a piece: what it covers, what you do, and what you keep.
function Gist({ it }: { it: Item }) {
  const l = it.stop.lesson
  const keep = materialsOf(l).find((m) => m.kind === 'template')
  return (
    <motion.ul className="cask__gist" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
      <li><b>Covers</b>{l.topic}</li>
      <li><b>You do</b>{l.practiceLabel}</li>
      {keep && <li><b>You keep</b>{keep.title}</li>}
    </motion.ul>
  )
}

// The guide, per card: a small orb in the corner that opens what you can change about this piece.
export function CardAsk({ it, onAsk, onSignal }: { it: Item; onAsk: (it: Item, a: Ask) => void; onSignal: (it: Item, s: Signal) => void }) {
  const [open, setOpen] = useState(false)
  const [gist, setGist] = useState(false)
  const [hot, setHot] = useState(false) // the card is hovered: the orb turns into the sphere
  const box = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const dark = useDark()
  const show = useCallback((o: boolean) => { setOpen(o); if (!o) setGist(false) }, [])
  const close = useCallback(() => show(false), [show])
  useDismiss(open, close, box, sheet)
  useEffect(() => {
    const card = box.current?.parentElement
    if (!card) return
    const on = () => setHot(true), off = () => setHot(false)
    card.addEventListener('mouseenter', on)
    card.addEventListener('mouseleave', off)
    return () => { card.removeEventListener('mouseenter', on); card.removeEventListener('mouseleave', off) }
  }, [])
  const run = (a: Act['run']) => {
    if (a === 'summary') return setGist((g) => !g)
    close()
    if (isSignal(a)) onSignal(it, a)
    else onAsk(it, a)
  }

  return (
    <div ref={box} className={`cask ${open ? 'is-open' : ''}`}>
      <button className="cask__btn" onClick={(e) => { e.stopPropagation(); show(!open) }} aria-label={`Ask the guide about ${it.m.title}`} aria-expanded={open} title="Ask the guide">
        <ThinkingOrb state={open || hot ? 'searching' : 'breathing'} size={20} theme={dark ? 'dark' : 'light'} color={dark ? '#c4b2ff' : '#6d3fe0'} dotSize={1.05} speed={1.1} />
        <span>Ask</span>
      </button>
      <PhonePortal>
        <AnimatePresence>{open && <motion.div className="ask-scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
        <AnimatePresence>
          {open && (
            <motion.div ref={sheet} className="cask__menu" role="menu" initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
              <div className="cask__piece">
                <span className="cask__thumb"><MaterialTile m={it.m} state="kept" /></span>
                <span className="cask__pieceText"><small>Changing</small><b>{it.m.title}</b><span className="cask__badges"><KindBadge kind={it.m.kind} /><TimeBadge min={it.m.min} /></span></span>
              </div>
              <p className="cask__title">Change this piece</p>
              {actionsFor(it.m.kind).map((a) => (
                <button key={a.id} role="menuitem" className={a.run === 'summary' && gist ? 'is-on' : ''} onClick={() => run(a.run)}>
                  <a.icon size={14} strokeWidth={2.1} />{a.label}
                </button>
              ))}
              <AnimatePresence initial={false}>{gist && <Gist it={it} />}</AnimatePresence>
              <p className="cask__title cask__title--after">Done it?</p>
              <div className="cask__feel">
                <button onClick={() => run('easy')}><Smile size={14} strokeWidth={2} />Too easy</button>
                <button onClick={() => run('hard')}><Frown size={14} strokeWidth={2} />Hard to follow</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PhonePortal>
    </div>
  )
}
