import type { BulkCreateResult } from '../../../types'

type BulkInviteFormProps = {
  bulkText: string
  bulkRole: string
  bulkResult: BulkCreateResult | null
  isPending: boolean
  onBulkTextChange: (value: string) => void
  onBulkRoleChange: (value: string) => void
  onSubmit: () => void
}

const BulkInviteForm = ({
  bulkText,
  bulkRole,
  bulkResult,
  isPending,
  onBulkTextChange,
  onBulkRoleChange,
  onSubmit,
}: BulkInviteFormProps) => (
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
      onChange={(e) => onBulkTextChange(e.target.value)}
      rows={5}
      placeholder={
        bulkRole === 'COORDINATOR'
          ? 'coordinator@charusat.ac.in'
          : bulkRole === 'TEACHER'
            ? 'teacher1@charusat.ac.in\nteacher2@charusat.ac.in'
            : '24ABC123\n24ABC124\n24ABC125'
      }
      className="w-full border border-outline-variant rounded-md px-3 py-2 text-sm font-mono focus:ring-primary/20 focus:border-primary outline-none"
      aria-label="Bulk account creation"
    />
    <div className="flex flex-wrap gap-3 mt-3">
      <select
        value={bulkRole}
        onChange={(e) => onBulkRoleChange(e.target.value)}
        className="px-3 py-2 border border-outline-variant rounded-md text-sm bg-surface-container-lowest"
      >
        <option value="STUDENT">Students</option>
        <option value="TEACHER">Teachers</option>
        <option value="COORDINATOR">Coordinators</option>
      </select>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-container disabled:opacity-50 cursor-pointer"
      >
        {isPending ? 'Creating...' : 'Create accounts & download Excel'}
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
)

export default BulkInviteForm
