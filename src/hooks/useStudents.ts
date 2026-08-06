import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStudents } from '../api/students'
import type { PaginationParams } from '../types/pagination'

export const STUDENTS_KEY = 'students'

export type StudentsQueryParams = PaginationParams & { semester?: number; department?: string }

export const useStudents = (params: StudentsQueryParams) =>
  useQuery({
    queryKey: [STUDENTS_KEY, params],
    queryFn: () => getStudents(params),
  })

export const useStudentsInvalidator = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [STUDENTS_KEY] })
}
