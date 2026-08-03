import { useState, useEffect, useMemo } from 'react'
import { getFaculty } from '../../api/subjects'
import type { Faculty } from '../../api/subjects'
import { createFaculty } from '../../api/faculty'
import {
  downloadFacultyTemplate,
  importFaculty,
} from '../../api/import'
import ExcelImportCard from '../../components/shared/ExcelImportCard'
import {
  isValidTeacherCode,
  normalizeTeacherCodeInput,
} from '../../utils/identifier-patterns'
import { BookOpen, ChevronDown, ChevronUp, Search, UserPlus } from 'lucide-react'

const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message
    if (Array.isArray(message)) return message[0] ?? fallback
    if (message) return message
  }
  return err instanceof Error ? err.message : fallback
}

const buildPreviewEmail = (code: string): string => {
  const normalized = normalizeTeacherCodeInput(code)
  return normalized ? `${normalized.toLowerCase()}@charusat.ac.in` : ''
}

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [teacherCode, setTeacherCode] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('IT')

  const loadFaculty = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getFaculty()
      setFaculty(data)
    } catch {
      setError('Failed to load faculty')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFaculty()
  }, [])

  const departments = useMemo(() => {
    const set = new Set(faculty.map((f) => f.department))
    return [...set].sort()
  }, [faculty])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return faculty
      .filter((f) => deptFilter === 'ALL' || f.department === deptFilter)
      .filter(
        (f) =>
          !q ||
          f.facultyCode.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q),
      )
      .sort((a, b) => a.facultyCode.localeCompare(b.facultyCode))
  }, [faculty, search, deptFilter])

  const previewEmail = buildPreviewEmail(teacherCode)

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = normalizeTeacherCodeInput(teacherCode)
    if (!isValidTeacherCode(code)) {
      setError('Teacher code must be exactly 3 letters')
      return
    }
    setAddLoading(true)
    setError('')
    try {
      await createFaculty({
        facultyCode: code,
        name: name.trim(),
        department: department.trim(),
      })
      setTeacherCode('')
      setName('')
      await loadFaculty()
      setShowAdd(false)
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to add teacher'))
    } finally {
      setAddLoading(false)
    }
  }

  const addForm = (
    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
      <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" />
        Add single teacher
      </h3>
      <form onSubmit={handleAddTeacher} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          required
          maxLength={3}
          placeholder="Code (ABC)"
          value={teacherCode}
          onChange={(e) => setTeacherCode(normalizeTeacherCodeInput(e.target.value))}
          className="px-3 py-2 border border-outline-variant rounded-md text-sm font-mono uppercase"
          aria-label="Teacher code"
        />
        <input
          type="text"
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-md text-sm sm:col-span-2"
          aria-label="Teacher name"
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
        <button
          type="submit"
          disabled={addLoading}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50"
        >
          {addLoading ? 'Adding…' : 'Add teacher'}
        </button>
      </form>
      {previewEmail && (
        <p className="text-xs text-on-surface-variant mt-2">
          Login email: <span className="font-mono text-on-surface">{previewEmail}</span> · account must
          exist in Account Management first
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Faculty
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            All teachers in the database. Each has a unique 3-letter teacher code. Sign in with
            @charusat.ac.in email and password.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary bg-primary-fixed/30 rounded-md hover:bg-surface-container"
          >
            {showAdd ? <ChevronUp className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {showAdd ? 'Hide form' : 'Add teacher'}
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
        <ExcelImportCard
          title="Faculty Import"
          description="Upload .xlsx — Teacher Code column (3 letters). Account must exist in Account Management first."
          onDownloadTemplate={downloadFacultyTemplate}
          onImport={importFaculty}
          onImportComplete={loadFaculty}
        />
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading faculty…</p>
      ) : faculty.length === 0 ? (
        <div className="space-y-4">
          {!showAdd && addForm}
          <div className="bg-surface-container-lowest shadow rounded-lg p-8 border border-outline-variant text-center">
            <p className="text-on-surface-variant">No teachers yet.</p>
            <p className="text-sm text-on-surface-variant mt-2">
              Create accounts in Account Management with 3-letter codes, then add a teacher above or import Excel.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest shadow rounded-lg border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="faculty-search" className="block text-xs font-medium text-on-surface-variant mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-outline" />
                <input
                  id="faculty-search"
                  type="search"
                  placeholder="Code, name, email, or department…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-outline-variant rounded-md text-sm focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            {departments.length > 1 && (
              <div>
                <label htmlFor="dept-filter" className="block text-xs font-medium text-on-surface-variant mb-1">
                  Department
                </label>
                <select
                  id="dept-filter"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="block w-full sm:w-40 px-3 py-2 border border-outline-variant rounded-md text-sm focus:ring-primary/20 focus:border-primary"
                >
                  <option value="ALL">All</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-variant">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Teacher Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Department
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-on-surface-variant text-center">
                      No teachers match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((member) => (
                    <tr key={member.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-2 text-sm font-mono font-medium">{member.facultyCode}</td>
                      <td className="px-4 py-2 text-sm text-on-surface">{member.name}</td>
                      <td className="px-4 py-2 text-sm text-on-surface-variant">{member.email}</td>
                      <td className="px-4 py-2 text-sm text-on-surface-variant">{member.department}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant text-xs text-on-surface-variant">
            {filteredRows.length} of {faculty.length} teachers
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyManagement
