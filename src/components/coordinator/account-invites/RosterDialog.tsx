import { X } from 'lucide-react'
import type { AccountInvite } from '../../../types'

type RosterDialogProps = {
  invite: AccountInvite
  rosterName: string
  rosterDepartment: string
  rosterSemester: string
  rosterBatch: string
  isPending: boolean
  onNameChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onSemesterChange: (value: string) => void
  onBatchChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

const RosterDialog = ({
  invite,
  rosterName,
  rosterDepartment,
  rosterSemester,
  rosterBatch,
  isPending,
  onNameChange,
  onDepartmentChange,
  onSemesterChange,
  onBatchChange,
  onSubmit,
  onClose,
}: RosterDialogProps) => (
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
            <span className="font-mono font-medium">{invite.identifier}</span> — student does not
            need to activate first.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-outline hover:text-on-surface-variant"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Roll number</label>
          <input
            type="text"
            readOnly
            value={invite.identifier ?? ''}
            className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm font-mono bg-surface-container-low"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">Full name</label>
          <input
            type="text"
            required
            value={rosterName}
            onChange={(e) => onNameChange(e.target.value)}
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
              onChange={(e) => onDepartmentChange(e.target.value)}
              placeholder="Auto from roll number"
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
              onChange={(e) => onSemesterChange(e.target.value)}
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
            onChange={(e) => onBatchChange(e.target.value)}
            placeholder="Auto from roll number"
            className="w-full px-3 py-2 border border-outline-variant rounded-md text-sm"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50"
          >
            {isPending ? 'Adding…' : 'Add student'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-on-surface border border-outline-variant rounded-md hover:bg-surface-container-low"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)

export default RosterDialog
