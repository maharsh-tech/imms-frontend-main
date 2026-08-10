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
}

export interface CieRound {
  id: string;
  academicYear: string;
  semester: number;
  department: string;
  name: string;
  sequence: number;
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
    currentAcademicYear?: string;
  };
}

export interface Assessment {
  id: string;
  subjectOfferingId?: string;
  cieRoundId?: string;
  name: string;
  sequence?: number;
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
  subjectOfferingId: string;
  facultyId: string;
  semester: number;
  academicYear: string;
  startRollNumber?: string | null;
  endRollNumber?: string | null;
  rosterCount?: number;
  subject: Subject & { assessments?: Assessment[] };
  faculty: Faculty;
  assessmentSubmissions?: { assessmentId: string; status: string; showNEToStudents: boolean }[];
}

export interface SubjectOfferingRow {
  id: string;
  academicYear: string;
  semester: number;
  subject: Subject & { assessments: Assessment[] };
  assignments: Array<
    Pick<
      SubjectAssignment,
      | 'id'
      | 'facultyId'
      | 'startRollNumber'
      | 'endRollNumber'
      | 'rosterCount'
      | 'faculty'
      | 'assessmentSubmissions'
    >
  >;
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
  academicYear: string;
  semester: number;
  cieRoundName: string;
  maxMarks: number;
  examDate?: string;
  examTime?: string;
};

export type UpdateAssessmentPayload = {
  maxMarks?: number;
  examDate?: string;
  examTime?: string;
};

export type EnrollmentScope = {
  academicYear: string;
  semester: number;
};

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

export const getCieRounds = (params: {
  academicYear: string;
  semester: number;
  department: string;
}) =>
  apiClient.get<CieRound[]>('/cie-rounds', { params }).then((r) => r.data);

export const getFaculty = (params?: PaginationParams) =>
  apiClient.get<PaginatedResult<Faculty>>('/faculty', { params }).then((r) => r.data);

export const getAssignments = (params?: { academicYear?: string; semester?: number }) =>
  apiClient.get<SubjectAssignment[]>('/subject-assignments', { params }).then((r) => r.data);
export const getOfferings = (params?: { academicYear?: string; semester?: number }) =>
  apiClient.get<SubjectOfferingRow[]>('/subject-offerings', { params }).then((r) => r.data);
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

export const getSubjectEnrollments = (
  subjectId: string,
  scope: EnrollmentScope,
) =>
  apiClient
    .get<SubjectEnrollment[]>(`/subjects/${subjectId}/enrollments`, { params: scope })
    .then((r) => r.data);

export const bulkEnrollStudents = (
  subjectId: string,
  scope: EnrollmentScope,
  rollNumbers: string[],
) =>
  apiClient
    .post<ImportResult>(`/subjects/${subjectId}/enrollments/bulk`, {
      ...scope,
      rollNumbers,
    })
    .then((r) => r.data);

export const importSubjectEnrollments = (
  subjectId: string,
  scope: EnrollmentScope,
  file: File,
) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient
    .post<ImportResult>(`/subjects/${subjectId}/enrollments/import`, form, {
      params: scope,
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

export const removeSubjectEnrollment = (
  subjectId: string,
  scope: EnrollmentScope,
  studentId: string,
) =>
  apiClient.delete(`/subjects/${subjectId}/enrollments/${studentId}`, { params: scope });
