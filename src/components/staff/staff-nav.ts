import {
  Layers,
  Link2,
  ClipboardList,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  Users,
} from 'lucide-react'
import type { StaffTab } from './StaffSidebar'

/** Coordinator dashboard section ids — also used as `?tab=` deep-link values. */
export type CoordinatorTabId =
  | 'subjects'
  | 'assignments'
  | 'marks'
  | 'faculty'
  | 'students'
  | 'marksReports'
  | 'invites'

/** Single source of truth for the coordinator sidebar navigation. */
export const COORDINATOR_TABS: StaffTab<CoordinatorTabId>[] = [
  { id: 'subjects', label: 'Subject', icon: Layers },
  { id: 'assignments', label: 'Exam & Assignments', icon: Link2 },
  { id: 'marks', label: 'Marks Entry', icon: ClipboardList },
  { id: 'faculty', label: 'Manage Faculty', icon: BookOpen },
  { id: 'students', label: 'Manage Student', icon: GraduationCap },
  { id: 'marksReports', label: 'Marks', icon: FileSpreadsheet },
  { id: 'invites', label: 'Account Management', shortLabel: 'Accounts', icon: Users },
]

/** Teacher sidebar navigation (single section — My Subjects). */
export const TEACHER_TABS: StaffTab<'home'>[] = [
  { id: 'home', label: 'My Subjects', icon: BookOpen },
]

/** Guard for `?tab=` deep-link values — rejects anything not in the config. */
export const isCoordinatorTab = (value: string | null): value is CoordinatorTabId =>
  value != null && COORDINATOR_TABS.some((tab) => tab.id === value)
