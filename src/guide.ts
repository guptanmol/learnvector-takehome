// What the guide says: short labels for what it knows, and the lines it answers with.
import type { Context, GoalKey, Level, WorkAnswer } from './model'
import { LAYOUT_NAME, layoutFor, type Ask, type Change, type Layout, type Pref, type Signal } from './plan'

export const GOAL_SHORT: Record<GoalKey, string> = { understand: 'Understand marketing', ai: 'AI at work', better: 'Better at the job' }
// experience only: knowing the basics doesn't mean you work in marketing
export const LEVEL_SHORT: Record<Level, string> = { new: 'New to marketing', practitioner: 'Knows the basics' }
export const CONTEXT_SHORT: Record<Context, string> = { regulated: 'Needs legal approval', general: 'No legal approval' }
export const GOAL_TO: Record<GoalKey, string> = { understand: 'understanding marketing', ai: 'using AI at work', better: 'a better marketing job' }

// what one answer says about experience, until you say otherwise
export const LEVEL_GUESS: Record<GoalKey, Level> = { understand: 'new', ai: 'practitioner', better: 'practitioner' }

export const WORK_SAY: Record<WorkAnswer, string> = {
  software: 'Picked examples for people who build software',
  marketing: 'Picked examples from day-to-day marketing work',
  other: 'Using general examples',
}

const PREF_SAY: Record<Pref, string> = { auto: 'Back to my mix', do: 'Practice comes first now', watch: 'Lessons before practice now', read: 'More cases and templates' }

function sayChange(c: Change): string {
  switch (c.kind) {
    case 'minutes': return `Right now: ${c.value} min`
    case 'later': return `Added ${c.min} min ${c.value.toLowerCase()}`
    case 'pref': return PREF_SAY[c.value]
    case 'level': return c.value === 'new' ? 'Starting from the basics' : 'Skipping the basics'
    case 'goal': return `Now heading to ${GOAL_TO[c.value]}. Laid out ${LAYOUT_NAME[layoutFor(c.value)].toLowerCase()}`
    case 'context': return c.value === 'regulated' ? 'Added a legal sign-off step' : 'Dropped the legal step'
  }
}
export const sayChanges = (cs: Change[]) => cs.map(sayChange).join(' · ')

type Swap = Exclude<Ask, 'format'>
export const NO_ALTERNATIVE: Record<Swap, string> = {
  easier: 'That’s already the gentlest one on this topic.',
  deeper: 'Nothing goes deeper on this topic yet.',
  shorter: 'Nothing shorter fits here.',
  other: 'Nothing shorter fits here.',
}
export const SWAP_SAY: Record<Swap, (title: string, min: number) => string> = {
  easier: (t) => `Swapped in something easier: “${t}”`,
  deeper: (t) => `Went deeper: “${t}”`,
  shorter: (t, min) => `Shorter: “${t}”, ${min} min`,
  other: (t) => `Swapped for “${t}”`,
}
export const SWAP_CAUSE: Record<Swap, string> = {
  easier: 'You asked for easier',
  deeper: 'You asked for deeper',
  shorter: 'You asked for something shorter',
  other: 'You asked to swap it',
}

export const SIGNAL_SAID: Record<Signal, string> = {
  knows: 'You said you already know this',
  easy: 'You said it was too easy',
  hard: 'You said it was hard to follow',
  right: 'You said it was just right',
}

// How I see you: how you learn best, as you set it or as the layout implies
export const PREF_STYLE: Record<Exclude<Pref, 'auto'>, string> = { do: 'By doing', watch: 'Watching first', read: 'From examples' }
export const LAYOUT_STYLE: Record<Layout, string> = { practice: 'By doing', toolkit: 'With tools to use', story: 'Step by step' }

export interface Head { status: string; title: string; meta?: string }

// The walk-through after the plan is built, one line per step.
export function tourSteps(t: { goal: GoalKey; legal: boolean; layout: Layout; steps: number; weeks: number; perDay: number; levelGuessed: boolean }): Head[] {
  const legal = t.legal ? ' I added a step on legal sign-off, since your work goes through approval.' : ''
  const second: Record<Layout, Omit<Head, 'status'>> = {
    practice: { title: 'Practice comes first', meta: `You want to use AI at work, so each step starts with something to try.${legal}` },
    toolkit: {
      title: 'Laid out as a toolkit',
      meta: `${t.levelGuessed ? 'I’m guessing you already work in marketing' : 'You already work in marketing'}, so I went straight to tools for the problems you deal with.${legal}`,
    },
    story: { title: 'One step at a time', meta: 'Each piece builds on the one before, so it all fits together as you go.' },
  }
  return [
    { status: 'Your path · 1 of 4', title: 'Here’s your route', meta: `${t.steps} steps to ${GOAL_TO[t.goal]}, about ${t.weeks} weeks at ${t.perDay} min a day. Tap a step on the route to see it.` },
    { status: 'Your path · 2 of 4', ...second[t.layout] },
    { status: 'Your path · 3 of 4', title: 'This is how I see you', meta: 'All of it is yours to change. Tap any line to fix it, now or whenever you come back.' },
    { status: 'Your path · 4 of 4', title: 'Change anything, any time', meta: 'Ask about a step, or tell me how a piece went. I’ll rework the plan and show you what moved.' },
  ]
}
// the button says where it goes, so the walk-through never feels open-ended
export const TOUR_NEXT = ['Start the tour', 'Next: how I see you', 'Next: changing things', 'Got it, let’s start']

export const REWORK_STAGES = ['Reading what you asked', 'Looking through the library', 'Rebuilding this step']
export const REWORK_STEP_MS = 750 // each stage gets long enough to read

// today's pieces kept on the device, for a train or anywhere the signal drops (mocked)
export type Offline = 'no' | 'saving' | 'saved'
export const OFFLINE_LABEL: Record<Offline, string> = { no: 'Save offline', saving: 'Saving', saved: 'Saved offline' }
