import apiClient from './client';
import type { FlagType } from '../types';

export interface MarksGridStudent {
  id: string;
  rollNumber: string;
  name: string;
  mark: {
    id: string;
    marksObtained: number | null;
    flag: FlagType;
  } | null;
}

export interface MarksGrid {
  assignment: {
    id: string;
    subject: { code: string; name: string; department: string };
    faculty: { name: string };
    semester: number;
    academicYear: string;
    subjectType?: 'CORE' | 'ELECTIVE';
    startRollNumber?: string | null;
    endRollNumber?: string | null;
  };
  assessment: { id: string; name: string; maxMarks: number };
  submission: { status: string; submittedAt?: string | null; publishedAt?: string | null };
  students: MarksGridStudent[];
}

export const getMarksGrid = (subjectAssignmentId: string, assessmentId: string) =>
  apiClient
    .get<MarksGrid>('/marks/grid', { params: { subjectAssignmentId, assessmentId } })
    .then((r) => r.data);

export const saveMarksBulk = (data: {
  subjectAssignmentId: string;
  assessmentId: string;
  marks: { studentId: string; marksObtained: number | null; flag: FlagType }[];
}) => apiClient.put('/marks/bulk', data).then((r) => r.data);

export const flagNe = (data: {
  subjectAssignmentId: string;
  assessmentId: string;
  neStudentIds: string[];
}) => apiClient.patch('/marks/flag-ne', data).then((r) => r.data);

export const submitMarks = (subjectAssignmentId: string, assessmentId: string) =>
  apiClient.post('/marks/submit', { subjectAssignmentId, assessmentId }).then((r) => r.data);

export const lockMarks = (subjectAssignmentId: string, assessmentId: string) =>
  apiClient.patch('/marks/lock', { subjectAssignmentId, assessmentId }).then((r) => r.data);

export const unlockMarks = (subjectAssignmentId: string, assessmentId: string) =>
  apiClient.patch('/marks/unlock', { subjectAssignmentId, assessmentId }).then((r) => r.data);

export const publishMarks = (subjectAssignmentId: string, assessmentId: string) =>
  apiClient.patch('/marks/publish', { subjectAssignmentId, assessmentId }).then((r) => r.data);

export const unpublishMarks = (subjectAssignmentId: string, assessmentId: string) =>
  apiClient.patch('/marks/unpublish', { subjectAssignmentId, assessmentId }).then((r) => r.data);

export const setNEVisibility = (data: {
  subjectAssignmentId: string;
  assessmentId: string;
  showNEToStudents: boolean;
}) => apiClient.patch('/marks/ne-visibility', data).then((r) => r.data);

export const getMyMarksheet = () => apiClient.get('/marks/my-marksheet').then((r) => r.data);
