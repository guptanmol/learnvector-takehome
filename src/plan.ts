import { lessons, minutesOf, type Lesson } from './data'
import { materialsOf, type Kind, type Material } from './materials'
import { lowerKeepAI } from './text'
import type { Context, GoalKey, Level, Milestone, Stop } from './model'

// The plan screen isn't one layout. How it's laid out follows how you said you want to learn:
// new and curious reads as a story, chapter by chapter; AI at work puts practice first and
// lessons on demand; a working marketer gets a toolkit, grouped by the problem it solves.
export type Layout = 'story' | 'practice' | 'toolkit'
export const layoutFor = (goal?: GoalKey): Layout => (goal === 'ai' ? 'practice' : goal === 'better' ? 'toolkit' : 'story')

export const LAYOUT_NAME: Record<Layout, string> = { story: 'Chapter by chapter', practice: 'Practice first', toolkit: 'Your toolkit' }

// How you'd rather learn, set by asking the guide. 'auto' lets the layout decide.
export type Pref = 'auto' | 'watch' | 'do' | 'read'
export type Fmt = Kind | 'practice'

const CYCLE: Record<Layout, Fmt[]> = {
  story: ['video', 'practice', 'quiz', 'video', 'practice', 'case', 'video'],
  practice: ['practice', 'video', 'template', 'practice', 'case', 'practice', 'video'],
  toolkit: ['template', 'case', 'practice', 'video', 'template', 'quiz', 'case'],
}
const PREF: Record<Exclude<Pref, 'auto'>, Fmt[]> = { watch: ['video'], do: ['practice', 'quiz'], read: ['case', 'template'] }
const FORMATS: Fmt[] = ['video', 'practice', 'case', 'quiz', 'template']

function formatFor(i: number, layout: Layout, pref: Pref, override?: Fmt): Fmt {
  if (override) return override
  if (pref !== 'auto') return PREF[pref][i % PREF[pref].length]
  return CYCLE[layout][i % CYCLE[layout].length]
}

function materialFor(l: Lesson, f: Fmt): Material {
  const ms = materialsOf(l)
  if (f === 'practice') return ms.find((m) => m.kind === 'game' || m.kind === 'drill')!
  return ms.find((m) => m.kind === f) ?? ms[0]
}

export interface Item { stop: Stop; i: number; m: Material; fmt: Fmt; slot: number | null }

export function itemsOf(stops: Stop[], layout: Layout, pref: Pref, formats: Record<string, Fmt>): Item[] {
  return stops.map((stop, i) => {
    const fmt = formatFor(i, layout, pref, formats[stop.lesson.id])
    return { stop, i, fmt, m: materialFor(stop.lesson, fmt), slot: null }
  })
}

// The items of each milestone, in path order.
export function stepsOf(plan: Milestone[], items: Item[]): Item[][] {
  let k = 0
  return plan.map((m) => m.stops.map(() => items[k++]).filter(Boolean))
}

// Learning happens in sittings: ten minutes now, twenty after lunch. Each sitting takes the next
// pieces in order, as far as its time goes.
export interface Sitting { id: string; when: string; min: number }
export const LATER = ['After lunch', 'This evening', 'Tomorrow morning']
export const MINUTE_STOPS = [10, 20, 30, 60]

export function fill(items: Item[], sittings: Sitting[]): Item[] {
  let k = 0
  let used = 0
  return items.map((it) => {
    while (k < sittings.length && used + it.m.min > sittings[k].min) { k++; used = 0 }
    if (k >= sittings.length) return { ...it, slot: null }
    used += it.m.min
    return { ...it, slot: k }
  })
}

// ----- asking the guide to rework one item -----
export type Ask = 'easier' | 'deeper' | 'shorter' | 'format' | 'other'

export function alternative(l: Lesson, ask: Exclude<Ask, 'format'>, taken: string[]): Lesson | null {
  const pool = lessons.filter((x) => x.id !== l.id && !taken.includes(x.id))
  const near = pool.filter((x) => x.goal === l.goal || x.topic === l.topic)
  const from = near.length ? near : pool
  const closest = (a: Lesson, b: Lesson) => Math.abs(a.level - l.level) - Math.abs(b.level - l.level)
  const best = (xs: Lesson[], by: (a: Lesson, b: Lesson) => number) => xs.sort(by)[0] ?? null
  if (ask === 'easier') return best(from.filter((x) => x.level < l.level), (a, b) => b.level - a.level)
  if (ask === 'deeper') return best(from.filter((x) => x.level > l.level), (a, b) => a.level - b.level)
  if (ask === 'shorter') return best(from.filter((x) => minutesOf(x) < minutesOf(l)), closest)
  return best(from, closest)
}

export const nextFormat = (f: Fmt): Fmt => FORMATS[(FORMATS.indexOf(f) + 1) % FORMATS.length]
export const FMT_NAME: Record<Fmt, string> = {
  video: 'a lesson', practice: 'hands-on practice', case: 'a case study', quiz: 'a quick quiz', template: 'a template', game: 'a game', drill: 'practice with AI',
}

// ----- asking the guide in your own words -----
export type Change =
  | { kind: 'minutes'; value: number }
  | { kind: 'pref'; value: Pref }
  | { kind: 'level'; value: Level }
  | { kind: 'goal'; value: GoalKey }
  | { kind: 'context'; value: Context }
  | { kind: 'later'; value: string; min: number }

const nearestStop = (n: number) => MINUTE_STOPS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a))

// A small keyword reader. Mocked on purpose; a real agent goes here.
export function readAsk(text: string): Change[] {
  const t = text.toLowerCase()
  const out: Change[] = []
  const n = t.match(/(\d+)\s*(m\b|min)/)?.[1]
  const min = n ? nearestStop(+n) : /hour/.test(t) ? 60 : null
  // "20 min after lunch" is a later sitting, not the one right now
  const later = min !== null ? t.match(/after lunch|this evening|tonight|later/)?.[0] : undefined
  if (min !== null && !later) out.push({ kind: 'minutes', value: min })
  if (/hands|doing|practi|game|interactive|try/.test(t)) out.push({ kind: 'pref', value: 'do' })
  else if (/watch|video|explain|show me/.test(t)) out.push({ kind: 'pref', value: 'watch' })
  else if (/read|template|example|case/.test(t)) out.push({ kind: 'pref', value: 'read' })
  if (/basic|easier|simpler|new to|beginner/.test(t)) out.push({ kind: 'level', value: 'new' })
  else if (/advanced|harder|deeper|know the basics|skip the basics|experienced/.test(t)) out.push({ kind: 'level', value: 'practitioner' })
  if (/\bai\b|prompt|chatgpt|claude|gpt/.test(t)) out.push({ kind: 'goal', value: 'ai' })
  else if (/understand|fundamental|how marketing works/.test(t)) out.push({ kind: 'goal', value: 'understand' })
  else if (/better at|my job|career|promot/.test(t)) out.push({ kind: 'goal', value: 'better' })
  if (min !== null && later) out.push({ kind: 'later', value: /evening|tonight/.test(later) ? 'This evening' : 'After lunch', min })
  if (/no legal|don.t need legal|skip legal/.test(t)) out.push({ kind: 'context', value: 'general' })
  else if (/legal|complian|bank|regulat/.test(t)) out.push({ kind: 'context', value: 'regulated' })
  return out
}

// ----- what the guide learns from how it went -----
// Knowing something, finding it easy, or finding it hard are signals about you, not the lesson.
// Each one is kept, shown back to you, and changes the rest of the path.
export type Signal = 'knows' | 'easy' | 'right' | 'hard'
export const isSignal = (x: string): x is Signal => x === 'knows' || x === 'easy' || x === 'right' || x === 'hard'
export interface Learned { id: number; topic: string; signal: Exclude<Signal, 'right'>; effect: string }
export const LEARNED_TEXT: Record<Learned['signal'], (t: string) => string> = {
  knows: (t) => `Knows ${lowerKeepAI(t)}`,
  easy: (t) => `Quick at ${lowerKeepAI(t)}`,
  hard: (t) => `Slower on ${lowerKeepAI(t)}`,
}

// ----- how long the whole thing really takes -----
// The pieces on screen are only the start of each step. A goal like "better at the job" is weeks
// of practice, so the estimate comes from the goal, not from the handful of pieces planned so far.
const GOAL_HOURS: Record<GoalKey, number> = { understand: 6, ai: 9, better: 12 }
const STEP_SHARE = [0.3, 0.4, 0.3]
const DAYS_A_WEEK = 5

export interface Estimate { total: number; steps: number[]; weeks: number }
export function estimate(goal: GoalKey, level: Level, perDay: number): Estimate {
  const total = Math.round(GOAL_HOURS[goal] * 60 * (level === 'new' ? 1.3 : 1))
  const weeks = Math.max(1, Math.ceil(total / (Math.max(10, perDay) * DAYS_A_WEEK)))
  return { total, steps: STEP_SHARE.map((s) => Math.round(total * s)), weeks }
}
export const hours = (min: number) => (min < 90 ? `${min} min` : `${Math.round(min / 30) / 2} h`.replace('.5 h', '½ h'))
