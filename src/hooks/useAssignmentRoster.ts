import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAssignmentRoster,
  bulkAddRosterStudents,
  removeAssignmentRosterStudent,
} from '../api/subject-assignment-roster'

export const ASSIGNMENT_ROSTER_KEY = 'assignmentRoster'

export const useAssignmentRoster = (subjectAssignmentId: string | undefined) =>
  useQuery({
    queryKey: [ASSIGNMENT_ROSTER_KEY, subjectAssignmentId],
    queryFn: () => getAssignmentRoster(subjectAssignmentId!),
    enabled: Boolean(subjectAssignmentId),
  })

export const useAssignmentRosterInvalidator = () => {
  const queryClient = useQueryClient()
  return (subjectAssignmentId: string) =>
    queryClient.invalidateQueries({
      queryKey: [ASSIGNMENT_ROSTER_KEY, subjectAssignmentId],
    })
}

export const useAssignmentRosterMutations = () => {
  const invalidateRoster = useAssignmentRosterInvalidator()

  const bulkAddMutation = useMutation({
    mutationFn: ({
      subjectAssignmentId,
      rollNumbers,
    }: {
      subjectAssignmentId: string
      rollNumbers: string[]
    }) => bulkAddRosterStudents(subjectAssignmentId, rollNumbers),
    onSuccess: (_result, { subjectAssignmentId }) => invalidateRoster(subjectAssignmentId),
  })

  const removeMutation = useMutation({
    mutationFn: ({
      subjectAssignmentId,
      studentId,
    }: {
      subjectAssignmentId: string
      studentId: string
    }) => removeAssignmentRosterStudent(subjectAssignmentId, studentId),
    onSuccess: (_result, { subjectAssignmentId }) => invalidateRoster(subjectAssignmentId),
  })

  return {
    bulkAdd: bulkAddMutation,
    remove: removeMutation,
    invalidateRoster,
  }
}
