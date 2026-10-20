import { lessons, lessonById, type Lesson } from './data'

// ----- what the guide knows about you -----

export type GoalKey = 'understand' | 'ai' | 'better'
export type Level = 'new' | 'practitioner'
export type Context = 'regulated' | 'general'
export type WorkAnswer = 'software' | 'marketing' | 'other'
// who the plan's examples are written for
export type WorkKey = 'software' | 'marketing' | 'regulated'

export interface Profile { goal?: GoalKey; level?: Level; context?: Context; work?: WorkAnswer }
// facts the guide filled in itself, and why
export type Guessed = Partial<Record<'goal' | 'level' | 'context' | 'work', string>>

export const GOAL_LABEL: Record<GoalKey, string> = {
  understand: 'Understand how marketing works',
  ai: 'Use AI in my marketing work',
  better: 'Get better at my marketing job',
}
export const GOAL_KEYS = Object.keys(GOAL_LABEL) as GoalKey[]
export const LEVEL_LABEL: Record<Level, string> = { new: 'Start from the beginning', practitioner: 'I know the basics' }
export const CONTEXT_LABEL: Record<Context, string> = { regulated: 'My work needs legal approval', general: 'No legal approval needed' }

// Your own answer first, then approvals, then a guess from experience.
export const workOf = (p: Profile): WorkKey =>
  p.context === 'regulated' ? 'regulated'
  : p.work === 'software' || p.work === 'marketing' ? p.work
  : p.level === 'new' ? 'software' : 'marketing'

// The email domain is the only thing a Google sign-in tells us about work. It is a guess, never a fact.
const KNOWN: Record<string, { company: string; work: WorkKey }> = {
  'harborbank.com': { company: 'Harbor Bank', work: 'regulated' },
  'lumen.dev': { company: 'Lumen', work: 'software' },
}
const PERSONAL = /^(gmail|googlemail|outlook|hotmail|yahoo|icloud|me|proton|protonmail)\./
export function guessWork(email: string): { work: WorkKey; company: string } | null {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (!domain || PERSONAL.test(domain)) return null
  if (KNOWN[domain]) return KNOWN[domain]
  const base = domain.split('.')[0]
  const company = base.charAt(0).toUpperCase() + base.slice(1)
  if (/bank|capital|credit|insur|financ|pharma|health/.test(base)) return { work: 'regulated', company }
  if (/\.(dev|io|ai|app|tech)$/.test(domain) || /labs|soft|tech|code/.test(base)) return { work: 'software', company }
  return null
}

// "Tell me in your own words": a small keyword reader. Mocked on purpose; a real agent goes here.
export function readWords(text: string): { work: WorkKey | null; goal: GoalKey | null } {
  const t = text.toLowerCase()
  // a marketing role wins over where it happens: "growth at a startup" is marketing, not software
  const work: WorkKey | null = /bank|complian|regulat|financ|insur|legal/.test(t) ? 'regulated'
    : /market|campaign|brand|growth|social|seo|content (lead|manager|strateg)/.test(t) ? 'marketing'
    : /engineer|develop|software|code|build|product|startup|founder/.test(t) ? 'software' : null
  const goal: GoalKey | null = /\bai\b|chatgpt|gpt|claude|automat|prompt|model/.test(t) ? 'ai'
    : /understand|learn|basics|how .*works|new to|curious/.test(t) ? 'understand'
    : /better|improve|grow|promot|career|senior/.test(t) ? 'better' : null
  return { work, goal }
}

// ----- ranking and the path -----

export interface Stop { lesson: Lesson }

// How many lessons the plan holds: more time a day, more of the path laid out now.
export const pathLength = (perDay: number) => Math.min(14, Math.max(5, Math.round(perDay / 3)))

// Lessons scored against who they're written for, your goal and topics you already know.
export function rank(work: WorkKey | null, goal: GoalKey | null, muted: string[]): Lesson[] {
  return lessons
    .map((l) => {
      let score = 0
      if (work) {
        if (l.for === work) score += 2.2
        else if (work === 'regulated' && l.for === 'marketing') score += 0.6
        else if (work !== 'software' && l.for === 'software') score -= 1.6
        else if (work === 'software' && l.for !== 'software' && l.level > 0.55) score -= 1.2
      }
      if (goal && l.goal === goal) score += 1.8
      if (muted.includes(l.topic)) score -= 5
      return { l, score }
    })
    .sort((a, b) => b.score - a.score)
    .map((r) => r.l)
}

// What you added from the library first, then the best-ranked lessons, basics to applied.
export function buildPath(ranked: Lesson[], added: string[], removed: string[], muted: string[], length: number): Stop[] {
  const out: Stop[] = []
  added.forEach((id) => {
    if (!out.some((o) => o.lesson.id === id) && !removed.includes(id)) out.push({ lesson: lessonById[id] })
  })
  const taken = new Set(out.map((o) => o.lesson.id))
  ranked
    .filter((l) => !taken.has(l.id) && !removed.includes(l.id) && !muted.includes(l.topic))
    .slice(0, Math.max(0, length - out.length))
    .sort((a, b) => a.level - b.level)
    .forEach((l) => out.push({ lesson: l }))
  return out
}

// ----- the plan: three milestones from where you are to your goal -----

export interface Milestone { title: string; why: string; stops: Stop[] }

// Each step is named for what you'll learn in it, in plain words, with what you'll be able to do after.
const ROUTES: Record<GoalKey, (w: WorkKey) => [string, string][]> = {
  understand: () => [
    ['What marketing is and how it works', 'You’ll see how getting noticed, winning trust and making a sale connect.'],
    ['Who buys, and why they say yes', 'You’ll describe who a product is for and what makes them choose it.'],
    ['Market a product you know', 'You’ll write a one-page plan for something real.'],
  ],
  ai: (w) => [
    ['Write prompts that get usable drafts', 'You’ll get a first draft from AI you can actually edit.'],
    ['Use AI across a campaign', 'AI will take the research, variants and planning off your plate.'],
    w === 'regulated'
      ? ['Get AI copy through review', 'You’ll know what legal will flag before you send it.']
      : ['Check AI work before it ships', 'You’ll catch what AI gets wrong before anyone else sees it.'],
  ],
  better: () => [
    ['Ask customers better questions', 'You’ll get honest answers instead of polite ones.'],
    ['Find where people drop off', 'You’ll spot the step that loses people, and why.'],
    ['Run tests you can trust', 'You’ll tell a real win from luck.'],
  ],
}

// Index of the first stop in each milestone after the first.
const stepStarts = (n: number) => [Math.ceil(n / 3), Math.ceil((2 * n) / 3)]

// Splits the planned stops into three milestones, basics first.
export function milestones(stops: Stop[], goal: GoalKey, work: WorkKey): Milestone[] {
  const cut = [0, ...stepStarts(stops.length), stops.length]
  return ROUTES[goal](work).map(([title, why], i) => ({ title, why, stops: stops.slice(cut[i], cut[i + 1]) }))
}

// ----- why each lesson is in, and why the rest are out -----

export type Why = { icon: 'goal' | 'level' | 'shield' | 'builds' | 'changed'; text: string }

const GOAL_TOWARD: Record<GoalKey, string> = { understand: 'Toward: the basics', ai: 'Toward: AI at work', better: 'Toward: get better' }

// Every lesson justifies its place: the role it plays in the sequence and what it gets you to.
export function whyChips(stop: Stop, i: number, p: Profile, path: Stop[]): Why[] {
  const l = stop.lesson
  const chips: Why[] = []
  const before = path.slice(0, i)
  const sameTopic = before.map((s) => s.lesson.topic).lastIndexOf(l.topic)
  const opens = stepStarts(path.length).indexOf(i)
  if (i === 0) chips.push({ icon: 'level', text: p.level === 'new' ? 'Foundation, starts from zero' : 'Foundation for the rest' })
  else if (opens >= 0) chips.push({ icon: 'builds', text: `Starts step ${opens + 2}, once #${i} is done` })
  else if (sameTopic >= 0) chips.push({ icon: 'builds', text: `Builds on #${sameTopic + 1}` })
  else if (l.level > before[i - 1].lesson.level + 0.05) chips.push({ icon: 'builds', text: `A step up from #${i}` })
  else chips.push({ icon: 'builds', text: `Widens what #${i} started` })
  if (p.goal && l.goal === p.goal) chips.push({ icon: 'goal', text: GOAL_TOWARD[p.goal] })
  if (p.context === 'regulated' && l.for === 'regulated') chips.push({ icon: 'shield', text: 'Passes legal review' })
  return chips
}

// The fact a lesson is checked against while the path is built.
export type Crit = 'goal' | 'level' | 'context' | 'time'

// A lesson left out of the path, and the one thing it fails on.
export function rejectReason(l: Lesson, p: Profile): { why: string; about: Crit } {
  if (p.level === 'practitioner' && l.level < 0.3) return { why: 'Too basic for you', about: 'level' }
  if (p.level === 'new' && l.level > 0.65) return { why: 'Too advanced to start with', about: 'level' }
  if (p.goal && l.goal !== p.goal) return { why: 'Not toward your goal', about: 'goal' }
  if (p.context !== 'regulated' && l.for === 'regulated') return { why: 'Written for teams with legal review', about: 'context' }
  return { why: 'Didn’t fit this week', about: 'time' }
}
