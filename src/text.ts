// Small helpers for building copy.

export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

// Lower-cases a topic for use mid-sentence, keeping "AI" as it is.
export const lowerKeepAI = (s: string) => s.toLowerCase().replace(/\bai\b/g, 'AI')

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
