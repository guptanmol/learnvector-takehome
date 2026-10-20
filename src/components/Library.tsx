import { useMemo, useState } from 'react'
import { KindBadge, SolidIcon, TimeBadge } from './Badges'
import { createPortal } from 'react-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import type { Lesson } from '../data'
import { KIND_LABEL, gainOf, materialsOf, type Kind, type Material } from '../materials'
import { KIND_COLOR } from '../colors'
import { lowerFirst, lowerKeepAI } from '../text'
import { MaterialTile } from './Builder'

type Filter = 'all' | Kind
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Lessons' },
  { key: 'game', label: 'Games' },
  { key: 'drill', label: 'Practice with AI' },
  { key: 'quiz', label: 'Quizzes' },
  { key: 'case', label: 'Case studies' },
  { key: 'template', label: 'Templates' },
]

interface Row { lesson: Lesson; m: Material; onPath: boolean }

interface Props {
  ranked: Lesson[]
  chosen: string[]
  /** what the guide is planning toward, if it knows */
  goal: string | null
  onAdd: (l: Lesson) => void
  onOpen: (l: Lesson) => void
}

const spring = { type: 'spring', stiffness: 260, damping: 26 } as const

// The library: the guide's best fits first, then everything, grouped by topic.
// One filter row picks the kind of material; every card shows that piece of each lesson.
export function Library({ ranked, chosen, goal, onAdd, onOpen }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  // what was on the path when you opened the library, so a card you add stays put and shows its new state
  const [before] = useState(() => new Set(chosen))
  const [flights, setFlights] = useState<Flight[]>([])

  // the card's picture drops into "Your path" (or the menu button on a phone)
  const add = (r: Row, el: HTMLElement) => {
    onAdd(r.lesson)
    const media = el.closest('.catalog__card')?.querySelector('.catalog__media')
    const target = pathTarget()
    if (!media || !target) return
    const a = media.getBoundingClientRect(), b = target.getBoundingClientRect()
    setFlights((f) => [...f, { id: `${r.m.key}-${Date.now()}`, m: r.m, x: a.left, y: a.top, w: a.width, h: a.height, tx: b.left + b.width / 2, ty: b.top + b.height / 2, target }])
  }

  const rows = useMemo(() => ranked.flatMap((lesson): Row[] => {
    const ms = materialsOf(lesson)
    const m = ms.find((x) => x.kind === (filter === 'all' ? 'video' : filter))
    return m ? [{ lesson, m, onPath: chosen.includes(lesson.id) }] : []
  }), [ranked, chosen, filter])

  // the best fits you haven't added yet; your path already shows the rest
  const forYou = goal ? [...rows.filter((r) => !before.has(r.lesson.id)), ...rows.filter((r) => before.has(r.lesson.id))].slice(0, 4) : []

  // topics in the order of their best lesson, so the closest topics come first
  const groups = useMemo(() => {
    const by = new Map<string, Row[]>()
    for (const r of rows) by.set(r.lesson.topic, [...(by.get(r.lesson.topic) ?? []), r])
    return [...by.entries()]
  }, [rows])

  return (
    <main className="library catalog">
      <header className="catalog__head">
        <h1>Library</h1>
        <p className="mut">{ranked.length} lessons. Each comes with practice, a quiz, a case study and a template.</p>
      </header>

      <div className="catalog__filters" role="tablist" aria-label="Show">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            className={`catalog__chip ${filter === f.key ? 'is-on' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.key !== 'all' && <span className="catalog__chipicon" style={{ ['--k' as string]: KIND_COLOR[f.key] }}><SolidIcon kind={f.key} color={KIND_COLOR[f.key]} size={12} /></span>}
            {f.label}
          </button>
        ))}
      </div>

      <LayoutGroup>
        {forYou.length > 0 && (
          <section className="catalog__section">
            <div className="catalog__sechead">
              <h3>For you</h3>
              <span className="catalog__sub">Best fits for {goal && lowerKeepAI(goal)}</span>
            </div>
            <div className="catalog__grid catalog__grid--top">
              {forYou.map((r) => <CatalogCard key={`top-${r.m.key}`} r={r} onAdd={add} onOpen={onOpen} />)}
            </div>
          </section>
        )}

        {groups.map(([topic, list]) => (
          <section key={topic} className="catalog__section">
            <div className="catalog__sechead">
              <h3>{topic}</h3>
              <span className="catalog__count">{list.length}</span>
            </div>
            <div className="catalog__grid">
              {list.map((r) => <CatalogCard key={r.m.key} r={r} onAdd={add} onOpen={onOpen} />)}
            </div>
          </section>
        ))}
      </LayoutGroup>
      {createPortal(
        flights.map((f) => <FlyingTile key={f.id} f={f} onDone={() => setFlights((all) => all.filter((x) => x.id !== f.id))} />),
        document.body,
      )}
    </main>
  )
}

// every quiz has the same gain line, so say what it checks instead
function gainLine(m: Material, lesson: Lesson) {
  if (m.kind !== 'quiz') return gainOf(m, lesson.title)
  const g = gainOf(materialsOf(lesson)[0], lesson.title)
  return `Check you can ${lowerFirst(g)}`
}

function CatalogCard({ r, onAdd, onOpen }: { r: Row; onAdd: (r: Row, el: HTMLElement) => void; onOpen: (l: Lesson) => void }) {
  const { lesson, m, onPath } = r
  return (
    <motion.article
      layout="position"
      className={`catalog__card ${onPath ? 'is-on' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <button className="catalog__hit" onClick={() => onOpen(lesson)} aria-label={`${m.title}, ${KIND_LABEL[m.kind]}, ${m.min} minutes`}>
        <span className="catalog__media"><MaterialTile m={m} /></span>
        <span className="catalog__text">
          <span className="catalog__title">{m.title}</span>
          <span className="catalog__gain">{gainLine(m, lesson)}</span>
          <span className="catalog__meta"><KindBadge kind={m.kind} /><TimeBadge min={m.min} /></span>
        </span>
      </button>
      <div className="catalog__foot">
        <AnimatePresence mode="popLayout" initial={false}>
          {onPath ? (
            <motion.span key="on" className="catalog__state" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 18 }}>
              <Check size={13} strokeWidth={2.6} />On your path
            </motion.span>
          ) : (
            <motion.button key="add" className="btn btn--soft catalog__add" onClick={(e) => onAdd(r, e.currentTarget)} whileTap={{ scale: 0.94 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 22 }}>
              <Plus size={15} strokeWidth={2.2} />Add to path
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
}

interface Flight { id: string; m: Material; x: number; y: number; w: number; h: number; tx: number; ty: number; target: HTMLElement }

const FLY_MS = 720
const LAND = 22 // px, the size it shrinks to as it lands

function pathTarget(): HTMLElement | null {
  const menu = document.querySelector<HTMLElement>('.top__menu')
  if (menu && menu.offsetParent) return menu
  const items = [...document.querySelectorAll<HTMLElement>('.app__side .sb__item')]
  return items.find((i) => i.textContent?.trim().startsWith('Your path')) ?? items[0] ?? null
}

// y moves early and x late, so the path bows into an arc;
// it lands on a small overshoot and the nav item answers with a bump.
function FlyingTile({ f, onDone }: { f: Flight; onDone: () => void }) {
  const dx = f.tx - (f.x + f.w / 2), dy = f.ty - (f.y + f.h / 2)
  const s = LAND / Math.max(f.w, f.h)
  return (
    <motion.div
      className="catalog__fly"
      style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1, borderRadius: 15 }}
      animate={{ x: dx, y: dy, scale: s, opacity: [1, 1, 0.9, 0], borderRadius: 15 / s }}
      transition={{
        x: { duration: FLY_MS / 1000, ease: [0.6, 0, 0.35, 1] },
        y: { duration: FLY_MS / 1000, ease: [0.15, 0.75, 0.4, 1] },
        scale: { duration: FLY_MS / 1000, ease: [0.3, 0, 0.2, 1] },
        borderRadius: { duration: FLY_MS / 1000 },
        opacity: { duration: FLY_MS / 1000, times: [0, 0.7, 0.92, 1] },
      }}
      onAnimationComplete={() => {
        f.target.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.1) translateY(-2px)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }],
          { duration: 460, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
        )
        onDone()
      }}
    >
      <MaterialTile m={f.m} />
    </motion.div>
  )
}
