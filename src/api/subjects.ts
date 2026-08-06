import apiClient from './client';
import type { ImportResult } from '../types';
import type { PaginatedResult, PaginationParams } from '../types/pagination';

export type SubjectType = 'CORE' | 'ELECTIVE';

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  subjectType: SubjectType;
  enrollmentCount?: number;
  assessments?: Assessment[];
}

export interface SubjectEnrollment {
  id: string;
  studentId: string;
  enrolledAt: string;
  student: {
    id: string;
    rollNumber: string;
    name: string;
    email: string;
    department: string;
    semester: number;
  };
}

export interface Assessment {
  id: string;
  subjectId: string;
  name: string;
  maxMarks: number;
  examDate?: string | null;
  examTime?: string | null;
}

export interface Faculty {
  id: string;
  facultyCode: string;
  name: string;
  email: string;
  department: string;
}

export interface SubjectAssignment {
  id: string;
  subjectId: string;
  facultyId: string;
  semester: number;
  academicYear: string;
  startRollNumber?: string | null;
  endRollNumber?: string | null;
  subject: Subject;
  faculty: Faculty;
  assessmentSubmissions?: { assessmentId: string; status: string; showNEToStudents: boolean }[];
}

export type CreateSubjectPayload = {
  code: string;
  name: string;
  department: string;
  semester: number;
  subjectType?: SubjectType;
};

export type UpdateSubjectPayload = Partial<Omit<CreateSubjectPayload, 'code'>>;

export type CreateAssessmentPayload = {
  name: string;
  maxMarks: number;
  examDate?: string;
  examTime?: string;
};

export type UpdateAssessmentPayload = Partial<CreateAssessmentPayload>;

export const getSubjects = (
  params?: PaginationParams & { semester?: number; department?: string },
) =>
  apiClient.get<PaginatedResult<Subject>>('/subjects', { params }).then((r) => r.data);

export const createSubject = (data: CreateSubjectPayload) =>
  apiClient.post<Subject>('/subjects', data).then((r) => r.data);

export const updateSubject = (id: string, data: UpdateSubjectPayload) =>
  apiClient.patch<Subject>(`/subjects/${id}`, data).then((r) => r.data);

export const deleteSubject = (id: string) => apiClient.delete(`/subjects/${id}`);

export const createAssessment = (subjectId: string, data: CreateAssessmentPayload) =>
  apiClient.post<Assessment>(`/subjects/${subjectId}/assessments`, data).then((r) => r.data);

export const updateAssessment = (
  subjectId: string,
  assessmentId: string,
  data: UpdateAssessmentPayload,
) =>
  apiClient
    .patch<Assessment>(`/subjects/${subjectId}/assessments/${assessmentId}`, data)
    .then((r) => r.data);

export const deleteAssessment = (subjectId: string, assessmentId: string) =>
  apiClient.delete(`/subjects/${subjectId}/assessments/${assessmentId}`);

export const getFaculty = (params?: PaginationParams) =>
  apiClient.get<PaginatedResult<Faculty>>('/faculty', { params }).then((r) => r.data);

export const getAssignments = (params?: { academicYear?: string; semester?: number }) =>
  apiClient.get<SubjectAssignment[]>('/subject-assignments', { params }).then((r) => r.data);
export const getMyAssignments = () =>
  apiClient.get<SubjectAssignment[]>('/subject-assignments/my').then((r) => r.data);
export const createAssignment = (data: {
  subjectId: string;
  facultyId: string;
  semester: number;
  academicYear: string;
  startRollNumber?: string;
  endRollNumber?: string;
}) => apiClient.post<SubjectAssignment>('/subject-assignments', data).then((r) => r.data);
export const deleteAssignment = (id: string) => apiClient.delete(`/subject-assignments/${id}`);

export const getSubjectEnrollments = (subjectId: string) =>
  apiClient.get<SubjectEnrollment[]>(`/subjects/${subjectId}/enrollments`).then((r) => r.data);

export const bulkEnrollStudents = (subjectId: string, rollNumbers: string[]) =>
  apiClient
    .post<ImportResult>(`/subjects/${subjectId}/enrollments/bulk`, { rollNumbers })
    .then((r) => r.data);

export const importSubjectEnrollments = (subjectId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient
    .post<ImportResult>(`/subjects/${subjectId}/enrollments/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const downloadEnrollmentTemplate = async (subjectId: string, subjectCode: string) => {
  const response = await apiClient.get(`/subjects/${subjectId}/enrollments/template`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${subjectCode}-elective-roster-template.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const removeSubjectEnrollment = (subjectId: string, studentId: string) =>
  apiClient.delete(`/subjects/${subjectId}/enrollments/${studentId}`);
