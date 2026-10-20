import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThinkingOrb } from 'thinking-orbs'

interface Props {
  status: string // a few words: what the guide is doing
  title: string // what this screen asks of you, in a few words
  meta?: ReactNode // one short line at most
  thinking: boolean
  note?: ReactNode
  reveal?: boolean // walk-through: the line types itself in, word by word
}

// The guide is a presence, not a narrator: an orb, a status, and a short headline for the
// step you're on. Anything longer belongs in the interface, not in a sentence.
export function Guide({ status, title, meta, thinking, note, reveal }: Props) {
  return (
    <div className={`guide ${reveal ? 'guide--tour' : ''}`}>
      <div className={`gmark ${thinking ? 'is-thinking' : ''}`} aria-hidden>
        <ThinkingOrb state="composing" size={32} speed={thinking ? 1.4 : 0.8} />
      </div>
      <div className="guide__body">
        <p className="guide__who">
          Your guide
          <span className="badge guide__step">{thinking ? 'Thinking' : status}</span>
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={title}
            className="guide__title"
            aria-live="polite"
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)', transition: { duration: 0.18 } }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>
        </AnimatePresence>
        {meta && reveal && typeof meta === 'string' ? (
          <p key={meta} className="guide__meta guide__meta--reveal" aria-label={meta}>
            {meta.split(' ').map((w, i) => (
              <motion.span key={i} aria-hidden initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.35 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>{w} </motion.span>
            ))}
          </p>
        ) : meta && <p className="guide__meta">{meta}</p>}
        <AnimatePresence>{note && <motion.div className="guide__note" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{note}</motion.div>}</AnimatePresence>
      </div>
    </div>
  )
}
