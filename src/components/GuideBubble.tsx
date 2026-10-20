import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Check, Undo2, X } from 'lucide-react'
import { ThinkingOrb } from 'thinking-orbs'
import type { FactKey } from '../colors'
import { PHONE, useDark, useDismiss, useMedia } from '../hooks'
import { FACT_ICON } from '../icons'
import type { LogEntry } from './GuidePanel'
import { PhonePortal } from './PhonePortal'

export interface Suggestion { id: string; text: string; fact: FactKey; run: () => void }

interface Props {
  step: string // the step this is anchored to
  thinking: boolean
  reply: string | null
  last: LogEntry | null
  suggestions: Suggestion[]
  onSkipStep: () => void
  skipLabel: string
  onText: (t: string) => void
  onOpen?: () => void
}

// The guide lives on the section it changes: open it from the step, ask, and watch that step change.
export function GuideBubble({ step, thinking, reply, last, suggestions, onSkipStep, skipLabel, onText, onOpen }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const phone = useMedia(PHONE)
  const dark = useDark()
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, close, box, sheet)
  const undo = !thinking && last && last.text === reply && <button onClick={last.undo}><Undo2 size={12} strokeWidth={2.4} />Undo</button>

  return (
    <div className="gbub" ref={box}>
      <button className={`gbub__btn ${open ? 'is-open' : ''}`} onClick={() => { if (!open) onOpen?.(); setOpen((o) => !o) }} aria-expanded={open}>
        <span className="gbub__orbwrap"><ThinkingOrb state={thinking ? 'solving' : 'breathing'} size={20} theme={dark ? 'dark' : 'light'} color={dark ? '#c4b2ff' : '#6d3fe0'} dotSize={1.2} dots={1.15} speed={1.15} /></span>
        <span>{thinking ? 'Reworking…' : <>Ask<span className="gbub__more"> about this step</span></>}</span>
      </button>

      {/* the guide's answer stays visible after you close it, next to the thing it changed */}
      <AnimatePresence>
        {!open && reply && !thinking && (
          <motion.div key={reply} className="gbub__toast" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Check size={13} strokeWidth={2.6} />{reply}
            {undo}
          </motion.div>
        )}
      </AnimatePresence>

      <PhonePortal>
        <AnimatePresence>{open && <motion.div className="ask-scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
        <AnimatePresence>
          {open && (
            <motion.div ref={sheet} className="gbub__card" role="dialog" aria-label="Ask your guide" initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
              <div className="gbub__head">
                <span className="gbub__orb"><ThinkingOrb state={thinking ? 'solving' : 'listening'} size={20} /></span>
                <span><small>Changing</small><b>{step}</b></span>
                <button className="gbub__close" onClick={close} aria-label="Close"><X size={14} strokeWidth={2.2} /></button>
              </div>
              {(thinking || reply) && (
                <p className="gbub__reply">{thinking ? 'Reworking this…' : reply}{undo}</p>
              )}
              <div className="gbub__chips">
                <button className="schip" onClick={() => { close(); onSkipStep() }} disabled={thinking}><FACT_ICON.level size={13} strokeWidth={2.2} />{skipLabel}</button>
                {suggestions.map((s) => {
                  const I = FACT_ICON[s.fact]
                  return <button key={s.id} className="schip" onClick={() => { close(); s.run() }} disabled={thinking}><I size={13} strokeWidth={2.2} />{s.text}</button>
                })}
              </div>
              <form className="shape__ask" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { close(); onText(text); setText('') } }}>
                <input autoFocus={!phone} value={text} onChange={(e) => setText(e.target.value)} placeholder="Or say it: more hands-on, only 10 min…" aria-label="Ask your guide for a change" />
                <button type="submit" disabled={!text.trim() || thinking} aria-label="Send"><ArrowUp size={15} strokeWidth={2.4} /></button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </PhonePortal>
    </div>
  )
}
