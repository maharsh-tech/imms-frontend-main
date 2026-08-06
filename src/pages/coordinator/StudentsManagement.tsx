import { useState, useEffect, useMemo } from 'react'
import { getStudents, createStudent, type Student } from '../../api/students'
import {
  downloadStudentTemplate,
  importStudents,
} from '../../api/import'
import ExcelImportCard from '../../components/shared/ExcelImportCard'
import { groupStudentsByBatch, formatBatchOptionLabel } from '../../utils/roll-batch'
import { isValidRollNumber, normalizeRollInput, deriveBatchFromRollNumber } from '../../utils/identifier-patterns'
import { GraduationCap, ChevronDown, ChevronUp, Search, UserPlus } from 'lucide-react'
import { apiErrorMessage } from '../../utils/api-errors'

const StudentsManagement = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)
  const pageSize = 50
  const [error, setError] = useState('')
  const [selectedPrefix, setSelectedPrefix] = useState('')
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [rollNumber, setRollNumber] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('IT')
  const [semester, setSemester] = useState('5')
  const [batch, setBatch] = useState('')

  const loadStudents = async (pageNum = page) => {
    setLoading(true)
    setError('')
    try {
      const result = await getStudents({ page: pageNum, limit: pageSize })
      setStudents(result.data)
      setTotalStudents(result.total)
      setTotalPages(Math.max(1, Math.ceil(result.total / result.limit)))
      setPage(result.page)
    } catch {
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents(1)
  }, [])

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    void loadStudents(nextPage)
  }

  const batchGroups = useMemo(() => groupStudentsByBatch(students), [students])

  useEffect(() => {
    if (batchGroups.length === 0) {
      setSelectedPrefix('')
      return
    }
    if (!selectedPrefix || !batchGroups.some((g) => g.prefix === selectedPrefix)) {
      setSelectedPrefix(batchGroups[0].prefix)
    }
  }, [batchGroups, selectedPrefix])

  const activeGroup = batchGroups.find((g) => g.prefix === selectedPrefix)

  const filteredRows = useMemo(() => {
    if (!activeGroup) return []
    const q = search.trim().toLowerCase()
    if (!q) return activeGroup.students
    return activeGroup.students.filter(
      (s) =>
        s.rollNumber.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    )
  }, [activeGroup, search])

  const handleImportComplete = () => {
    loadStudents()
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    const roll = normalizeRollInput(rollNumber)
    if (!isValidRollNumber(roll)) {
      setError('Roll number must match standard format')
      return
    }
    setAddLoading(true)
    setError('')
    try {
      await createStudent({
        rollNumber: roll,
        name: name.trim(),
        department: department.trim(),
        semester: Number.parseInt(semester, 10),
        batch: batch.trim() || deriveBatchFromRollNumber(roll),
      })
      setRollNumber('')
      setName('')
      await loadStudents()
      setShowAdd(false)
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to add student'))
    } finally {
      setAddLoading(false)
    }
  }

  const addForm = (
    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
      <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" />
        Add single student
      </h3>
      <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input
          type="text"
          required
          placeholder="Roll number"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
          className="px-3 py-2 border border-outline-variant rounded-md text-sm font-mono"
          aria-label="Roll number"
        />
        <input
          type="text"
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-md text-sm sm:col-span-2"
          aria-label="Student name"
        />
        <input
          type="text"
          required
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-md text-sm"
          aria-label="Department"
        />
        <input
          type="number"
          required
          min={1}
          max={12}
          placeholder="Semester"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-md text-sm"
          aria-label="Semester"
        />
        <input
          type="text"
          required
          placeholder="Batch (optional — auto from roll)"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-md text-sm"
          aria-label="Batch"
        />
        <button
          type="submit"
          disabled={addLoading}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50"
        >
          {addLoading ? 'Adding…' : 'Add student'}
        </button>
      </form>
      <p className="text-xs text-on-surface-variant mt-2">Account must exist in Account Management (activation not required).</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Students
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            All students in the database, grouped by batch (e.g. 24IT, D25IT diploma). Students sign in with roll
            number only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary bg-primary-fixed/30 rounded-md hover:bg-surface-container"
          >
            {showAdd ? <ChevronUp className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {showAdd ? 'Hide form' : 'Add student'}
          </button>
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary bg-primary-fixed/30 rounded-md hover:bg-surface-container"
          >
            {showImport ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
            {showImport ? 'Hide import' : 'Import Excel'}
          </button>
        </div>
      </div>

      {showAdd && addForm}

      {showImport && (
        <div className="space-y-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="block text-xs font-medium text-on-surface-variant mb-1">Department (import default)</span>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
                aria-label="Import department default"
              />
            </label>
            <label className="text-sm">
              <span className="block text-xs font-medium text-on-surface-variant mb-1">Semester (import default)</span>
              <input
                type="number"
                min={1}
                max={12}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
                aria-label="Import semester default"
              />
            </label>
            <label className="text-sm">
              <span className="block text-xs font-medium text-on-surface-variant mb-1">Batch override (optional)</span>
              <input
                type="text"
                placeholder="Auto from roll if empty"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
                aria-label="Import batch override"
              />
            </label>
          </div>
          <ExcelImportCard
            title="Student Import"
            description="Upload CSPIT roster (.xlsx): Roll No + Student Name columns. Supports regular (24IT…) and diploma (D25IT…) rolls. Account must exist in Account Management first."
            onDownloadTemplate={downloadStudentTemplate}
            onImport={(file) =>
              importStudents(file, {
                department: department.trim(),
                semester: Number.parseInt(semester, 10),
                ...(batch.trim() ? { batch: batch.trim() } : {}),
              })
            }
            onImportComplete={handleImportComplete}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading students…</p>
      ) : students.length === 0 ? (
        <div className="space-y-4">
          {!showAdd && addForm}
          <div className="bg-surface-container-lowest shadow rounded-lg p-8 border border-outline-variant text-center">
            <p className="text-on-surface-variant">No students yet.</p>
            <p className="text-sm text-on-surface-variant mt-2">
              Create accounts in Account Management, then add a student above or import Excel.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest shadow rounded-lg border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="batch-select" className="block text-xs font-medium text-on-surface-variant mb-1">
                Batch
              </label>
              <select
                id="batch-select"
                value={selectedPrefix}
                onChange={(e) => setSelectedPrefix(e.target.value)}
                className="block w-full sm:max-w-xs px-3 py-2 border border-outline-variant rounded-md text-sm focus:ring-primary/20 focus:border-primary"
              >
                {batchGroups.map((group) => (
                  <option key={group.prefix} value={group.prefix}>
                    {formatBatchOptionLabel(group)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="student-search" className="block text-xs font-medium text-on-surface-variant mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-outline" />
                <input
                  id="student-search"
                  type="search"
                  placeholder="Roll, name, or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-outline-variant rounded-md text-sm focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-variant">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Roll No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Sem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Account
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-on-surface-variant text-center">
                      No students match your search in this batch.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((student) => (
                    <tr key={student.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-2 text-sm font-mono font-medium">{student.rollNumber}</td>
                      <td className="px-4 py-2 text-sm text-on-surface">{student.name}</td>
                      <td className="px-4 py-2 text-sm text-on-surface-variant">{student.batch}</td>
                      <td className="px-4 py-2 text-sm text-on-surface-variant">{student.semester}</td>
                      <td className="px-4 py-2 text-sm">
                        {student.userId ? (
                          <span className="text-green-700">Linked</span>
                        ) : (
                          <span className="text-amber-700">No account</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant text-xs text-on-surface-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              {filteredRows.length} shown on page · {totalStudents} total
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || loading}
                  className="px-2 py-1 rounded border border-outline-variant disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="px-2 py-1 rounded border border-outline-variant disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsManagement
