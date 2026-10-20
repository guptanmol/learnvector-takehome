import { ArrowUpRight, Briefcase, Check, Clock3, Hand, Hourglass, Layers, RefreshCw, ShieldCheck, Target, Zap, type LucideIcon } from 'lucide-react'
import type { FactKey } from './colors'
import type { Why } from './model'

// Facts about you are icons; colour dots are kept for one thing only, the kind of material.
export const FACT_ICON: Record<FactKey, LucideIcon> = { goal: Target, level: Layers, context: ShieldCheck, time: Clock3, style: Hand, work: Briefcase }
export const LEARNED_ICON: Record<'knows' | 'easy' | 'hard', LucideIcon> = { knows: Check, easy: Zap, hard: Hourglass }
export const WHY_ICON: Record<Why['icon'], LucideIcon> = { goal: Target, level: Layers, shield: ShieldCheck, builds: ArrowUpRight, changed: RefreshCw }
