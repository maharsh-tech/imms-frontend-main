import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
import { COORDINATOR_TABS, TEACHER_TABS } from '../../components/staff/staff-nav'
import apiClient from '../../api/client'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { MarksGridRow, MARKS_GRID_COLUMNS, type MarksGridRowState } from './MarksGridRow'
import { apiErrorMessage } from '../../utils/api-errors'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAssignmentsInvalidator } from '../../hooks/useAssignments'

type RowState = MarksGridRowState

type NeFilter = 'all' | 'ne' | 'ab'

const MarksGridPage = () => {
  usePageTitle('Marks Grid')
  const { assignmentId, assessmentId } = useParams<{ assignmentId: string; assessmentId: string }>()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isCoordinator = user?.role === 'COORDINATOR'
  const isTeacher = user?.role === 'TEACHER'
  const invalidateAssignments = useAssignmentsInvalidator()

  // Sidebar navigation — quick jump back to the portal's dashboard sections.
  const staffTabs = isCoordinator ? COORDINATOR_TABS : TEACHER_TABS
  const handleTabChange = (id: string) => {
    if (isCoordinator) {
      navigate(`/coordinator?tab=${encodeURIComponent(id)}`)
    } else {
      navigate('/teacher')
    }
  }

  const [grid, setGrid] = useState<MarksGrid | null>(null)
  const [rows, setRows] = useState<RowState[]>([])
  const [search, setSearch] = useState('')
  const [neFilter, setNeFilter] = useState<NeFilter>('all')
  const [hasDirtyChanges, setHasDirtyChanges] = useState(false)
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
      setHasDirtyChanges(false)
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
        if (neFilter === 'ab' && !row.isAb) return false
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
      invalidateAssignments()
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
      invalidateAssignments()
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
      invalidateAssignments()
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
      invalidateAssignments()
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
      invalidateAssignments()
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
    const ExcelJS = (await import('exceljs')).default
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

  const handleDownloadPdf = async () => {
    if (!grid) return
    const [jsPDFMod, autoTableMod] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])
    const jsPDF = jsPDFMod.default
    const autoTable = autoTableMod.default
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

  const updateRow = useCallback((studentId: string, patch: Partial<RowState>) => {
    setHasDirtyChanges(true)
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)),
    )
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 8,
  })

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
        tabs={staffTabs}
        onTabChange={handleTabChange}
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
        tabs={staffTabs}
        onTabChange={handleTabChange}
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
      tabs={staffTabs}
      onTabChange={handleTabChange}
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
        {grid.assignment.startRollNumber && grid.assignment.endRollNumber && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            Grading Range: {grid.assignment.startRollNumber} - {grid.assignment.endRollNumber}
          </span>
        )}
      </p>

        {isCoordinator && isDraft && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-amber-900">Set NE for this CIE exam</h2>
            <p className="text-sm text-amber-800 mt-1">
              Tick NE for students not eligible for <strong>{grid.assessment.name}</strong> only.
              No Excel re-upload needed — do this once per CIE exam. Then click{' '}
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
            Tick <strong>AB</strong> for absent students (works for NE students too — they will show{' '}
            <strong>AB+NE</strong> after save). Click <strong>Save Changes</strong> before submitting.
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
          <div className="flex overflow-hidden rounded-lg border border-outline-variant" role="group" aria-label="Filter by status">
            {([
              ['all', `All (${rows.length})`],
              ['ne', `NE (${summary.ne})`],
              ['ab', `AB (${summary.ab})`],
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
          <div ref={scrollRef} className="max-h-[min(60vh,640px)] overflow-y-auto">
            <div role="table" className="min-w-full">
              <div
                role="row"
                className="sticky top-0 z-10 grid border-b border-surface-variant bg-surface-container-low"
                style={{ gridTemplateColumns: MARKS_GRID_COLUMNS }}
              >
                <div role="columnheader" className="px-4 py-3 text-left text-label-sm uppercase text-on-surface-variant">
                  Sr
                </div>
                <div role="columnheader" className="px-4 py-3 text-left text-label-sm uppercase text-on-surface-variant">
                  Student ID
                </div>
                <div role="columnheader" className="px-4 py-3 text-left text-label-sm uppercase text-on-surface-variant">
                  Name
                </div>
                <div role="columnheader" className="px-4 py-3 text-left text-label-sm uppercase text-on-surface-variant">
                  Enter Marks
                </div>
              </div>
              <div
                role="rowgroup"
                className="relative"
                style={{ height: filteredRows.length > 0 ? `${rowVirtualizer.getTotalSize()}px` : undefined }}
              >
                {filteredRows.length === 0 ? (
                  <div
                    role="row"
                    className="grid"
                    style={{ gridTemplateColumns: MARKS_GRID_COLUMNS }}
                  >
                    <div role="cell" className="col-span-4 px-4 py-6 text-center text-sm text-on-surface-variant">
                      {rows.length === 0
                        ? grid?.assignment.subjectType === 'ELECTIVE'
                          ? 'No students enrolled in this elective — coordinator must import the roster in Subjects first.'
                          : 'No students in this semester/department — import students first (Students tab).'
                        : 'No students match your search'}
                    </div>
                  </div>
                ) : (
                  rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = filteredRows[virtualRow.index]
                    if (!item) return null
                    const { row } = item
                    return (
                      <MarksGridRow
                        key={row.studentId}
                        row={row}
                        displayIndex={virtualRow.index}
                        isDraft={isDraft}
                        isCoordinator={isCoordinator}
                        isTeacher={isTeacher}
                        maxMarks={maxMarks}
                        onUpdateRow={(patch) => updateRow(row.studentId, patch)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </div>
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
                  disabled={saving || !hasDirtyChanges}
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
