// Each thing the guide knows about you has its own colour, used wherever that fact shows up.
export const FACT_COLOR = {
  goal: '#f97316',
  level: '#3b82f6',
  context: '#ec4899',
  time: '#22c55e',
  style: '#8b5cf6', // how you like to learn
  work: '#64748b',
} as const
export type FactKey = keyof typeof FACT_COLOR

// Each kind of material has its own colour, so a quiz reads as a quiz before you read the word.
export const KIND_COLOR = {
  video: '#ef4444',
  game: '#0d9488',
  quiz: '#0ea5e9',
  drill: '#8b5cf6',
  template: '#f59e0b',
  case: '#ec4899',
} as const
