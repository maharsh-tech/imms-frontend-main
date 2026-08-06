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
import { FileText, FileSpreadsheet } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

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
          isAb: s.mark?.flag === FlagType.AB || s.mark?.flag === FlagType.AB_NE,
          isNe: s.mark?.flag === FlagType.NE || s.mark?.flag === FlagType.AB_NE,
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

  const handleSaveAll = async () => {
    if (!assignmentId || !assessmentId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (isCoordinator) {
        await Promise.all([
          saveMarksBulk({
            subjectAssignmentId: assignmentId,
            assessmentId,
            marks: rows.map((r) => ({
              studentId: r.studentId,
              marksObtained: r.isAb ? null : r.marksObtained === '' ? null : Number(r.marksObtained),
              flag: r.isAb ? FlagType.AB : FlagType.NONE,
            })),
          }),
          flagNe({
            subjectAssignmentId: assignmentId,
            assessmentId,
            neStudentIds: rows.filter((r) => r.isNe).map((r) => r.studentId),
          })
        ])
      } else {
        await saveMarksBulk({
          subjectAssignmentId: assignmentId,
          assessmentId,
          marks: rows.map((r) => ({
            studentId: r.studentId,
            marksObtained: r.isAb ? null : r.marksObtained === '' ? null : Number(r.marksObtained),
            flag: r.isAb ? FlagType.AB : FlagType.NONE,
          })),
        })
      }
      showToast('All changes saved successfully!', 'success')
      load()
    } catch (err: unknown) {
      const errMsg = apiErrorMessage(err, 'Save failed')
      setError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (summary.blank > 0) {
      setError('Cannot submit: all students must be graded, marked absent (AB), or marked not eligible (NE).')
      return
    }
    if (!assignmentId || !assessmentId || !confirm('Submit marks to coordinator? You cannot edit after this.')) return
    setError('')
    setMessage('')
    setSaving(true)
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
      await submitMarks(assignmentId, assessmentId)
      showToast('Marks submitted successfully!', 'success')
      load()
    } catch (err: unknown) {
      const errMsg = apiErrorMessage(err, 'Submit failed')
      setError(errMsg)
      showToast(errMsg, 'error')
    } finally {
      setSaving(false)
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
      showToast('Marks locked successfully!', 'success')
      load()
    } catch (err: unknown) {
      const errMsg = apiErrorMessage(err, 'Lock failed')
      setError(errMsg)
      showToast(errMsg, 'error')
    }
  }

  const handleUnlock = async () => {
    if (!assignmentId || !assessmentId || !confirm('Unlock marks for teacher editing?')) return
    setError('')
    setMessage('')
    try {
      await unlockMarks(assignmentId, assessmentId)
      showToast('Marks unlocked successfully!', 'success')
      load()
    } catch (err: unknown) {
      const errMsg = apiErrorMessage(err, 'Unlock failed')
      setError(errMsg)
      showToast(errMsg, 'error')
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
      showToast('Results published successfully!', 'success')
      load()
    } catch (err: unknown) {
      const errMsg = apiErrorMessage(err, 'Publish failed')
      setError(errMsg)
      showToast(errMsg, 'error')
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
      showToast('Results unpublished successfully!', 'success')
      load()
    } catch (err: unknown) {
      const errMsg = apiErrorMessage(err, 'Unpublish failed')
      setError(errMsg)
      showToast(errMsg, 'error')
    }
  }

  const handleDownloadExcel = async () => {
    if (!grid) return
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Marks')

    worksheet.columns = [
      { header: 'Sr', key: 'sr', width: 8 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Marks Obtained', key: 'marks', width: 18 }
    ]

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A365D' }
      }
      cell.alignment = { vertical: 'middle', horizontal: 'left' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    headerRow.height = 25

    rows.forEach((row, index) => {
      let markText: string | number = row.marksObtained === '' ? '—' : Number(row.marksObtained)
      if (row.isNe && row.isAb) {
        markText = 'AB+NE'
      } else if (row.isNe) {
        markText = 'NE'
      } else if (row.isAb) {
        markText = 'AB'
      }

      const addedRow = worksheet.addRow({
        sr: index + 1,
        studentId: row.rollNumber,
        name: row.name,
        marks: markText
      })

      const markCell = addedRow.getCell('marks')
      if (row.isNe && row.isAb) {
        markCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3E8FF' } // soft purple
        }
        markCell.font = { bold: true, color: { argb: 'FF6B21A8' } } // dark purple
        markCell.alignment = { horizontal: 'center' }
      } else if (row.isNe) {
        markCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1ECF1' } // soft blue
        }
        markCell.font = { bold: true, color: { argb: 'FF0C5460' } } // dark blue
        markCell.alignment = { horizontal: 'center' }
      } else if (row.isAb) {
        markCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' } // soft red
        }
        markCell.font = { bold: true, color: { argb: 'FF991B1B' } } // dark red
        markCell.alignment = { horizontal: 'center' }
      } else {
        markCell.alignment = { horizontal: 'left' }
      }

      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        }
        if (cell.value !== markText) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        }
      })
      addedRow.height = 20
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${grid.assignment.subject.code}_${grid.assessment.name}_marks.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = () => {
    if (!grid) return
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setTextColor(26, 54, 93)
    doc.text(`${grid.assignment.subject.code} — ${grid.assessment.name}`, 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(74, 85, 104)
    doc.text(`Faculty: ${grid.assignment.faculty.name}`, 14, 28)
    doc.text(`Max Marks: ${grid.assessment.maxMarks}  |  Semester: ${grid.assignment.semester}`, 14, 34)

    autoTable(doc, {
      startY: 40,
      head: [['Sr', 'Student ID', 'Name', 'Marks Obtained']],
      body: rows.map((r, i) => [
        String(i + 1),
        r.rollNumber,
        r.name,
        r.isNe && r.isAb ? 'AB+NE' : r.isNe ? 'NE' : r.isAb ? 'AB' : r.marksObtained || '—'
      ]),
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = data.cell.text[0]
          if (val === 'AB+NE') {
            data.cell.styles.fillColor = [243, 232, 255] // soft purple
            data.cell.styles.textColor = [107, 33, 168] // dark purple
            data.cell.styles.fontStyle = 'bold'
          } else if (val === 'NE') {
            data.cell.styles.fillColor = [209, 236, 241] // soft blue
            data.cell.styles.textColor = [12, 84, 96] // dark blue
            data.cell.styles.fontStyle = 'bold'
          } else if (val === 'AB') {
            data.cell.styles.fillColor = [254, 226, 226] // soft red
            data.cell.styles.textColor = [153, 27, 27] // dark red
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
      headStyles: {
        fillColor: [26, 54, 93],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      theme: 'striped',
    })

    const filename = `${grid.assignment.subject.code}_${grid.assessment.name}_marks.pdf`
    doc.save(filename)
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
      <div className="md:pr-52 pb-20 md:pb-0 relative">
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
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
          {isCoordinator && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <FileText size={16} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={16} />
                <span>Download Excel</span>
              </button>
            </div>
          )}
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
                {(isTeacher || isCoordinator) && <th className="px-4 py-3 text-center text-label-sm uppercase text-on-surface-variant">AB</th>}
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
                      {(isTeacher || isCoordinator) && isDraft ? (
                        <input
                          type="number"
                          min={0}
                          max={maxMarks}
                          value={row.isAb ? '' : row.marksObtained}
                          disabled={row.isAb}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val !== '' && Number(val) < 0) return
                            updateRow(index, { marksObtained: val })
                          }}
                          className="imms-input w-20 py-1 text-sm"
                          aria-label={`Marks for ${row.name}`}
                        />
                      ) : (
                        <span className="text-sm">
                          {row.isNe && row.isAb ? 'AB+NE' : row.isAb ? 'AB' : row.marksObtained || (row.isNe ? '—' : '—')}
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
                    {(isTeacher || isCoordinator) && (
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.isAb}
                          disabled={!isDraft || (isTeacher && row.isNe)}
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

        </div> {/* closing wrapper */}
        
        {/* Floating Actions Panel */}
        {(isDraft || isSubmitted || isPublished) && (
          <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around gap-2 p-3 bg-surface-container-low border-t border-outline-variant shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:-translate-y-1/2 md:w-44 md:flex-col md:border md:rounded-xl md:shadow-xl md:p-4 md:bg-surface-container-lowest">
            <p className="hidden md:block text-xs font-semibold text-on-surface-variant text-center border-b border-outline-variant pb-2 mb-1 w-full">
              Actions
            </p>
            
            {isDraft && (
              <>
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex-1 md:flex-none md:w-full bg-primary text-on-primary px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer text-center"
                >
                  Save Changes
                </button>
                
                {isCoordinator && (
                  <button
                    onClick={handleLock}
                    disabled={saving}
                    className="flex-1 md:flex-none md:w-full bg-error text-on-error px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer text-center"
                  >
                    Lock Marks
                  </button>
                )}
                
                {isTeacher && (
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 md:flex-none md:w-full bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer text-center"
                  >
                    Submit
                  </button>
                )}
              </>
            )}

            {isCoordinator && isSubmitted && (
              <>
                <button
                  onClick={handleUnlock}
                  disabled={saving}
                  className="flex-1 md:flex-none md:w-full bg-secondary text-on-secondary px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer text-center"
                >
                  Unlock
                </button>
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="flex-1 md:flex-none md:w-full bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer text-center"
                >
                  Publish
                </button>
              </>
            )}

            {isCoordinator && isPublished && (
              <button
                onClick={handleUnpublish}
                disabled={saving}
                className="flex-1 md:flex-none md:w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                Unpublish
              </button>
            )}
          </div>
        )}

        {/* Custom Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-5 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
            }`}
            role="status"
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
    </StaffShell>
  )
}

export default MarksGridPage
