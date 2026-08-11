import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import AccountInvites from './AccountInvites'
import StudentsManagement from './StudentsManagement'
import FacultyManagement from './FacultyManagement'
import SubjectsManagement from './SubjectsManagement'
import AssignmentsManagement from './AssignmentsManagement'
import MarksEntry from './MarksEntry'
import MarksReports from './MarksReports'
import { StaffShell } from '../../components/staff'
import {
  COORDINATOR_TABS,
  isCoordinatorTab,
  type CoordinatorTabId,
} from '../../components/staff/staff-nav'
import apiClient from '../../api/client'

export default function CoordinatorDashboard() {
  const { user, logout } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()

  // Support deep links like /coordinator?tab=marks (also used by the marks-page sidebar).
  const [tab, setTab] = useState<CoordinatorTabId>(() => {
    const fromUrl = searchParams.get('tab')
    return isCoordinatorTab(fromUrl) ? fromUrl : 'subjects'
  })

  // Keep the URL in sync with the live section so refresh/deep links land correctly.
  const handleTabChange = (id: CoordinatorTabId) => {
    setTab(id)
    setSearchParams({ tab: id }, { replace: true })
  }

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      logout()
    }
  }

  return (
    <StaffShell
      title="Coordinator Portal"
      userLabel={user?.name || user?.email}
      onLogout={handleLogout}
      wide
      tabs={COORDINATOR_TABS}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      <header className="mb-md">
        <h1 className="text-headline-lg-mobile font-semibold text-primary lg:text-headline-lg">
          Dashboard
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Manage accounts, rosters, subjects, and marks workflow
        </p>
      </header>

      {tab === 'subjects' && <SubjectsManagement />}
      {tab === 'assignments' && <AssignmentsManagement />}
      {tab === 'marks' && <MarksEntry />}
      {tab === 'faculty' && <FacultyManagement />}
      {tab === 'students' && <StudentsManagement />}
      {tab === 'marksReports' && <MarksReports />}
      {tab === 'invites' && <AccountInvites />}
    </StaffShell>
  )
}
