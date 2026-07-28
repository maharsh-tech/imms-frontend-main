// Enums — mirrored from Prisma schema (prisma/schema.prisma is source of truth)
// Using const objects instead of TS enums for compatibility with verbatimModuleSyntax

export const Role = {
  COORDINATOR: 'COORDINATOR',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const SubmissionStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  LOCKED: 'LOCKED',
} as const;
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const FlagType = {
  AB: 'AB',
  NE: 'NE',
  NONE: 'NONE',
} as const;
export type FlagType = (typeof FlagType)[keyof typeof FlagType];

export const AuditAction = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SUBMIT: 'SUBMIT',
  UNLOCK: 'UNLOCK',
  PUBLISH: 'PUBLISH',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// API response types — what the backend returns

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  profilePic?: string;
}

export type StudentState = 'NO_RECORD' | 'UNPUBLISHED' | 'PUBLISHED';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  studentState: StudentState | null;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
