import { useEffect, useState, type ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { getMyMarksheet } from '../../api/marks'
import apiClient from '../../api/client'
import RoleNavBar from '../../components/shared/RoleNavBar'

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
  const { user, logout } = useAuthStore()
  const [data, setData] = useState<MarksheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentState, setStudentState] = useState<string | null>(null)
  
  // Keep track of which subjects are collapsed (by code). Default = empty = all expanded.
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      try {
        const me = await apiClient.get('/auth/me')
        setStudentState(me.data.studentState)
        if (me.data.studentState === 'NO_RECORD') return
        const sheet = await getMyMarksheet()
        setData(sheet as MarksheetData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      logout()
    }
  }

  const toggleSubject = (code: string) => {
    setCollapsedSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const shell = (content: ReactNode) => (
    <div className="min-h-screen bg-gray-100">
      <RoleNavBar
        title="IMMS Student"
        userLabel={user?.name || user?.email}
        onLogout={handleLogout}
      />
      {content}
    </div>
  )

  if (loading) {
    return shell(
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500 animate-pulse">Loading...</p>
      </div>,
    )
  }

  if (studentState === 'NO_RECORD') {
    return shell(
      <main className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow p-8 border border-amber-200">
          <h2 className="text-xl font-bold text-gray-900">Account not linked</h2>
          <p className="mt-3 text-gray-600">
            Contact the Exam Coordinator to have your student record added to the roster.
          </p>
        </div>
      </main>,
    )
  }

  return shell(
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">My Marksheet</h2>
      {(!data?.hasPublished || data.subjects.length === 0) && (
        <div className="bg-white rounded-lg shadow p-6 border border-blue-200">
          <p className="text-gray-600">
            No published results are visible for your account yet. For elective subjects, you must
            be on the coordinator&apos;s elective roster before results appear. Contact the Exam
            Coordinator if you think this is wrong.
          </p>
        </div>
      )}
      {data && data.hasPublished && data.subjects.length > 0 && (
        <>
          <p className="text-gray-700">
            {data.studentName} · {data.rollNumber} · Semester {data.semester}
          </p>
          <div className="mt-6 space-y-4">
            {data.subjects.map((s) => {
              const isCollapsed = collapsedSubjects.has(s.code)
              return (
                <div key={s.code} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSubject(s.code)}
                    className="w-full px-4 py-3 bg-gray-50 border-b flex items-center justify-between hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {s.code} — {s.name}
                      </span>
                      <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {s.assessments.length} {s.assessments.length === 1 ? 'exam' : 'exams'}
                      </span>
                    </div>
                    <span className="text-gray-400 font-bold">
                      {isCollapsed ? '▸' : '▾'}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 uppercase bg-white">
                          <th className="px-4 py-2 border-b">Exam</th>
                          <th className="px-4 py-2 border-b">Max</th>
                          <th className="px-4 py-2 border-b">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.assessments.map((a) => (
                          <tr key={a.name} className="border-t hover:bg-gray-50/50">
                            <td className="px-4 py-2 text-sm text-gray-900">{a.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{a.maxMarks}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{a.display}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </main>,
  )
}

export default StudentMarksheet
