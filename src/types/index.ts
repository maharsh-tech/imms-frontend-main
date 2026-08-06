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
  PUBLISHED: 'PUBLISHED',
} as const;
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const FlagType = {
  AB: 'AB',
  NE: 'NE',
  NONE: 'NONE',
  AB_NE: 'AB_NE',
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
  needsPasswordChange: boolean;
}

export interface AccountInvite {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
  identifier?: string | null;
  createdAt: string;
  isActivated: boolean;
  activationLink: string | null;
  hasActivationToken?: boolean;
  rosterLinked?: boolean | null;
}



export interface BulkCreateResult {
  created: number;
  skipped: number;
  errors: { identifier: string | null; email: string; reason: string }[];
  invites: AccountInvite[];
}

export interface ImportRowError {
  row: number;
  reason: string;
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: ImportRowError[];
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
