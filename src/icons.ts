import { ArrowUpRight, BookOpen, Briefcase, Check, Clock3, FileText, Gamepad2, Hand, Hourglass, Layers, ListChecks, MessageSquareText, Play, RefreshCw, ShieldCheck, Target, Zap, type LucideIcon } from 'lucide-react'
import type { FactKey } from './colors'
import type { Kind } from './materials'
import type { Why } from './model'

// Facts about you are icons; colour dots are kept for one thing only, the kind of material.
export const FACT_ICON: Record<FactKey, LucideIcon> = { goal: Target, level: Layers, context: ShieldCheck, time: Clock3, style: Hand, work: Briefcase }
export const LEARNED_ICON: Record<'knows' | 'easy' | 'hard', LucideIcon> = { knows: Check, easy: Zap, hard: Hourglass }
export const WHY_ICON: Record<Why['icon'], LucideIcon> = { goal: Target, level: Layers, shield: ShieldCheck, builds: ArrowUpRight, changed: RefreshCw }
export const KIND_ICON: Record<Kind, LucideIcon> = { video: Play, game: Gamepad2, drill: MessageSquareText, quiz: ListChecks, case: BookOpen, template: FileText }
