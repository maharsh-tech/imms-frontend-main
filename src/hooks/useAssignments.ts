import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOfferings,
  getSubjects,
  getFaculty,
  getMarksEntryYears,
  getAssignmentSemesters,
  createAssignment,
  deleteAssignment,
} from '../api/subjects'

const NO_CACHE = { staleTime: 0, gcTime: 0 } as const

export const useAssignmentYears = () =>
  useQuery({
    queryKey: ['assignments', 'years'],
    queryFn: () => getMarksEntryYears(),
    ...NO_CACHE,
  })

export const useAssignmentSemesters = (academicYear: string) =>
  useQuery({
    queryKey: ['assignments', 'semesters', academicYear.trim()],
    queryFn: () => getAssignmentSemesters(academicYear.trim()),
    enabled: Boolean(academicYear.trim()),
    ...NO_CACHE,
  })

export const useAssignmentOfferings = (academicYear: string, semester: string) =>
  useQuery({
    queryKey: ['assignments', 'offerings', academicYear.trim(), semester],
    queryFn: () =>
      getOfferings({
        academicYear: academicYear.trim(),
        semester: Number(semester),
      }),
    enabled: Boolean(academicYear.trim() && semester),
    ...NO_CACHE,
  })

/** Subjects + faculty for assign-teacher / add-exam forms — only when a form is open. */
export const useAssignmentFormCatalog = (enabled: boolean) =>
  useQuery({
    queryKey: ['assignments', 'formCatalog'],
    queryFn: async () => {
      const [subjects, faculty] = await Promise.all([
        getSubjects({ limit: 500 }),
        getFaculty({ limit: 500 }),
      ])
      return { subjects: subjects.data, faculty: faculty.data }
    },
    enabled,
    ...NO_CACHE,
  })

/** @deprecated Use scoped hooks above — kept for invalidator key compatibility */
export const ASSIGNMENTS_KEY = 'assignments'

export const useAssignmentsInvalidator = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] })
}

export const assignmentMutations = {
  create: createAssignment,
  delete: deleteAssignment,
}
