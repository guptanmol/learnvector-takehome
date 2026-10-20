import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { ThinkingOrb } from 'thinking-orbs'
import { PHONE, useDark, useMedia } from '../hooks'

export interface Check { id: 'goal' | 'level' | 'context' | 'work'; q: string; options: { label: string; run: () => void }[] }

const WAIT_S = 10 // how long a question waits before it lets itself out

// One small question about a guess, in the guide's voice: an ink card with the orb, so it never
// reads as content. It waits ten seconds (the bar drains; touching it pauses), then leaves on its
// own and the guess stays, marked as assumed. It sits just above the dock.
export function GuessCheck({ check, onDismiss }: { check: Check; onDismiss: () => void }) {
  const narrow = useMedia(PHONE)
  const dark = useDark()
  // sit 10px above the dock, however tall it is right now
  const [lift, setLift] = useState<number | null>(null)
  useEffect(() => {
    const dock = document.querySelector('.app__main > .dock')
    if (!dock) return
    const set = () => setLift(window.innerHeight - dock.getBoundingClientRect().top + 10)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(dock)
    window.addEventListener('resize', set)
    return () => { ro.disconnect(); window.removeEventListener('resize', set) }
  }, [])

  const card = (
    <motion.div
      className="gcheck gcheck--sheet"
      role="group"
      aria-label={check.q}
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 20 }}
      style={lift !== null ? { bottom: lift } : undefined}
    >
      <div className="gcheck__top">
        <span className="gcheck__orb" aria-hidden><ThinkingOrb state="listening" size={20} theme={dark ? 'light' : 'dark'} color={dark ? '#6d3fe0' : '#c4b2ff'} dotSize={1.15} /></span>
        <span className="gcheck__k">Quick question</span>
        <button className="gcheck__x" onClick={onDismiss} aria-label="Not now"><X size={15} strokeWidth={2.2} /></button>
      </div>
      <p className="gcheck__q">{check.q}</p>
      {/* long answers stack on a phone instead of being cut off */}
      <div className="gcheck__opts" style={{ ['--n' as string]: narrow && check.options.some((o) => o.label.length > 14) ? 1 : check.options.length }}>
        {check.options.map((o) => (
          <button key={o.label} className="gcheck__opt" onClick={o.run}>{o.label}</button>
        ))}
      </div>
      <span className="gcheck__timer" aria-hidden><i style={{ animationDuration: `${WAIT_S}s` }} onAnimationEnd={onDismiss} /></span>
    </motion.div>
  )
  return createPortal(card, document.body)
}
