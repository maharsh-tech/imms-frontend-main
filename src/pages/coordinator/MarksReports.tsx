import { useState } from 'react'
import { FileSpreadsheet, Download, Search, Users } from 'lucide-react'
import CIECard from '../../components/student/CIECard'
import {
  useReportsYears,
  useReportsSemesters,
  useReportsBatches,
  useReportsBatchStudents,
  useReportsStudentSearch,
  useCoordinatorMarksheet,
} from '../../hooks/useMarksReports'
import {
  downloadBatchMarksExcel,
  downloadStudentMarksheetExcel,
  type ReportsBatchOption,
  type ReportsStudentRow,
} from '../../api/reports'
import { apiErrorMessage } from '../../utils/api-errors'

type ViewMode = 'batch' | 'student'

const selectClass =
  'w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50'

const MarksReports = () => {
  const [mode, setMode] = useState<ViewMode>('batch')
  const [academicYear, setAcademicYear] = useState('')
  const [semester, setSemester] = useState('')
  const [batchOption, setBatchOption] = useState<ReportsBatchOption | null>(null)
  const [page, setPage] = useState(1)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [exportError, setExportError] = useState('')
  const [exporting, setExporting] = useState(false)

  const { data: yearOptions = [], isLoading: yearsLoading, isFetching: yearsFetching } =
    useReportsYears()
  const { data: semesterOptions = [], isLoading: semLoading, isFetching: semFetching } =
    useReportsSemesters(academicYear)
  const { data: batchOptions = [], isLoading: batchLoading, isFetching: batchFetching } =
    useReportsBatches(academicYear, semester)

  const batchKey = batchOption ? `${batchOption.batch}:${batchOption.department}` : ''
  const {
    data: batchStudentsPage,
    isLoading: studentsLoading,
    isFetching: studentsFetching,
  } = useReportsBatchStudents(
    academicYear,
    semester,
    batchOption?.batch ?? '',
    batchOption?.department ?? '',
    page,
  )

  const { data: searchResults = [], isFetching: searchFetching } =
    useReportsStudentSearch(searchQuery, academicYear, semester)

  const { data: marksheet, isLoading: marksheetLoading, isFetching: marksheetFetching } =
    useCoordinatorMarksheet(selectedStudentId, academicYear, semester)

  const loadingYears = yearsLoading || yearsFetching
  const loadingSemesters = semLoading || semFetching
  const loadingBatches = batchLoading || batchFetching
  const loadingStudents = studentsLoading || studentsFetching
  const loadingMarksheet = marksheetLoading || marksheetFetching

  const scopeReady = Boolean(academicYear.trim()) && Boolean(semester)
  const batchReady = scopeReady && Boolean(batchOption)
  const totalPages = Math.max(
    1,
    Math.ceil((batchStudentsPage?.total ?? 0) / (batchStudentsPage?.limit ?? 50)),
  )

  const handleYearChange = (value: string) => {
    setAcademicYear(value)
    setSemester('')
    setBatchOption(null)
    setPage(1)
    setSelectedStudentId(null)
  }

  const handleSemesterChange = (value: string) => {
    setSemester(value)
    setBatchOption(null)
    setPage(1)
    setSelectedStudentId(null)
  }

  const handleBatchChange = (value: string) => {
    const found = batchOptions.find((b) => `${b.batch}:${b.department}` === value) ?? null
    setBatchOption(found)
    setPage(1)
    setSelectedStudentId(null)
  }

  const handleSelectStudent = (student: ReportsStudentRow) => {
    setSelectedStudentId(student.id)
  }

  const handleBatchExport = async () => {
    if (!batchOption || !scopeReady) return
    setExportError('')
    setExporting(true)
    try {
      await downloadBatchMarksExcel({
        academicYear: academicYear.trim(),
        semester: Number(semester),
        batch: batchOption.batch,
        department: batchOption.department,
      })
    } catch (err) {
      setExportError(apiErrorMessage(err, 'Export failed'))
    } finally {
      setExporting(false)
    }
  }

  const handleStudentExport = async () => {
    if (!selectedStudentId || !marksheet || !scopeReady) return
    setExportError('')
    setExporting(true)
    try {
      await downloadStudentMarksheetExcel(
        selectedStudentId,
        academicYear.trim(),
        Number(semester),
        marksheet.student.rollNumber,
      )
    } catch (err) {
      setExportError(apiErrorMessage(err, 'Export failed'))
    } finally {
      setExporting(false)
    }
  }

  const scopeSelectors = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
          Academic year
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
          Semester
        </span>
        <select
          value={semester}
          onChange={(e) => handleSemesterChange(e.target.value)}
          disabled={!academicYear || loadingSemesters}
          className={selectClass}
          aria-label="Select semester"
        >
          <option value="">
            {!academicYear
              ? 'Select year first'
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

      {mode === 'batch' && (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
            Batch
          </span>
          <select
            value={batchKey}
            onChange={(e) => handleBatchChange(e.target.value)}
            disabled={!semester || loadingBatches}
            className={selectClass}
            aria-label="Select batch"
          >
            <option value="">
              {!semester
                ? 'Select semester first'
                : loadingBatches
                  ? 'Loading…'
                  : batchOptions.length === 0
                    ? 'No published marks for this semester'
                    : 'Select batch'}
            </option>
            {batchOptions.map((b) => (
              <option key={`${b.batch}:${b.department}`} value={`${b.batch}:${b.department}`}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )

  const marksheetPanel = selectedStudentId && (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {marksheet ? (
            <>
              <h3 className="text-title-md font-semibold text-on-surface">
                {marksheet.student.rollNumber} — {marksheet.student.name}
              </h3>
              <p className="text-sm text-on-surface-variant">
                {marksheet.student.batch} · Sem {marksheet.student.semester}
                {!marksheet.student.isActive && (
                  <span className="ml-2 rounded bg-surface-variant px-2 py-0.5 text-xs">
                    Graduated / inactive
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">
              {loadingMarksheet ? 'Loading marksheet…' : 'Select a student'}
            </p>
          )}
        </div>
        {marksheet?.hasPublished && (
          <button
            type="button"
            onClick={handleStudentExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Excel
          </button>
        )}
      </div>

      {loadingMarksheet && (
        <p className="text-sm text-on-surface-variant">Loading marks…</p>
      )}

      {!loadingMarksheet && marksheet && !marksheet.hasPublished && (
        <p className="rounded-lg border border-outline-variant bg-surface-container-low p-6 text-center text-sm text-on-surface-variant">
          No published marks for this student in the selected semester.
        </p>
      )}

      {!loadingMarksheet && marksheet?.hasPublished && (
        <div className="grid gap-4 md:grid-cols-2">
          {marksheet.cieRounds.map((round) => (
            <CIECard
              key={round.name}
              name={round.name}
              sequence={round.sequence}
              subjects={round.subjects.map((s) => ({
                code: s.code,
                name: s.name,
                maxMarks: s.maxMarks,
                display:
                  s.flag !== 'NONE' && s.marksObtained != null
                    ? `${s.display} (${s.marksObtained})`
                    : s.display,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" aria-hidden="true" />
          Marks
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          View published marks by batch or individual student. Data loads step by step — select
          scope first, then pick a student or export.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('batch')
            setSelectedStudentId(null)
          }}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
            mode === 'batch'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
          }`}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          By batch
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('student')
            setBatchOption(null)
            setSelectedStudentId(null)
          }}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
            mode === 'student'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
          }`}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          By student
        </button>
      </div>

      {scopeSelectors}

      {exportError && (
        <p className="text-sm text-error" role="alert">
          {exportError}
        </p>
      )}

      {mode === 'batch' && batchReady && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-on-surface-variant">
              {batchStudentsPage?.total ?? 0} students with published marks
            </p>
            <button
              type="button"
              onClick={handleBatchExport}
              disabled={exporting || (batchStudentsPage?.total ?? 0) === 0}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary/90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export batch Excel
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-left text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Roll</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loadingStudents && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant">
                      Loading students…
                    </td>
                  </tr>
                )}
                {!loadingStudents &&
                  (batchStudentsPage?.data ?? []).map((student) => (
                    <tr
                      key={student.id}
                      className={`border-t border-outline-variant ${
                        selectedStudentId === student.id ? 'bg-primary-container/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono">{student.rollNumber}</td>
                      <td className="px-4 py-3">{student.name}</td>
                      <td className="px-4 py-3">
                        {student.isActive ? (
                          <span className="text-on-surface">Active</span>
                        ) : (
                          <span className="text-on-surface-variant">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="text-primary hover:underline"
                        >
                          View marks
                        </button>
                      </td>
                    </tr>
                  ))}
                {!loadingStudents && (batchStudentsPage?.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant">
                      No students found for this batch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-outline-variant px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-on-surface-variant">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-outline-variant px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'student' && scopeReady && (
        <div className="space-y-4">
          <label className="block max-w-md">
            <span className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Search by roll or name (min 3 characters)
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedStudentId(null)
              }}
              placeholder="e.g. 24IT093"
              className={selectClass}
              aria-label="Search student"
            />
          </label>

          {searchQuery.trim().length >= 3 && (
            <div className="rounded-lg border border-outline-variant divide-y divide-outline-variant">
              {searchFetching && (
                <p className="px-4 py-3 text-sm text-on-surface-variant">Searching…</p>
              )}
              {!searchFetching && searchResults.length === 0 && (
                <p className="px-4 py-3 text-sm text-on-surface-variant">No matches.</p>
              )}
              {!searchFetching &&
                searchResults.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleSelectStudent(student)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-surface-container-low ${
                      selectedStudentId === student.id ? 'bg-primary-container/30' : ''
                    }`}
                  >
                    <span>
                      <span className="font-mono font-medium">{student.rollNumber}</span>
                      {' — '}
                      {student.name}
                    </span>
                    {!student.isActive && (
                      <span className="text-xs text-on-surface-variant">Inactive</span>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {marksheetPanel}

      {!scopeReady && (
        <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">
          Select academic year and semester to browse marks.
        </div>
      )}
    </div>
  )
}

export default MarksReports
