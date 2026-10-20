import { useId } from 'react'
import { KIND_COLOR } from '../colors'
import { KIND_LABEL, type Kind } from '../materials'

// Solid, softly shaded icons for each kind of material (and time), drawn to sit in a tinted circle.
// White details are cut into the shape.
const SHAPES: Record<Kind | 'time', { body: string; marks?: string; markStroke?: boolean }> = {
  video: { body: 'M8.2 4.6c-.9-.6-2.2.1-2.2 1.2v12.4c0 1.1 1.3 1.8 2.2 1.2l9.6-6.2c.9-.6.9-1.8 0-2.4z' },
  game: { body: 'M7.5 6.5h9a5 5 0 0 1 4.9 5.9l-.7 3.6a2.6 2.6 0 0 1-4.5 1.2L14.4 15H9.6l-1.8 2.2a2.6 2.6 0 0 1-4.5-1.2l-.7-3.6a5 5 0 0 1 4.9-5.9z', marks: 'M7.5 9.5v4M5.5 11.5h4M15.5 10.5h.01M17.5 12.5h.01', markStroke: true },
  drill: { body: 'M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-8l-4.6 3.4c-.6.4-1.4 0-1.4-.7V18A3 3 0 0 1 2 15V7a3 3 0 0 1 3-3z', marks: 'M7 9h10M7 13h6', markStroke: true },
  quiz: { body: 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z', marks: 'M7.5 12.2l3 3 6-6.2', markStroke: true },
  case: { body: 'M3 5.5A2.5 2.5 0 0 1 5.5 3H11v18H5.5A2.5 2.5 0 0 1 3 18.5zM13 3h5.5A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5H13z' },
  template: { body: 'M7 2h7.6L20 7.4V19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z', marks: 'M8 12h8M8 16h5', markStroke: true },
  time: { body: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z', marks: 'M12 7v5.2l3.4 2', markStroke: true },
}

export function SolidIcon({ kind, color, size = 13 }: { kind: Kind | 'time'; color: string; size?: number }) {
  const id = useId()
  const s = SHAPES[kind]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ filter: `drop-shadow(0 1.5px 1.5px color-mix(in srgb, ${color} 40%, transparent))`, overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`color-mix(in srgb, ${color} 62%, #ffffff)`} />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <path d={s.body} fill={`url(#${id})`} />
      {s.marks && <path d={s.marks} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />}
    </svg>
  )
}

// What kind of material it is and how long it takes: raised pills with the icon in a tinted circle.
export function KindBadge({ kind }: { kind: Kind }) {
  return (
    <span className="kbadge" style={{ ['--k' as string]: KIND_COLOR[kind] }}>
      <span className="kbadge__icon"><SolidIcon kind={kind} color={KIND_COLOR[kind]} /></span>
      {KIND_LABEL[kind]}
    </span>
  )
}

export function TimeBadge({ min }: { min: number }) {
  return (
    <span className="kbadge kbadge--time" style={{ ['--k' as string]: '#7c7a86' }}>
      <span className="kbadge__icon"><SolidIcon kind="time" color="#7c7a86" /></span>
      {min} min
    </span>
  )
}
