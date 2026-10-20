import { ArrowDown, ArrowUp, Check, FileText, Shuffle, Timer, type LucideIcon } from 'lucide-react'
import type { Ask, Item, Signal } from './plan'

export type Act = { id: string; label: string; icon: LucideIcon; run: Ask | Signal | 'summary' }

// What you can ask depends on what the piece is: a video can't be made easier, but you can skip it
// or get the gist; practice can be tuned.
export function actionsFor(kind: Item['m']['kind']): Act[] {
  const know: Act = { id: 'know', label: kind === 'template' ? 'I have one already' : 'I already know this', icon: Check, run: 'knows' }
  const other: Act = { id: 'other', label: 'Another way to learn it', icon: Shuffle, run: 'format' }
  if (kind === 'video' || kind === 'case' || kind === 'template') return [know, { id: 'gist', label: 'Quick summary', icon: FileText, run: 'summary' }, other]
  return [
    know,
    { id: 'easier', label: 'Make it easier', icon: ArrowDown, run: 'easier' },
    { id: 'deeper', label: 'Make it harder', icon: ArrowUp, run: 'deeper' },
    { id: 'short', label: 'Something shorter', icon: Timer, run: 'shorter' },
    other,
  ]
}
