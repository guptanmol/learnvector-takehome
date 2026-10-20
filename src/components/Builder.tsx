import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Check, FastForward, FileText, Gamepad2, ListChecks, MessageSquareText, Play, X, type LucideIcon } from 'lucide-react'
import { ThinkingOrb } from 'thinking-orbs'
import { lessonById } from '../data'
import { KIND_LABEL, materials, materialsOf, type Kind, type Material } from '../materials'
import media from '../media.json'
import { FACT_COLOR, KIND_COLOR } from '../colors'
import { PHONE, useMedia } from '../hooks'
import type { Crit } from '../model'

const clips = media as Record<string, { poster: string; loop: string }>

const KIND_ICON: Record<Kind, LucideIcon> = { video: Play, game: Gamepad2, drill: MessageSquareText, quiz: ListChecks, case: BookOpen, template: FileText }

interface Props {
  chosen: string[] // lessons in plan order
  decoys: { id: string; why: string; about: Crit }[] // lessons that look close but don't fit, and why
  criteria: { id: Crit; text: string }[] // what the guide understood about you, checked one at a time
  minutes: number
  onDone: () => void
}

type State = 'grey' | 'bloom' | 'kept' | 'no'
interface Slot { m: Material; state: State; crit?: Crit; why?: string; pin?: boolean }

const BLOOM = 1100 // ms for a tile to bloom from black and white into colour
const DROP = 650 // gap between each match blooming, as if it's reading each one
const DECIDE = 380 // gap between each decision
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

// The library starts grey. The guide checks it against one thing it knows about you at a
// time, and what matches blooms into colour. What fits drops into your picks below; the grid keeps
// turning over to new material, so it reads as a library far bigger than the screen.
export function Builder({ chosen, decoys, criteria, minutes, onDone }: Props) {
  // phones: fewer tiles, and no blur (iOS Safari renders animated blur with artefacts)
  const phone = useMedia(PHONE)
  const count = phone ? 4 : 12
  const filler = useMemo(() => materials.filter((m) => !chosen.includes(m.lesson)), [chosen])
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: count }, () => ({ m: pick(filler), state: 'grey' })))
  const [picked, setPicked] = useState<{ m: Material; crit: Crit }[]>([])
  const [phase, setPhase] = useState(0) // 0 reading you, 1 checking the library, 2 ordering
  const [active, setActive] = useState<Crit | null>(null)
  const [found, setFound] = useState<Partial<Record<Crit, number>>>({})
  const done = useRef(onDone)
  done.current = onDone

  // each kept lesson shows as one of its materials, so the picks read as a mix, not a video list
  const keptAs = useMemo(() => {
    const order: Kind[] = ['video', 'game', 'case', 'quiz', 'template', 'video', 'game']
    return Object.fromEntries(chosen.map((id, i) => {
      const ms = materialsOf(lessonById[id])
      const want = order[i % order.length]
      const m = ms.find((x) => x.kind === want) ?? ms.find((x) => want === 'game' && x.kind === 'drill') ?? ms[0]
      return [id, m]
    }))
  }, [chosen])

  useEffect(() => {
    const ts: number[] = []
    const at = (ms: number, f: () => void) => ts.push(window.setTimeout(f, ms))
    const rounds = criteria.length
    const per = Math.ceil(chosen.length / rounds)
    const pool = [...decoys]
    const fresh = (): Slot => ({ m: pick(filler), state: 'grey' })
    at(1400, () => setPhase(1))
    let t0 = 1600
    criteria.forEach((c, r) => {
      const keep = chosen.slice(r * per, (r + 1) * per)
      // close calls: match this, fail something else
      const close = pool.filter((d) => d.about !== c.id).slice(0, 1)
      close.forEach((d) => pool.splice(pool.indexOf(d), 1))
      const bring: Slot[] = [
        ...keep.map((id) => ({ m: keptAs[id], state: 'grey' as const, pin: true })),
        ...close.map((d) => ({ m: pick(materialsOf(lessonById[d.id])), state: 'grey' as const, pin: true, why: d.why })),
      ]
      at(t0, () => {
        setActive(c.id)
        // the whole grid turns over; this round's candidates land somewhere in it
        setSlots((prev) => {
          const order = prev.map((_, i) => i).sort(() => Math.random() - 0.5)
          const next = prev.map(fresh)
          bring.forEach((b, k) => { next[order[k]] = b })
          return next
        })
      })
      // matches bloom one at a time, as if it's reading each one
      bring.forEach((b, k) => at(t0 + 1500 + k * DROP, () => {
        setSlots((prev) => prev.map((s) => (s.pin && s.m.key === b.m.key ? { ...s, state: 'bloom', crit: c.id } : s)))
        setFound((f) => ({ ...f, [c.id]: (f[c.id] ?? 0) + 1 }))
      }))
      // then it decides on each: a fit drops into your picks and its spot refills; a miss goes grey
      bring.forEach((b, k) => at(t0 + 1500 + bring.length * DROP + 500 + k * DECIDE, () => {
        if (b.why) return setSlots((prev) => prev.map((s) => (s.pin && s.m.key === b.m.key ? { ...s, pin: false, state: 'no' } : s)))
        setSlots((prev) => prev.map((s) => (s.pin && s.m.key === b.m.key ? fresh() : s)))
        setPicked((p) => [...p, { m: b.m, crit: c.id }])
      }))
      t0 += 1500 + bring.length * (DROP + DECIDE) + 1300
    })
    at(t0, () => { setActive(null); setPhase(2) })
    at(t0 + 2600, () => done.current())
    return () => ts.forEach(clearTimeout)
    // the build is scripted once, from the plan it mounted with
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // the grid never stops turning over: the library is far bigger than this screen
  useEffect(() => {
    if (phase < 1) return
    const t = window.setInterval(() => setSlots((prev) => {
      const idle = prev.map((s, i) => (s.state !== 'bloom' && !s.pin ? i : -1)).filter((i) => i >= 0)
      if (!idle.length) return prev
      const i = pick(idle)
      const next = [...prev]
      next[i] = { m: pick(filler), state: 'grey' }
      return next
    }), phone ? 260 : 700)
    return () => clearInterval(t)
  }, [phase, filler, phone])

  const shown = phase === 2 ? [...picked].sort((a, b) => chosen.indexOf(a.m.lesson) - chosen.indexOf(b.m.lesson)) : picked
  const activeText = criteria.find((c) => c.id === active)?.text
  const status = phase === 0 ? 'Reading what you told me' : phase === 1 ? 'Going through the library' : `Ordering your picks · ${minutes} min today`
  const sub = activeText ? `${found[active!] ?? 0} match “${activeText}”` : phase === 2 ? 'Putting them in the order you’ll learn them' : 'Starting with what you told me'

  return (
    <section className="builder" aria-live="polite">
      <div className="builder__head">
        <span className="builder__orb" aria-hidden><ThinkingOrb state={phase === 1 ? 'searching' : 'composing'} size={32} /></span>
        <AnimatePresence mode="wait">
          <motion.span key={status} className="builder__status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>{status}</motion.span>
        </AnimatePresence>
        <button className="link builder__skip" onClick={() => done.current()}><FastForward size={13} strokeWidth={2} /> Skip</button>
      </div>

      <div className="crits">
        {criteria.map((c, i) => (
          <motion.span key={c.id} className={`crit ${active === c.id ? 'is-on' : ''}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, scale: active === c.id ? 1.04 : 1 }} transition={{ opacity: { delay: 0.2 + i * 0.18 }, y: { delay: 0.2 + i * 0.18 }, scale: { type: 'spring', stiffness: 420, damping: 16 } }}>
            <span className="cdot" style={{ background: FACT_COLOR[c.id] }} />{c.text}
            {found[c.id] ? <motion.b key={found[c.id]} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>{found[c.id]}</motion.b> : null}
          </motion.span>
        ))}
      </div>
      <p className="crits__sub">{sub}</p>

      <div className="lib" style={{ ['--rows' as string]: phone ? 2 : 3 }}>
        {slots.map((s, i) => (
          <div key={i} className="lib__slot">
            <AnimatePresence initial={false}>
              <motion.div
                key={s.m.key}
                layoutId={s.pin && !s.why ? `pick-${s.m.key}` : undefined}
                className="lib__fade"
                initial={phone ? { opacity: 0, y: '38%', scale: 0.96 } : { opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
                animate={phone ? { opacity: 1, y: '0%', scale: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={phone ? { opacity: 0, y: '-38%', scale: 0.96 } : { opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
                transition={{ duration: phone ? 0.42 : 1.1, ease: [0.22, 1, 0.36, 1], delay: s.pin ? 0 : phone ? (i % 2) * 0.06 + Math.floor(i / 2) * 0.05 : (i % 4) * 0.09 + Math.floor(i / 4) * 0.07, layout: { type: 'spring', stiffness: 120, damping: 20 } }}
              >
                <MaterialTile m={s.m} state={s.state} crit={s.crit} why={s.why} />
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="picks">
        <span className="picks__label">Picked for you <b>{picked.length}</b></span>
        <div className="picks__row" style={{ ['--n' as string]: chosen.length }}>
          {shown.map((p, i) => (
            <motion.div key={p.m.key} layoutId={`pick-${p.m.key}`} layout className="pick" transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
              <MaterialTile m={p.m} state="kept" crit={p.crit} n={phase === 2 ? i + 1 : 0} />
            </motion.div>
          ))}
          {Array.from({ length: Math.max(0, chosen.length - picked.length) }).map((_, i) => <span key={`e${i}`} className="pick pick--empty" />)}
        </div>
      </div>
    </section>
  )
}

// One piece of course material, drawn as what you'd actually do with it.
export function MaterialTile({ m, state = 'kept', crit, why, n }: { m: Material; state?: State; crit?: Crit; why?: string; n?: number }) {
  const KI = KIND_ICON[m.kind]
  const photo = m.kind === 'video' || m.kind === 'case'
  const poster = clips[m.lesson]?.poster
  const wet = state === 'bloom' || state === 'kept'
  // where the drop lands, so each tile's colour spreads from a different spot
  const h = [...m.key].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 997, 7)
  const art = photo ? (poster ? <img className="mt__img" src={poster} alt="" draggable={false} /> : null) : <Art m={m} />
  return (
    <div className={`mt mt--${m.kind} is-${state} ${photo ? 'mt--photo' : ''}`} style={{ ['--k' as string]: KIND_COLOR[m.kind] }}>
      {/* black and white underneath; colour blooms over it from one point */}
      <div className="mt__layer mt__layer--dry" aria-hidden>{art}</div>
      <div
        className="mt__layer mt__layer--wet"
        style={{
          clipPath: `circle(${wet ? 150 : 0}% at ${20 + (h % 60)}% ${25 + ((h >> 3) % 50)}%)`,
          transition: wet ? `clip-path ${BLOOM}ms cubic-bezier(0.22, 0.8, 0.2, 1)` : `clip-path ${Math.round(BLOOM * 0.55)}ms cubic-bezier(0.4, 0, 1, 1)`,
        }}
      >
        {art}
        <span className="mt__kind"><KI size={11} strokeWidth={2.3} />{KIND_LABEL[m.kind]}<i>{m.min} min</i></span>
        <p className="mt__title">{m.title}</p>
      </div>
      {crit && (
        <span className="mt__dot" style={{ background: FACT_COLOR[crit], opacity: wet ? 1 : 0, transform: wet ? 'scale(1)' : 'scale(0.4)', transitionDelay: wet ? `${BLOOM * 0.4}ms` : '0ms' }} />
      )}
      {state === 'kept' && crit && !n && (
        <motion.span className="mt__badge is-kept" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 16 }}>
          <Check size={12} strokeWidth={2.8} />
        </motion.span>
      )}
      {n ? <motion.span className="mt__badge is-num" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 16, delay: n * 0.08 }}>{n}</motion.span> : null}
      <AnimatePresence>
        {state === 'no' && why && (
          <motion.span className="mt__why" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <X size={11} strokeWidth={2.6} />{why}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

// small drawings of the activity itself, so a game looks like a game and a quiz like a quiz
function Art({ m }: { m: Material }) {
  if (m.kind === 'quiz' && m.q) return (
    <span className="art art--quiz">
      {m.q.a.map((a, i) => <span key={a} className={i === 0 ? 'is-right' : ''}>{i === 0 && <Check size={10} strokeWidth={3} />}{a}</span>)}
    </span>
  )
  if (m.kind === 'game') return (
    <span className="art art--game">
      <span className="art__chips"><i /><i /><i /></span>
      <span className="art__bins"><i /><i /><i /></span>
    </span>
  )
  if (m.kind === 'drill') return (
    <span className="art art--drill">
      <span className="art__bubble"><i /><i /></span>
      <span className="art__bubble is-guide"><i /></span>
    </span>
  )
  return (
    <span className="art art--template">
      <span className="art__sheet"><b /><i /><i /><i /></span>
    </span>
  )
}
