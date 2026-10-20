import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, FileText, Frown, Meh, Play, Shuffle, Smile, Timer, X, type LucideIcon } from 'lucide-react'
import type { Act } from '../actions'
import { WHY_ICON } from '../icons'
import { materialsOf } from '../materials'
import type { Why } from '../model'
import { isSignal, type Ask, type Item, type Signal } from '../plan'
import { KindBadge, TimeBadge } from './Badges'
import { MaterialTile } from './Builder'

// What you can ask before you start. A video can't be made easier, but you can skip it if you know
// it, or get the gist first. Practice can be made shorter.
function before(kind: Item['m']['kind']): Act[] {
  const know: Act = { id: 'know', label: 'I already know this', icon: Check, run: 'knows' }
  const gist: Act = { id: 'gist', label: 'Quick summary', icon: FileText, run: 'summary' }
  const other: Act = { id: 'other', label: 'Another way to learn it', icon: Shuffle, run: 'format' }
  if (kind === 'video' || kind === 'case') return [know, gist, other]
  if (kind === 'template') return [{ ...know, label: 'I have one already' }, gist, other]
  return [know, { id: 'short', label: 'Something shorter', icon: Timer, run: 'shorter' }, other]
}

const AFTER: { s: Signal; label: string; icon: LucideIcon }[] = [
  { s: 'easy', label: 'Too easy', icon: Smile },
  { s: 'right', label: 'Just right', icon: Meh },
  { s: 'hard', label: 'Hard to follow', icon: Frown },
]

// Everything about one piece in one place: what it is, why it's here, what you can ask before you
// start, and how it went once you've done it. That last part is how the guide learns about you.
export function ItemSheet({ it, why, when, onClose, onAsk, onSignal }: {
  it: Item; why: Why[]; when: string | null; onClose: () => void; onAsk: (a: Ask) => void; onSignal: (s: Signal) => void
}) {
  const [gist, setGist] = useState(false)
  const l = it.stop.lesson
  const keep = materialsOf(l).find((m) => m.kind === 'template')
  const run = (a: Act['run']) => {
    if (a === 'summary') setGist((g) => !g)
    else if (isSignal(a)) onSignal(a)
    else onAsk(a)
  }
  return (
    <>
      <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="isheet" role="dialog" aria-label={it.m.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
        <button className="sheet__close" onClick={onClose} aria-label="Close"><X size={16} strokeWidth={2} /></button>
        <div className="isheet__media"><MaterialTile m={it.m} state="kept" /></div>
        <p className="isheet__meta">{when && <span className={`slot ${when === 'Now' ? 'is-now' : ''}`}>{when}</span>}<KindBadge kind={it.m.kind} /><TimeBadge min={it.m.min} /></p>
        <h2 className="isheet__title">{it.m.title}</h2>
        <span className="pwhys">{why.map((c) => { const I = WHY_ICON[c.icon]; return <span key={c.text} className="pwhy"><I size={12} strokeWidth={2.2} />{c.text}</span> })}</span>

        <div className="isheet__block">
          <span className="k">Before you start</span>
          <div className="isheet__asks">
            {before(it.m.kind).map((a) => (
              <button key={a.id} className={a.run === 'summary' && gist ? 'is-on' : ''} onClick={() => run(a.run)}>
                <a.icon size={15} strokeWidth={2.1} />{a.label}
              </button>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {gist && (
              <motion.ul className="gist" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                <li><b>Covers</b>{l.topic}, the way it shows up in real work</li>
                <li><b>You’ll do</b>{l.practiceLabel}</li>
                {keep && <li><b>You keep</b>{keep.title}</li>}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="isheet__block isheet__after">
          <span className="k">Done it? Tell me how it went</span>
          <div className="isheet__feel">
            {AFTER.map(({ s, label, icon: I }) => (
              <button key={s} onClick={() => onSignal(s)}><I size={18} strokeWidth={1.9} />{label}</button>
            ))}
          </div>
        </div>

        <div className="preview__actions">
          <button className="btn btn--primary" onClick={onClose}><Play size={15} strokeWidth={2.4} fill="currentColor" />Start, {it.m.min} min</button>
          <span className="faint">Lessons aren’t part of this prototype</span>
        </div>
      </motion.div>
    </>
  )
}
