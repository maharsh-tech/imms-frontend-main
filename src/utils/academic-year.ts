/** Indian academic year (Jul–Jun): e.g. Aug 2026 → `2025-2026`, Jul 2026 → `2026-2027`. */
export const getDefaultAcademicYear = (): string => {
  const y = new Date().getFullYear()
  const m = new Date().getMonth()
  return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

export const resolveAcademicYearFromOptions = (
  options: readonly string[],
  preferred: string,
): string => {
  if (options.length === 0) return preferred
  return options.includes(preferred) ? preferred : options[0]
}

export const pickLatestSemester = (semesters: readonly number[]): number =>
  Math.max(...semesters)
