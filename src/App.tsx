import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { checksFor, factsFor, personaRowsFor, suggestionsFor, type Changes, type Seen } from './aboutYou'
import { lessons, lessonById, minutesOf, type Lesson } from './data'
import { briefOf } from './materials'
import {
  GOAL_SHORT, LEVEL_GUESS, LEVEL_SHORT, NO_ALTERNATIVE, REASON, SIGNAL_SAID, SWAP_CAUSE, SWAP_SAY, SWAP_WHY,
  REWORK_STEP_MS, WEEK, WORK_SAY, destination, sayChanges, tourSteps, type Head, type Offline,
} from './guide'
import { PHONE, ThemeContext, useMedia, useTimers } from './hooks'
import {
  GOAL_LABEL, buildPath, pathLength, guessWork, milestones, rank, readWords, rejectReason, whyChips, workOf,
  type GoalKey, type Guessed, type Level, type Profile, type Why, type WorkAnswer,
} from './model'
import {
  FMT_NAME, LAYOUT_NAME, alternative, estimate, fill, itemsOf, layoutFor, nextFormat, readAsk, stepsOf,
  type Ask, type Change, type Fmt, type Item, type Learned, type Pref, type Signal, type Sitting,
} from './plan'
import { lowerFirst, lowerKeepAI, plural } from './text'
import { AboutBar } from './components/AboutBar'
import { Avatar } from './components/Avatar'
import { Backdrop } from './components/Backdrop'
import { Builder } from './components/Builder'
import { Dock } from './components/Dock'
import { Entry } from './components/Entry'
import { GuessCheck } from './components/GuessCheck'
import { Guide } from './components/Guide'
import { GuideBubble } from './components/GuideBubble'
import { GuidePanel, WeekButton, type LogEntry } from './components/GuidePanel'
import { ItemSheet } from './components/ItemSheet'
import { Journey, RouteSummary } from './components/Journey'
import { LessonPreview } from './components/LessonPreview'
import { Library } from './components/Library'
import { Path } from './components/Path'
import { Rework } from './components/Rework'
import { Session } from './components/Session'
import { Sidebar } from './components/Sidebar'
import { PEOPLE, meId } from './people'
import { TOUR_STEPS, TourControls } from './components/Tour'

// Google sign-in gives us a first name and an email. A work email we recognise is the only guess
// it can make about you, and it's shown as one.
const me = PEOPLE[meId]
const first = me.name
const fromEmail = guessWork(me.email)

type Phase = 'explore' | 'building' | 'ready'
type Tab = 'path' | 'library'
interface Note { id: number; text: string; why: string; action: string; undo: () => void }
interface Flight { id: number; x: number; y: number; tx: number; ty: number }
interface Pending { id: number; cause: string; why: string; text: string; before: Map<string, string>; undo: () => void }

// A short sitting on a phone (a lunch break), a longer one on a laptop. It's shown as a guess.
const firstSitting = (phone: boolean): Sitting[] => [{ id: 'now', when: 'Now', min: phone ? 10 : 20 }]
const becauseText = (cause: string) => `Because ${lowerFirst(cause)}`
const titlesOf = (items: Item[]) => new Map(items.map((it) => [it.m.key, it.m.title]))
const entryOf = (p: Pending, added: string[], removed: string[]): LogEntry => ({ id: p.id, cause: p.cause, text: p.text, undo: p.undo, added, removed })

// Swaps a lesson on the path, keyed by the lesson first planned in its place.
const swapIn = (subs: Record<string, string>, shown: string, next: string) => {
  const orig = Object.entries(subs).find(([, v]) => v === shown)?.[0] ?? shown
  return { ...subs, [orig]: next }
}

// What each walk-through step is about stays explorable; taps anywhere else nudge the buttons.
const TOUR_SUBJECT = ['.route, .vroute', '.path-wrap', '.gpanel', '.path__ask']


export default function App() {
  const narrow = useMedia(PHONE)
  // on mid-size screens the sidebar folds to its rail so the work area keeps its room
  const mid = useMedia('(max-width: 1180px)')
  const timers = useTimers()
  const seq = useRef(0)
  const pending = useRef<Pending | null>(null) // a change waiting to see what it moved

  // what the guide knows about you
  const [phase, setPhase] = useState<Phase>('explore')
  const [profile, setProfile] = useState<Profile>({})
  const [guessed, setGuessed] = useState<Guessed>({})
  const [asked, setAsked] = useState<string[]>([]) // guesses you waved off; it won't ask again

  // the plan as you've shaped it
  const [added, setAdded] = useState<string[]>([])
  const [sittings, setSittings] = useState(() => firstSitting(narrow))
  const [minutesSource, setMinutesSource] = useState<'you' | 'guess'>('guess')
  const [subs, setSubs] = useState<Record<string, string>>({}) // lessons the guide swapped at your request
  const [formats, setFormats] = useState<Record<string, Fmt>>({})
  const [pref, setPref] = useState<Pref>('auto')
  const [muted, setMuted] = useState<string[]>([]) // topics you already know
  const [done, setDone] = useState<string[]>([])
  const [learned, setLearned] = useState<Learned[]>([])

  // the guide at work
  const [thinking, setThinking] = useState(false)
  const [busy, setBusy] = useState<string | null>(null) // the lesson being reworked
  const [rework, setRework] = useState<{ cause: string; stage: number } | null>(null)
  const [reply, setReply] = useState<string | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  // why each piece the guide swapped in is there, kept on the card until it changes again
  const [because, setBecause] = useState<Record<string, string>>({})
  const [flights, setFlights] = useState<Flight[]>([])
  const [note, setNote] = useState<Note | null>(null)

  // the screen
  const [tab, setTab] = useState<Tab>('path')
  const [unseen, setUnseen] = useState(0) // lessons added from the library, cleared once you look at your path
  const [tour, setTour] = useState<number | null>(null) // the walk-through after the plan is built
  const [nudge, setNudge] = useState(0)
  const [youOpen, setYouOpen] = useState(false) // phone: How I see you, as a sheet opened from your photo
  const [focus, setFocus] = useState(0)
  const [sheet, setSheet] = useState<Item | null>(null)
  const [preview, setPreview] = useState<Lesson | null>(null)
  const [session, setSession] = useState(false)
  const [offline, setOffline] = useState<Offline>('no')
  const [drawer, setDrawer] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Theme follows the system until you choose; your choice is remembered on this device.
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { const t = localStorage.getItem('lv-theme'); if (t === 'light' || t === 'dark') return t } catch { /* private mode */ }
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('lv-theme', theme) } catch { /* private mode */ }
  }, [theme])

  // ----- the plan, derived from what the guide knows -----
  const { goal, level, context } = profile
  const workKey = workOf(profile)
  const ranked = useMemo(() => rank(level ? workKey : null, goal ?? null, muted), [level, workKey, goal, muted])
  const perDay = sittings.reduce((a, x) => a + x.min, 0)
  const stops = useMemo(() => (goal && level ? buildPath(ranked, added, done, muted, pathLength(perDay)) : []), [goal, level, ranked, added, done, muted, perDay])
  const chosen = useMemo(() => stops.map((s) => s.lesson.id), [stops])
  // swaps applied, each lesson shown in the format that suits you
  const path = useMemo(() => stops.map((s) => (subs[s.lesson.id] ? { lesson: lessonById[subs[s.lesson.id]] } : s)), [stops, subs])
  const plan = useMemo(() => (goal ? milestones(path, goal, workKey) : []), [path, goal, workKey])
  const layout = layoutFor(goal)
  const items = useMemo(() => fill(itemsOf(path, layout, pref, formats), sittings), [path, layout, pref, formats, sittings])
  const est = estimate(goal ?? 'understand', level ?? 'new', perDay)
  const nowItems = items.filter((it) => it.slot === 0)
  const nowMin = nowItems.reduce((a, it) => a + it.m.min, 0)
  const step = Math.min(focus, plan.length - 1)
  const libraryLocked = !(phase === 'ready' && tour === null) // until the plan is built and the tour is done

  // Lessons that look close but don't fit, each with the one thing it fails on.
  const decoys = useMemo(
    () => (goal && level ? lessons.filter((l) => !chosen.includes(l.id)).map((l) => ({ id: l.id, ...rejectReason(l, profile) })) : []),
    [goal, level, chosen, profile],
  )
  const whyItem = (it: Item): Why[] => [
    ...(because[it.stop.lesson.id] ? [{ icon: 'changed' as const, text: because[it.stop.lesson.id] }] : []),
    ...whyChips(it.stop, it.i, profile, path),
  ]

  const tabRef = useRef(tab)
  const itemsRef = useRef(items)
  useEffect(() => { tabRef.current = tab }, [tab])
  useEffect(() => { itemsRef.current = items }, [items])

  // passing notices clear themselves
  useEffect(() => {
    if (!note) return
    const t = window.setTimeout(() => setNote(null), 6000)
    return () => clearTimeout(t)
  }, [note])
  useEffect(() => {
    if (!fresh.size) return
    const t = window.setTimeout(() => setFresh(new Set()), 8000)
    return () => clearTimeout(t)
  }, [fresh])

  const notify = (text: string, why: string, action: string, undo: () => void) => setNote({ id: ++seq.current, text, why, action, undo })
  const openTab = (t: Tab) => { setTab(t); if (t === 'path') setUnseen(0) }
  const showTour = (n: number | null) => {
    setTour(n)
    if (n === null) setNudge(0)
    // on a phone, the step about how the guide sees you opens that sheet
    setYouOpen(narrow && n === 2)
  }

  // ----- your answers -----
  const unguess = (what: keyof Guessed) => setGuessed((g) => { const n = { ...g }; delete n[what]; return n })
  const fix = (what: 'goal' | 'level' | 'context', key: string) => { setProfile((p) => ({ ...p, [what]: key })); unguess(what) }
  const pickWork = (w: WorkAnswer) => { setProfile((p) => ({ ...p, work: w })); unguess('work') }

  // The one question: your answer is the goal; experience and approvals start as guesses.
  const start = (answer: GoalKey, why: Guessed, lvl: Level = LEVEL_GUESS[answer], regulated?: 'regulated') => {
    const ctx = regulated ?? (fromEmail?.work === 'regulated' ? 'regulated' : undefined)
    // a bank email says marketing at a regulated company; otherwise the guide doesn't know your work yet
    const work = ctx ? 'marketing' : fromEmail?.work === 'software' ? 'software' : undefined
    setProfile({ goal: answer, level: lvl, context: ctx, work })
    setGuessed({
      ...why,
      ...(ctx && !regulated && fromEmail ? { context: `from your work email (${fromEmail.company})` } : {}),
      ...(!work && !why.work ? { work: 'not asked yet' } : {}),
    })
    setAsked([])
    setPhase('building')
  }
  const words = (text: string) => {
    const r = readWords(text)
    if (!r.work && !r.goal) return notify('Didn’t catch that', 'try “marketing at a bank, want to use AI”', 'OK', () => {})
    const g = r.goal ?? (r.work === 'software' ? 'understand' : 'better')
    const lvl = r.work ? (r.work === 'software' ? 'new' : 'practitioner') : LEVEL_GUESS[g]
    const why: Guessed = { ...(r.goal ? {} : { goal: 'from what you wrote' }), ...(r.work ? {} : { level: 'from what you wrote' }) }
    start(g, why, lvl, r.work === 'regulated' ? 'regulated' : undefined)
    if (r.work) pickWork(r.work === 'software' ? 'software' : 'marketing')
  }

  const addToPath = (l: Lesson) => {
    setAdded((a) => [...a, l.id])
    // the dot appears as the card lands on "Your path" (the flight in Library takes ~720ms)
    timers.later(() => { if (tabRef.current === 'library') setUnseen((n) => n + 1) }, 700)
    notify('Added to your path', l.title, 'Undo', () => setAdded((a) => a.filter((x) => x !== l.id)))
  }
  const saveOffline = () => {
    if (offline === 'saved') return setOffline('no')
    setOffline('saving')
    timers.later(() => {
      setOffline('saved')
      notify('Saved for offline', `${nowMin} min of today’s pieces, playable without signal`, 'Remove', () => setOffline('no'))
    }, 1100)
  }
  const reset = () => {
    timers.clear()
    pending.current = null
    setPhase('explore'); setProfile({}); setGuessed({}); setAsked([])
    setAdded([]); setSittings(firstSitting(narrow)); setMinutesSource('guess'); setSubs({}); setFormats({}); setPref('auto')
    setMuted([]); setDone([]); setLearned([])
    setThinking(false); setBusy(null); setRework(null); setReply(null); setLog([]); setBecause({}); setNote(null)
    setOffline('no'); setFocus(0); openTab('path'); showTour(null)
  }

  // ----- the guide reworks the path: it shows its work, makes the change, logs what moved -----
  // `why` is what a piece that arrives says about itself; by default it's the cause
  const act = (text: string, apply: () => void, target: string | null = null, cause = 'You asked', why = becauseText(cause)) => {
    const before = { profile, guessed, pref, sittings, subs, formats, muted, done, learned, because }
    const id = ++seq.current
    const undo = () => {
      setProfile(before.profile); setGuessed(before.guessed); setPref(before.pref); setSittings(before.sittings); setSubs(before.subs)
      setFormats(before.formats); setMuted(before.muted); setDone(before.done); setLearned(before.learned); setBecause(before.because)
      setLog((x) => x.filter((e) => e.id !== id)); setFresh(new Set()); setReply('Put that back the way it was.')
    }
    setBusy(target); setThinking(true)
    // what it heard first, then each stage ticking off, before anything moves
    setRework({ cause, stage: 0 })
    if (narrow && tour === null) setYouOpen(false)
    timers.later(() => setRework((r) => r && { ...r, stage: 1 }), REWORK_STEP_MS)
    timers.later(() => setRework((r) => r && { ...r, stage: 2 }), REWORK_STEP_MS * 2)
    timers.later(() => {
      pending.current = { id, cause, why, text, before: titlesOf(itemsRef.current), undo }
      apply()
      setBusy(null); setThinking(false); setReply(text); setRework(null)
      // the effect below logs what moved; if nothing on the path did, log it here
      timers.later(() => {
        const p = pending.current
        if (p?.id !== id) return
        pending.current = null
        const e = entryOf(p, [], [])
        setLog((l) => [e, ...l])
      }, 120)
    }, REWORK_STEP_MS * 3)
  }
  useEffect(() => {
    const p = pending.current
    if (!p) return
    pending.current = null
    const after = titlesOf(items)
    const e = entryOf(p, [...after].filter(([k]) => !p.before.has(k)).map(([, t]) => t), [...p.before].filter(([k]) => !after.has(k)).map(([, t]) => t))
    setLog((l) => [e, ...l])
    const arrived = items.filter((it) => !p.before.has(it.m.key)).map((it) => it.stop.lesson.id)
    setFresh(new Set(arrived))
    if (arrived.length) setBecause((b) => ({ ...b, ...Object.fromEntries(arrived.map((id) => [id, p.why])) }))
  }, [items])

  const change = (cs: Change[], cause = 'You asked') => act(sayChanges(cs), () => cs.forEach((c) => {
    if (c.kind === 'minutes') setSittings((x) => [{ ...x[0], min: c.value }, ...x.slice(1)])
    else if (c.kind === 'later') setSittings((x) => (x.some((y) => y.when === c.value) ? x : [...x, { id: c.value, when: c.value, min: c.min }]))
    else if (c.kind === 'pref') setPref(c.value)
    else fix(c.kind, c.value)
  }), null, cause)
  const askText = (t: string) => {
    const cs = readAsk(t)
    if (!cs.length) return setReply('I can change the pace, the format, the level or where you’re heading. Try “more hands-on” or “20 min after lunch”.')
    change(cs, `You asked: “${t}”`)
  }
  const setWork = (w: WorkAnswer, cause: string) => act(WORK_SAY[w], () => pickWork(w), null, cause)
  // your week answers two things at once: the work you do and how much you already know
  const week = (w: (typeof WEEK)[number]) => act(w.say, () => {
    pickWork(w.work)
    if (w.level) { setProfile((p) => ({ ...p, level: w.level })); unguess('level') }
  }, null, w.cause)

  // Asking about one piece: another format, or a swap for something easier, deeper or shorter.
  const ask = (it: Item, a: Ask) => {
    const l = it.stop.lesson
    if (a === 'format') {
      const nf = nextFormat(it.fmt)
      return act(`Made “${l.title}” ${FMT_NAME[nf]}`, () => setFormats((f) => ({ ...f, [l.id]: nf })), l.id, 'You asked for another format', 'Another format, as you asked')
    }
    const alt = alternative(l, a, path.map((x) => x.lesson.id))
    if (!alt) return setReply(NO_ALTERNATIVE[a])
    act(SWAP_SAY[a](alt.title, minutesOf(alt)), () => setSubs((s) => swapIn(s, l.id, alt.id)), l.id, SWAP_CAUSE[a], SWAP_WHY[a])
  }

  // How a piece went teaches the guide something about you, and reshapes the rest of the topic.
  const learn = (topics: string[], signal: Learned['signal'], effect: string) => {
    const xs = topics.map((topic) => ({ id: ++seq.current, topic, signal, effect }))
    setLearned((x) => [...xs, ...x.filter((y) => !topics.includes(y.topic))])
  }
  // a dot travels from the piece to what the guide has learned about you
  const flyToLearned = (lessonId: string) => {
    const from = document.querySelector(`[data-lesson="${lessonId}"]`)?.getBoundingClientRect()
    const to = document.querySelector('.shape')?.getBoundingClientRect()
    if (from && to) setFlights((f) => [...f, { id: ++seq.current, x: from.left + from.width / 2, y: from.top + from.height / 3, tx: to.left + 24, ty: to.top + 20 }])
  }
  const signal = (it: Item, sg: Signal) => {
    const l = it.stop.lesson
    const topic = l.topic
    const said = SIGNAL_SAID[sg]
    if (sg === 'right') {
      const next = path.find((x) => x.lesson.id !== l.id && !done.includes(x.lesson.id))?.lesson.title ?? 'the next step'
      return act(`Nice. Keeping this pace. Next up: “${next}”`, () => setDone((d) => [...d, l.id]), l.id, said)
    }
    flyToLearned(l.id)
    const same = path.filter((x) => x.lesson.topic === topic && x.lesson.id !== l.id)
    if (sg === 'knows') {
      const n = same.length + 1
      return act(`Got it, you know ${topic.toLowerCase()}. Skipped ${plural(n, 'piece')} on it and moved the next step up.`, () => {
        setMuted((m) => [...m, topic])
        learn([topic], 'knows', `Skipped ${n}`)
      }, l.id, said, `Moved up: you already know ${lowerKeepAI(topic)}`)
    }
    const taken = path.map((x) => x.lesson.id)
    const swaps = same.flatMap((x) => {
      const alt = alternative(x.lesson, sg === 'easy' ? 'deeper' : 'easier', taken)
      return alt ? [[x.lesson.id, alt.id] as const] : []
    })
    const n = swaps.length
    const text = sg === 'easy'
      ? `You’re quick at ${topic.toLowerCase()}. ${n ? `Made ${plural(n, 'later piece')} on it harder.` : 'I’ll go faster on it from here.'}`
      : `${topic} takes more time, that’s fine. ${n ? `Swapped ${plural(n, 'later piece')} for gentler ones.` : 'I’ll add a recap before the next one.'}`
    act(text, () => {
      setDone((d) => [...d, l.id])
      setSubs((s) => swaps.reduce((acc, [shown, next]) => swapIn(acc, shown, next), s))
      learn([topic], sg, n ? `Changed ${n}` : 'Noted')
    }, l.id, said, sg === 'easy' ? `Harder, since ${lowerKeepAI(topic)} came easy` : `Gentler, since ${lowerKeepAI(topic)} was hard to follow`)
  }
  // "I know this step already": every topic in the step is known, so the step goes and the next moves up
  // Steps run in order: finished and known lessons leave the path, so the first step is always the
  // current one and the rest are previews. Skipping always means the current step.
  const skipStep = () => {
    const its = stepsOf(plan, items)[0] ?? []
    const topics = [...new Set(its.map((it) => it.stop.lesson.topic))]
    if (!topics.length) return
    act(`Got it, you know this. Skipped ${its.length} pieces and moved the next step up.`, () => {
      setMuted((m) => [...m, ...topics])
      learn(topics, 'knows', 'Skipped')
      setFocus(0)
    }, null, 'You said you know step 1', 'Moved up: you already know the last step')
  }
  const forget = (id: number) => {
    const x = learned.find((y) => y.id === id)
    if (!x) return
    if (x.signal === 'knows') setMuted((m) => m.filter((t) => t !== x.topic))
    setLearned((l) => l.filter((y) => y.id !== id))
    setReply(`Forgot that. ${x.topic} is back on your path.`)
  }

  // ----- what the guide shows back -----
  // with the sidebar open on a laptop, the route folds into its goal card instead of taking a row
  const sideRoute = !narrow && phase === 'ready'
  const known = goal && level ? { goal, level } : null
  const seen: Seen | null = known && { ...known, context, work: profile.work, workKey, guessed, pref, layout, sittings, minutesSource }
  // Changing your time goes through the guide too, so you see what it does: what fits now, and when you'd finish.
  const retime = (id: string, m: number) => {
    const next = sittings.map((x) => (x.id === id ? { ...x, min: m } : x))
    const nextPerDay = next.reduce((a, x) => a + x.min, 0)
    const weeks = estimate(goal ?? 'understand', level ?? 'new', nextPerDay).weeks
    const grow = pathLength(nextPerDay) - pathLength(perDay)
    const sized = grow > 0 ? `Added ${plural(grow, 'lesson')} to your path. ` : grow < 0 ? `Moved ${plural(-grow, 'lesson')} to later. ` : ''
    const slot = next.findIndex((x) => x.id === id)
    const was = items.filter((it) => it.slot === slot)
    const now = fill(itemsOf(path, layout, pref, formats), next).filter((it) => it.slot === slot)
    // what this sitting gains or gives up, named by the pieces themselves
    const gained = now.filter((it) => !was.some((w) => w.m.key === it.m.key))
    const lost = was.filter((it) => !now.some((n) => n.m.key === it.m.key))
    const more = (list: Item[]) => (list.length > 1 ? `, and ${list.length - 1} more` : '')
    const gain = gained.length ? `With ${m} min you'll also get to “${gained[0].m.title}”${more(gained)}. `
      : lost.length ? `“${lost[0].m.title}”${more(lost)} moves to later. ` : ''
    const when = id === 'now' ? 'right now' : next.find((x) => x.id === id)?.when.toLowerCase() ?? ''
    const finish = weeks === est.weeks ? `Still about ${plural(weeks, 'week')} to your goal.` : `You'd finish in about ${plural(weeks, 'week')} instead of ${est.weeks}.`
    act(`${gain}${sized}${finish}`, () => { setSittings(next); setMinutesSource('you') }, null, `You have ${m} min ${when}`)
  }
  // what the sitting teaches, from the pieces that teach (quizzes and templates check or support it)
  const sittingBrief = briefOf(nowItems.filter((it) => it.m.kind !== 'quiz' && it.m.kind !== 'template').map((it) => it.stop.lesson.id))
  const todayLine = !nowItems.length ? null
    : sittingBrief.startsWith('By the end,') ? sittingBrief.replace('By the end,', 'By the end of today,') : `Today ${lowerFirst(sittingBrief)}`
  const pace = (m: number) => retime('now', m)
  const changes: Changes = { change, setWork, pickWork, week, unguess, pace }
  const suggestions = seen ? suggestionsFor(seen, changes) : []
  const facts = seen && phase === 'ready' ? factsFor(seen) : []
  const personaRows = seen ? personaRowsFor(seen, changes) : []
  // one optional question at a time, once the path is in front of you
  const check = seen && phase === 'ready' && tour === null && !thinking
    ? checksFor(seen, changes, first, fromEmail?.company).find((c) => !asked.includes(c.id))
    : undefined

  // ----- the walk-through and the guide's headline -----
  const tourHeads = known
    ? tourSteps({ ...known, legal: context === 'regulated', layout, steps: plan.length, weeks: est.weeks, perDay, levelGuessed: !!guessed.level, sideRoute })
    : []
  useEffect(() => {
    if (tour === null) return
    const subject = TOUR_SUBJECT[tour] ?? '.guide'
    const tap = (e: PointerEvent) => {
      const t = e.target as Element
      if (t.closest('.stage') && !t.closest('.guide') && !t.closest(subject)) setNudge((n) => n + 1)
    }
    document.addEventListener('pointerdown', tap)
    return () => document.removeEventListener('pointerdown', tap)
  }, [tour])

  const head: Head =
    phase === 'explore' ? {
      status: 'Getting to know you',
      title: `Hi ${first}. What brings you here?`,
      meta: 'Pick whichever fits best and I’ll shape a path around it. You can change anything later.',
    }
    : phase === 'building' ? { status: 'Planning', title: 'Building your path' }
    : tour !== null && tourHeads[tour] ? tourHeads[tour]
    : {
      status: thinking ? 'Reworking' : 'Your path',
      title: goal ? destination(goal, context === 'regulated') : 'Your path',
      meta: `About ${plural(est.weeks, 'week')} at ${perDay} min a day · laid out ${LAYOUT_NAME[layout].toLowerCase()}`,
    }

  const claim = note && (
    <span className="claim">
      <span className="claim__dot" />
      <span><b>{note.text}</b> · {note.why}</span>
      <button className="claim__undo" onClick={() => { note.undo(); setNote(null) }}>{note.action}</button>
    </span>
  )
  const guideNote = phase === 'ready' && tour !== null
    ? (
      <TourControls
        step={tour} words={tourHeads[tour]?.meta?.split(' ').length ?? 0} nudge={nudge}
        onNext={() => showTour(tour >= TOUR_STEPS - 1 ? null : tour + 1)} onSkip={() => showTour(null)}
      />
    )
    : claim

  const sidebar = (inDrawer: boolean) => (
    <Sidebar
      tab={tab} first={first} me={meId} theme={theme} badge={unseen} libraryLocked={libraryLocked}
      route={sideRoute && !inDrawer ? <RouteSummary compact={collapsed || mid} legal={context === 'regulated'} plan={plan} items={items} focus={step} onFocus={(i) => { setFocus(i); openTab('path') }} /> : undefined}
      goal={phase === 'ready' && goal ? { label: GOAL_LABEL[goal], weeks: est.weeks, next: nowItems[0] && { title: nowItems[0].m.title, min: nowItems[0].m.min } } : null}
      onNext={() => { if (nowItems[0]) { openTab('path'); setSheet(nowItems[0]); setDrawer(false) } }}
      collapsed={!inDrawer && (collapsed || mid)}
      onCollapse={() => (inDrawer ? setDrawer(false) : setCollapsed((c) => !c))}
      onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      onTab={(t) => { openTab(t); setDrawer(false) }}
      onReset={() => { reset(); setDrawer(false) }}
    />
  )

  const builder = (
    <Builder
      chosen={chosen} minutes={sittings[0].min} decoys={decoys}
      criteria={[
        ...(goal ? [{ id: 'goal' as const, ...REASON.goal[goal] }] : []),
        ...(level ? [{ id: 'level' as const, ...REASON.level[level] }] : []),
        ...(context === 'regulated' ? [{ id: 'context' as const, ...REASON.regulated(fromEmail?.company) }] : []),
      ]}
      onDone={() => { setPhase('ready'); showTour(0) }}
    />
  )

  const panel = (
    <GuidePanel
      today={todayLine}
      est={est} sittings={sittings} thinking={thinking} learned={learned} onForget={forget} changes={log}
      persona={{ name: first, rows: personaRows }} onShow={narrow ? () => setYouOpen(false) : undefined}
    />
  )

  const ready = (
    <>
      {!narrow && !sideRoute && (
        <Journey
          from={level ? LEVEL_SHORT[level] : ''} to={goal ? GOAL_SHORT[goal] : ''} legal={context === 'regulated'}
          plan={plan} items={items} done={done.length} focus={step} onFocus={setFocus}
        />
      )}
      <div className="ready__body">
        <div className="path-wrap" data-rework={rework ? '' : undefined}>
          <AnimatePresence>{rework && <Rework key="rework" cause={rework.cause} stage={rework.stage} />}</AnimatePresence>
          <Path
            layout={layout} plan={plan} items={items} sittings={sittings.map((x) => x.when)} busy={busy} fresh={fresh}
            because={because} stepMin={est.steps} focus={step}
            ask={(
              <GuideBubble
                step={plan[step]?.title ?? ''} thinking={thinking} reply={reply} last={log[0] ?? null} suggestions={suggestions}
                onSkipStep={skipStep} skipLabel={step === 0 ? 'I know this step already' : 'I know step 1 already'} onText={askText} onOpen={() => showTour(null)}
              />
            )}
            onOpen={(it) => (tour !== null ? setNudge((n) => n + 1) : setSheet(it))} onAsk={ask} onSignal={signal}
            onLocked={() => notify('Opens after step 1', 'finish it first, or tell me you know it', 'I know step 1', skipStep)}
          />
        </div>
        {!narrow && panel}
      </div>
    </>
  )

  return (
    <ThemeContext.Provider value={theme}>
      <div className="app" data-side={collapsed || mid ? 'collapsed' : 'open'}>
        <Backdrop theme={theme} />
        {!narrow && <aside className="app__side">{sidebar(false)}</aside>}
        <div className="app__main">
          <header className="top">
            {narrow && (
              <button className="top__menu" onClick={() => setDrawer(true)} aria-label={unseen ? `Open menu, ${unseen} new on your path` : 'Open menu'}>
                <Menu size={18} strokeWidth={2} />
                {unseen > 0 && <motion.i className="top__dot" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 16 }} />}
              </button>
            )}
            {!(narrow && phase === 'ready' && tab === 'path') && <h2 className="top__title">{tab === 'path' ? 'Your path' : 'Library'}</h2>}
            {narrow && phase === 'ready' && tab === 'path' && <button className="top__me" onClick={() => setYouOpen(true)} aria-label="How I see you" aria-expanded={youOpen}><Avatar name={first} /></button>}
            {narrow && phase === 'ready' && tab === 'path' && <WeekButton today={todayLine} est={est} sittings={sittings} />}
            {narrow && phase === 'ready' && tab === 'path' && <RouteSummary pill legal={context === 'regulated'} plan={plan} items={items} focus={step} onFocus={(i) => { setFocus(i); setYouOpen(false) }} />}
            {!narrow && <AboutBar facts={facts} onFix={fix} onEdit={() => { setPhase('explore'); openTab('path') }} />}
          </header>

          {tab === 'path' ? (
            <main className="stage">
              <Guide status={head.status} title={head.title} meta={head.meta} thinking={thinking} reveal={phase === 'ready' && tour !== null} note={guideNote} />
              <LayoutGroup>
                <AnimatePresence mode="popLayout" initial={false}>
                  {phase === 'explore' ? (
                    <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                      <Entry
                        onAnswer={(g) => start(g, { level: 'from your answer' })}
                        onWords={words}
                        onLook={() => start('understand', { goal: 'you haven’t said yet', level: 'starting simple' })}
                      />
                    </motion.div>
                  ) : phase === 'building' ? (
                    <motion.div key="building" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.35 } }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                      {builder}
                    </motion.div>
                  ) : (
                    <motion.div key="plan" className="ready" data-tour={tour ?? undefined} data-mtab={narrow ? 'path' : undefined} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.35 } }}>
                      {ready}
                    </motion.div>
                  )}
                </AnimatePresence>
              </LayoutGroup>
            </main>
          ) : (
            <Library ranked={ranked} chosen={chosen} goal={goal ? GOAL_SHORT[goal] : null} onAdd={addToPath} onOpen={setPreview} />
          )}

          {tab === 'path' && check && <GuessCheck key={check.id} check={check} onDismiss={() => setAsked((a) => [...a, check.id])} />}
          {phase === 'ready' && tab === 'path' && tour === null && (
            <Dock
              items={items} sittings={sittings} guess={minutesSource === 'guess'}
              onMinutes={retime}
              onAdd={(when) => setSittings((x) => [...x, { id: when, when, min: 20 }])}
              onRemove={(id) => setSittings((x) => x.filter((y) => y.id !== id))}
              onStart={() => setSession(true)}
              offline={offline}
              onOffline={saveOffline}
            />
          )}
        </div>

        <AnimatePresence>
          {narrow && drawer && (
            <>
              <motion.div className="scrim" onClick={() => setDrawer(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.aside className="drawer" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
                {sidebar(true)}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {tab === 'library' && note && (
            <motion.div key={note.id} className="notice" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>{claim}</motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {session && <Session items={nowItems} brief={sittingBrief} offline={offline} onOffline={saveOffline} onClose={() => setSession(false)} />}
        </AnimatePresence>

        {narrow && createPortal(
        <AnimatePresence>
          {youOpen && phase === 'ready' && (
            <>
              <motion.div key="scrim" className="you-scrim" onClick={() => setYouOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.div key="sheet" className="you-sheet" role="dialog" aria-label="How I see you" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
                <span className="you-sheet__grip" aria-hidden />
                {panel}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
      {flights.map((d) => (
          <motion.span
            key={d.id}
            className="flight flight--dot"
            initial={{ x: d.x, y: d.y, width: 14, height: 14, opacity: 1 }}
            animate={{ x: d.tx, y: d.ty, width: 8, height: 8, opacity: 0.9 }}
            transition={{ duration: 0.8, ease: [0.5, 0, 0.2, 1] }}
            onAnimationComplete={() => setFlights((all) => all.filter((x) => x.id !== d.id))}
          />
        ))}

        <AnimatePresence>
          {sheet && (
            <ItemSheet
              it={sheet} why={whyItem(sheet)} when={sheet.slot != null ? sittings[sheet.slot]?.when ?? null : null}
              onClose={() => setSheet(null)}
              onAsk={(a) => { const it = sheet; setSheet(null); ask(it, a) }}
              onSignal={(sg) => { const it = sheet; setSheet(null); timers.later(() => signal(it, sg), 220) }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {preview && <LessonPreview lesson={preview} onClose={() => setPreview(null)} />}
        </AnimatePresence>
      </div>
    </ThemeContext.Provider>
  )
}
