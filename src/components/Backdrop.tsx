import { GrainGradient } from '@paper-design/shaders-react'
import { useMedia } from '../hooks'

// A slow grain gradient runs behind everything: near-neutral greys with only a hint of cool,
// so colour comes from the content and the one violet accent, not the page.
export function Backdrop({ theme }: { theme: 'light' | 'dark' }) {
  const dark = theme === 'dark'
  const still = useMedia('(prefers-reduced-motion: reduce)')
  return (
    <div className="backdrop" aria-hidden>
      <GrainGradient
        style={{ width: '100%', height: '100%' }}
        colors={dark ? ['#1b1a21', '#1e1d23', '#19181e', '#1d1c22'] : ['#ebeaf0', '#f4f4f6', '#e7e6ed', '#f2f2f5']}
        colorBack={dark ? '#111114' : '#f6f6f8'}
        shape="blob"
        softness={1}
        intensity={0.08}
        noise={0.06}
        scale={1.25}
        speed={still ? 0 : 0.18}
      />
    </div>
  )
}
