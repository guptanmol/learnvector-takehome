// What the guide shows back about you, and how each part of it can be changed: the header facts,
// the quick questions about its guesses, the How I see you rows and the suggested changes.
import type { FactKey } from './colors'
import type { Fact } from './components/AboutBar'
import type { Check } from './components/GuessCheck'
import type { Suggestion } from './components/GuideBubble'
import type { PersonaRow } from './components/GuidePanel'
import { CONTEXT_SHORT, GOAL_SHORT, LAYOUT_STYLE, LEVEL_SHORT, PREF_STYLE, WEEK } from './guide'
import {
  CONTEXT_LABEL, GOAL_KEYS, GOAL_LABEL, LEVEL_LABEL,
  type Context, type GoalKey, type Guessed, type Level, type WorkAnswer, type WorkKey,
} from './model'
import { MINUTE_STOPS, type Change, type Layout, type Pref, type Sitting } from './plan'

export interface Seen {
  goal: GoalKey
  level: Level
  context?: Context
  work?: WorkAnswer
  workKey: WorkKey
  guessed: Guessed
  pref: Pref
  layout: Layout
  sittings: Sitting[]
  minutesSource: 'you' | 'guess'
}

export interface Changes {
  change: (cs: Change[], cause: string) => void
  setWork: (w: WorkAnswer, cause: string) => void
  pickWork: (w: WorkAnswer) => void // quietly, without reworking the path
  week: (w: (typeof WEEK)[number]) => void
  unguess: (what: keyof Guessed) => void
  pace: (min: number) => void
}

const LEVELS: Level[] = ['new', 'practitioner']
const WORK_OPTIONS: [WorkAnswer, string][] = [['software', 'Builds software'], ['marketing', 'In marketing'], ['other', 'Something else']]
const PREF_OPTIONS: [Pref, string][] = [['auto', 'Let the guide mix it'], ['do', PREF_STYLE.do], ['watch', PREF_STYLE.watch], ['read', PREF_STYLE.read]]

// The header bar: what the guide understands, each fact switchable.
export const factsFor = (s: Seen): Fact[] => [
  { id: 'goal', value: GOAL_SHORT[s.goal], current: s.goal, options: Object.entries(GOAL_LABEL), why: s.guessed.goal },
  { id: 'level', value: LEVEL_SHORT[s.level], current: s.level, options: Object.entries(LEVEL_LABEL), why: s.guessed.level },
  ...(s.context ? [{ id: 'context' as const, value: CONTEXT_SHORT[s.context], current: s.context, options: Object.entries(CONTEXT_LABEL), why: s.guessed.context }] : []),
]

// One-tap changes offered in the ask bubble.
export function suggestionsFor(s: Seen, c: Changes): Suggestion[] {
  const suggest = (id: string, fact: FactKey, text: string, cs: Change[]): Suggestion => ({ id, fact, text, run: () => c.change(cs, `You asked: ${text}`) })
  return [
    s.goal === 'ai'
      ? suggest('goal', 'goal', 'Less AI, more craft', [{ kind: 'goal', value: 'better' }])
      : suggest('goal', 'goal', 'Bring AI into it', [{ kind: 'goal', value: 'ai' }]),
    s.pref === 'do'
      ? suggest('watch', 'style', 'Explain it before I try', [{ kind: 'pref', value: 'watch' }])
      : suggest('do', 'style', s.layout === 'practice' ? 'Even more hands-on' : 'Less watching, more doing', [{ kind: 'pref', value: 'do' }]),
    s.sittings.length === 1
      ? suggest('later', 'time', '20 more min after lunch', [{ kind: 'later', value: 'After lunch', min: 20 }])
      : suggest('short', 'time', 'Only 10 min right now', [{ kind: 'minutes', value: 10 }]),
  ]
}

// What the guide checks with you, in order: what you're here for (if you didn't say), your week
// (if your email didn't tell it), and a note on any step it added because of where you work.
export function checksFor(s: Seen, c: Changes, first: string, company?: string): Check[] {
  const checks: (Check | null)[] = [
    s.guessed.goal ? {
      id: 'goal',
      q: 'What would you like to get out of this?',
      options: GOAL_KEYS.map((k) => ({ label: GOAL_SHORT[k], run: () => c.change([{ kind: 'goal', value: k }], 'You told me your goal') })),
    } : null,
    s.guessed.work ? {
      id: 'work',
      q: `What does a normal week look like for you, ${first}?`,
      options: WEEK.map((w) => ({ label: w.label, run: () => c.week(w) })),
    } : null,
    s.guessed.context ? {
      id: 'context',
      label: 'Why I added a step',
      q: `You’re at ${company ?? 'a bank'}. Banks usually review marketing before it goes out, so I added a short step on getting AI-written copy through review.`,
      options: [
        { label: 'Keep it', run: () => c.unguess('context') },
        { label: 'Remove it', run: () => c.change([{ kind: 'context', value: 'general' }], 'You removed the review step') },
      ],
    } : null,
  ]
  return checks.filter((x) => x !== null)
}

// How I see you: each line says what the guide believes and lets you change it, any time.
export function personaRowsFor(s: Seen, c: Changes): PersonaRow[] {
  const regulated = s.context === 'regulated'
  const work = s.work ?? (s.workKey === 'software' ? 'software' : 'marketing')
  const workValue = s.guessed.work ? 'Not sure yet'
    : s.workKey === 'regulated' ? 'Marketing, regulated'
    : s.work === 'software' ? 'Builds software'
    : s.work === 'other' ? 'Outside marketing' : 'In marketing'
  const perDay = s.sittings.reduce((a, x) => a + x.min, 0)
  return [
    {
      id: 'goal', label: 'Goal', value: GOAL_SHORT[s.goal], guess: !!s.guessed.goal,
      options: GOAL_KEYS.map((k) => ({ label: GOAL_SHORT[k], on: k === s.goal, pick: () => c.change([{ kind: 'goal', value: k }], 'You changed your goal') })),
    },
    {
      id: 'level', label: 'Experience', value: LEVEL_SHORT[s.level], guess: !!s.guessed.level,
      options: LEVELS.map((k) => ({ label: LEVEL_SHORT[k], on: k === s.level, pick: () => c.change([{ kind: 'level', value: k }], 'You changed your experience') })),
    },
    {
      id: 'work', label: 'Your work', value: workValue,
      options: WORK_OPTIONS.map(([k, label]) => ({ label, on: !s.guessed.work && work === k, pick: () => c.setWork(k, 'You changed your work') })),
    },
    {
      id: 'context', label: 'Approvals', value: regulated ? 'Legal sign-off' : 'None needed', guess: regulated && !!s.guessed.context,
      options: [
        { label: 'Legal sign-off', on: regulated, pick: () => c.change([{ kind: 'context', value: 'regulated' }], 'You said your work needs legal sign-off') },
        { label: 'None needed', on: !regulated, pick: () => c.change([{ kind: 'context', value: 'general' }], 'You said no legal sign-off') },
      ],
    },
    {
      id: 'style', label: 'Learns best', value: s.pref === 'auto' ? LAYOUT_STYLE[s.layout] : PREF_STYLE[s.pref],
      options: PREF_OPTIONS.map(([k, label]) => ({ label, on: s.pref === k, pick: () => c.change([{ kind: 'pref', value: k }], 'You changed how you learn best') })),
    },
    {
      id: 'time', label: 'Pace', value: `${perDay} min a day${s.sittings.length > 1 ? `, ${s.sittings.length} sittings` : ''}`, guess: s.minutesSource === 'guess',
      options: MINUTE_STOPS.map((m) => ({ label: `${m} min now`, on: s.sittings[0].min === m, pick: () => c.pace(m) })),
    },
  ]
}
