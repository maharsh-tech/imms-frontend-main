import { useEffect, useMemo, useState } from 'react'
import { getMyMarksheet } from '../../api/marks'
import apiClient from '../../api/client'
import { StudentIdentity, CIECard, CIEMarksheetModal } from '../../components/student'
import type { CieRound } from '../../components/student'

interface MarksheetData {
  semester: number | null
  studentName: string
  rollNumber: string
  cieRounds: CieRound[]
}

const StudentMarksheet = () => {
  const [data, setData] = useState<MarksheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentState, setStudentState] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState<CieRound | null>(null)

  const loadMarksheet = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [meRes, sheetRes] = await Promise.allSettled([
        apiClient.get('/auth/me'),
        getMyMarksheet()
      ])

      const me = meRes.status === 'fulfilled' ? meRes.value : null
      const studentState = me?.data?.studentState
      setStudentState(studentState ?? null)

      if (studentState === 'NO_RECORD') {
        setData(null)
        return
      }

      const sheet = sheetRes.status === 'fulfilled' ? sheetRes.value : null
      if (sheet) {
        setData(sheet as MarksheetData)
      }
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

  const roundsForSemester = useMemo(
    () =>
      data?.semester == null
        ? []
        : (data.cieRounds ?? []).filter((round) => round.semester === data.semester),
    [data]
  )

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

  return (
    <>
      <StudentIdentity
        name={data?.studentName || 'Student'}
        rollNumber={data?.rollNumber || '—'}
        semester={data?.semester ?? null}
      />

      {roundsForSemester.length === 0 ? (
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
              No published results are visible
              {data?.semester != null && ` for semester ${data.semester} `}
              yet. Contact the Exam Coordinator if you think this is wrong.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roundsForSemester.map((round) => (
            <CIECard
              key={`${round.academicYear}-${round.semester}-${round.sequence}-${round.name}`}
              name={round.name}
              sequence={round.sequence}
              subjects={round.subjects}
              onOpen={() => setSelectedRound(round)}
            />
          ))}
        </div>
      )}

      {selectedRound && (
        <CIEMarksheetModal
          round={selectedRound}
          rollNumber={data?.rollNumber || '—'}
          onClose={() => setSelectedRound(null)}
        />
      )}
    </>
  )
}

export default StudentMarksheet
