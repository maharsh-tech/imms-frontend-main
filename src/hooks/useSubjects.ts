import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSubjects,
  getSubjectEnrollments,
  createSubject,
  updateSubject,
  deleteSubject,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  bulkEnrollStudents,
  removeSubjectEnrollment,
} from '../api/subjects'
import type { PaginationParams } from '../types/pagination'

export const SUBJECTS_KEY = 'subjects'
export const SUBJECT_ENROLLMENTS_KEY = 'subjectEnrollments'

export const useSubjects = (params?: PaginationParams & { semester?: number; department?: string }) =>
  useQuery({
    queryKey: [SUBJECTS_KEY, params],
    queryFn: () => getSubjects(params),
  })

export const useSubjectEnrollments = (subjectId: string | undefined) =>
  useQuery({
    queryKey: [SUBJECT_ENROLLMENTS_KEY, subjectId],
    queryFn: () => getSubjectEnrollments(subjectId!),
    enabled: Boolean(subjectId),
  })

export const useSubjectsInvalidator = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [SUBJECTS_KEY] })
}

export const useSubjectEnrollmentsInvalidator = () => {
  const queryClient = useQueryClient()
  return (subjectId: string) =>
    queryClient.invalidateQueries({ queryKey: [SUBJECT_ENROLLMENTS_KEY, subjectId] })
}

export const subjectMutations = {
  createSubject,
  updateSubject,
  deleteSubject,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  bulkEnrollStudents,
  removeSubjectEnrollment,
}
