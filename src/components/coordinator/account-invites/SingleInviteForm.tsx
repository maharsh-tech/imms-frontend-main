import { UserPlus } from 'lucide-react'

type SingleInviteFormProps = {
  addRole: string
  identifier: string
  email: string
  previewEmail: string
  isPending: boolean
  onAddRoleChange: (value: string) => void
  onIdentifierChange: (value: string) => void
  onEmailChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

const SingleInviteForm = ({
  addRole,
  identifier,
  email,
  previewEmail,
  isPending,
  onAddRoleChange,
  onIdentifierChange,
  onEmailChange,
  onSubmit,
}: SingleInviteFormProps) => (
  <div className="bg-surface-container-low p-4 rounded-md mb-8 border border-outline-variant">
    <h3 className="text-lg font-medium text-on-surface mb-4 flex items-center">
      <UserPlus className="w-5 h-5 mr-2 text-primary" />
      Add account
    </h3>
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {addRole === 'STUDENT' ? (
          <input
            type="text"
            required
            placeholder="Roll number (e.g. 24IT093)"
            className="w-full sm:w-40 px-3 py-2 border border-outline-variant rounded-md text-sm font-mono uppercase"
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value.toUpperCase())}
            disabled={isPending}
          />
        ) : (
          <input
            type="email"
            required
            placeholder="nishatshaikh.it@charusat.ac.in"
            className="flex-1 px-3 py-2 border border-outline-variant rounded-md text-sm"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isPending}
          />
        )}
        <select
          className="w-full sm:w-40 px-3 py-2 border border-outline-variant rounded-md text-sm bg-surface-container-lowest"
          value={addRole}
          onChange={(e) => onAddRoleChange(e.target.value)}
          disabled={isPending}
        >
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Adding...' : 'Add'}
        </button>
      </div>
      {previewEmail && addRole === 'STUDENT' && (
        <p className="text-sm text-on-surface-variant">
          Email will be: <span className="font-mono text-on-surface">{previewEmail}</span>
        </p>
      )}
    </form>
  </div>
)

export default SingleInviteForm
