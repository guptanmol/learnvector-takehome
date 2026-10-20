// Mock catalog. Marketing first, including how to use AI in marketing.
// Every lesson is a short video followed by a practice: a mini game or a real task.

export type GameKey = 'sort' | 'spot' | 'match' | 'pick' | 'order' | 'redpen' | 'write' | 'fix'

export interface Lesson {
  id: string
  title: string
  topic: string
  /** 0 = basics, 1 = applied / doing it daily */
  level: number
  practice: 'game' | 'task'
  videoMin: number
  practiceMin: number
  /** the practice, in one short line */
  practiceLabel: string
  game: GameKey
  /** instructor, named on the lesson's footage */
  host: string
  /** who it's written for, and which goal it serves; the guide plans with these */
  for: 'software' | 'marketing' | 'regulated'
  goal: 'understand' | 'ai' | 'better'
}

export const lessons: Lesson[] = [
  { id: 'l1', title: 'Marketing in one diagram', topic: 'How marketing works', level: 0.05, practice: 'game', videoMin: 6, practiceMin: 2, practiceLabel: 'Sort 8 activities into the funnel', game: 'sort', host: 'Maya', for: 'software', goal: 'understand' },
  { id: 'l2', title: 'Who is it for? Positioning in a sentence', topic: 'Positioning', level: 0.2, practice: 'task', videoMin: 7, practiceMin: 3, practiceLabel: 'Write one for a product you know', game: 'write', host: 'Jon', for: 'software', goal: 'understand' },
  { id: 'l3', title: 'Five questions that beat a survey', topic: 'Customer research', level: 0.25, practice: 'game', videoMin: 6, practiceMin: 2, practiceLabel: 'Spot the leading question', game: 'spot', host: 'Maya', for: 'marketing', goal: 'better' },
  { id: 'l4', title: 'Find the leak in a funnel', topic: 'Funnels and growth', level: 0.45, practice: 'task', videoMin: 8, practiceMin: 4, practiceLabel: 'Find the drop-off in a real dashboard', game: 'fix', host: 'Ravi', for: 'marketing', goal: 'better' },
  { id: 'l5', title: 'The four Ps, for people who build apps', topic: 'How marketing works', level: 0.1, practice: 'game', videoMin: 5, practiceMin: 2, practiceLabel: 'Match an app to each P', game: 'match', host: 'Jon', for: 'software', goal: 'understand' },
  { id: 'l6', title: 'From stranger to customer', topic: 'Funnels and growth', level: 0.15, practice: 'game', videoMin: 6, practiceMin: 2, practiceLabel: 'Put the journey in order', game: 'order', host: 'Ravi', for: 'software', goal: 'understand' },
  { id: 'l7', title: 'A/B tests without fooling yourself', topic: 'Funnels and growth', level: 0.65, practice: 'game', videoMin: 9, practiceMin: 3, practiceLabel: 'Pick the test that actually won', game: 'pick', host: 'Ravi', for: 'marketing', goal: 'better' },
  { id: 'l8', title: 'Write a customer profile people use', topic: 'Customer research', level: 0.5, practice: 'task', videoMin: 7, practiceMin: 4, practiceLabel: 'Draft a profile from 3 interviews', game: 'write', host: 'Maya', for: 'marketing', goal: 'better' },
  { id: 'l9', title: 'Prompting for a first draft you can edit', topic: 'Writing with AI', level: 0.3, practice: 'task', videoMin: 6, practiceMin: 3, practiceLabel: 'Turn a vague prompt into a usable draft', game: 'write', host: 'Lena', for: 'marketing', goal: 'ai' },
  { id: 'l10', title: 'One brief, twenty ad variants', topic: 'AI in campaign work', level: 0.7, practice: 'game', videoMin: 8, practiceMin: 2, practiceLabel: 'Pick the 3 variants worth testing', game: 'pick', host: 'Lena', for: 'marketing', goal: 'ai' },
  { id: 'l11', title: 'What compliance will flag in AI copy', topic: 'AI in regulated teams', level: 0.8, practice: 'game', videoMin: 7, practiceMin: 3, practiceLabel: 'Red-pen five AI drafts', game: 'redpen', host: 'Sam', for: 'regulated', goal: 'ai' },
  { id: 'l12', title: 'Read 200 reviews in ten minutes', topic: 'AI for research', level: 0.6, practice: 'task', videoMin: 8, practiceMin: 4, practiceLabel: 'Pull 3 themes from a review dump', game: 'sort', host: 'Lena', for: 'marketing', goal: 'ai' },
  { id: 'l13', title: 'Teach a model your brand voice', topic: 'Writing with AI', level: 0.75, practice: 'task', videoMin: 9, practiceMin: 4, practiceLabel: 'Rewrite a bland email in your voice', game: 'fix', host: 'Sam', for: 'marketing', goal: 'ai' },
  { id: 'l14', title: 'AI reporting your boss will trust', topic: 'AI in campaign work', level: 0.85, practice: 'task', videoMin: 10, practiceMin: 4, practiceLabel: 'Check an AI summary against the data', game: 'fix', host: 'Ravi', for: 'regulated', goal: 'better' },
  { id: 'l15', title: 'Plan a month of posts with AI', topic: 'AI in campaign work', level: 0.45, practice: 'game', videoMin: 6, practiceMin: 2, practiceLabel: 'Fill the calendar before the deadline', game: 'order', host: 'Lena', for: 'marketing', goal: 'ai' },
  { id: 'l16', title: 'AI in a bank: what you can and cannot say', topic: 'AI in regulated teams', level: 0.6, practice: 'game', videoMin: 7, practiceMin: 2, practiceLabel: 'Approve or reject 6 claims', game: 'spot', host: 'Sam', for: 'regulated', goal: 'ai' },
]

export const lessonById: Record<string, Lesson> = Object.fromEntries(lessons.map((l) => [l.id, l]))
export const minutesOf = (l: Lesson) => l.videoMin + l.practiceMin
