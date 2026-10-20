import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { ThinkingOrb } from 'thinking-orbs'
import { REWORK_STAGES } from '../guide'
import { useDark } from '../hooks'

// While the guide reworks your path it shows its work: what it heard, then each stage ticking off,
// over the step it's changing. The new pieces bloom in only after the last stage.
export function Rework({ cause, stage }: { cause: string; stage: number }) {
  const dark = useDark()
  return (
    <motion.div className="rework" role="status" aria-live="polite" initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
      <div className="rework__head">
        <ThinkingOrb state="solving" size={32} theme={dark ? 'dark' : 'light'} color={dark ? '#c4b2ff' : '#6d3fe0'} dotSize={1.1} />
        <span className="rework__cause"><small>Reworking your path</small><b>{cause}</b></span>
      </div>
      <ol className="rework__steps">
        {REWORK_STAGES.map((s, i) => {
          const state = i < stage ? 'done' : i === stage ? 'now' : 'next'
          return (
            <li key={s} className={`rework__step is-${state}`}>
              <span className="rework__mark">
                <AnimatePresence mode="wait" initial={false}>
                  {state === 'done'
                    ? <motion.span key="d" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 16 }}><Check size={12} strokeWidth={3} /></motion.span>
                    : <motion.i key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
                </AnimatePresence>
              </span>
              {s}
            </li>
          )
        })}
      </ol>
    </motion.div>
  )
}
