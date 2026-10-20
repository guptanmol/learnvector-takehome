import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { PHONE, useMedia } from '../hooks'

// On a phone, popovers render as sheets on the body so no card or scroller clips them.
export function PhonePortal({ children }: { children: ReactNode }) {
  const phone = useMedia(PHONE)
  return phone ? createPortal(children, document.body) : <>{children}</>
}
