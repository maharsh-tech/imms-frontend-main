import { useQuery } from '@tanstack/react-query'
import {
  getMarksEntryYears,
  getMarksEntrySubjects,
  getMarksEntrySemesters,
  getMarksEntryExams,
} from '../api/subjects'

/** User asked for no cache — refetch every time a step is selected. */
const NO_CACHE = { staleTime: 0, gcTime: 0 } as const

export const useMarksEntryYears = () =>
  useQuery({
    queryKey: ['marksEntry', 'years'],
    queryFn: () => getMarksEntryYears(),
    ...NO_CACHE,
  })

export const useMarksEntrySubjects = (academicYear: string) =>
  useQuery({
    queryKey: ['marksEntry', 'subjects', academicYear.trim()],
    queryFn: () => getMarksEntrySubjects(academicYear.trim()),
    enabled: Boolean(academicYear.trim()),
    ...NO_CACHE,
  })

export const useMarksEntrySemesters = (academicYear: string, subjectId: string) =>
  useQuery({
    queryKey: ['marksEntry', 'semesters', academicYear.trim(), subjectId],
    queryFn: () => getMarksEntrySemesters(academicYear.trim(), subjectId),
    enabled: Boolean(academicYear.trim() && subjectId),
    ...NO_CACHE,
  })

export const useMarksEntryExams = (
  academicYear: string,
  subjectId: string,
  semester: string,
) =>
  useQuery({
    queryKey: ['marksEntry', 'exams', academicYear.trim(), subjectId, semester],
    queryFn: () =>
      getMarksEntryExams(academicYear.trim(), subjectId, Number(semester)),
    enabled: Boolean(academicYear.trim() && subjectId && semester),
    ...NO_CACHE,
  })
