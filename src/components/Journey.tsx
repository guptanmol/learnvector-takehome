import { motion } from 'framer-motion'
import { Check, Flag, MapPin, ShieldCheck } from 'lucide-react'
import type { Milestone } from '../model'
import { stepsOf, type Item } from '../plan'

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
        <button key={s.m.title} className={`stop ${focus === i ? 'is-on' : ''} ${i <= reached ? 'is-reached' : ''}`} onClick={() => onFocus(i)} aria-current={focus === i ? 'step' : undefined}>
          <motion.span className="stop__node" animate={{ scale: focus === i ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 420, damping: 20 }}>
            {i + 1}
          </motion.span>
          <span className="stop__label"><b title={`${s.its.length} pieces · ${s.min} min`}>{s.m.title}</b></span>
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
