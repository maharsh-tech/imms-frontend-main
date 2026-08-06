import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAssignments, getSubjects, getFaculty, createAssignment, deleteAssignment } from '../api/subjects'

export const ASSIGNMENTS_KEY = 'assignments'

export const useAssignmentsBundle = () =>
  useQuery({
    queryKey: [ASSIGNMENTS_KEY],
    queryFn: async () => {
      const [assignments, subjects, faculty] = await Promise.all([
        getAssignments(),
        getSubjects({ limit: 500 }),
        getFaculty({ limit: 500 }),
      ])
      return { assignments, subjects: subjects.data, faculty: faculty.data }
    },
  })

export const useAssignmentsInvalidator = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] })
}

export const assignmentMutations = {
  create: createAssignment,
  delete: deleteAssignment,
}
