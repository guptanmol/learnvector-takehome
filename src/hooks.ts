import { createContext, useCallback, useContext, useEffect, useRef, useState, type RefObject } from 'react'

export const PHONE = '(max-width: 760px)'

// Tracks a media query, updating when it flips.
export function useMedia(query: string) {
  const [matches, setMatches] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const on = () => setMatches(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return matches
}

export const ThemeContext = createContext<'light' | 'dark'>('light')
export const useDark = () => useContext(ThemeContext) === 'dark'

// setTimeout that is cancelled on unmount, or all at once with clear().
export function useTimers() {
  const ids = useRef(new Set<number>())
  const later = useCallback((f: () => void, ms: number) => {
    const id = window.setTimeout(() => { ids.current.delete(id); f() }, ms)
    ids.current.add(id)
  }, [])
  const clear = useCallback(() => { ids.current.forEach(clearTimeout); ids.current.clear() }, [])
  useEffect(() => clear, [clear])
  return { later, clear }
}

// Closes a popover on a pointerdown outside its elements, or on Escape.
export function useDismiss(open: boolean, close: () => void, a: RefObject<Element>, b?: RefObject<Element>) {
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => {
      const t = e.target as Node
      if (!a.current?.contains(t) && !b?.current?.contains(t)) close()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('pointerdown', off)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', off); document.removeEventListener('keydown', esc) }
  }, [open, close, a, b])
}
