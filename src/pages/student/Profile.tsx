import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import apiClient from '../../api/client'
import { getMyMarksheet } from '../../api/marks'

type ProfileDetails = {
  rollNumber: string
  semester: number | null
  studentName: string
}

/**
 * Student profile — account details and logout. No photo/avatar.
 */
const StudentProfile = () => {
  const { user, logout } = useAuthStore()
  const [details, setDetails] = useState<ProfileDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await apiClient.get('/auth/me')
        if (me.data.studentState === 'NO_RECORD') {
          setDetails(null)
          return
        }
        const sheet = await getMyMarksheet()
        setDetails({
          rollNumber: sheet.rollNumber || '—',
          semester: sheet.semester ?? null,
          studentName: sheet.studentName || user?.name || '—',
        })
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user?.name])

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      logout()
    }
  }

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

        <div className="border-t border-surface-variant p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-transparent px-4 py-3 text-label-md font-semibold text-primary transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto sm:min-w-[160px]"
            aria-label="Log out of Student Portal"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Log out
          </button>
        </div>
      </article>
    </section>
  )
}

export default StudentProfile
