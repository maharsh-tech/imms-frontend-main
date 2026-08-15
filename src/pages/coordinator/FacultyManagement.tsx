import { useState, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createFaculty } from '../../api/faculty'
import {
  downloadFacultyTemplate,
  importFaculty,
} from '../../api/import'
import ExcelImportCard from '../../components/shared/ExcelImportCard'
import {
  isValidTeacherSlug,
  teacherSlugFromEmailInput,
} from '../../utils/identifier-patterns'
import { BookOpen, ChevronDown, ChevronUp, Search, UserPlus } from 'lucide-react'
import { apiErrorMessage } from '../../utils/api-errors'
import { useFaculty, useFacultyInvalidator } from '../../hooks/useFaculty'

const FacultyManagement = () => {
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [teacherEmail, setTeacherEmail] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('IT')

  const invalidateFaculty = useFacultyInvalidator()
  const { data, isLoading, isFetching, error: queryError } = useFaculty({ page, limit: pageSize })
  const faculty = data?.data ?? []
  const totalFaculty = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalFaculty / pageSize))
  const loading = isLoading || isFetching

  const createMutation = useMutation({
    mutationFn: createFaculty,
    onSuccess: () => {
      setTeacherEmail('')
      setName('')
      setShowAdd(false)
      invalidateFaculty()
    },
    onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to add teacher')),
  })

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

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

  const previewSlug = teacherSlugFromEmailInput(teacherEmail)

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    const slug = teacherSlugFromEmailInput(teacherEmail)
    if (!isValidTeacherSlug(slug)) {
      setError('Teacher email must match institutional format')
      return
    }
    setError('')
    createMutation.mutate({
      facultyCode: slug,
      name: name.trim(),
      department: department.trim(),
    })
  }

  const addForm = (
    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4">
      <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" />
        Add single teacher
      </h3>
      <form onSubmit={handleAddTeacher} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="email"
          required
          placeholder="teacher@charusat.ac.in"
          value={teacherEmail}
          onChange={(e) => setTeacherEmail(e.target.value)}
          className="px-3 py-2 border border-outline-variant rounded-md text-sm sm:col-span-2"
          aria-label="Teacher email"
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
          disabled={createMutation.isPending}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50"
        >
          {createMutation.isPending ? 'Adding…' : 'Add teacher'}
        </button>
      </form>
      {previewSlug && isValidTeacherSlug(previewSlug) && (
        <p className="text-xs text-on-surface-variant mt-2">
          Login email:{' '}
          <span className="font-mono text-on-surface">{previewSlug}@charusat.ac.in</span> · account
          must exist in Account Management first
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
            All teachers in the database. Teachers sign in with Google using their institutional email (
            <span className="font-mono">firstname.lastname.dept@charusat.ac.in</span>).
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
        <div className="space-y-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-4 max-w-xs">
            <label className="text-sm block">
              <span className="block text-xs font-medium text-on-surface-variant mb-1">Department (import default)</span>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
                aria-label="Import department default"
              />
            </label>
          </div>
          <ExcelImportCard
            title="Faculty Import"
            description="Upload CSPIT staff list (.xlsx): single-column names (DR./MR./MS.) matched to Account Management, or structured sheet with Email, Full Name, Department (blank Department defaults to IT). Account must exist first."
            onDownloadTemplate={downloadFacultyTemplate}
            onImport={(file) => importFaculty(file, { department: department.trim() })}
            onImportComplete={invalidateFaculty}
          />
        </div>
      )}

      {(error || queryError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error || 'Failed to load faculty'}</p>
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
              Create accounts in Account Management with teacher emails, then add a teacher above or import Excel.
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
                  placeholder="Email slug, name, or department…"
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">
                    Department
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-sm text-on-surface-variant text-center">
                      No teachers match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((member) => (
                    <tr key={member.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-2 text-sm font-mono font-medium">{member.email}</td>
                      <td className="px-4 py-2 text-sm text-on-surface">{member.name}</td>
                      <td className="px-4 py-2 text-sm text-on-surface-variant">{member.department}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant text-xs text-on-surface-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{filteredRows.length} on page · {totalFaculty} total</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span>Page {page} of {totalPages}</span>
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

export default FacultyManagement
