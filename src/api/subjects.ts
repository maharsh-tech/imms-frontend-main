import apiClient from './client';

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  creditHours?: number | null;
  assessments?: Assessment[];
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
  subject: Subject;
  faculty: Faculty;
  assessmentSubmissions?: { assessmentId: string; status: string }[];
}

export type CreateSubjectPayload = {
  code: string;
  name: string;
  department: string;
  semester: number;
  creditHours?: number;
};

export type UpdateSubjectPayload = Partial<Omit<CreateSubjectPayload, 'code'>>;

export type CreateAssessmentPayload = {
  name: string;
  maxMarks: number;
  examDate?: string;
  examTime?: string;
};

export type UpdateAssessmentPayload = Partial<CreateAssessmentPayload>;

export const getSubjects = (params?: { semester?: number; department?: string }) =>
  apiClient.get<Subject[]>('/subjects', { params }).then((r) => r.data);

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

export const getFaculty = () => apiClient.get<Faculty[]>('/faculty').then((r) => r.data);

export const getAssignments = () =>
  apiClient.get<SubjectAssignment[]>('/subject-assignments').then((r) => r.data);
export const getMyAssignments = () =>
  apiClient.get<SubjectAssignment[]>('/subject-assignments/my').then((r) => r.data);
export const createAssignment = (data: {
  subjectId: string;
  facultyId: string;
  semester: number;
  academicYear: string;
}) => apiClient.post<SubjectAssignment>('/subject-assignments', data).then((r) => r.data);
export const deleteAssignment = (id: string) => apiClient.delete(`/subject-assignments/${id}`);
