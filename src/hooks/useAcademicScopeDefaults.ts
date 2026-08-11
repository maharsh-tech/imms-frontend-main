import { useEffect } from 'react'
import {
  getDefaultAcademicYear,
  resolveAcademicYearFromOptions,
  pickLatestSemester,
} from '../utils/academic-year'

export const useDefaultAcademicYear = (
  yearOptions: readonly string[],
  academicYear: string,
  setAcademicYear: (value: string) => void,
): void => {
  useEffect(() => {
    if (yearOptions.length === 0) return
    const resolved = resolveAcademicYearFromOptions(
      yearOptions,
      academicYear || getDefaultAcademicYear(),
    )
    if (resolved !== academicYear) setAcademicYear(resolved)
  }, [yearOptions, academicYear, setAcademicYear])
}

export const useDefaultSemester = (
  semesterOptions: readonly number[],
  academicYear: string,
  semester: string,
  setSemester: (value: string) => void,
): void => {
  useEffect(() => {
    if (!academicYear.trim() || semesterOptions.length === 0 || semester) return
    setSemester(String(pickLatestSemester(semesterOptions)))
  }, [semesterOptions, academicYear, semester, setSemester])
}
