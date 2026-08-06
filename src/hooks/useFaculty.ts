import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getFaculty } from '../api/subjects'
import type { PaginationParams } from '../types/pagination'

export const FACULTY_KEY = 'faculty'

export const useFaculty = (params?: PaginationParams) =>
  useQuery({
    queryKey: [FACULTY_KEY, params],
    queryFn: () => getFaculty(params),
  })

export const useFacultyInvalidator = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [FACULTY_KEY] })
}
