import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import {
  getMarksGrid,
  saveMarksBulk,
  flagNe,
  submitMarks,
  lockMarks,
  unlockMarks,
  publishMarks,
  unpublishMarks,
} from '../../api/marks'
import type { MarksGrid } from '../../api/marks'
import { FlagType } from '../../types'
import SubmissionStatusBadge from '../../components/shared/SubmissionStatusBadge'
import { StaffShell } from '../../components/staff'
import apiClient from '../../api/client'

type RowState = {
  studentId: string
  rollNumber: string
  name: string
  marksObtained: string
  isAb: boolean
  isNe: boolean
}

const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
    if (Array.isArray(message)) return message[0] ?? fallback
    if (message) return message
  }
  return err instanceof Error ? err.message : fallback
}

type NeFilter = 'all' | 'ne' | 'not-ne'

const MarksGridPage = () => {
  const { assignmentId, assessmentId } = useParams<{ assignmentId: string; assessmentId: string }>()
  const { user, logout } = useAuthStore()
  const isCoordinator = user?.role === 'COORDINATOR'
  const isTeacher = user?.role === 'TEACHER'

  const [grid, setGrid] = useState<MarksGrid | null>(null)
  const [rows, setRows] = useState<RowState[]>([])
  const [search, setSearch] = useState('')
  const [neFilter, setNeFilter] = useState<NeFilter>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    if (!assignmentId || !assessmentId) return
    setLoading(true)
    try {
      const data = await getMarksGrid(assignmentId, assessmentId)
      setGrid(data)
      setRows(
        data.students.map((s) => ({
          studentId: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          marksObtained: s.mark?.marksObtained != null ? String(s.mark.marksObtained) : '',
          isAb: s.mark?.flag === FlagType.AB,
          isNe: s.mark?.flag === FlagType.NE,
        })),
      )
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load marks grid'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [assignmentId, assessmentId])

  const status = grid?.submission.status ?? 'DRAFT'
  const isDraft = status === 'DRAFT'
  const isSubmitted = status === 'SUBMITTED'
  const isPublished = status === 'PUBLISHED'
  const isLocked = isSubmitted || isPublished
  const maxMarks = grid?.assessment.maxMarks ?? 0

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (neFilter === 'ne' && !row.isNe) return false
        if (neFilter === 'not-ne' && row.isNe) return false
        if (!q) return true
        return row.rollNumber.toLowerCase().includes(q) || row.name.toLowerCase().includes(q)
      })
  }, [rows, search, neFilter])

  const summary = useMemo(() => {
    let entered = 0
    let ab = 0
    let ne = 0
    let blank = 0
    for (const row of rows) {
      if (row.isNe) ne++
      else if (row.isAb) ab++
      else if (row.marksObtained !== '') entered++
      else blank++
    }
    return { entered, ab, ne, blank }
  }, [rows])

  const handleSaveMarks = async () => {
    if (!assignmentId || !assessmentId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await saveMarksBulk({
        subjectAssignmentId: assignmentId,
        assessmentId,
        marks: rows.map((r) => ({
          studentId: r.studentId,
          marksObtained: r.isAb ? null : r.marksObtained === '' ? null : Number(r.marksObtained),
          flag: r.isAb ? FlagType.AB : FlagType.NONE,
        })),
      })
      setMessage('Marks saved')
      load()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNe = async () => {
    if (!assignmentId || !assessmentId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await flagNe({
        subjectAssignmentId: assignmentId,
        assessmentId,
        neStudentIds: rows.filter((r) => r.isNe).map((r) => r.studentId),
      })
      setMessage('NE flags saved')
      load()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to save NE flags'))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!assignmentId || !assessmentId || !confirm('Submit marks to coordinator? You cannot edit after this.')) return
    setError('')
    setMessage('')
    try {
      await submitMarks(assignmentId, assessmentId)
      setMessage('Submitted')
      load()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Submit failed'))
    }
  }

  const handleLock = async () => {
    if (
      !assignmentId ||
      !assessmentId ||
      !confirm('Lock marks? The teacher will not be able to edit until you unlock.')
    ) {
      return
    }
    setError('')
    setMessage('')
    try {
      await lockMarks(assignmentId, assessmentId)
      setMessage('Marks locked')
      load()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Lock failed'))
    }
  }

  const handleUnlock = async () => {
    if (!assignmentId || !assessmentId || !confirm('Unlock marks for teacher editing?')) return
    setError('')
    setMessage('')
    try {
      await unlockMarks(assignmentId, assessmentId)
      setMessage('Unlocked')
      load()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Unlock failed'))
    }
  }

  const handlePublish = async () => {
    if (
      !assignmentId ||
      !assessmentId ||
      !confirm('Publish results? Students will be able to see marks.')
    ) {
      return
    }
    setError('')
    setMessage('')
    try {
      await publishMarks(assignmentId, assessmentId)
      setMessage('Published — students can now see results')
      load()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Publish failed'))
    }
  }

  const handleUnpublish = async () => {
    if (
      !assignmentId ||
      !assessmentId ||
      !confirm('Unpublish results? Students will no longer see these marks.')
    ) {
      return
    }
    setError('')
    setMessage('')
    try {
      await unpublishMarks(assignmentId, assessmentId)
      setMessage('Unpublished — hidden from students')
      load()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Unpublish failed'))
    }
  }

  const updateRow = (index: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      logout()
    }
  }

  if (loading) {
    return (
      <StaffShell
        title={isCoordinator ? 'Coordinator Portal' : 'Teacher Portal'}
        userLabel={user?.name || user?.email}
        onLogout={handleLogout}
        wide
      >
        <p className="py-12 text-center text-body-md text-on-surface-variant">Loading...</p>
      </StaffShell>
    )
  }

  if (!grid) {
    return (
      <StaffShell
        title={isCoordinator ? 'Coordinator Portal' : 'Teacher Portal'}
        userLabel={user?.name || user?.email}
        onLogout={handleLogout}
        wide
      >
        <p className="py-12 text-center text-body-md text-error">{error || 'Not found'}</p>
      </StaffShell>
    )
  }

  const backLink = isCoordinator ? '/coordinator' : '/teacher'

  return (
    <StaffShell
      title={isCoordinator ? 'Coordinator Portal' : 'Teacher Portal'}
      userLabel={user?.name || user?.email}
      onLogout={handleLogout}
      wide
    >
      <Link to={backLink} className="text-label-md text-primary hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-headline-lg-mobile font-semibold text-primary lg:text-headline-lg">
        {grid.assignment.subject.code} — {grid.assessment.name}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-body-md text-on-surface-variant">
        <span>
          {grid.assignment.faculty.name} · Max {maxMarks} marks
        </span>
        <SubmissionStatusBadge status={status} />
      </p>

        {isCoordinator && isDraft && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-amber-900">Set NE for this exam</h2>
            <p className="text-sm text-amber-800 mt-1">
              Tick NE for students not eligible for <strong>{grid.assessment.name}</strong> only.
              No Excel re-upload needed — do this once per internal/exam. Then click{' '}
              <strong>Save NE Flags</strong>.
            </p>
          </div>
        )}

        {isCoordinator && isLocked && !isPublished && (
          <div
            className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded text-sm"
            role="status"
          >
            Marks are locked — teacher cannot edit. Unlock to allow changes, or publish when ready.
          </div>
        )}

        {isTeacher && isLocked && !isPublished && (
          <div
            className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded text-sm"
            role="status"
          >
            Marks are locked by the coordinator — view only
          </div>
        )}

        {isTeacher && isDraft && (
          <div className="mt-4 bg-primary-fixed/30 border border-primary-fixed rounded-lg p-3 text-sm text-primary">
            Students marked <strong>NE</strong> by the coordinator are flagged but you can still enter marks.
            After publish, NE students see <strong>NE</strong> by default. Enable{' '}
            <strong>Show Marks to NE Students</strong> on the Assignments page to reveal their entered
            marks instead.
          </div>
        )}

        {isPublished && isCoordinator && (
          <div className="mt-4 bg-primary-fixed/30 border border-primary-fixed text-primary p-3 rounded text-sm">
            Results are published. Students can view their marksheet.
          </div>
        )}

        {message && <div className="mt-4 bg-green-50 text-green-700 p-3 rounded text-sm">{message}</div>}
        {error && <div className="mt-4 bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by roll number or name…"
            className="imms-input max-w-sm text-sm"
            aria-label="Search students"
          />
          <div className="flex overflow-hidden rounded-lg border border-outline-variant" role="group" aria-label="Filter by NE status">
            {([
              ['all', `All (${rows.length})`],
              ['ne', `NE (${summary.ne})`],
              ['not-ne', `Not NE (${rows.length - summary.ne})`],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setNeFilter(value)}
                className={`px-3 py-2 text-label-sm font-medium transition-colors ${
                  neFilter === value
                    ? value === 'ne'
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="imms-card mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-variant">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-4 py-3 text-left text-label-sm uppercase text-on-surface-variant">Sr</th>
                <th className="px-4 py-3 text-left text-label-sm uppercase text-on-surface-variant">Student ID</th>
                <th className="px-4 py-3 text-left text-label-sm uppercase text-on-surface-variant">Name</th>
                <th className="px-4 py-3 text-left text-label-sm uppercase text-on-surface-variant">Enter Marks</th>
                {isCoordinator && <th className="px-4 py-3 text-center text-label-sm uppercase text-on-surface-variant">NE</th>}
                {isTeacher && <th className="px-4 py-3 text-center text-label-sm uppercase text-on-surface-variant">NE</th>}
                {isTeacher && <th className="px-4 py-3 text-center text-label-sm uppercase text-on-surface-variant">AB</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-on-surface-variant">
                    {rows.length === 0
                      ? grid?.assignment.subjectType === 'ELECTIVE'
                        ? 'No students enrolled in this elective — coordinator must import the roster in Subjects first.'
                        : 'No students in this semester/department — import students first (Students tab).'
                      : 'No students match your search'}
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ row, index }, displayIndex) => (
                  <tr key={row.studentId} className={row.isNe ? 'bg-amber-50' : ''}>
                    <td className="px-4 py-2 text-sm">{displayIndex + 1}</td>
                    <td className="px-4 py-2 text-sm font-mono">{row.rollNumber}</td>
                    <td className="px-4 py-2 text-sm">
                      {row.name}
                    </td>
                    <td className="px-4 py-2">
                      {isTeacher && isDraft ? (
                        <input
                          type="number"
                          value={row.isAb ? '' : row.marksObtained}
                          disabled={row.isAb}
                          onChange={(e) => updateRow(index, { marksObtained: e.target.value })}
                          className="imms-input w-20 py-1 text-sm"
                          aria-label={`Marks for ${row.name}`}
                        />
                      ) : (
                        <span className="text-sm">
                          {row.isAb ? 'AB' : row.marksObtained || (row.isNe ? '—' : '—')}
                          {row.isNe && row.marksObtained && isCoordinator && (
                            <span className="text-on-surface-variant text-xs ml-1">(NE flagged)</span>
                          )}
                        </span>
                      )}
                    </td>
                    {isCoordinator && (
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.isNe}
                          disabled={!isDraft}
                          onChange={(e) => updateRow(index, { isNe: e.target.checked })}
                          aria-label={`NE ${row.name}`}
                        />
                      </td>
                    )}
                    {isTeacher && (
                      <td className="px-4 py-2 text-center">
                        {row.isNe ? (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            NE
                          </span>
                        ) : (
                          <span className="text-xs text-outline">—</span>
                        )}
                      </td>
                    )}
                    {isTeacher && (
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.isAb}
                          disabled={!isDraft || row.isNe}
                          onChange={(e) =>
                            updateRow(index, {
                              isAb: e.target.checked,
                              marksObtained: e.target.checked ? '' : row.marksObtained,
                            })
                          }
                          aria-label={`AB ${row.name}`}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-sm text-on-surface-variant">
          {summary.entered} entered · {summary.ab} AB · {summary.ne} NE · {summary.blank} blank
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {isCoordinator && isDraft && (
            <>
              <button
                onClick={handleSaveNe}
                disabled={saving}
                className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50"
              >
                Save NE Flags
              </button>
              <button
                onClick={handleLock}
                disabled={saving}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Lock Marks
              </button>
            </>
          )}
          {isTeacher && isDraft && (
            <>
              <button
                onClick={handleSaveMarks}
                disabled={saving}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-container disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Submit to Coordinator
              </button>
            </>
          )}
          {isCoordinator && isSubmitted && (
            <>
              <button
                onClick={handleUnlock}
                disabled={saving}
                className="bg-secondary text-on-secondary rounded-lg px-4 py-2 text-label-md font-semibold hover:opacity-90 disabled:opacity-50"
              >
                Unlock for Teacher
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Publish Results
              </button>
            </>
          )}
          {isCoordinator && isPublished && (
            <button
              onClick={handleUnpublish}
              disabled={saving}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Unpublish Results
            </button>
          )}
        </div>
    </StaffShell>
  )
}

export default MarksGridPage
