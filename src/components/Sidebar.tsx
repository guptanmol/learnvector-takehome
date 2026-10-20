import { useCallback, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark, Check, ChevronsUpDown, Wrench, ChartColumn, LibraryBig, Lock, Moon, PanelLeftClose, PanelLeftOpen, Play, RotateCcw, Route, Sun, Target, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Avatar } from './Avatar'
import { useDismiss } from '../hooks'
import { PEOPLE, switchTo } from '../people'

type Tab = 'path' | 'library'

interface SideGoal { label: string; weeks: number; next?: { title: string; min: number } }

interface Props {
  route?: ReactNode // the route, folded, when there's room for it here
  tab: Tab
  first: string
  me: string // which mock account is signed in
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

export function Sidebar({ route, tab, first, me, theme, collapsed, goal, onCollapse, onTheme, onTab, onReset, onNext, badge = 0, libraryLocked = false }: Props) {
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
        <Me first={first} me={me} collapsed={collapsed} />
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

// You, and a demo-only switch between the mock accounts so a reviewer can see each persona's page.
// Switching reloads, the same as signing in as someone else.
function Me({ first, me, collapsed }: { first: string; me: string; collapsed: boolean }) {
  const [at, setAt] = useState<{ left: number; bottom: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setAt(null), [])
  useDismiss(!!at, close, btn, panel)
  const toggle = () => {
    const r = btn.current?.getBoundingClientRect()
    if (at || !r) return setAt(null)
    // above the profile; beside it when the sidebar is collapsed
    setAt(collapsed ? { left: r.right + 10, bottom: innerHeight - r.bottom } : { left: r.left, bottom: innerHeight - r.top + 8 })
  }
  return (
    <>
      <button ref={btn} className={`sb__me ${at ? 'is-open' : ''}`} onClick={toggle} aria-expanded={!!at} aria-haspopup="menu" title={`${first}, signed in with Google`}>
        <Avatar name={first} className="sb__avatar" />
        {!collapsed && <span className="sb__who"><b>{first}</b><small>Google account</small></span>}
        {!collapsed && <ChevronsUpDown className="sb__swap" size={15} strokeWidth={2} />}
      </button>
      {createPortal(
        <AnimatePresence>
          {at && (
            <motion.div ref={panel} className="who-pop" role="menu" style={{ left: at.left, bottom: at.bottom }} initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={{ duration: 0.16 }}>
              <p className="who-pop__k"><Wrench size={12} strokeWidth={2.2} />Demo tool · switch persona</p>
              {Object.entries(PEOPLE).map(([id, p]) => (
                <button key={id} className={`who-pop__row ${id === me ? 'is-on' : ''}`} role="menuitemradio" aria-checked={id === me} onClick={() => (id === me ? close() : switchTo(id))}>
                  <Avatar name={p.name} className="who-pop__av" />
                  <span className="who-pop__t"><b>{p.name}</b><small>{p.email}</small></span>
                  {id === me && <Check size={15} strokeWidth={2.4} />}
                </button>
              ))}
              <p className="who-pop__note">Not part of the design. Switching starts that person over.</p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
