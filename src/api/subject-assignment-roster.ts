import apiClient from './client';
import type { ImportResult } from '../types';

export interface AssignmentRosterEntry {
  id: string;
  studentId: string;
  addedAt: string;
  student: {
    id: string;
    rollNumber: string;
    name: string;
    email: string;
    department: string;
    semester: number;
    currentAcademicYear?: string;
  };
}

export const getAssignmentRoster = (subjectAssignmentId: string) =>
  apiClient
    .get<AssignmentRosterEntry[]>(`/subject-assignments/${subjectAssignmentId}/roster`)
    .then((r) => r.data);

export const bulkAddRosterStudents = (
  subjectAssignmentId: string,
  rollNumbers: string[],
) =>
  apiClient
    .post<ImportResult>(`/subject-assignments/${subjectAssignmentId}/roster/bulk`, {
      rollNumbers,
    })
    .then((r) => r.data);

export const importAssignmentRoster = (subjectAssignmentId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient
    .post<ImportResult>(`/subject-assignments/${subjectAssignmentId}/roster/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const downloadAssignmentRosterTemplate = async (subjectAssignmentId: string) => {
  const response = await apiClient.get(
    `/subject-assignments/${subjectAssignmentId}/roster/template`,
    { responseType: 'blob' },
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `assignment-${subjectAssignmentId}-roster-template.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const removeAssignmentRosterStudent = (
  subjectAssignmentId: string,
  studentId: string,
) => apiClient.delete(`/subject-assignments/${subjectAssignmentId}/roster/${studentId}`);
