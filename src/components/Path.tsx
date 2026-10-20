import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, RefreshCw, Sparkles, Undo2 } from 'lucide-react'
import { ThinkingOrb } from 'thinking-orbs'
import { gainOf } from '../materials'
import type { Milestone } from '../model'
import { hours, stepsOf, type Ask, type Item, type Layout, type Signal } from '../plan'
import { KindBadge, TimeBadge } from './Badges'
import { MaterialTile } from './Builder'
import { CardAsk } from './CardAsk'
import type { LogEntry } from './GuidePanel'

interface PathProps {
  layout: Layout
  plan: Milestone[]
  items: Item[]
  sittings: string[] // names of today's sittings, by slot
  busy: string | null // the lesson the guide is reworking
  focus: number // the step you're looking at, picked on the journey
  stepMin: number[] // realistic length of each step, not just the pieces planned so far
  fresh: Set<string> // pieces that just changed because of something the guide learned
  because: Record<string, string> // why the guide put a piece here, for pieces it swapped in
  onOpen: (it: Item) => void
  onAsk: (it: Item, a: Ask) => void
  onSignal: (it: Item, s: Signal) => void
  ask?: ReactNode // the guide, anchored to this step
  diff: LogEntry | null // the last change the guide made, shown where it happened
}

// One step of your path at a time. The step is picked on the journey above; how it's laid out
// follows how you learn.
export function Path(p: PathProps) {
  const m = p.plan[p.focus]
  const its = stepsOf(p.plan, p.items)[p.focus] ?? []
  // pieces that arrive while you're looking bloom in from grey; the rest are just there
  const key = `${p.layout}-${p.focus}`
  const seen = useRef<{ k: string; keys: Set<string> }>({ k: '', keys: new Set() })
  if (seen.current.k !== key) seen.current = { k: key, keys: new Set(its.map((it) => it.m.key)) }
  useEffect(() => { its.forEach((it) => seen.current.keys.add(it.m.key)) })
  const isNew = (it: Item) => !seen.current.keys.has(it.m.key)
  const sub: Sub = { ...p, its, isNew }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section
        key={key}
        className={`path path--${p.layout}`}
        initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -6, filter: 'blur(4px)', transition: { duration: 0.2 } }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        aria-label={m?.title}
      >
        <header className="path__head">
          {p.ask && <div className="path__ask">{p.ask}</div>}
          <span className="path__eyebrow">
            <span>Step {p.focus + 1} of {p.plan.length}</span>
            <span>About {hours(p.stepMin[p.focus] ?? 0)}</span>
            {/* lessons live in topics; the step says which ones it draws from */}
            <span className="path__topics" title="Topics in this step">{[...new Set(its.map((it) => it.stop.lesson.topic))].join(' · ')}</span>
            <AnimatePresence>
              {p.diff && (
                <motion.span key={p.diff.id} className="hchip hchip--changed" title={`${p.diff.cause}: ${p.diff.text}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 420, damping: 22 }}>
                  <Sparkles size={12} strokeWidth={2.3} />Updated just now
                  <button onClick={p.diff.undo}><Undo2 size={12} strokeWidth={2.4} />Undo</button>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <h3>{m?.title}</h3>
          <p>{m?.why}</p>
        </header>
        {p.layout === 'toolkit' ? <Toolkit {...sub} /> : <Sequence {...sub} />}
      </motion.section>
    </AnimatePresence>
  )
}

type Sub = PathProps & { its: Item[]; isNew: (it: Item) => boolean }

// A working marketer: the tools for this problem; the guide suggests where to start.
function Toolkit({ its, ...p }: Sub) {
  return (
    <section className="group group--flat">
      <div className="toolkit">
        <AnimatePresence mode="popLayout" initial={false}>
          {its.map((it, i) => (
            <Beat key={it.m.key} it={it} as="div" role={i === 0 ? <><b className="beat__n is-start">★</b>Start here</> : roleOf(it, i)} {...p} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}

// a piece leaving blurs and shrinks away; the rest slide over; a new one rises in
const BEAT = {
  initial: { opacity: 0, y: 14, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.9, filter: 'blur(8px)', transition: { duration: 0.35 } },
  transition: { type: 'spring' as const, stiffness: 200, damping: 26 },
}

// One card on the step: the piece, its role in the step, and the guide's Ask.
function Beat({ it, as, role, arrow, ...p }: Omit<Sub, 'its'> & { it: Item; as: 'li' | 'div'; role: ReactNode; arrow?: boolean }) {
  const Tag = as === 'li' ? motion.li : motion.div
  return (
    <Tag className="beat" layout {...BEAT}>
      {arrow && <span className="story__then" aria-hidden><ArrowRight size={14} strokeWidth={2.2} /></span>}
      <span className="beat__role">{role}</span>
      <div className="beat__card">
        <Piece it={it} bloom={p.isNew(it)} {...p} />
        <CardAsk it={it} onAsk={p.onAsk} onSignal={p.onSignal} />
      </div>
    </Tag>
  )
}

// What each piece is for, in words: why you'd do it at this point.
function roleOf(it: Item, i: number): string {
  const k = it.m.kind
  if (k === 'game' || k === 'drill') return i === 0 ? 'Try it first' : 'Practise it'
  if (k === 'quiz') return 'Check yourself'
  if (k === 'case') return 'See it done for real'
  if (k === 'template') return 'Use it on your work'
  return i === 0 ? 'Start with the idea' : 'Learn why it works'
}

// Story and practice layouts: one row, read in order. Practice opens with something to try.
function Sequence({ its, ...p }: Sub) {
  return (
    <section className="group group--flat">
      <ol className={`story ${p.layout === 'practice' ? 'story--wide' : ''}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          {its.map((it, j) => (
            <Beat key={it.m.key} it={it} as="li" arrow={j > 0} role={<><b className="beat__n">{j + 1}</b>{roleOf(it, j)}</>} {...p} />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  )
}

// One piece of your path: what it is, and whether it's in this sitting. Tap for everything else.
function Piece({ it, bloom, sittings, busy, fresh, because, onOpen }: { it: Item; bloom: boolean } & PathProps) {
  const working = busy === it.stop.lesson.id
  // a new arrival starts grey and the colour spreads in
  const [wet, setWet] = useState(!bloom)
  useEffect(() => {
    if (wet) return
    const t = window.setTimeout(() => setWet(true), 500)
    return () => clearTimeout(t)
  }, [wet])
  return (
    <button data-lesson={it.stop.lesson.id} className="piece" onClick={() => onOpen(it)} aria-label={`${it.m.title}. Open`}>
      <span className="piece__media">
        <AnimatePresence initial={false}>
          <motion.span key={it.m.key} className="piece__swap" initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <MaterialTile m={it.m} state={wet ? 'kept' : 'grey'} />
          </motion.span>
        </AnimatePresence>
        <AnimatePresence>
          {(bloom || fresh.has(it.stop.lesson.id)) && (
            <motion.span className="piece__fresh" initial={{ opacity: 0, y: -6, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.6 }}>New</motion.span>
          )}
        </AnimatePresence>
        {it.slot != null && <span className={`piece__when ${it.slot === 0 ? 'is-now' : ''}`}>{sittings[it.slot]}</span>}
        {because[it.stop.lesson.id] && <span className="piece__because" title={because[it.stop.lesson.id]}><RefreshCw size={11} strokeWidth={2.4} />{because[it.stop.lesson.id]}</span>}
        <AnimatePresence>
          {working && (
            <motion.span className="piece__think" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ThinkingOrb state="solving" size={32} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="piece__text">
        <span className="piece__title">{it.m.title}</span>
        <span className="piece__gain">{gainOf(it.m, it.stop.lesson.title)}</span>
        <span className="piece__meta">
          <KindBadge kind={it.m.kind} /><TimeBadge min={it.m.min} />
        </span>
      </span>
    </button>
  )
}
