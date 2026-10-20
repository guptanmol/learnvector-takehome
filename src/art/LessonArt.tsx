// A miniature of the practice UI for each GameKey, built from filled, softly shadowed HTML surfaces.
// Static by default; when an ancestor has data-hot="true" one calm ~2.4s loop acts out the
// interaction (CSS only, injected once below).
import type { CSSProperties, ReactNode } from 'react'
import { Gamepad2, PenLine, Check, X } from 'lucide-react'
import type { GameKey } from '../data'

const C = {
  game: '#efefed', task: '#f2f0ea', surface: '#ffffff', soft: '#fafafa',
  fill: '#e4e4e7', fill2: '#d4d4d8', muted: '#71717a', ink: '#18181b',
  ok: '#16a34a', bad: '#dc2626', active: '#5a3ca0',
}
const SH = '0 1px 2px rgba(16,16,20,.08), 0 3px 8px -2px rgba(16,16,20,.10)'
const SH_LIFT = '0 6px 14px -4px rgba(16,16,20,.18), 0 1px 2px rgba(16,16,20,.08)'
const RING = (c: string) => `0 0 0 1.5px ${c}`

// ----- motion -----
const D = '2.4s'
const CSS = `
.lv-root{container-type:size}
.lv-body{inset:10px 10px 26px}
.lv-bins{--sx:calc(-100% - 18px);--sy:0px;--mx:calc(-50% - 9px);--my:-3px}
.lv-mid{width:20px}
@container (max-height:179px){.lv-q{display:none}}
@container (max-width:140px){
.lv-q{display:none}.lv-body{font-size:8.5px !important;inset:8px 7px 24px}.lv-chip{padding:4px 4px !important}
.lv-bins{grid-template-columns:1fr !important;--sx:22px;--sy:-24px;--mx:9px;--my:-5px}.lv-spacer{display:none}
.lv-mid{width:12px}.lv-w{white-space:normal !important}.lv-axis{display:none !important}}
.lv-drag{transform:translate(var(--mx),var(--my)) rotate(-3deg)}
.lv-lift{transform:translate(7px,-2px) rotate(1.5deg)}
@keyframes lv-drag{0%{opacity:0;transform:translate(var(--sx),var(--sy))}8%{opacity:1;transform:translate(var(--sx),calc(var(--sy) - 3px)) rotate(-3deg)}50%{opacity:1;transform:translate(0,-3px) rotate(-2deg)}60%,88%{opacity:1;transform:none}100%{opacity:0;transform:none}}
@keyframes lv-pop{0%,30%{transform:scale(0)}42%{transform:scale(1.15)}50%,100%{transform:scale(1)}}
@keyframes lv-strike{0%,25%{text-decoration-color:transparent}45%,100%{text-decoration-color:${C.bad}}}
@keyframes lv-in{0%,45%{opacity:0;transform:translateY(2px)}60%,100%{opacity:1;transform:none}}
@keyframes lv-line{0%,10%{stroke-dashoffset:1}55%,100%{stroke-dashoffset:0}}
@keyframes lv-sel{0%,30%{box-shadow:${SH}}45%,100%{box-shadow:${RING(C.ok)},${SH}}}
@keyframes lv-lift{0%,15%{transform:translate(7px,-2px) rotate(1.5deg)}55%,85%{transform:none}100%{transform:translate(7px,-2px) rotate(1.5deg)}}
@keyframes lv-type{0%,8%{max-width:0}62%,100%{max-width:11em}}
@keyframes lv-blink{0%{opacity:1}50%{opacity:0}}
@keyframes lv-bar{0%,25%{transform:scaleY(1);background:${C.bad}}55%,88%{transform:scaleY(.41);background:${C.fill2}}100%{transform:scaleY(1);background:${C.bad}}}
@keyframes lv-old{0%,30%{opacity:1}45%,88%{opacity:0}100%{opacity:1}}
@keyframes lv-new{0%,30%{opacity:0}45%,88%{opacity:1}100%{opacity:0}}
[data-hot="true"] .lv-drag{animation:lv-drag ${D} ease-in-out infinite}
[data-hot="true"] .lv-pop{animation:lv-pop ${D} ease-out infinite}
[data-hot="true"] .lv-strike{animation:lv-strike ${D} ease-in-out infinite}
[data-hot="true"] .lv-in{animation:lv-in ${D} ease-out infinite}
[data-hot="true"] .lv-line{animation:lv-line ${D} ease-in-out infinite}
[data-hot="true"] .lv-sel{animation:lv-sel ${D} ease-out infinite}
[data-hot="true"] .lv-lift{animation:lv-lift ${D} ease-in-out infinite}
[data-hot="true"] .lv-type{animation:lv-type ${D} steps(18,end) infinite}
[data-hot="true"] .lv-caret{animation:lv-blink .8s steps(1) infinite}
[data-hot="true"] .lv-bar{animation:lv-bar ${D} ease-in-out infinite}
[data-hot="true"] .lv-old{animation:lv-old ${D} ease-in-out infinite}
[data-hot="true"] .lv-new{animation:lv-new ${D} ease-in-out infinite}
@media (prefers-reduced-motion: reduce){[data-hot="true"] [class*="lv-"]{animation:none !important}}
`
if (typeof document !== 'undefined') {
  let el = document.getElementById('lva-css')
  if (!el) {
    el = document.createElement('style')
    el.id = 'lva-css'
    document.head.appendChild(el)
  }
  if (el.textContent !== CSS) el.textContent = CSS
}

// ----- primitives -----
const fill: CSSProperties = { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }
const one: CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }

function Chip(p: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`lv-chip ${p.className ?? ''}`} style={{
      ...one, background: C.surface, borderRadius: 5, padding: '4px 6px', boxShadow: SH,
      color: C.ink, lineHeight: 1.2, ...p.style,
    }}>{p.children}</div>
  )
}
const activeStyle: CSSProperties = { boxShadow: `${RING(C.active)}, ${SH_LIFT}`, position: 'relative', zIndex: 2 }
const Bar = (w: string) => <div style={{ height: 4, width: w, borderRadius: 2, background: C.fill2 }} />

function Badge(p: { color: string; icon: 'check' | 'x'; style?: CSSProperties }) {
  const Icon = p.icon === 'check' ? Check : X
  return (
    <span className="lv-pop" style={{
      position: 'absolute', width: 13, height: 13, borderRadius: 7, background: p.color,
      display: 'grid', placeItems: 'center', boxShadow: SH, ...p.style,
    }}><Icon size={9} strokeWidth={3} color="#fff" /></span>
  )
}

// ----- one small screen per GameKey -----

function Sort() {
  const bin = (label: string, chips: ReactNode) => (
    <div style={{ background: C.fill, borderRadius: 7, padding: 5, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{ ...one, color: C.muted, fontWeight: 600, padding: '1px 1px 2px' }}>{label}</div>
      {chips}
    </div>
  )
  const slot = { height: 19, borderRadius: 5, background: C.fill2 }
  return (
    <div className="lv-bins" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {bin('Awareness', <><Chip>Billboard</Chip><div className="lv-spacer" style={{ height: 19 }} /></>)}
      {bin('Purchase', <>
        <Chip>Checkout</Chip>
        <div style={{ position: 'relative', ...slot }}>
          <Chip className="lv-drag" style={{ position: 'absolute', inset: 0, ...activeStyle }}>Free trial</Chip>
        </div>
      </>)}
    </div>
  )
}

function Spot() {
  const q = (t: string, wrong?: boolean) => (
    <div style={{ position: 'relative', alignSelf: wrong ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
      <Chip className="lv-w" style={{ borderRadius: 9, padding: '5px 8px', color: wrong ? C.muted : C.ink }}>
        <span className={wrong ? 'lv-strike' : undefined} style={wrong ? { textDecoration: 'line-through', textDecorationColor: C.bad, textDecorationThickness: 1.5 } : undefined}>{t}</span>
      </Chip>
      {wrong && <Badge color={C.bad} icon="x" style={{ top: -5, right: -5 }} />}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {q('What did you try first?')}
      {q("You'd pay for this, right?", true)}
      {q('When did it last break?')}
    </div>
  )
}

function Match() {
  const L = ['Product', 'Price', 'Place']
  const R = ['App Store', 'Offline', 'Free tier']
  const line = (y1: number, y2: number, active?: boolean) => (
    <path d={`M0 ${y1} C10 ${y1} 10 ${y2} 20 ${y2}`} fill="none" pathLength={1}
      stroke={active ? C.active : '#a1a1aa'} strokeWidth={active ? 1.75 : 1.25} strokeLinecap="round"
      className={active ? 'lv-line' : undefined} style={active ? { strokeDasharray: 1 } : undefined} />
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gridTemplateRows: 'repeat(3, 24px)', alignItems: 'center' }}>
      {L.map((t, i) => <Chip key={t} style={{ gridColumn: 1, gridRow: i + 1 }}>{t}</Chip>)}
      <svg className="lv-mid" viewBox="0 0 20 72" preserveAspectRatio="none" aria-hidden style={{ gridColumn: 2, gridRow: '1 / 4', height: '100%', overflow: 'visible' }}>
        {line(12, 36)}{line(36, 60)}{line(60, 12, true)}
      </svg>
      {R.map((t, i) => <Chip key={t} style={{ gridColumn: 3, gridRow: i + 1 }}>{t}</Chip>)}
    </div>
  )
}

function Pick() {
  const tile = (t: string, sel?: boolean) => (
    <div className={sel ? 'lv-sel' : undefined} style={{
      position: 'relative', background: C.surface, borderRadius: 6, padding: 4, minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: 3,
      boxShadow: sel ? `${RING(C.ok)}, ${SH}` : SH,
    }}>
      <div style={{ height: 18, borderRadius: 3, background: C.fill }} />
      <div className="lv-w" style={{ ...one, color: C.ink, fontWeight: 600 }}>{t}</div>
      {sel && <Badge color={C.ok} icon="check" style={{ top: -5, right: -5 }} />}
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {tile('Save 20%')}{tile('Try it free', true)}{tile('New: dark mode')}{tile('Join 10k teams')}
    </div>
  )
}

function Order() {
  const rows = ['Sees an ad', 'Visits site', 'Starts trial', 'Buys']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map((t, i) => (
        <Chip key={t} className={i === 2 ? 'lv-lift' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', ...(i === 2 ? activeStyle : null) }}>
          <span style={{ flex: 'none', width: 13, height: 13, borderRadius: 7, background: C.fill, color: C.muted, display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 600 }}>{i + 1}</span>
          <span style={one}>{t}</span>
        </Chip>
      ))}
    </div>
  )
}

function RedPen() {
  return (
    <div style={{ background: C.surface, borderRadius: 7, padding: '7px 8px', boxShadow: SH, display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1.3 }}>
      <div className="lv-w" style={{ ...one, color: C.ink }}>Meet the Everyday card.</div>
      <div className="lv-w" style={{ ...one, color: C.muted }}>
        <span className="lv-strike" style={{ textDecoration: 'line-through', textDecorationColor: C.bad, textDecorationThickness: 1.5 }}>Approval guaranteed.</span>
      </div>
      <div className="lv-in lv-w" style={{ ...one, color: C.bad, fontWeight: 600 }}>Subject to approval.</div>
      <div className="lv-w" style={{ ...one, color: C.ink }}>Apply in two minutes.</div>
    </div>
  )
}

function Write() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ background: C.surface, borderRadius: 7, padding: '7px 8px', boxShadow: `${RING(C.active)}, ${SH}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <span className="lv-type" style={{ display: 'inline-block', overflow: 'hidden', maxWidth: '11em' }}>For new runners who</span>
          <span className="lv-caret" style={{ flex: 'none', width: 1.5, height: '1.15em', marginLeft: 1, background: C.ink }} />
        </div>
        {Bar('70%')}
      </div>
      <div style={{ alignSelf: 'flex-end', background: C.ink, color: '#fff', borderRadius: 5, padding: '4px 9px', fontWeight: 600, boxShadow: SH }}>Submit</div>
    </div>
  )
}

function Fix() {
  const data: [string, number][] = [['Visit', 100], ['Cart', 64], ['Pay', 92], ['Paid', 31]]
  return (
    <div style={{ background: C.surface, borderRadius: 7, padding: '6px 7px 5px', boxShadow: SH, height: '100%', maxHeight: 120, minHeight: 64, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', gap: 5, paddingTop: 12 }}>
        {data.map(([k, v], i) => {
          const wrong = i === 2
          return (
            <div key={k} style={{ position: 'relative', flex: 1, height: `${v}%`, display: 'flex', alignItems: 'flex-end' }}>
              <div className={wrong ? 'lv-bar' : undefined} style={{ width: '100%', height: '100%', borderRadius: 2, transformOrigin: '50% 100%', background: wrong ? C.bad : C.fill2 }} />
              {wrong && (
                <span className="lv-old" style={{ position: 'absolute', left: '50%', bottom: '100%', transform: 'translate(-50%,-2px)', fontSize: 8.5, fontWeight: 700, color: C.bad }}>92%</span>
              )}
              {wrong && <span className="lv-new" style={{ position: 'absolute', left: '50%', bottom: '41%', transform: 'translate(-50%,-2px)', fontSize: 8.5, fontWeight: 700, color: C.ink, opacity: 0 }}>38%</span>}
            </div>
          )
        })}
      </div>
      <div className="lv-axis" style={{ display: 'flex', gap: 5, color: C.muted, fontSize: 8 }}>
        {data.map(([k]) => <span key={k} style={{ ...one, flex: 1, textAlign: 'center' }}>{k}</span>)}
      </div>
    </div>
  )
}

const GAMES: Record<GameKey, { prompt: string; View: () => JSX.Element }> = {
  sort: { prompt: 'Drag each to its stage', View: Sort },
  spot: { prompt: 'Tap the leading one', View: Spot },
  match: { prompt: 'Connect the pairs', View: Match },
  pick: { prompt: 'Pick the winner', View: Pick },
  order: { prompt: 'Put them in order', View: Order },
  redpen: { prompt: 'Mark what fails review', View: RedPen },
  write: { prompt: 'Write it in one line', View: Write },
  fix: { prompt: 'Find the wrong number', View: Fix },
}

export function GamePreview(props: { game: GameKey; practice: 'game' | 'task' }): JSX.Element {
  const { prompt, View } = GAMES[props.game]
  const isGame = props.practice === 'game'
  const Icon = isGame ? Gamepad2 : PenLine
  return (
    <div className="lv-root" aria-hidden style={{ ...fill, background: isGame ? C.game : C.task, fontFamily: 'inherit' }}>
      <div className="lv-body" style={{
        position: 'absolute', display: 'flex', flexDirection: 'column', gap: 7,
        fontSize: 9.5, lineHeight: 1.2, color: C.ink,
      }}>
        <div className="lv-q" style={{ ...one, flex: 'none', color: C.muted }}>{prompt}</div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <View />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 10, bottom: 8, right: 48, display: 'flex', alignItems: 'center', gap: 4, color: C.muted, fontSize: 10.5, lineHeight: 1 }}>
        <Icon size={12} strokeWidth={1.75} color={C.muted} />
        <span>{isGame ? 'Game' : 'Task'}</span>
      </div>
    </div>
  )
}
