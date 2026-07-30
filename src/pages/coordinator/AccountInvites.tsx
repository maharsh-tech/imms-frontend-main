import { useState, useEffect, useMemo } from 'react'
import {
  getAccountInvites,
  createAccountInvite,
  bulkCreateAccountInvites,
  deleteAccountInvite,
} from '../../api/allowedUsers'
import type { AccountInvite, BulkCreateResult } from '../../types'
import { normalizeTeacherCodeInput } from '../../utils/identifier-patterns'
import { createStudent } from '../../api/students'
import { Trash2, UserPlus, Copy, Check, X } from 'lucide-react'

type RoleFilter = 'ALL' | 'STUDENT' | 'TEACHER' | 'COORDINATOR'

const buildPreviewEmail = (identifier: string, role: string): string => {
  const id = identifier.trim().toLowerCase()
  if (!id) return ''
  const domain = role === 'STUDENT' ? 'charusat.edu.in' : 'charusat.ac.in'
  return `${id}@${domain}`
}

const parseBulkLines = (
  text: string,
  role: string,
): { identifier?: string; email?: string }[] => {
  const entries: { identifier?: string; email?: string }[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (role === 'COORDINATOR') {
      entries.push({ email: trimmed.toLowerCase() })
      continue
    }
    const id = trimmed.split(/[,\t\s]+/)[0]?.trim()
    if (!id) continue
    if (role === 'TEACHER') {
      entries.push({ identifier: normalizeTeacherCodeInput(id) })
    } else {
      entries.push({ identifier: id.toUpperCase() })
    }
  }
  return entries
}


const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message
    if (Array.isArray(message)) return message[0] ?? fallback
    if (message) return message
  }
  return err instanceof Error ? err.message : fallback
}

const AccountInvites = () => {
  const [invites, setInvites] = useState<AccountInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('STUDENT')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkRole, setBulkRole] = useState('STUDENT')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkCreateResult | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [addRole, setAddRole] = useState('STUDENT')
  const [addLoading, setAddLoading] = useState(false)
  const [rosterInvite, setRosterInvite] = useState<AccountInvite | null>(null)
  const [rosterName, setRosterName] = useState('')
  const [rosterDepartment, setRosterDepartment] = useState('IT')
  const [rosterSemester, setRosterSemester] = useState('5')
  const [rosterBatch, setRosterBatch] = useState('2023-2027')
  const [rosterLoading, setRosterLoading] = useState(false)


  const previewEmail = useMemo(
    () => (addRole === 'COORDINATOR' ? email : buildPreviewEmail(identifier, addRole)),
    [identifier, addRole, email],
  )

  const fetchInvites = async () => {
    try {
      const data = await getAccountInvites()
      setInvites(data)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message || 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvites()
  }, [])

  const pendingRosterCount = useMemo(
    () =>
      invites.filter(
        (i) =>
          (i.role === 'STUDENT' || i.role === 'TEACHER') && i.rosterLinked === false,
      ).length,
    [invites],
  )

  const filteredInvites = useMemo(() => {
    const list =
      roleFilter === 'ALL' ? invites : invites.filter((i) => i.role === roleFilter)
    return [...list].sort((a, b) =>
      (a.identifier ?? a.email).localeCompare(b.identifier ?? b.email, undefined, {
        numeric: true,
      }),
    )
  }, [invites, roleFilter])



  const handleCopy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleCopyAllPending = async () => {
    const lines = filteredInvites
      .filter((i) => i.activationLink)
      .map((i) => `${i.identifier ?? '—'}\t${i.email}\t${i.activationLink}`)
    if (lines.length === 0) return
    await handleCopy(lines.join('\n'), 'all-pending')
  }

  const handleBulkAdd = async () => {
    const entries = parseBulkLines(bulkText, bulkRole)
    if (entries.length === 0) {
      setError(
        bulkRole === 'COORDINATOR'
          ? 'Add one email per line for coordinators'
          : bulkRole === 'TEACHER'
            ? 'Add one 3-letter teacher code per line (e.g. ABC)'
            : 'Add one ID per line (e.g. 24IT093)',
      )
      return
    }
    setBulkLoading(true)
    setError('')
    setBulkResult(null)
    try {
      const result = await bulkCreateAccountInvites({ role: bulkRole, entries })
      setBulkResult(result)
      setBulkText('')
      fetchInvites()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message || 'Bulk create failed')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (addRole === 'COORDINATOR' && !email.trim()) return
    if (addRole !== 'COORDINATOR' && !identifier.trim()) return
    setAddLoading(true)
    setError('')
    try {
      await createAccountInvite({
        role: addRole,
        identifier: addRole !== 'COORDINATOR'
          ? addRole === 'TEACHER'
            ? normalizeTeacherCodeInput(identifier)
            : identifier.trim().toUpperCase()
          : undefined,
        email: addRole === 'COORDINATOR' ? email.trim().toLowerCase() : undefined,
      })
      setEmail('')
      setIdentifier('')
      fetchInvites()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message || 'Failed to create account')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Revoke this account? They will not be able to activate.')) return
    try {
      await deleteAccountInvite(id)
      fetchInvites()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message || 'Failed to delete invite')
    }
  }

  const handleOpenRoster = (invite: AccountInvite) => {
    setRosterInvite(invite)
    setRosterName('')
    setRosterDepartment('IT')
    setRosterSemester('5')
    setRosterBatch('2023-2027')
    setError('')
  }

  const handleCloseRoster = () => {
    setRosterInvite(null)
    setRosterName('')
  }

  const handleAddToRoster = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rosterInvite?.identifier) return
    setRosterLoading(true)
    setError('')
    try {
      await createStudent({
        rollNumber: rosterInvite.identifier,
        name: rosterName.trim(),
        department: rosterDepartment.trim(),
        semester: Number.parseInt(rosterSemester, 10),
        batch: rosterBatch.trim(),
      })
      handleCloseRoster()
      fetchInvites()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to add student to roster'))
    } finally {
      setRosterLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading invites...</div>
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Account Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Students sign in with roll number (<span className="font-mono">24IT093</span>). Teachers
            use a unique 3-letter code (<span className="font-mono">ABC</span>) →{' '}
            <span className="font-mono">abc@charusat.ac.in</span> for login.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopyAllPending}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            {copiedKey === 'all-pending' ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied all pending links
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy all pending links
              </>
            )}
          </button>
        </div>
      </div>



      {pendingRosterCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="text-sm text-amber-800">
            {pendingRosterCount} account{pendingRosterCount === 1 ? '' : 's'} ha
            {pendingRosterCount === 1 ? 's' : 've'} no roster row yet — use{' '}
            <strong>Add to roster</strong> below or the Students tab.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Bulk invite (paste student IDs)</h3>
        <p className="text-xs text-gray-500 mb-2">
          {bulkRole === 'COORDINATOR'
            ? 'One coordinator email per line'
            : bulkRole === 'STUDENT'
              ? 'One roll number per line — college email is generated automatically'
              : 'One ID per line — email is generated automatically'}
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={5}
          placeholder={
            bulkRole === 'COORDINATOR'
              ? 'coordinator@charusat.ac.in'
              : bulkRole === 'TEACHER'
                ? 'ABC\nDEF\nGHI'
                : '24IT093\n24IT094\n24IT095'
          }
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-blue-500 focus:border-blue-500 outline-none"
          aria-label="Bulk account creation"
        />
        <div className="flex flex-wrap gap-3 mt-3">
          <select
            value={bulkRole}
            onChange={(e) => setBulkRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="COORDINATOR">Coordinators</option>
          </select>
          <button
            type="button"
            onClick={handleBulkAdd}
            disabled={bulkLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {bulkLoading ? 'Creating...' : 'Create accounts & get links'}
          </button>
        </div>
        {bulkResult && (
          <p className="mt-3 text-sm text-gray-700">
            Created: {bulkResult.created} · Skipped: {bulkResult.skipped}
            {bulkResult.errors.length > 0 && (
              <span className="text-red-600"> · {bulkResult.errors.length} errors</span>
            )}
          </p>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-md mb-8 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
          Add single account
        </h3>
        <form onSubmit={handleSingleAdd} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {addRole !== 'COORDINATOR' ? (
              <input
                type="text"
                required
                placeholder={addRole === 'TEACHER' ? 'Code (ABC)' : 'Roll (24IT093)'}
                maxLength={addRole === 'TEACHER' ? 3 : undefined}
                className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono uppercase"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(
                    addRole === 'TEACHER'
                      ? normalizeTeacherCodeInput(e.target.value)
                      : e.target.value.toUpperCase(),
                  )
                }
                disabled={addLoading}
              />
            ) : (
              <input
                type="email"
                required
                placeholder="coordinator@charusat.ac.in"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={addLoading}
              />
            )}
            <select
              className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
              disabled={addLoading}
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="COORDINATOR">Coordinator</option>
            </select>
            <button
              type="submit"
              disabled={addLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {addLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
          {previewEmail && addRole !== 'COORDINATOR' && (
            <p className="text-sm text-gray-600">
              Email will be: <span className="font-mono text-gray-900">{previewEmail}</span>
            </p>
          )}
        </form>
      </div>

      <div className="flex gap-2 mb-4">
        {(['STUDENT', 'TEACHER', 'COORDINATOR', 'ALL'] as RoleFilter[]).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setRoleFilter(role)}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              roleFilter === role
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {role === 'ALL' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase() + 's'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roster</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>

              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvites.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  No accounts in this category.
                </td>
              </tr>
            ) : (
              filteredInvites.map((invite) => (
                <tr key={invite.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                    {invite.identifier ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{invite.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        invite.role === 'COORDINATOR'
                          ? 'bg-purple-100 text-purple-800'
                          : invite.role === 'TEACHER'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {invite.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {invite.role === 'COORDINATOR' ? (
                      <span className="text-gray-400">—</span>
                    ) : invite.rosterLinked ? (
                      <span className="text-green-700 font-medium">In roster</span>
                    ) : (
                      <span className="text-amber-700 font-medium">Not in roster</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {invite.isActivated ? (
                      <span className="text-green-700 font-medium">Active</span>
                    ) : (
                      <span className="text-amber-700 font-medium">Pending activation</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm space-x-2">
                    {invite.role === 'STUDENT' && !invite.rosterLinked && invite.identifier && (
                      <button
                        type="button"
                        onClick={() => handleOpenRoster(invite)}
                        className="inline-flex items-center text-green-700 hover:text-green-900 text-xs font-medium"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add to roster
                      </button>
                    )}
                    {invite.activationLink && (
                      <button
                        type="button"
                        onClick={() => handleCopy(invite.activationLink!, invite.id)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs"
                      >
                        {copiedKey === invite.id ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy link
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(invite.id)}
                      className="inline-flex items-center text-red-600 hover:text-red-800 p-1"
                      title="Revoke"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rosterInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200"
            role="dialog"
            aria-labelledby="roster-dialog-title"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 id="roster-dialog-title" className="text-lg font-semibold text-gray-900">
                  Add to roster
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Invite exists for{' '}
                  <span className="font-mono font-medium">{rosterInvite.identifier}</span> — student
                  does not need to activate first.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseRoster}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddToRoster} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Roll number</label>
                <input
                  type="text"
                  readOnly
                  value={rosterInvite.identifier ?? ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={rosterName}
                  onChange={(e) => setRosterName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={rosterDepartment}
                    onChange={(e) => setRosterDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Semester</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={rosterSemester}
                    onChange={(e) => setRosterSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Batch</label>
                <input
                  type="text"
                  required
                  value={rosterBatch}
                  onChange={(e) => setRosterBatch(e.target.value)}
                  placeholder="2023-2027"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={rosterLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {rosterLoading ? 'Adding…' : 'Add student'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseRoster}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountInvites
