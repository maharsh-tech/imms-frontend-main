import { useState, useEffect, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createStudent } from '../../api/students'
import {
  accountInviteMutations,
  useAccountInvites,
  useAccountInvitesInvalidator,
} from '../../hooks/useAccountInvites'
import type { AccountInvite, BulkCreateResult } from '../../types'
import { apiErrorMessage } from '../../utils/api-errors'
import { deriveBatchFromRollNumber, deriveDepartmentFromRollNumber } from '../../utils/identifier-patterns'
import BulkInviteForm from '../../components/coordinator/account-invites/BulkInviteForm'
import SingleInviteForm from '../../components/coordinator/account-invites/SingleInviteForm'
import InviteTable from '../../components/coordinator/account-invites/InviteTable'
import RosterDialog from '../../components/coordinator/account-invites/RosterDialog'
import {
  buildPreviewEmail,
  parseBulkLines,
  downloadInviteLinksExcel,
  type RoleFilter,
} from '../../components/coordinator/account-invites/account-invite-utils'

const AccountInvites = () => {
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('STUDENT')
  const [bulkText, setBulkText] = useState('')
  const [bulkRole, setBulkRole] = useState('STUDENT')
  const [bulkResult, setBulkResult] = useState<BulkCreateResult | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [addRole, setAddRole] = useState('STUDENT')
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [showSingleForm, setShowSingleForm] = useState(false)
  const [rosterInvite, setRosterInvite] = useState<AccountInvite | null>(null)
  const [rosterName, setRosterName] = useState('')
  const [rosterDepartment, setRosterDepartment] = useState('')
  const [rosterSemester, setRosterSemester] = useState('')
  const [rosterBatch, setRosterBatch] = useState('')

  const invalidateInvites = useAccountInvitesInvalidator()

  useEffect(() => {
    setPage(1)
  }, [roleFilter])

  const inviteParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
    }),
    [page, roleFilter, pageSize],
  )

  const { data, isLoading, isFetching, error: queryError } = useAccountInvites(inviteParams)
  const invites = data?.data ?? []
  const totalInvites = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalInvites / pageSize))
  const loading = isLoading || isFetching

  const bulkCreateMutation = useMutation({
    mutationFn: accountInviteMutations.bulkCreate,
    onSuccess: async (result) => {
      setBulkResult(result)
      setBulkText('')
      invalidateInvites()
      if (result.invites && result.invites.length > 0) {
        await downloadInviteLinksExcel(result.invites, bulkRole)
      }
      setShowBulkForm(false)
    },
    onError: (err: unknown) => setError(apiErrorMessage(err, 'Bulk create failed')),
  })

  const createMutation = useMutation({
    mutationFn: accountInviteMutations.create,
    onSuccess: () => {
      setEmail('')
      setIdentifier('')
      invalidateInvites()
      setShowSingleForm(false)
    },
    onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to create account')),
  })

  const deleteMutation = useMutation({
    mutationFn: accountInviteMutations.delete,
    onSuccess: () => invalidateInvites(),
    onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to delete invite')),
  })

  const rosterMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      setRosterInvite(null)
      setRosterName('')
      invalidateInvites()
    },
    onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to add student to roster')),
  })

  const previewEmail = useMemo(() => {
    if (addRole === 'COORDINATOR' || addRole === 'TEACHER') {
      return email.trim().toLowerCase()
    }
    return buildPreviewEmail(identifier, addRole)
  }, [identifier, addRole, email])

  const pendingRosterCount = useMemo(
    () =>
      invites.filter(
        (i) => (i.role === 'STUDENT' || i.role === 'TEACHER') && i.rosterLinked === false,
      ).length,
    [invites],
  )

  const filteredInvites = useMemo(
    () =>
      [...invites].sort((a, b) =>
        (a.identifier ?? a.email).localeCompare(b.identifier ?? b.email, undefined, {
          numeric: true,
        }),
      ),
    [invites],
  )

  const handleBulkAdd = () => {
    const entries = parseBulkLines(bulkText, bulkRole)
    if (entries.length === 0) {
      setError(
        bulkRole === 'COORDINATOR'
          ? 'Add one email per line for coordinators'
          : bulkRole === 'TEACHER'
            ? 'Add one teacher email per line (e.g. teacher@charusat.ac.in)'
            : 'Add one ID per line (e.g. 24ABC123)',
      )
      return
    }
    setError('')
    setBulkResult(null)
    bulkCreateMutation.mutate({ role: bulkRole, entries })
  }

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if ((addRole === 'COORDINATOR' || addRole === 'TEACHER') && !email.trim()) return
    if (addRole === 'STUDENT' && !identifier.trim()) return
    setError('')
    createMutation.mutate({
      role: addRole,
      identifier: addRole === 'STUDENT' ? identifier.trim().toUpperCase() : undefined,
      email:
        addRole === 'COORDINATOR' || addRole === 'TEACHER'
          ? email.trim().toLowerCase()
          : undefined,
    })
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Revoke this account? They will not be able to sign in.')) return
    deleteMutation.mutate(id)
  }

  const handleOpenRoster = (invite: AccountInvite) => {
    const roll = invite.identifier ?? ''
    setRosterInvite(invite)
    setRosterName('')
    setRosterDepartment(roll ? deriveDepartmentFromRollNumber(roll) : '')
    setRosterSemester('')
    setRosterBatch(roll ? deriveBatchFromRollNumber(roll) : '')
    setError('')
  }

  const handleAddToRoster = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rosterInvite?.identifier) return
    setError('')
    const roll = rosterInvite.identifier
    rosterMutation.mutate({
      rollNumber: roll,
      name: rosterName.trim(),
      department: rosterDepartment.trim() || deriveDepartmentFromRollNumber(roll),
      semester: Number.parseInt(rosterSemester, 10),
      batch: rosterBatch.trim() || deriveBatchFromRollNumber(roll),
    })
  }

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant animate-pulse">Loading invites...</div>
  }

  return (
    <div className="bg-surface-container-lowest shadow rounded-lg p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Account Management</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Accounts are ready immediately — users sign in with Google using their institutional email.
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
              showBulkForm
                ? 'bg-primary text-white hover:bg-primary-container'
                : 'bg-surface-container-low text-primary hover:bg-surface-container'
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
              showSingleForm
                ? 'bg-primary text-white hover:bg-primary-container'
                : 'bg-surface-container-low text-primary hover:bg-surface-container'
            }`}
          >
            {showSingleForm ? 'Close Add Single' : 'Add Single'}
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

      {(error || queryError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error || 'Failed to load accounts'}</p>
        </div>
      )}

      {showBulkForm && (
        <BulkInviteForm
          bulkText={bulkText}
          bulkRole={bulkRole}
          bulkResult={bulkResult}
          isPending={bulkCreateMutation.isPending}
          onBulkTextChange={setBulkText}
          onBulkRoleChange={setBulkRole}
          onSubmit={handleBulkAdd}
        />
      )}

      {showSingleForm && (
        <SingleInviteForm
          addRole={addRole}
          identifier={identifier}
          email={email}
          previewEmail={previewEmail}
          isPending={createMutation.isPending}
          onAddRoleChange={setAddRole}
          onIdentifierChange={setIdentifier}
          onEmailChange={setEmail}
          onSubmit={handleSingleAdd}
        />
      )}

      <InviteTable
        invites={filteredInvites}
        roleFilter={roleFilter}
        page={page}
        totalPages={totalPages}
        totalInvites={totalInvites}
        loading={loading}
        onRoleFilterChange={setRoleFilter}
        onPageChange={setPage}
        onDelete={handleDelete}
        onOpenRoster={handleOpenRoster}
      />

      {rosterInvite && (
        <RosterDialog
          invite={rosterInvite}
          rosterName={rosterName}
          rosterDepartment={rosterDepartment}
          rosterSemester={rosterSemester}
          rosterBatch={rosterBatch}
          isPending={rosterMutation.isPending}
          onNameChange={setRosterName}
          onDepartmentChange={setRosterDepartment}
          onSemesterChange={setRosterSemester}
          onBatchChange={setRosterBatch}
          onSubmit={handleAddToRoster}
          onClose={() => setRosterInvite(null)}
        />
      )}
    </div>
  )
}

export default AccountInvites
