import { motion } from 'framer-motion'
import { CloudDownload, Play, X } from 'lucide-react'
import { OFFLINE_LABEL, type Offline } from '../guide'
import { KIND_LABEL } from '../materials'
import type { Item } from '../plan'
import { plural } from '../text'
import { KIND_ICON } from '../icons'
import { MaterialTile } from './Builder'

const PHOTO = new Set(['video', 'case'])

// What "Start" plays: the pieces that fit the sitting you're in, as a sequence you can read at a glance.
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
        <header className="session__head">
          <div>
            <p className="k">Right now</p>
            <h2 className="session__title">{min} min · {plural(items.length, 'piece')}</h2>
          </div>
          <button className="session__close" onClick={onClose} aria-label="Close"><X size={16} strokeWidth={2} /></button>
        </header>

        {/* one segment per piece, sized by its minutes */}
        <div className="session__bar" aria-hidden>
          {items.map((it) => <i key={it.m.key} style={{ flexGrow: it.m.min }} />)}
        </div>

        <ol className="session__flow">
          {items.map((it, i) => {
            const KindIcon = KIND_ICON[it.m.kind]
            return (
              <li key={it.m.key} className="session__step">
                <span className="session__node">{i + 1}</span>
                {/* lessons and cases show their footage; everything else just its kind */}
                <span className="session__thumb">
                  {PHOTO.has(it.m.kind) ? <MaterialTile m={it.m} state="kept" /> : <KindIcon size={18} strokeWidth={1.9} />}
                </span>
                <span className="session__t">
                  <b>{it.m.title}</b>
                  <span className="session__meta">{KIND_LABEL[it.m.kind]} · {it.m.min} min</span>
                </span>
              </li>
            )
          })}
        </ol>

        <footer className="session__foot">
          <button className="btn btn--primary" onClick={onClose}><Play size={14} strokeWidth={2.4} fill="currentColor" />Start · {min} min</button>
          <button className="btn btn--soft" onClick={onOffline} disabled={offline === 'saving'}><CloudDownload size={15} strokeWidth={2} />{OFFLINE_LABEL[offline]}</button>
        </footer>
        <p className="session__note">Lessons aren't part of this prototype. After each one, your guide adjusts the path.</p>
      </motion.div>
    </>
  )
}
