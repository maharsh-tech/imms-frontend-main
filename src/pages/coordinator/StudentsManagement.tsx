import { useState, useEffect, useMemo } from 'react'
import { getStudents, createStudent } from '../../api/students'
import {
  downloadStudentTemplate,
  importStudents,
} from '../../api/import'
import ExcelImportCard from '../../components/shared/ExcelImportCard'
import { groupStudentsByBatch, formatBatchOptionLabel } from '../../utils/roll-batch'
import { isValidRollNumber, normalizeRollInput } from '../../utils/identifier-patterns'
import { GraduationCap, ChevronDown, ChevronUp, Search, UserPlus } from 'lucide-react'

const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message
    if (Array.isArray(message)) return message[0] ?? fallback
    if (message) return message
  }
  return err instanceof Error ? err.message : fallback
}

const StudentsManagement = () => {
  const [students, setStudents] = useState<Awaited<ReturnType<typeof getStudents>>>([])
  const [loading, setLoading] = useState(true)
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
  const [batch, setBatch] = useState('2023-2027')

  const loadStudents = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getStudents()
      setStudents(data)
    } catch {
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

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
      setError('Roll number must match format 24IT093')
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
        batch: batch.trim(),
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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-blue-600" />
        Add single student
      </h3>
      <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input
          type="text"
          required
          placeholder="Roll (24IT093)"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
          aria-label="Roll number"
        />
        <input
          type="text"
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm sm:col-span-2"
          aria-label="Student name"
        />
        <input
          type="text"
          required
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
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
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          aria-label="Semester"
        />
        <input
          type="text"
          required
          placeholder="Batch (2024-2028)"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          aria-label="Batch"
        />
        <button
          type="submit"
          disabled={addLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {addLoading ? 'Adding…' : 'Add student'}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">Account invite for this roll must exist (activation not required).</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Students
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            All students in the database, grouped by batch (e.g. 24IT). Students sign in with roll
            number only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            {showAdd ? <ChevronUp className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {showAdd ? 'Hide form' : 'Add student'}
          </button>
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            {showImport ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
            {showImport ? 'Hide import' : 'Import Excel'}
          </button>
        </div>
      </div>

      {showAdd && addForm}

      {showImport && (
        <ExcelImportCard
          title="Student Import"
          description="Upload .xlsx to add or update roster rows. Account Invites must exist first. Email is auto from roll number."
          onDownloadTemplate={downloadStudentTemplate}
          onImport={importStudents}
          onImportComplete={handleImportComplete}
        />
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading students…</p>
      ) : students.length === 0 ? (
        <div className="space-y-4">
          {!showAdd && addForm}
          <div className="bg-white shadow rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-600">No students yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Add Account Invites, then add a student above or import Excel.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="batch-select" className="block text-xs font-medium text-gray-500 mb-1">
                Batch
              </label>
              <select
                id="batch-select"
                value={selectedPrefix}
                onChange={(e) => setSelectedPrefix(e.target.value)}
                className="block w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {batchGroups.map((group) => (
                  <option key={group.prefix} value={group.prefix}>
                    {formatBatchOptionLabel(group)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="student-search" className="block text-xs font-medium text-gray-500 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  id="student-search"
                  type="search"
                  placeholder="Roll, name, or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Roll No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Account
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-gray-500 text-center">
                      No students match your search in this batch.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-mono font-medium">{student.rollNumber}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{student.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{student.batch}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{student.semester}</td>
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

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            {filteredRows.length} of {activeGroup?.count ?? 0} in {selectedPrefix} · {students.length}{' '}
            total
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsManagement
