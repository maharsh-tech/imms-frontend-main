import { useEffect, useState } from 'react'
import { getMyMarksheet } from '../../api/marks'
import apiClient from '../../api/client'
import { StudentIdentity, SubjectCard } from '../../components/student'

interface MarksheetData {
  semester: number | null
  studentName: string
  rollNumber: string
  hasPublished: boolean
  subjects: {
    code: string
    name: string
    assessments: { name: string; maxMarks: number; display: string }[]
  }[]
}

const StudentMarksheet = () => {
  const [data, setData] = useState<MarksheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentState, setStudentState] = useState<string | null>(null)

  const loadMarksheet = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const me = await apiClient.get('/auth/me')
      setStudentState(me.data.studentState)
      if (me.data.studentState === 'NO_RECORD') {
        setData(null)
        return
      }
      const sheet = await getMyMarksheet()
      setData(sheet as MarksheetData)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadMarksheet()
  }, [])

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState !== 'visible') return
      loadMarksheet(true)
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
        <p className="animate-pulse text-body-md text-on-surface-variant">Loading...</p>
      </div>
    )
  }

  if (studentState === 'NO_RECORD') {
    return (
      <section className="mx-auto max-w-md py-12">
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-8 shadow-[var(--shadow-card)]">
          <h2 className="text-title-lg text-primary">Account not linked</h2>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Your account is not linked to any student record. Contact the Exam Coordinator.
          </p>
        </div>
      </section>
    )
  }

  const hasResults = Boolean(data?.hasPublished && data.subjects.length > 0)

  return (
    <>
      <StudentIdentity
        name={data?.studentName || 'Student'}
        rollNumber={data?.rollNumber || '—'}
        semester={data?.semester ?? null}
      />

      {!hasResults && (
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col items-center py-xl text-center">
            <svg
              className="mb-2 h-10 w-10 text-on-surface-variant"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <circle cx="12" cy="14" r="3" />
              <path d="M12 13v1l.5.5" />
            </svg>
            <p className="text-label-md text-on-surface-variant">Results Awaited</p>
            <p className="mt-2 max-w-sm text-body-md text-on-surface-variant">
              No published results are visible yet. Contact the Exam Coordinator if you think this
              is wrong.
            </p>
          </div>
        </div>
      )}

      {hasResults && data && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.subjects.map((subject) => (
            <SubjectCard
              key={subject.code}
              code={subject.code}
              name={subject.name}
              assessments={subject.assessments}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default StudentMarksheet
