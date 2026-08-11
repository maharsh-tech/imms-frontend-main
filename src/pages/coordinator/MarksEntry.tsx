import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import ExcelImportCard from '../../components/shared/ExcelImportCard'
import { downloadMarksTemplate, importMarks } from '../../api/marks'
import {
  useMarksEntryYears,
  useMarksEntrySubjects,
  useMarksEntrySemesters,
  useMarksEntryExams,
} from '../../hooks/useMarksEntry'
import type { ImportResult } from '../../types'

/**
 * Coordinator Marks Entry — Excel upload that bypasses teachers.
 * Fetches one step at a time: years → subjects → semesters → exams.
 */
const MarksEntry = () => {
  const [academicYear, setAcademicYear] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [semester, setSemester] = useState('')
  const [cieRoundName, setCieRoundName] = useState('')

  const {
    data: yearOptions = [],
    isLoading: yearsLoading,
    isFetching: yearsFetching,
  } = useMarksEntryYears()

  const {
    data: subjectOptions = [],
    isLoading: subjectsLoading,
    isFetching: subjectsFetching,
  } = useMarksEntrySubjects(academicYear)

  const {
    data: semesterOptions = [],
    isLoading: semestersLoading,
    isFetching: semestersFetching,
  } = useMarksEntrySemesters(academicYear, subjectId)

  const {
    data: examOptions = [],
    isLoading: examsLoading,
    isFetching: examsFetching,
  } = useMarksEntryExams(academicYear, subjectId, semester)

  const loadingYears = yearsLoading || yearsFetching
  const loadingSubjects = subjectsLoading || subjectsFetching
  const loadingSemesters = semestersLoading || semestersFetching
  const loadingExams = examsLoading || examsFetching

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
            disabled={loadingYears || yearOptions.length === 0}
            className={selectClass}
            aria-label="Select academic year"
          >
            <option value="">
              {loadingYears
                ? 'Loading…'
                : yearOptions.length === 0
                  ? 'No years in system'
                  : 'Select year'}
            </option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
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
            disabled={!academicYear || loadingSubjects}
            className={selectClass}
            aria-label="Select subject"
          >
            <option value="">
              {!academicYear
                ? 'Select year first'
                : loadingSubjects
                  ? 'Loading…'
                  : subjectOptions.length === 0
                    ? 'No subjects for year'
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
            onChange={(e) => handleSemesterChange(e.target.value)}
            disabled={!subjectId || loadingSemesters}
            className={selectClass}
            aria-label="Select semester"
          >
            <option value="">
              {!subjectId
                ? 'Select subject first'
                : loadingSemesters
                  ? 'Loading…'
                  : semesterOptions.length === 0
                    ? 'No semesters'
                    : 'Select semester'}
            </option>
            {semesterOptions.map((sem) => (
              <option key={sem} value={String(sem)}>
                Semester {sem}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
            4. Exam
          </span>
          <select
            value={cieRoundName}
            onChange={(e) => setCieRoundName(e.target.value)}
            disabled={!semester || loadingExams}
            className={selectClass}
            aria-label="Select exam"
          >
            <option value="">
              {!semester
                ? 'Select semester first'
                : loadingExams
                  ? 'Loading…'
                  : examOptions.length === 0
                    ? 'No exams'
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
          title="Excel upload"
          description="Columns: Student ID and Marks. Use AB for absent. Download the template, fill marks, then upload."
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
