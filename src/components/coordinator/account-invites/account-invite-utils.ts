export type RoleFilter = 'ALL' | 'STUDENT' | 'TEACHER' | 'COORDINATOR'

export const buildPreviewEmail = (identifier: string, role: string): string => {
  const id = identifier.trim().toLowerCase()
  if (!id) return ''
  const domain = role === 'STUDENT' ? 'charusat.edu.in' : 'charusat.ac.in'
  if (id.includes('@')) return id
  return `${id}@${domain}`
}

export const parseBulkLines = (
  text: string,
  role: string,
): { identifier?: string; email?: string }[] => {
  const entries: { identifier?: string; email?: string }[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (role === 'TEACHER') {
      if (trimmed.includes('@')) {
        entries.push({ email: trimmed.toLowerCase() })
      }
      continue
    }
    const id = trimmed.split(/[,\t\s]+/)[0]?.trim()
    if (!id || id.includes('@')) continue
    entries.push({ identifier: id.toUpperCase() })
  }
  return entries
}
