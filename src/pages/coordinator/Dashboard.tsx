import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import AccountInvites from './AccountInvites'
import StudentsManagement from './StudentsManagement'
import FacultyManagement from './FacultyManagement'
import SubjectsManagement from './SubjectsManagement'
import AssignmentsManagement from './AssignmentsManagement'
import { StaffShell } from '../../components/staff'
import { Users, GraduationCap, BookOpen, Layers, Link2 } from 'lucide-react'
import apiClient from '../../api/client'

type Tab = 'invites' | 'students' | 'faculty' | 'subjects' | 'assignments'

export default function CoordinatorDashboard() {
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState<Tab>('subjects')

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      logout()
    }
  }

  const tabs = [
    { id: 'subjects' as const, label: 'Subject', icon: Layers },
    { id: 'assignments' as const, label: 'Exam & Assignments', icon: Link2 },
    { id: 'faculty' as const, label: 'Manage Faculty', icon: BookOpen },
    { id: 'students' as const, label: 'Manage Student', icon: GraduationCap },
    { id: 'invites' as const, label: 'Account Management', shortLabel: 'Accounts', icon: Users },
  ]

  return (
    <StaffShell
      title="Coordinator Portal"
      userLabel={user?.name || user?.email}
      onLogout={handleLogout}
      wide
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      <header className="mb-md">
        <h1 className="text-headline-lg-mobile font-semibold text-primary lg:text-headline-lg">
          Dashboard
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Manage accounts, rosters, subjects, and marks workflow
        </p>
      </header>

      {tab === 'invites' && <AccountInvites />}
      {tab === 'students' && <StudentsManagement />}
      {tab === 'faculty' && <FacultyManagement />}
      {tab === 'subjects' && <SubjectsManagement />}
      {tab === 'assignments' && <AssignmentsManagement />}
    </StaffShell>
  )
}
