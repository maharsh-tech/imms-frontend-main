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
 * Sequence: Year → Subject → Semester → Exam → Excel.
 */
const MarksEntry = () => {
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear)
  const [subjectId, setSubjectId] = useState('')
  const [semester, setSemester] = useState('')
  const [cieRoundName, setCieRoundName] = useState('')
  const [subjectSearch, setSubjectSearch] = useState('')

  const { data, isLoading, isFetching } = useAssignmentsBundle()
  const offerings = data?.offerings ?? []
  const loading = isLoading || isFetching

  const yearOptions = useMemo(() => {
    const years = new Set(offerings.map((o) => o.academicYear))
    const current = academicYear.trim()
    if (current) years.add(current)
    return [...years].sort((a, b) => b.localeCompare(a))
  }, [offerings, academicYear])

  const yearOfferings = useMemo(
    () => offerings.filter((o) => o.academicYear === academicYear.trim()),
    [offerings, academicYear],
  )

  const subjectOptions = useMemo(() => {
    if (!academicYear.trim()) return []
    const byId = new Map<string, { id: string; code: string; name: string }>()
    for (const offering of yearOfferings) {
      byId.set(offering.subject.id, {
        id: offering.subject.id,
        code: offering.subject.code,
        name: offering.subject.name,
      })
    }
    return [...byId.values()].sort((a, b) => a.code.localeCompare(b.code))
  }, [yearOfferings, academicYear])

  const filteredSubjectOptions = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase()
    if (!q) return subjectOptions
    return subjectOptions.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q),
    )
  }, [subjectOptions, subjectSearch])

  const semesterOptions = useMemo(() => {
    if (!subjectId) return []
    const semesters = new Set<number>()
    for (const offering of yearOfferings) {
      if (offering.subject.id === subjectId) semesters.add(offering.semester)
    }
    return [...semesters].sort((a, b) => a - b)
  }, [yearOfferings, subjectId])

  const examOptions = useMemo(() => {
    if (!subjectId || !semester) return []
    const offering = yearOfferings.find(
      (o) => o.subject.id === subjectId && o.semester === Number(semester),
    )
    if (!offering) return []
    const names = (offering.subject.assessments ?? [])
      .map((a) => a.name)
      .filter(Boolean)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b))
  }, [yearOfferings, subjectId, semester])

  const canUpload =
    Boolean(academicYear.trim()) &&
    Boolean(subjectId) &&
    Boolean(semester) &&
    Boolean(cieRoundName)

  const scopeParams = {
    subjectId,
    academicYear: academicYear.trim(),
    semester: Number(semester),
    cieRoundName,
  }

  const handleYearChange = (value: string) => {
    setAcademicYear(value)
    setSubjectId('')
    setSemester('')
    setCieRoundName('')
    setSubjectSearch('')
  }

  const handleSubjectChange = (value: string) => {
    setSubjectId(value)
    setSemester('')
    setCieRoundName('')
  }

  const handleSemesterChange = (value: string) => {
    setSemester(value)
    setCieRoundName('')
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
        errors: [{ row: 0, reason: 'Select Year, Subject, Semester, and Exam first' }],
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
            1. Academic year
          </span>
          <select
            value={academicYear}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={loading || yearOptions.length === 0}
            className={selectClass}
            aria-label="Select academic year"
          >
            <option value="">
              {loading ? 'Loading…' : yearOptions.length === 0 ? 'No years' : 'Select year'}
            </option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
            2. Subject
          </span>
          <input
            type="search"
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            disabled={!academicYear || subjectOptions.length === 0}
            placeholder="Search by code or name…"
            className={`${selectClass} mb-2`}
            aria-label="Search subjects"
          />
          <select
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            disabled={!academicYear || filteredSubjectOptions.length === 0}
            className={selectClass}
            aria-label="Select subject"
          >
            <option value="">
              {!academicYear
                ? 'Select year first'
                : filteredSubjectOptions.length === 0
                  ? subjectSearch.trim()
                    ? 'No subjects match search'
                    : 'No subjects for year'
                  : 'Select subject'}
            </option>
            {filteredSubjectOptions.map((s) => (
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
            onChange={(e) => handleSemesterChange(e.target.value)}
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

        <label className="block lg:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
            4. Exam
          </span>
          <select
            value={cieRoundName}
            onChange={(e) => setCieRoundName(e.target.value)}
            disabled={!semester || examOptions.length === 0}
            className={selectClass}
            aria-label="Select exam"
          >
            <option value="">
              {!semester
                ? 'Select semester first'
                : examOptions.length === 0
                  ? 'No exams for this offering'
                  : 'Select exam'}
            </option>
            {examOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {canUpload ? (
        <ExcelImportCard
          title="5. Excel upload"
          description="Columns: Student ID and Marks. Use AB for absent. Download the template for this year/subject/semester/exam, fill marks, then upload."
          onDownloadTemplate={handleDownloadTemplate}
          onImport={handleImport}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">
          Select Year, Subject, Semester, and Exam to enable Excel upload.
        </div>
      )}
    </div>
  )
}

export default MarksEntry
