import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import apiClient from '../../api/client'
import { getMyMarksheet } from '../../api/marks'

type ProfileDetails = {
  rollNumber: string
  semester: number | null
  studentName: string
}

/**
 * Student profile — account details. No photo/avatar.
 */
const StudentProfile = () => {
  const { user } = useAuthStore()
  const [details, setDetails] = useState<ProfileDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [meRes, sheetRes] = await Promise.allSettled([
          apiClient.get('/auth/me'),
          getMyMarksheet()
        ])

        const me = meRes.status === 'fulfilled' ? meRes.value : null
        if (me?.data?.studentState === 'NO_RECORD') {
          setDetails(null)
          return
        }

        const sheet = sheetRes.status === 'fulfilled' ? sheetRes.value : null
        if (sheet) {
          setDetails({
            rollNumber: sheet.rollNumber || '—',
            semester: sheet.semester ?? null,
            studentName: sheet.studentName || user?.name || '—',
          })
        } else {
          setDetails(null)
        }
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user?.name])

  const displayName = details?.studentName || user?.name || '—'

  const infoRows = [
    { label: 'Name', value: displayName },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Roll number', value: details?.rollNumber || '—' },
    {
      label: 'Semester',
      value: details?.semester != null ? `Semester ${details.semester}` : '—',
    },
    { label: 'Role', value: 'Student' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
        <p className="animate-pulse text-body-md text-on-surface-variant">Loading...</p>
      </div>
    )
  }

  return (
    <section className="w-full">
      <header className="mb-xl">
        <h1 className="mb-1 text-headline-lg-mobile font-semibold text-primary lg:text-headline-lg">
          Profile
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-on-surface-variant">
          <span className="rounded-full bg-secondary-container px-3 py-1 text-label-md text-on-secondary-container">
            {displayName.toUpperCase()}
          </span>
          {details?.rollNumber && details.rollNumber !== '—' && (
            <>
              <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden="true" />
              <span className="text-label-md">{details.rollNumber}</span>
            </>
          )}
          {details?.semester != null && (
            <>
              <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden="true" />
              <span className="text-label-md font-bold text-primary">
                Semester {details.semester}
              </span>
            </>
          )}
        </div>
      </header>

      <article className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-[var(--shadow-card)]">
        <div className="border-b border-surface-variant p-4">
          <h2 className="text-title-lg font-semibold text-primary">Account information</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Your portal login details</p>
        </div>

        <dl className="divide-y divide-surface-variant">
          {infoRows.map((row) => (
            <div
              key={row.label}
              className="grid min-h-12 grid-cols-1 gap-1 px-4 py-4 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-4 sm:py-0"
            >
              <dt className="text-label-sm uppercase text-on-surface-variant">{row.label}</dt>
              <dd className="break-words text-body-md text-on-surface">{row.value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </section>
  )
}

export default StudentProfile
