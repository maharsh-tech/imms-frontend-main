/** Regular or diploma student roll */
export const ROLL_NUMBER_PATTERN = /^(?:D\d{2}[A-Z]{2}\d+|\d{2}[A-Z]{2}\d+)$/

/** e.g. nishatshaikh.it */
export const TEACHER_SLUG_PATTERN = /^[a-z0-9]+(\.[a-z0-9]+)+$/

/** @deprecated */
export const TEACHER_CODE_PATTERN = /^[A-Z]{3}$/

export const normalizeTeacherSlugInput = (value: string): string => value.trim().toLowerCase()

export const normalizeRollInput = (value: string): string => value.trim().toUpperCase()

export const isValidTeacherSlug = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase()
  const slug = trimmed.includes('@') ? trimmed.slice(0, trimmed.indexOf('@')) : trimmed
  return TEACHER_SLUG_PATTERN.test(slug)
}

/** @deprecated */
export const normalizeTeacherCodeInput = (value: string): string =>
  value.trim().toUpperCase().slice(0, 3)

export const isValidRollNumber = (value: string): boolean =>
  ROLL_NUMBER_PATTERN.test(normalizeRollInput(value))

export const isDiplomaRollNumber = (value: string): boolean =>
  /^D\d{2}[A-Z]{2}\d+$/.test(normalizeRollInput(value))

export const deriveBatchFromRollNumber = (rollNumber: string): string => {
  const roll = rollNumber.trim().toUpperCase()
  const diploma = roll.match(/^D(\d{2})[A-Z]{2}/)
  if (diploma?.[1]) {
    const year = 2000 + Number.parseInt(diploma[1], 10)
    return `D${year}-${year + 3}`
  }
  const regular = roll.match(/^(\d{2})[A-Z]{2}/)
  if (regular?.[1]) {
    const year = 2000 + Number.parseInt(regular[1], 10)
    return `${year}-${year + 4}`
  }
  return 'Unknown'
}

export const teacherSlugFromEmailInput = (value: string): string => {
  const trimmed = value.trim().toLowerCase()
  return trimmed.includes('@') ? trimmed.slice(0, trimmed.indexOf('@')) : trimmed
}
