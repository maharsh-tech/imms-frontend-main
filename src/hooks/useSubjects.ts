import { useMutation } from '@tanstack/react-query'
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
import { useQuery, useQueryClient } from '@tanstack/react-query'

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

export const useSubjectMutations = () => {
  const invalidateSubjects = useSubjectsInvalidator()
  const invalidateEnrollments = useSubjectEnrollmentsInvalidator()

  const createSubjectMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => invalidateSubjects(),
  })
  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSubject>[1] }) =>
      updateSubject(id, data),
    onSuccess: () => invalidateSubjects(),
  })
  const deleteSubjectMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => invalidateSubjects(),
  })
  const createAssessmentMutation = useMutation({
    mutationFn: ({
      subjectId,
      data,
    }: {
      subjectId: string
      data: Parameters<typeof createAssessment>[1]
    }) => createAssessment(subjectId, data),
    onSuccess: () => invalidateSubjects(),
  })
  const updateAssessmentMutation = useMutation({
    mutationFn: ({
      subjectId,
      assessmentId,
      data,
    }: {
      subjectId: string
      assessmentId: string
      data: Parameters<typeof updateAssessment>[2]
    }) => updateAssessment(subjectId, assessmentId, data),
    onSuccess: () => invalidateSubjects(),
  })
  const deleteAssessmentMutation = useMutation({
    mutationFn: ({
      subjectId,
      assessmentId,
    }: {
      subjectId: string
      assessmentId: string
    }) => deleteAssessment(subjectId, assessmentId),
    onSuccess: () => invalidateSubjects(),
  })
  const bulkEnrollMutation = useMutation({
    mutationFn: ({ subjectId, rollNumbers }: { subjectId: string; rollNumbers: string[] }) =>
      bulkEnrollStudents(subjectId, rollNumbers),
    onSuccess: (_result, { subjectId }) => {
      invalidateEnrollments(subjectId)
      invalidateSubjects()
    },
  })
  const removeEnrollmentMutation = useMutation({
    mutationFn: ({ subjectId, studentId }: { subjectId: string; studentId: string }) =>
      removeSubjectEnrollment(subjectId, studentId),
    onSuccess: (_result, { subjectId }) => {
      invalidateEnrollments(subjectId)
      invalidateSubjects()
    },
  })

  return {
    createSubject: createSubjectMutation,
    updateSubject: updateSubjectMutation,
    deleteSubject: deleteSubjectMutation,
    createAssessment: createAssessmentMutation,
    updateAssessment: updateAssessmentMutation,
    deleteAssessment: deleteAssessmentMutation,
    bulkEnroll: bulkEnrollMutation,
    removeEnrollment: removeEnrollmentMutation,
    invalidateEnrollments,
  }
}
