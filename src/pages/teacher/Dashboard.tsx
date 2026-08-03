import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { getMyAssignments } from '../../api/subjects'
import type { SubjectAssignment } from '../../api/subjects'
import apiClient from '../../api/client'
import { StaffShell } from '../../components/staff'
import SubmissionStatusBadge from '../../components/shared/SubmissionStatusBadge'

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore()
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([])

  useEffect(() => {
    getMyAssignments().then(setAssignments)
  }, [])

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      logout()
    }
  }

  return (
    <StaffShell
      title="Teacher Portal"
      userLabel={user?.name || user?.email}
      onLogout={handleLogout}
    >
      <header className="mb-xl">
        <h1 className="text-headline-lg-mobile font-semibold text-primary lg:text-headline-lg">
          My Subjects
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Enter marks for your assigned subjects and exams
        </p>
      </header>

      {assignments.length === 0 ? (
        <div className="imms-card p-6 text-center">
          <p className="text-body-md text-on-surface-variant">
            No subjects assigned yet. Contact the coordinator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {assignments.map((a) => (
            <article
              key={a.id}
              className="imms-card overflow-hidden transition-shadow hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="border-b border-surface-variant p-4">
                <h2 className="text-title-lg text-primary">
                  {a.subject.code} — {a.subject.name}
                </h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Semester {a.semester} · {a.academicYear}
                  {a.subject.subjectType === 'ELECTIVE' && (
                    <span className="ml-2 font-medium text-primary">
                      Elective · {a.subject.enrollmentCount ?? 0} students
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {a.subject.assessments?.map((ass) => {
                  const sub = a.assessmentSubmissions?.find((s) => s.assessmentId === ass.id)
                  return (
                    <Link
                      key={ass.id}
                      to={`/teacher/marks/${a.id}/${ass.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-md text-primary transition-colors hover:bg-surface-container"
                    >
                      {ass.name}
                      {sub && <SubmissionStatusBadge status={sub.status} />}
                    </Link>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </StaffShell>
  )
}
