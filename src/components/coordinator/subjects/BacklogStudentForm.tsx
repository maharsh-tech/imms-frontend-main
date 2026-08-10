import { useState } from 'react'
import type { Subject, EnrollmentScope } from '../../../api/subjects'
import { apiErrorMessage } from '../../../utils/api-errors'
import { useSubjectEnrollments, useSubjectMutations } from '../../../hooks/useSubjects'

type BacklogStudentFormProps = {
  subject: Subject
  enrollmentScope: EnrollmentScope
  onClose: () => void
}

const BacklogStudentForm = ({ subject, enrollmentScope, onClose }: BacklogStudentFormProps) => {
  const [rollNumber, setRollNumber] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { data: enrollments = [] } = useSubjectEnrollments(subject.id, enrollmentScope)
  const { bulkEnroll, removeEnrollment } = useSubjectMutations()

  const busy = bulkEnroll.isPending || removeEnrollment.isPending

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = rollNumber.trim()
    if (!trimmed) return
    setError('')
    setMessage('')
    bulkEnroll.mutate(
      { subjectId: subject.id, scope: enrollmentScope, rollNumbers: [trimmed] },
      {
        onSuccess: (result) => {
          if (result.imported > 0) {
            setMessage(`Added ${trimmed} as a backlog student for ${subject.code}`)
            setRollNumber('')
          } else {
            setError(result.errors[0]?.reason ?? `Could not add ${trimmed}`)
          }
        },
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to add backlog student')),
      },
    )
  }

  const handleRemove = (studentId: string) => {
    setError('')
    setMessage('')
    removeEnrollment.mutate(
      { subjectId: subject.id, scope: enrollmentScope, studentId },
      {
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to remove student')),
      },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-container-lowest rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border border-outline-variant">
        <div className="p-6 border-b border-outline-variant">
          <h3 className="text-lg font-semibold text-on-surface">
            Backlog students — {subject.code} ({subject.name})
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Offering {enrollmentScope.academicYear} · semester {enrollmentScope.semester}. Add a
            student who must retake this subject even though it no longer matches their current
            semester/year.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {message && (
            <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-700">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Roll number (e.g. 24IT093)"
              className="flex-1 border border-outline-variant rounded-md px-3 py-2 text-sm"
              aria-label="Backlog student roll number"
            />
            <button
              type="submit"
              disabled={busy || !rollNumber.trim()}
              className="bg-primary text-white rounded px-4 py-2 text-sm hover:bg-primary-container disabled:opacity-50"
            >
              Add backlog student
            </button>
          </form>
          <div>
            <h4 className="text-sm font-medium text-on-surface mb-2">
              Registered students ({enrollments.length})
            </h4>
            {enrollments.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No students registered yet.</p>
            ) : (
              <ul className="divide-y divide-outline-variant border border-outline-variant rounded-md max-h-64 overflow-y-auto">
                {enrollments.map((row) => (
                  <li key={row.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      {row.student.rollNumber} — {row.student.name}
                      {row.student.semester !== enrollmentScope.semester && (
                        <span className="ml-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          backlog · sem {row.student.semester}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(row.studentId)}
                      disabled={busy}
                      className="text-red-600 hover:underline text-xs disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-outline-variant flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-on-surface-variant hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default BacklogStudentForm
