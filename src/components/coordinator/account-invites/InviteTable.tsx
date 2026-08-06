import { Copy, Check, Trash2, UserPlus } from 'lucide-react'
import type { AccountInvite } from '../../../types'
import type { RoleFilter } from './account-invite-utils'

type InviteTableProps = {
  invites: AccountInvite[]
  roleFilter: RoleFilter
  page: number
  totalPages: number
  totalInvites: number
  loading: boolean
  linkLoadingId: string | null
  copiedKey: string | null
  onRoleFilterChange: (role: RoleFilter) => void
  onPageChange: (page: number) => void
  onCopyActivationLink: (invite: AccountInvite) => void
  onDelete: (id: string) => void
  onOpenRoster: (invite: AccountInvite) => void
}

const InviteTable = ({
  invites,
  roleFilter,
  page,
  totalPages,
  totalInvites,
  loading,
  linkLoadingId,
  copiedKey,
  onRoleFilterChange,
  onPageChange,
  onCopyActivationLink,
  onDelete,
  onOpenRoster,
}: InviteTableProps) => (
  <>
    <div className="flex gap-2 mb-4">
      {(['STUDENT', 'TEACHER', 'COORDINATOR', 'ALL'] as RoleFilter[]).map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onRoleFilterChange(role)}
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
          {invites.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-on-surface-variant">
                No accounts in this category.
              </td>
            </tr>
          ) : (
            invites.map((invite) => (
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
                      onClick={() => onOpenRoster(invite)}
                      className="inline-flex items-center text-green-700 hover:text-green-900 text-xs font-medium"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add to roster
                    </button>
                  )}
                  {!invite.isActivated && (
                    <button
                      type="button"
                      onClick={() => onCopyActivationLink(invite)}
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
                    onClick={() => onDelete(invite.id)}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant bg-surface-container-low text-sm">
          <span className="text-on-surface-variant">
            Page {page} of {totalPages} · {totalInvites} accounts
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1 rounded-md border border-outline-variant disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1 rounded-md border border-outline-variant disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  </>
)

export default InviteTable
