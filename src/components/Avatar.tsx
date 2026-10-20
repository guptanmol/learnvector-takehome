// The Google profile picture. Sign-in gives us a name and a photo; with no photo, the initial.
const PHOTOS: Record<string, string> = { Priya: '/avatars/priya.jpg', Cathy: '/avatars/cathy.jpg' }

export function Avatar({ name, className = '', title }: { name: string; className?: string; title?: string }) {
  const src = PHOTOS[name]
  return (
    <span className={`avatar ${src ? 'avatar--photo' : ''} ${className}`} title={title}>
      {src ? <img src={src} alt={name} draggable={false} /> : name[0]}
    </span>
  )
}
