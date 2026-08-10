import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOfferings, getSubjects, getFaculty, createAssignment, deleteAssignment } from '../api/subjects'

export const ASSIGNMENTS_KEY = 'assignments'

export const useAssignmentsBundle = () =>
  useQuery({
    queryKey: [ASSIGNMENTS_KEY],
    queryFn: async () => {
      const [offerings, subjects, faculty] = await Promise.all([
        getOfferings(),
        getSubjects({ limit: 500 }),
        getFaculty({ limit: 500 }),
      ])
      return { offerings, subjects: subjects.data, faculty: faculty.data }
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
