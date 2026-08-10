import { useQuery } from '@tanstack/react-query'
import { getCieRounds } from '../api/subjects'

export const CIE_ROUNDS_KEY = 'cieRounds'

export const useCieRounds = (
  academicYear: string,
  semester: number,
  department: string,
) =>
  useQuery({
    queryKey: [CIE_ROUNDS_KEY, academicYear, semester, department],
    queryFn: () => getCieRounds({ academicYear, semester, department }),
    enabled: Boolean(academicYear && semester && department),
  })
