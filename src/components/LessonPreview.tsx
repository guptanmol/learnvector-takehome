import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, PenLine, Play, X } from 'lucide-react'
import { minutesOf, type Lesson } from '../data'
import { GamePreview } from '../art/LessonArt'
import media from '../media.json'

const clips = media as Record<string, { poster: string; loop: string }>

// A poster frame, and a short muted loop that plays while the card is hot.
function Footage({ id, hot }: { id: string; hot: boolean }) {
  const v = useRef<HTMLVideoElement>(null)
  const clip = clips[id]
  useEffect(() => {
    const el = v.current
    if (!el) return
    if (hot) el.play().catch(() => {})
    else { el.pause(); el.currentTime = 0 }
  }, [hot])
  return (
    <div className="footage">
      <img src={clip.poster} alt="" loading="lazy" decoding="async" />
      <video ref={v} src={clip.loop} muted loop playsInline preload="none" aria-hidden className={hot ? 'is-on' : ''} />
    </div>
  )
}

// The lesson at a glance: video on the left, the practice on the right, each panel as wide as its
// minutes. Hover (or long-press on a phone) plays both.
function LessonCard({ lesson }: { lesson: Lesson }) {
  const [hot, setHot] = useState(false)
  // hover intent: passing over a card on the way somewhere else shouldn't wake it up
  const intent = useRef<number>()
  const press = useRef<number>()
  useEffect(() => () => { clearTimeout(intent.current); clearTimeout(press.current) }, [])
  const enter = () => { intent.current = window.setTimeout(() => setHot(true), 120) }
  const leave = () => { clearTimeout(intent.current); setHot(false) }

  return (
    <div
      className="card card--hero"
      data-hot={hot}
      onPointerEnter={(e) => e.pointerType === 'mouse' && enter()}
      onPointerLeave={leave}
      onPointerDown={(e) => { if (e.pointerType !== 'mouse') press.current = window.setTimeout(() => setHot(true), 280) }}
      onPointerUp={() => clearTimeout(press.current)}
    >
      <button
        className="card__hit"
        aria-label={`${lesson.title}. ${lesson.videoMin} minute video, then ${lesson.practiceLabel.toLowerCase()}, ${lesson.practiceMin} minutes.`}
      >
        <div className="card__media">
          <div className="card__video" style={{ flexGrow: lesson.videoMin }}>
            <Footage id={lesson.id} hot={hot} />
            <span className="card__host">with {lesson.host}</span>
            <span className="card__play" aria-hidden>
              <Play size={14} strokeWidth={2} fill="currentColor" />
            </span>
            <span className="card__min">{lesson.videoMin} min</span>
          </div>
          <div className="card__game" style={{ flexGrow: lesson.practiceMin * 1.6 }}>
            <GamePreview game={lesson.game} practice={lesson.practice} />
            <span className="card__min card__min--game">+{lesson.practiceMin}</span>
          </div>
        </div>
        <div className="card__body">
          <h3 className="card__title">{lesson.title}</h3>
          <p className="card__meta">
            <span className="badge"><Play size={11} strokeWidth={2.4} fill="currentColor" />{lesson.videoMin} min video</span>
            <span className="badge">
              {lesson.practice === 'game' ? <Gamepad2 size={13} strokeWidth={2} /> : <PenLine size={12} strokeWidth={2} />}
              {lesson.practiceMin} min {lesson.practice === 'game' ? 'game' : 'task'}
            </span>
          </p>
        </div>
      </button>
    </div>
  )
}

// A lesson opened from the library.
export function LessonPreview({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  return (
    <>
      <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="preview" role="dialog" aria-label={lesson.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
        <button className="sheet__close" onClick={onClose} aria-label="Close"><X size={16} strokeWidth={2} /></button>
        <LessonCard lesson={lesson} />
        <p className="preview__then">Then: {lesson.practiceLabel.toLowerCase()}</p>
        <div className="preview__actions">
          <button className="btn btn--primary" onClick={onClose}>Start, {minutesOf(lesson)} min</button>
          <span className="faint">Lessons aren't part of this prototype</span>
        </div>
      </motion.div>
    </>
  )
}
