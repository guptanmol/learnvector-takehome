import type { ReactNode } from 'react'
import { Bookmark, ChartColumn, LibraryBig, Lock, Moon, PanelLeftClose, PanelLeftOpen, Play, RotateCcw, Route, Sun, Target, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar } from './Avatar'

type Tab = 'path' | 'library'

interface SideGoal { label: string; weeks: number; next?: { title: string; min: number } }

interface Props {
  route?: ReactNode // the route, folded, when there's room for it here
  tab: Tab
  first: string
  theme: 'light' | 'dark'
  collapsed: boolean
  goal: SideGoal | null
  onCollapse: () => void
  onTheme: () => void
  onTab: (t: Tab) => void
  onReset: () => void
  onNext: () => void
  /** lessons added from the library that you haven't seen on your path yet */
  badge?: number
  /** the library opens once your path is built and the walk-through is done */
  libraryLocked?: boolean
}

// One column: where you can go, what you're working toward with the next thing to do, and you.
// Progress and Saved are marked as coming so the frame reads as a real app.
const NAV: { id: Tab | 'progress' | 'saved'; label: string; icon: LucideIcon; live: boolean }[] = [
  { id: 'path', label: 'Your path', icon: Route, live: true },
  { id: 'library', label: 'Library', icon: LibraryBig, live: true },
  { id: 'progress', label: 'Progress', icon: ChartColumn, live: false },
  { id: 'saved', label: 'Saved', icon: Bookmark, live: false },
]

export function Sidebar({ route, tab, first, theme, collapsed, goal, onCollapse, onTheme, onTab, onReset, onNext, badge = 0, libraryLocked = false }: Props) {
  return (
    <div className={`sb ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sb__top">
        <span className="sb__brand" aria-label="LearnVector">L</span>
        {!collapsed && <span className="sb__name">LearnVector</span>}
        <button className="sb__icon sb__fold" onClick={onCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <PanelLeftOpen size={17} strokeWidth={1.8} /> : <PanelLeftClose size={17} strokeWidth={1.8} />}
        </button>
      </div>

      <nav className="sb__nav" aria-label="Main">
        {NAV.map((n) => {
          const on = n.id === tab
          const locked = n.id === 'library' && libraryLocked
          const live = n.live && !locked
          const I = n.icon
          const dot = n.id === 'path' && badge > 0
          return (
            <button
              key={n.id}
              className={`sb__item ${on ? 'is-on' : ''}`}
              disabled={!live}
              aria-current={on ? 'page' : undefined}
              aria-label={dot ? `${n.label}, ${badge} new` : undefined}
              title={locked ? 'Finish setting up your path first' : collapsed ? n.label : n.live ? undefined : `${n.label} is not part of this prototype`}
              onClick={() => live && onTab(n.id as Tab)}
            >
              {on && <motion.span layoutId="sb-pill" className="sb__pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
              <I size={18} strokeWidth={1.8} />
              {!collapsed && <span className="sb__label">{n.label}</span>}
              {!collapsed && !n.live && <span className="sb__soon">Soon</span>}
              {!collapsed && locked && <Lock className="sb__lock" size={14} strokeWidth={2} />}
              <AnimatePresence>
                {dot && (
                  <motion.span
                    key={badge > 1 ? 'n' : 'dot'}
                    className={`sb__badge ${badge > 1 ? 'is-count' : ''}`}
                    initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 560, damping: 17 }}
                  >
                    {badge > 1 ? badge : null}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>

      <AnimatePresence initial={false}>
        {goal && !collapsed && (
          <motion.section className="sb__goal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <span className="sb__goalhead"><Target size={14} strokeWidth={2.1} />Your goal</span>
            <b className="sb__goaltitle">{goal.label}</b>
            <span className="sb__weeks">
              <span className="sb__bar"><i style={{ width: `${100 / goal.weeks}%` }} /></span>
              <small>Week 1 of about {goal.weeks}</small>
            </span>
            {route}
            {goal.next && (
              <button className="sb__next" onClick={onNext}>
                <span className="sb__nextplay"><Play size={12} strokeWidth={2.4} fill="currentColor" /></span>
                <span className="sb__nexttext"><small>Up next · {goal.next.min} min</small><b>{goal.next.title}</b></span>
              </button>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {collapsed && route}
      <span className="sb__spacer" />

      <div className="sb__foot">
        <div className="sb__me">
          <Avatar name={first} className="sb__avatar" title={`${first}, signed in with Google`} />
          {!collapsed && <span className="sb__who"><b>{first}</b><small>Signed in with Google</small></span>}
        </div>
        <div className="sb__tools">
          <button className="sb__icon" onClick={onTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
          </button>
          <button className="sb__icon" onClick={onReset} aria-label="Start over" title="Start over"><RotateCcw size={16} strokeWidth={1.9} /></button>
        </div>
      </div>
    </div>
  )
}
