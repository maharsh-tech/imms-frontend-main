import type { Student } from '../api/students'

export const parseRollBatchPrefix = (rollNumber: string): string => {
  const match = rollNumber.trim().match(/^((?:D)?\d{2}[A-Za-z]{2})/)
  return match ? match[1].toUpperCase() : 'OTHER'
}

export type BatchGroup = {
  prefix: string
  semesterLabel: string
  count: number
  students: Student[]
}

export const groupStudentsByBatch = (students: Student[]): BatchGroup[] => {
  const byPrefix = new Map<string, Student[]>()

  for (const student of students) {
    const prefix = parseRollBatchPrefix(student.rollNumber)
    const list = byPrefix.get(prefix) ?? []
    list.push(student)
    byPrefix.set(prefix, list)
  }

  return Array.from(byPrefix.entries())
    .map(([prefix, list]) => {
      const semesters = [...new Set(list.map((s) => s.semester))].sort((a, b) => a - b)
      const semesterLabel =
        semesters.length === 0
          ? '—'
          : semesters.length === 1
            ? `Sem ${semesters[0]}`
            : `Sem ${semesters[0]}–${semesters[semesters.length - 1]}`

      const sorted = [...list].sort((a, b) =>
        a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }),
      )

      return { prefix, semesterLabel, count: sorted.length, students: sorted }
    })
    .sort((a, b) => a.prefix.localeCompare(b.prefix, undefined, { numeric: true }))
}

export const formatBatchOptionLabel = (group: BatchGroup): string => {
  const diplomaTag = group.prefix.startsWith('D') ? ' · Diploma' : ''
  return `${group.prefix} (${group.semesterLabel} · ${group.count} students${diplomaTag})`
}
