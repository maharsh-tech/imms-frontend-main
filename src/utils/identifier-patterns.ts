/** Exactly 3 uppercase letters */
export const TEACHER_CODE_PATTERN = /^[A-Z]{3}$/

/** e.g. 24IT093 */
export const ROLL_NUMBER_PATTERN = /^\d{2}[A-Z]{2}\d+$/

export const normalizeTeacherCodeInput = (value: string): string =>
  value.trim().toUpperCase().slice(0, 3)

export const normalizeRollInput = (value: string): string => value.trim().toUpperCase()

export const isValidTeacherCode = (value: string): boolean =>
  TEACHER_CODE_PATTERN.test(normalizeTeacherCodeInput(value))

export const isValidRollNumber = (value: string): boolean =>
  ROLL_NUMBER_PATTERN.test(normalizeRollInput(value))
