import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { FMT_NAME, type Item } from '../plan'
import { plural } from '../text'
import { OFFLINE_LABEL, type Offline } from '../guide'

// What "Start" plays: the pieces that fit the sitting you're in right now.
export function Session({ items, offline, onOffline, onClose }: {
  items: Item[]
  offline: Offline
  onOffline: () => void
  onClose: () => void
}) {
  const min = items.reduce((a, it) => a + it.m.min, 0)
  return (
    <>
      <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="preview session" role="dialog" aria-label="Right now" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
        <button className="sheet__close" onClick={onClose} aria-label="Close"><X size={16} strokeWidth={2} /></button>
        <p className="k">Right now</p>
        <h2 className="session__title">{min} minutes, {plural(items.length, 'piece')}</h2>
        <ol className="session__list">
          {items.map((x, i) => (
            <li key={x.m.key}>
              <span className="session__n">{i + 1}</span>
              <span className="session__t"><b>{x.m.title}</b><small>{FMT_NAME[x.fmt]} · from “{x.stop.lesson.title}”</small></span>
              <span className="session__m">{x.m.min} min</span>
            </li>
          ))}
        </ol>
        <div className="preview__actions">
          <button className="btn btn--primary" onClick={onClose}>Start lesson 1</button>
          <button className="btn btn--soft" onClick={onOffline} disabled={offline === 'saving'}>{OFFLINE_LABEL[offline]}</button>
          <span className="faint">Lessons aren't part of this prototype. After each one, your guide adjusts the path.</span>
        </div>
      </motion.div>
    </>
  )
}
