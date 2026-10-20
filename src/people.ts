// The mock Google accounts. ?u= picks one; the sidebar's demo switcher reloads with another.
export const PEOPLE: Record<string, { name: string; email: string }> = {
  priya: { name: 'Priya', email: 'priya@gmail.com' },
  cathy: { name: 'Cathy', email: 'cathy@harborbank.com' },
  sam: { name: 'Sam', email: 'sam@gmail.com' },
}

const asked = new URLSearchParams(location.search).get('u') ?? ''
export const meId = asked in PEOPLE ? asked : 'priya'

export const switchTo = (id: string) => {
  const url = new URL(location.href)
  url.searchParams.set('u', id)
  location.assign(url)
}
