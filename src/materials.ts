import { lessons, type Lesson } from './data'
import { lowerFirst } from './text'

// A course is more than its videos. Each lesson comes with the other things you'd learn from:
// a game or hands-on practice, a quick check, a case study taken apart, and a template you keep.
export type Kind = 'video' | 'game' | 'drill' | 'quiz' | 'case' | 'template'

export interface Material {
  key: string
  lesson: string
  kind: Kind
  title: string
  min: number
  q?: { q: string; a: string[] } // quiz: first answer is the right one
}

export const KIND_LABEL: Record<Kind, string> = { video: 'Lesson', game: 'Game', drill: 'Practice with AI', quiz: 'Quiz', case: 'Case study', template: 'Template' }

const BY_TOPIC: Record<string, { quiz: { title: string; q: string; a: string[] }; case: string; template: string }> = {
  'How marketing works': { quiz: { title: 'Where a funnel starts', q: 'What comes first in a funnel?', a: ['Awareness', 'Retention', 'Referral'] }, case: 'A note-taking app’s first 1,000 users', template: 'One-page marketing plan' },
  Positioning: { quiz: { title: 'What a positioning line needs', q: 'A positioning line should name…', a: ['Who it’s for', 'Every feature', 'The price'] }, case: 'Two apps, same features, different buyers', template: 'Positioning sentence' },
  'Customer research': { quiz: { title: 'Which question is leading?', q: 'Which question leads the witness?', a: ['“Wouldn’t this save you time?”', '“Walk me through last week”', '“What did you try before?”'] }, case: 'Five interviews that changed a roadmap', template: 'Interview script' },
  'Funnels and growth': { quiz: { title: 'Why isn’t revenue growing?', q: 'Signups up, revenue flat. Look at…', a: ['Activation', 'Ad spend', 'The logo'] }, case: 'Finding a 40% drop at checkout', template: 'Funnel audit sheet' },
  'Writing with AI': { quiz: { title: 'What a first prompt needs', q: 'A good first prompt adds…', a: ['Audience and goal', 'More adjectives', '“Be creative”'] }, case: 'A bland launch email, rewritten with AI', template: 'Prompt pack: first drafts' },
  'AI in campaign work': { quiz: { title: 'Which AI variants to test', q: '20 AI variants. Test…', a: ['The 3 most different', 'All 20', 'The longest'] }, case: 'One brief, a month of ads', template: 'Campaign brief for AI' },
  'AI in regulated teams': { quiz: { title: 'What legal will flag', q: 'What will legal flag?', a: ['“Guaranteed returns”', '“Learn more”', '“Apply today”'] }, case: 'An AI ad that failed review', template: 'Claims checklist' },
  'AI for research': { quiz: { title: 'What to ask AI about reviews', q: 'From 200 reviews, ask AI for…', a: ['Themes with quotes', 'A star average', 'A one-line summary'] }, case: 'From a review dump to a roadmap', template: 'Review-mining prompt' },
}

export function materialsOf(l: Lesson): Material[] {
  const t = BY_TOPIC[l.topic]
  return [
    { key: `${l.id}-video`, lesson: l.id, kind: 'video', title: l.title, min: l.videoMin },
    { key: `${l.id}-practice`, lesson: l.id, kind: l.practice === 'game' ? 'game' : 'drill', title: l.practiceLabel, min: l.practiceMin },
    ...(t ? [
      { key: `${l.id}-quiz`, lesson: l.id, kind: 'quiz' as const, title: t.quiz.title, q: t.quiz, min: 1 },
      { key: `${l.id}-case`, lesson: l.id, kind: 'case' as const, title: t.case, min: 5 },
      { key: `${l.id}-template`, lesson: l.id, kind: 'template' as const, title: t.template, min: 2 },
    ] : []),
  ]
}

export const materials: Material[] = lessons.flatMap(materialsOf)

// What you walk away with, in plain words. Every piece answers "why would I do this?"
const LESSON_GAIN: Record<string, string> = {
  l1: 'See how all of marketing fits together',
  l2: 'Say who your product is for in one line',
  l3: 'Ask customers questions that get honest answers',
  l4: 'Spot where people drop off, and why',
  l5: 'Describe any product with the four Ps',
  l6: 'Map the steps from first look to purchase',
  l7: 'Tell a real win from luck',
  l8: 'Write a customer profile your team will use',
  l9: 'Get a usable first draft from AI',
  l10: 'Turn one brief into ads worth testing',
  l11: 'Catch what legal will flag before you send it',
  l12: 'Pull real themes out of customer reviews',
  l13: 'Make AI write like your brand',
  l14: 'Check AI reports before anyone else sees them',
  l15: 'Plan a month of posts in an afternoon',
  l16: 'Know which claims you can and can’t make',
}
export function gainOf(m: Material, lessonTitle?: string): string {
  if (m.kind === 'video') return LESSON_GAIN[m.lesson] ?? (lessonTitle ?? '')
  if (m.kind === 'quiz') return 'Check you’ve really got it'
  if (m.kind === 'case') return 'See how it played out for a real team'
  if (m.kind === 'template') return `Leave with your own ${lowerFirst(m.title)}`
  return `Practise it: ${lowerFirst(LESSON_GAIN[m.lesson] ?? m.title)}`
}
