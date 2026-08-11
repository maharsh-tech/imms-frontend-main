import { useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import ExcelImportCard from '../../components/shared/ExcelImportCard'
import { downloadMarksTemplate, importMarks } from '../../api/marks'
import { useAssignmentsBundle } from '../../hooks/useAssignments'
import type { ImportResult } from '../../types'

const defaultAcademicYear = () => {
  const y = new Date().getFullYear()
  const m = new Date().getMonth()
  return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

/**
 * Coordinator Marks Entry — Excel upload that bypasses teachers.
 * Sequence: Exam → Subject → Semester → Excel.
 */
const MarksEntry = () => {
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear)
  const [cieRoundName, setCieRoundName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [semester, setSemester] = useState('')

  const { data, isLoading, isFetching } = useAssignmentsBundle()
  const offerings = data?.offerings ?? []
  const loading = isLoading || isFetching

  const yearOfferings = useMemo(
    () =>
      offerings.filter(
        (o) => o.academicYear === academicYear.trim(),
      ),
    [offerings, academicYear],
  )

  const examOptions = useMemo(() => {
    const names = new Set<string>()
    for (const offering of yearOfferings) {
      for (const assessment of offering.subject.assessments ?? []) {
        if (assessment.name) names.add(assessment.name)
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [yearOfferings])

  const subjectOptions = useMemo(() => {
    if (!cieRoundName) return []
    const exam = cieRoundName.trim().toUpperCase()
    const byId = new Map<string, { id: string; code: string; name: string }>()
    for (const offering of yearOfferings) {
      const hasExam = (offering.subject.assessments ?? []).some(
        (a) => a.name.trim().toUpperCase() === exam,
      )
      if (!hasExam) continue
      byId.set(offering.subject.id, {
        id: offering.subject.id,
        code: offering.subject.code,
        name: offering.subject.name,
      })
    }
    return [...byId.values()].sort((a, b) => a.code.localeCompare(b.code))
  }, [yearOfferings, cieRoundName])

  const semesterOptions = useMemo(() => {
    if (!cieRoundName || !subjectId) return []
    const exam = cieRoundName.trim().toUpperCase()
    const semesters = new Set<number>()
    for (const offering of yearOfferings) {
      if (offering.subject.id !== subjectId) continue
      const hasExam = (offering.subject.assessments ?? []).some(
        (a) => a.name.trim().toUpperCase() === exam,
      )
      if (hasExam) semesters.add(offering.semester)
    }
    return [...semesters].sort((a, b) => a - b)
  }, [yearOfferings, cieRoundName, subjectId])

  const canUpload =
    Boolean(cieRoundName) &&
    Boolean(subjectId) &&
    Boolean(semester) &&
    Boolean(academicYear.trim())

  const scopeParams = {
    subjectId,
    academicYear: academicYear.trim(),
    semester: Number(semester),
    cieRoundName,
  }

  const handleExamChange = (value: string) => {
    setCieRoundName(value)
    setSubjectId('')
    setSemester('')
  }

  const handleSubjectChange = (value: string) => {
    setSubjectId(value)
    setSemester('')
  }

  const handleDownloadTemplate = async () => {
    if (!canUpload) return
    await downloadMarksTemplate(scopeParams)
  }

  const handleImport = async (file: File): Promise<ImportResult> => {
    if (!canUpload) {
      return {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [{ row: 0, reason: 'Select Exam, Subject, and Semester first' }],
      }
    }
    return importMarks(file, scopeParams)
  }

  const selectClass =
    'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
          Marks Entry
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Upload subject marks from Excel when teachers have not entered them on the website.
          This updates marks directly (bypasses teachers). NE flags stay in Exam & Assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
            Academic year
          </span>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value)
              setCieRoundName('')
              setSubjectId('')
              setSemester('')
            }}
            placeholder="2025-2026"
            className={selectClass}
            aria-label="Academic year"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
            1. Exam
          </span>
          <select
            value={cieRoundName}
            onChange={(e) => handleExamChange(e.target.value)}
            disabled={loading || examOptions.length === 0}
            className={selectClass}
            aria-label="Select exam"
          >
            <option value="">
              {loading ? 'Loading…' : examOptions.length === 0 ? 'No exams for year' : 'Select exam'}
            </option>
            {examOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
            2. Subject
          </span>
          <select
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            disabled={!cieRoundName || subjectOptions.length === 0}
            className={selectClass}
            aria-label="Select subject"
          >
            <option value="">
              {!cieRoundName
                ? 'Select exam first'
                : subjectOptions.length === 0
                  ? 'No subjects for exam'
                  : 'Select subject'}
            </option>
            {subjectOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
            3. Semester
          </span>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            disabled={!subjectId || semesterOptions.length === 0}
            className={selectClass}
            aria-label="Select semester"
          >
            <option value="">
              {!subjectId
                ? 'Select subject first'
                : semesterOptions.length === 0
                  ? 'No semester offering'
                  : 'Select semester'}
            </option>
            {semesterOptions.map((sem) => (
              <option key={sem} value={String(sem)}>
                Semester {sem}
              </option>
            ))}
          </select>
        </label>
      </div>

      {canUpload ? (
        <ExcelImportCard
          title="4. Excel upload"
          description="Columns: Student ID, Name (optional), Marks Obtained. Use AB for absent. Download the template for this exam/subject/semester, fill marks, then upload."
          onDownloadTemplate={handleDownloadTemplate}
          onImport={handleImport}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">
          Select Exam, Subject, and Semester to enable Excel upload.
        </div>
      )}
    </div>
  )
}

export default MarksEntry
