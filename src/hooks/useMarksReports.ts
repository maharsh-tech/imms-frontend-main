import { useQuery } from '@tanstack/react-query';
import {
  getReportsYears,
  getReportsSemesters,
  getReportsBatches,
  getReportsBatchStudents,
  searchReportsStudents,
  getCoordinatorMarksheet,
} from '../api/reports';

const NO_CACHE = { staleTime: 0, gcTime: 0 } as const;

export const useReportsYears = () =>
  useQuery({
    queryKey: ['reports', 'years'],
    queryFn: () => getReportsYears(),
    ...NO_CACHE,
  });

export const useReportsSemesters = (academicYear: string) =>
  useQuery({
    queryKey: ['reports', 'semesters', academicYear],
    queryFn: () => getReportsSemesters(academicYear.trim()),
    enabled: Boolean(academicYear.trim()),
    ...NO_CACHE,
  });

export const useReportsBatches = (academicYear: string, semester: string) =>
  useQuery({
    queryKey: ['reports', 'batches', academicYear, semester],
    queryFn: () =>
      getReportsBatches(academicYear.trim(), Number(semester)),
    enabled: Boolean(academicYear.trim()) && Boolean(semester),
    ...NO_CACHE,
  });

export const useReportsBatchStudents = (
  academicYear: string,
  semester: string,
  batch: string,
  department: string,
  page: number,
) =>
  useQuery({
    queryKey: ['reports', 'batchStudents', academicYear, semester, batch, department, page],
    queryFn: () =>
      getReportsBatchStudents({
        academicYear: academicYear.trim(),
        semester: Number(semester),
        batch,
        department,
        page,
        limit: 50,
      }),
    enabled:
      Boolean(academicYear.trim()) &&
      Boolean(semester) &&
      Boolean(batch) &&
      Boolean(department),
    ...NO_CACHE,
  });

export const useReportsStudentSearch = (
  q: string,
  academicYear: string,
  semester: string,
) =>
  useQuery({
    queryKey: ['reports', 'search', q, academicYear, semester],
    queryFn: () =>
      searchReportsStudents({
        q: q.trim(),
        academicYear: academicYear.trim(),
        semester: Number(semester),
      }),
    enabled:
      q.trim().length >= 3 &&
      Boolean(academicYear.trim()) &&
      Boolean(semester),
    ...NO_CACHE,
  });

export const useCoordinatorMarksheet = (
  studentId: string | null,
  academicYear: string,
  semester: string,
) =>
  useQuery({
    queryKey: ['reports', 'marksheet', studentId, academicYear, semester],
    queryFn: () =>
      getCoordinatorMarksheet(
        studentId!,
        academicYear.trim(),
        Number(semester),
      ),
    enabled:
      Boolean(studentId) &&
      Boolean(academicYear.trim()) &&
      Boolean(semester),
    ...NO_CACHE,
  });
