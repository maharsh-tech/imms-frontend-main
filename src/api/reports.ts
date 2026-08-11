import apiClient from './client';
import type { PaginatedResult } from '../types/pagination';

export type ReportsBatchOption = {
  batch: string;
  department: string;
  label: string;
};

export type ReportsStudentRow = {
  id: string;
  rollNumber: string;
  name: string;
  batch: string;
  department: string;
  isActive: boolean;
};

export type CoordinatorMarksheetSubject = {
  code: string;
  name: string;
  maxMarks: number;
  display: string;
  marksObtained: number | null;
  flag: string;
};

export type CoordinatorMarksheet = {
  student: {
    rollNumber: string;
    name: string;
    department: string;
    semester: number;
    batch: string;
    isActive: boolean;
  };
  hasPublished: boolean;
  cieRounds: {
    name: string;
    sequence: number;
    subjects: CoordinatorMarksheetSubject[];
  }[];
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const getReportsYears = () =>
  apiClient.get<string[]>('/reports/years').then((r) => r.data);

export const getReportsSemesters = (academicYear: string) =>
  apiClient
    .get<number[]>('/reports/semesters', { params: { academicYear } })
    .then((r) => r.data);

export const getReportsBatches = (academicYear: string, semester: number) =>
  apiClient
    .get<ReportsBatchOption[]>('/reports/batches', {
      params: { academicYear, semester },
    })
    .then((r) => r.data);

export const getReportsBatchStudents = (params: {
  academicYear: string;
  semester: number;
  batch: string;
  department: string;
  page?: number;
  limit?: number;
}) =>
  apiClient
    .get<PaginatedResult<ReportsStudentRow>>('/reports/batch/students', { params })
    .then((r) => r.data);

export const searchReportsStudents = (params: {
  q: string;
  academicYear: string;
  semester: number;
  limit?: number;
}) =>
  apiClient
    .get<ReportsStudentRow[]>('/reports/students/search', { params })
    .then((r) => r.data);

export const getCoordinatorMarksheet = (
  studentId: string,
  academicYear: string,
  semester: number,
) =>
  apiClient
    .get<CoordinatorMarksheet>(`/reports/marksheet/${studentId}`, {
      params: { academicYear, semester },
    })
    .then((r) => r.data);

export const downloadBatchMarksExcel = async (params: {
  academicYear: string;
  semester: number;
  batch: string;
  department: string;
}): Promise<void> => {
  const { data } = await apiClient.get<Blob>('/reports/batch/export', {
    responseType: 'blob',
    params,
  });
  const label = `${params.department}_${params.batch.replace(/-/g, '')}_sem${params.semester}`;
  downloadBlob(data, `marks_${label}.xlsx`);
};

export const downloadStudentMarksheetExcel = async (
  studentId: string,
  academicYear: string,
  semester: number,
  rollNumber: string,
): Promise<void> => {
  const { data } = await apiClient.get<Blob>(
    `/reports/marksheet/${studentId}/export`,
    {
      responseType: 'blob',
      params: { academicYear, semester },
    },
  );
  downloadBlob(data, `marksheet_${rollNumber}.xlsx`);
};
