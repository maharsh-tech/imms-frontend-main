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

export const getSubjects = () => apiClient.get<Subject[]>('/subjects').then((r) => r.data);
export const createSubject = (data: Partial<Subject>) =>
  apiClient.post<Subject>('/subjects', data).then((r) => r.data);
export const createAssessment = (subjectId: string, data: { name: string; maxMarks: number }) =>
  apiClient.post<Assessment>(`/subjects/${subjectId}/assessments`, data).then((r) => r.data);

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
