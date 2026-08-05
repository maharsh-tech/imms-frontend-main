import { useState, useEffect, useMemo } from 'react'
import {
  getAccountInvites,
  createAccountInvite,
  bulkCreateAccountInvites,
  deleteAccountInvite,
  regenerateActivationLink,
} from '../../api/allowedUsers'
import type { AccountInvite, BulkCreateResult } from '../../types'
import { createStudent } from '../../api/students'
import { Trash2, UserPlus, Copy, Check, X } from 'lucide-react'
import ExcelJS from 'exceljs'

type RoleFilter = 'ALL' | 'STUDENT' | 'TEACHER' | 'COORDINATOR'

const buildPreviewEmail = (identifier: string, role: string): string => {
  const id = identifier.trim().toLowerCase()
  if (!id) return ''
  const domain = role === 'STUDENT' ? 'charusat.edu.in' : 'charusat.ac.in'
  if (id.includes('@')) return id
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
    if (role === 'COORDINATOR' || role === 'TEACHER') {
      if (trimmed.includes('@')) {
        entries.push({ email: trimmed.toLowerCase() })
      } else if (role === 'TEACHER') {
        entries.push({ identifier: trimmed.toLowerCase() })
      } else {
        entries.push({ email: trimmed.toLowerCase() })
      }
      continue
    }
    const id = trimmed.split(/[,\t\s]+/)[0]?.trim()
    if (!id) continue
    entries.push({ identifier: id.toUpperCase() })
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
  const [linkLoadingId, setLinkLoadingId] = useState<string | null>(null)
  const [bulkText, setBulkText] = useState('')
  const [bulkRole, setBulkRole] = useState('STUDENT')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkCreateResult | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [addRole, setAddRole] = useState('STUDENT')
  const [addLoading, setAddLoading] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [showSingleForm, setShowSingleForm] = useState(false)
  const [rosterInvite, setRosterInvite] = useState<AccountInvite | null>(null)
  const [rosterName, setRosterName] = useState('')
  const [rosterDepartment, setRosterDepartment] = useState('IT')
  const [rosterSemester, setRosterSemester] = useState('5')
  const [rosterBatch, setRosterBatch] = useState('2023-2027')
  const [rosterLoading, setRosterLoading] = useState(false)


  const previewEmail = useMemo(() => {
    if (addRole === 'COORDINATOR' || addRole === 'TEACHER') {
      return email.trim().toLowerCase()
    }
    return buildPreviewEmail(identifier, addRole)
  }, [identifier, addRole, email])

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
    const pending = filteredInvites.filter((i) => !i.isActivated)
    if (pending.length === 0) return
    setLinkLoadingId('all-pending')
    setError('')
    try {
      const lines = await Promise.all(
        pending.map(async (invite) => {
          const updated = await regenerateActivationLink(invite.id)
          return `${invite.identifier ?? '—'}\t${invite.email}\t${updated.activationLink ?? ''}`
        }),
      )
      await handleCopy(lines.join('\n'), 'all-pending')
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to generate activation links'))
    } finally {
      setLinkLoadingId(null)
    }
  }

  const handleCopyActivationLink = async (invite: AccountInvite) => {
    setLinkLoadingId(invite.id)
    setError('')
    try {
      const updated = await regenerateActivationLink(invite.id)
      if (!updated.activationLink) {
        setError('Failed to generate activation link')
        return
      }
      await handleCopy(updated.activationLink, invite.id)
      setInvites((prev) =>
        prev.map((i) =>
          i.id === invite.id
            ? { ...i, hasActivationToken: true, activationLink: updated.activationLink }
            : i,
        ),
      )
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to generate activation link'))
    } finally {
      setLinkLoadingId(null)
    }
  }

  const downloadInviteLinksExcel = async (createdInvites: AccountInvite[]) => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Activation Links')

    worksheet.columns = [
      { header: 'Student/Faculty/Coordinator ID', key: 'idOrEmail', width: 35 },
      { header: 'Activation Link', key: 'link', width: 60 }
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

    createdInvites.forEach((invite) => {
      const idOrEmail = invite.identifier || invite.email
      const addedRow = worksheet.addRow({
        idOrEmail,
        link: invite.activationLink || '—'
      })

      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        }
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      })
      addedRow.height = 20
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `activation_links_${bulkRole.toLowerCase()}s.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleBulkAdd = async () => {
    const entries = parseBulkLines(bulkText, bulkRole)
    if (entries.length === 0) {
      setError(
        bulkRole === 'COORDINATOR'
          ? 'Add one email per line for coordinators'
          : bulkRole === 'TEACHER'
            ? 'Add one teacher email per line (e.g. nishatshaikh.it@charusat.ac.in)'
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
      if (result.invites && result.invites.length > 0) {
        await downloadInviteLinksExcel(result.invites)
      }
      setShowBulkForm(false)
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
    if ((addRole === 'COORDINATOR' || addRole === 'TEACHER') && !email.trim()) return
    if (addRole === 'STUDENT' && !identifier.trim()) return
    setAddLoading(true)
    setError('')
    try {
      await createAccountInvite({
        role: addRole,
        identifier: addRole === 'STUDENT' ? identifier.trim().toUpperCase() : undefined,
        email:
          addRole === 'COORDINATOR' || addRole === 'TEACHER'
            ? email.trim().toLowerCase()
            : undefined,
      })
      setEmail('')
      setIdentifier('')
      fetchInvites()
      setShowSingleForm(false)
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
    return <div className="p-8 text-center text-on-surface-variant animate-pulse">Loading invites...</div>
  }

  return (
    <div className="bg-surface-container-lowest shadow rounded-lg p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">
            Account Management
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Students sign in with roll number (<span className="font-mono">24IT093</span>). Teachers
            sign in with institutional email (
            <span className="font-mono">nishatshaikh.it@charusat.ac.in</span>).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowBulkForm(!showBulkForm)
              setShowSingleForm(false)
            }}
            className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md border border-outline-variant cursor-pointer transition-colors ${
              showBulkForm ? 'bg-primary text-white hover:bg-primary-container' : 'bg-surface-container-low text-primary hover:bg-surface-container'
            }`}
          >
            {showBulkForm ? 'Close Bulk Invite' : 'Bulk Invite'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSingleForm(!showSingleForm)
              setShowBulkForm(false)
            }}
            className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md border border-outline-variant cursor-pointer transition-colors ${
              showSingleForm ? 'bg-primary text-white hover:bg-primary-container' : 'bg-surface-container-low text-primary hover:bg-surface-container'
            }`}
          >
            {showSingleForm ? 'Close Add Single' : 'Add Single'}
          </button>
          <button
            type="button"
            onClick={handleCopyAllPending}
            disabled={linkLoadingId === 'all-pending'}
            className="inline-flex items-center px-3 py-2 text-sm font-semibold text-primary bg-primary-fixed/30 rounded-md hover:bg-surface-container disabled:opacity-60 cursor-pointer"
          >
            {copiedKey === 'all-pending' ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied all pending links
              </>
            ) : linkLoadingId === 'all-pending' ? (
              'Generating links...'
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

      {showBulkForm && (
        <div className="bg-surface-container-low p-4 rounded-md mb-6 border border-outline-variant">
          <h3 className="text-lg font-medium text-on-surface mb-3">Bulk invite (paste student IDs)</h3>
          <p className="text-xs text-on-surface-variant mb-2">
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
                  ? 'nishatshaikh.it@charusat.ac.in\npriyankapatel.it@charusat.ac.in'
                  : '24IT093\n24IT094\n24IT095'
            }
            className="w-full border border-outline-variant rounded-md px-3 py-2 text-sm font-mono focus:ring-primary/20 focus:border-primary outline-none"
            aria-label="Bulk account creation"
          />
          <div className="flex flex-wrap gap-3 mt-3">
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded-md text-sm bg-surface-container-lowest"
            >
              <option value="STUDENT">Students</option>
              <option value="TEACHER">Teachers</option>
              <option value="COORDINATOR">Coordinators</option>
            </select>
            <button
              type="button"
              onClick={handleBulkAdd}
              disabled={bulkLoading}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50 cursor-pointer"
            >
              {bulkLoading ? 'Creating...' : 'Create accounts & download Excel'}
            </button>
          </div>
          {bulkResult && (
            <p className="mt-3 text-sm text-on-surface">
              Created: {bulkResult.created} · Skipped: {bulkResult.skipped}
              {bulkResult.errors.length > 0 && (
                <span className="text-red-600"> · {bulkResult.errors.length} errors</span>
              )}
            </p>
          )}
        </div>
      )}

      {showSingleForm && (
        <div className="bg-surface-container-low p-4 rounded-md mb-8 border border-outline-variant">
          <h3 className="text-lg font-medium text-on-surface mb-4 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-primary" />
            Add single account
          </h3>
          <form onSubmit={handleSingleAdd} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {addRole === 'STUDENT' ? (
                <input
                  type="text"
                  required
                  placeholder="Roll (24IT093)"
                  className="w-full sm:w-40 px-3 py-2 border border-outline-variant rounded-md text-sm font-mono uppercase"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                  disabled={addLoading}
                />
              ) : (
                <input
                  type="email"
                  required
                  placeholder={
                    addRole === 'TEACHER'
                      ? 'nishatshaikh.it@charusat.ac.in'
                      : 'coordinator@charusat.ac.in'
                  }
                  className="flex-1 px-3 py-2 border border-outline-variant rounded-md text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={addLoading}
                />
              )}
              <select
                className="w-full sm:w-40 px-3 py-2 border border-outline-variant rounded-md text-sm bg-surface-container-lowest"
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
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50 cursor-pointer"
              >
                {addLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
            {previewEmail && addRole === 'STUDENT' && (
              <p className="text-sm text-on-surface-variant">
                Email will be: <span className="font-mono text-on-surface">{previewEmail}</span>
              </p>
            )}
          </form>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['STUDENT', 'TEACHER', 'COORDINATOR', 'ALL'] as RoleFilter[]).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setRoleFilter(role)}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              roleFilter === role
                ? 'bg-primary text-white'
                : 'bg-background text-on-surface-variant hover:bg-gray-200'
            }`}
          >
            {role === 'ALL' ? 'All' : role.charAt(0) + role.slice(1).toLowerCase() + 's'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-variant">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Roster</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Account</th>

              <th className="px-4 py-3 text-right text-xs font-medium text-on-surface-variant uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-surface-container-lowest divide-y divide-surface-variant">
            {filteredInvites.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-on-surface-variant">
                  No accounts in this category.
                </td>
              </tr>
            ) : (
              filteredInvites.map((invite) => (
                <tr key={invite.id} className="hover:bg-surface-container-low">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-on-surface">
                    {invite.identifier ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-on-surface">{invite.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        invite.role === 'COORDINATOR'
                          ? 'bg-purple-100 text-purple-800'
                          : invite.role === 'TEACHER'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-primary'
                      }`}
                    >
                      {invite.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {invite.role === 'COORDINATOR' ? (
                      <span className="text-outline">—</span>
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
                    {!invite.isActivated && (
                      <button
                        type="button"
                        onClick={() => handleCopyActivationLink(invite)}
                        disabled={linkLoadingId === invite.id}
                        className="inline-flex items-center text-primary hover:text-primary text-xs disabled:opacity-60"
                      >
                        {copiedKey === invite.id ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied
                          </>
                        ) : linkLoadingId === invite.id ? (
                          'Generating...'
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            {invite.hasActivationToken ? 'Copy new link' : 'Copy activation link'}
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
            className="bg-surface-container-lowest rounded-lg shadow-xl max-w-md w-full p-6 border border-outline-variant"
            role="dialog"
            aria-labelledby="roster-dialog-title"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 id="roster-dialog-title" className="text-lg font-semibold text-on-surface">
                  Add to roster
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Invite exists for{' '}
                  <span className="font-mono font-medium">{rosterInvite.identifier}</span> — student
                  does not need to activate first.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseRoster}
                className="text-outline hover:text-on-surface-variant"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddToRoster} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Roll number</label>
                <input
                  type="text"
                  readOnly
                  value={rosterInvite.identifier ?? ''}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm font-mono bg-surface-container-low"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={rosterName}
                  onChange={(e) => setRosterName(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={rosterDepartment}
                    onChange={(e) => setRosterDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Semester</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={rosterSemester}
                    onChange={(e) => setRosterSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Batch</label>
                <input
                  type="text"
                  required
                  value={rosterBatch}
                  onChange={(e) => setRosterBatch(e.target.value)}
                  placeholder="2023-2027"
                  className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={rosterLoading}
                  className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50"
                >
                  {rosterLoading ? 'Adding…' : 'Add student'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseRoster}
                  className="px-4 py-2 text-sm text-on-surface border border-outline-variant rounded-md hover:bg-surface-container-low"
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
