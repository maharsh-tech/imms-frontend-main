import { useQuery } from '@tanstack/react-query'
import { getOfferings } from '../api/subjects'

export const MARKS_ENTRY_OFFERINGS_KEY = 'marksEntryOfferings'

/** Offerings for one academic year only — loaded after year is selected. */
export const useMarksEntryOfferings = (academicYear: string) =>
  useQuery({
    queryKey: [MARKS_ENTRY_OFFERINGS_KEY, academicYear.trim()],
    queryFn: () => getOfferings({ academicYear: academicYear.trim() }),
    enabled: Boolean(academicYear.trim()),
    staleTime: 60_000,
  })
