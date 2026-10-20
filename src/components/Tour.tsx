import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { TOUR_NEXT } from '../guide'

export const TOUR_STEPS = 4

// The walk-through's buttons. They wait until the line has been read, arrive with a bump and keep a
// gentle nudge; a tap elsewhere shakes them and says why nothing happened.
export function TourControls({ step, words, nudge, onNext, onSkip }: {
  step: number
  words: number // in the line being read
  nudge: number // taps outside the tour so far
  onNext: () => void
  onSkip: () => void
}) {
  const last = step >= TOUR_STEPS - 1
  return (
    <motion.span key={step} className="tour__btns" initial={{ opacity: 0, y: 8, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.5 + words * 0.06 }}>
      <motion.span key={`shake-${nudge}`} className="tour__shake" animate={nudge ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.42 }}>
        <motion.button
          className="btn btn--primary btn--sm tour__next"
          onClick={onNext}
          animate={{ y: [0, -3, 0], rotate: [0, -1.5, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 1.8, delay: 1.4 + words * 0.06 }}
        >
          {TOUR_NEXT[Math.min(step, TOUR_STEPS - 1)]} <ArrowRight size={14} strokeWidth={2.4} />
        </motion.button>
      </motion.span>
      {!last && <button className="link tour__skip" onClick={onSkip}>Skip tour</button>}
      <AnimatePresence>
        {nudge > 0 && <motion.span key="hint" className="tour__hint" role="status" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>You can tap around once the tour is done</motion.span>}
      </AnimatePresence>
      <span className="tour__dots" aria-label={`Step ${step + 1} of ${TOUR_STEPS}`}>
        {Array.from({ length: TOUR_STEPS }, (_, i) => <i key={i} className={i < step ? 'is-done' : i === step ? 'is-on' : ''} />)}
      </span>
    </motion.span>
  )
}
