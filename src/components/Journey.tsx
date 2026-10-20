import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Flag, Lock, MapPin, ShieldCheck } from 'lucide-react'
import type { Milestone } from '../model'
import { stepsOf, type Item } from '../plan'
import { useDismiss } from '../hooks'
import { plural } from '../text'

interface Props {
  from: string // where you are now
  to: string // the goal
  legal: boolean // a sign-off checkpoint before the goal
  plan: Milestone[]
  items: Item[]
  done: number // pieces finished
  focus: number // the step in view
  onFocus: (i: number) => void
}

// Your path as one route: where you are, the steps, where you're going. Each step is a stop you
// can open; the stretch you've reached is solid, the road ahead is light.
export function Journey({ from, to, legal, plan, items, done, focus, onFocus }: Props) {
  const steps = stepsOf(plan, items).map((its, i) => ({
    m: plan[i], its, min: its.reduce((a, it) => a + it.m.min, 0), now: its.some((it) => it.slot === 0),
  }))
  const reached = Math.max(0, steps.findIndex((s) => s.now))
  const cols = steps.length + 2 + (legal ? 1 : 0)
  return (
    <nav className="route" aria-label="Your route" style={{ ['--cols' as string]: cols }}>
      <span className="route__track" aria-hidden>
        <motion.span className="route__fill" animate={{ width: `${((reached + 1) / (cols - 1)) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 22 }} />
      </span>

      <div className="stop stop--end">
        <span className="stop__node stop__node--end">{done > 0 ? <Check size={11} strokeWidth={3} /> : <MapPin size={11} strokeWidth={2.4} />}</span>
        <span className="stop__label"><b title="Where you are now">{from}</b></span>
      </div>

      {steps.map((s, i) => (
        <button key={s.m.title} className={`stop ${focus === i ? 'is-on' : ''} ${i <= reached ? 'is-reached' : ''} ${i > 0 ? 'is-later' : ''}`} onClick={() => onFocus(i)} aria-current={focus === i ? 'step' : undefined}>
          <motion.span className="stop__node" animate={{ scale: focus === i ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 420, damping: 20 }}>
            {i + 1}
          </motion.span>
          <span className="stop__label"><b title={`${s.its.length} pieces · ${s.min} min`}>{s.m.title}</b><small>{i > 0 ? 'After step 1' : plural(s.its.length, 'piece')}</small></span>
        </button>
      ))}

      {legal && (
        <div className="stop stop--check">
          <span className="stop__node stop__node--end"><ShieldCheck size={11} strokeWidth={2.4} /></span>
          <span className="stop__label"><b>Legal sign-off</b></span>
        </div>
      )}

      <div className="stop stop--end stop--goal">
        <span className="stop__node stop__node--end"><Flag size={11} strokeWidth={2.4} /></span>
        <span className="stop__label"><b title="Your goal">{to}</b></span>
      </div>
    </nav>
  )
}

// The same route, folded into one line: the step you're on. Tapping it opens every step, with its size
// and whether it's open yet, as a panel over the page (rendered on the body so the sidebar can't clip it).
export function RouteSummary({ legal, plan, items, focus, onFocus, compact = false, pill = false }: Pick<Props, 'legal' | 'plan' | 'items' | 'focus' | 'onFocus'> & { compact?: boolean; pill?: boolean }) {
  const [at, setAt] = useState<{ top: number; left: number; width: number } | null>(null)
  const sum = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLOListElement>(null)
  const close = useCallback(() => setAt(null), [])
  useDismiss(!!at, close, sum, panel)
  useEffect(() => {
    if (!at) return
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [at, close])
  const toggle = () => {
    const r = sum.current?.getBoundingClientRect()
    // in the collapsed rail the panel opens beside it; elsewhere, under the line
    if (at || !r) return setAt(null)
    // beside the collapsed rail; under the header pill, right-aligned; otherwise under the line
    const width = Math.min(320, window.innerWidth - 24)
    setAt(compact ? { top: r.top, left: r.right + 10, width: 300 }
      : pill ? { top: r.bottom + 8, left: Math.max(12, r.right - width), width }
      : { top: r.bottom + 6, left: r.left, width: Math.max(r.width, 280) })
  }
  const steps = stepsOf(plan, items).map((its, i) => ({ m: plan[i], n: its.length, min: its.reduce((a, it) => a + it.m.min, 0) }))
  return (
    <div className={`vroute ${compact ? 'vroute--rail' : ''} ${pill ? 'vroute--pill' : ''} ${at ? 'is-open' : ''}`}>
      {pill ? (
        <button ref={sum} className="vroute__pill" onClick={toggle} aria-expanded={!!at} aria-haspopup="true" aria-label={`Step ${focus + 1} of ${steps.length}: ${plan[focus]?.title}. Show all steps`}>
          Step {focus + 1} of {steps.length}<ChevronDown className="vroute__chev" size={14} strokeWidth={2.4} />
        </button>
      ) : compact ? (
        <button ref={sum} className="vroute__rail" onClick={toggle} aria-expanded={!!at} aria-haspopup="true" aria-label={`Step ${focus + 1} of ${steps.length}: ${plan[focus]?.title}. Show all steps`} title="Your steps">
          {steps.map((s, i) => <span key={s.m.title} className={`vroute__dot ${i === focus ? 'is-on' : ''} ${i > 0 ? 'is-later' : ''}`}>{i + 1}</span>)}
        </button>
      ) : (
        <button ref={sum} className="vroute__sum" onClick={toggle} aria-expanded={!!at} aria-haspopup="true">
          <span className="vroute__n">{focus + 1}</span>
          <span className="vroute__t"><small>Step {focus + 1} of {steps.length}</small><b>{plan[focus]?.title}</b></span>
          <ChevronDown className="vroute__chev" size={15} strokeWidth={2.2} />
        </button>
      )}
      {createPortal(
        <AnimatePresence>
          {at && (
            <motion.ol ref={panel} className="vroute__list" style={{ top: at.top, left: at.left, width: at.width }} initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.18 }}>
              {steps.map((s, i) => (
                <li key={s.m.title}>
                  <button className={`vstop ${focus === i ? 'is-on' : ''} ${i > 0 ? 'is-later' : ''}`} onClick={() => { onFocus(i); close() }} aria-current={focus === i ? 'step' : undefined}>
                    <span className="vstop__node">{i > 0 ? <Lock size={11} strokeWidth={2.4} /> : i + 1}</span>
                    <span className="vstop__t"><b>{s.m.title}</b><small>{plural(s.n, 'piece')} · {s.min} min{i > 0 ? ' · after step\u00a01' : ''}</small></span>
                  </button>
                </li>
              ))}
              {legal && (
                <li><span className="vstop vstop--check"><span className="vstop__node"><ShieldCheck size={11} strokeWidth={2.4} /></span><span className="vstop__t"><b>Legal sign-off</b><small>before it goes out</small></span></span></li>
              )}
            </motion.ol>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
