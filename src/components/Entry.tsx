import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Compass, PenLine, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react'
import { PHONE, useMedia } from '../hooks'
import type { GoalKey } from '../model'

// The three reasons people come, each with its own picture so it reads as a choice, not content.
const ANSWERS: { goal: GoalKey; text: string; icon: LucideIcon; pic: string; at: string }[] = [
  { goal: 'understand', text: 'Understand how marketing works', icon: Compass, pic: '/entry/understand.jpg', at: '86% 40%' },
  { goal: 'ai', text: 'Use AI in my work', icon: Sparkles, pic: '/entry/ai.jpg', at: '58% 40%' },
  { goal: 'better', text: 'Get better at my marketing job', icon: TrendingUp, pic: '/entry/better.jpg', at: '55% 45%' },
]

// The one question before the app. One tap builds the path; everything else starts as a guess
// the path shows and lets you fix.
export function Entry({ onAnswer, onWords, onLook }: { onAnswer: (g: GoalKey) => void; onWords: (text: string) => void; onLook: () => void }) {
  const [writing, setWriting] = useState(false)
  const [words, setWords] = useState('')
  const phone = useMedia(PHONE)
  return (
    <div className="entry">
      <div className="entry__answers" role="group" aria-label="What brings you here">
        {ANSWERS.map((a, i) => (
          <motion.button
            key={a.goal}
            className="eans"
            onClick={() => onAnswer(a.goal)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="eans__pic">
              <img src={a.pic} alt="" style={{ objectPosition: a.at }} />
            </span>
            <span className="eans__row">
              <span className="eans__icon"><a.icon size={17} strokeWidth={2} /></span>
              <b>{a.text}</b>
              <ArrowRight className="eans__go" size={16} strokeWidth={2.2} aria-hidden />
            </span>
          </motion.button>
        ))}
      </div>

      <div className="entry__more">
        {writing ? (
          <form className="entry__form" onSubmit={(e) => { e.preventDefault(); if (words.trim()) onWords(words) }}>
            <PenLine size={15} strokeWidth={2} aria-hidden />
            <input autoFocus={!phone} value={words} onChange={(e) => setWords(e.target.value)} placeholder="e.g. I do marketing at a bank and want to use AI" aria-label="Tell me in your own words" />
            <button className="btn btn--primary btn--sm" type="submit" disabled={!words.trim()} aria-label="Build my path"><ArrowRight size={15} strokeWidth={2.2} /></button>
          </form>
        ) : (
          <>
            <button className="entry__else" onClick={() => setWriting(true)}><PenLine size={15} strokeWidth={2} />Something else</button>
            <button className="entry__look" onClick={onLook}>Just let me look around</button>
          </>
        )}
      </div>
    </div>
  )
}
