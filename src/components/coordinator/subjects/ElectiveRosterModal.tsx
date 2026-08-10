import type { ImportResult } from '../../../types'
import ExcelImportCard from '../../shared/ExcelImportCard'

export type RosterMember = {
  id: string
  studentId: string
  student: {
    rollNumber: string
    name: string
  }
}

type ElectiveRosterModalProps = {
  title: string
  description: string
  enrollments: RosterMember[]
  rosterPaste: string
  rosterResult: ImportResult | null
  rosterLoading: boolean
  rosterPasteRef: React.RefObject<HTMLTextAreaElement | null>
  onDownloadTemplate: () => Promise<void>
  onImport: (file: File) => Promise<ImportResult>
  onPasteChange: (value: string) => void
  onPasteEnroll: () => void
  onRemoveEnrollment: (studentId: string) => void
  onImportComplete: () => void
  onClose: () => void
}

const ElectiveRosterModal = ({
  title,
  description,
  enrollments,
  rosterPaste,
  rosterResult,
  rosterLoading,
  rosterPasteRef,
  onDownloadTemplate,
  onImport,
  onPasteChange,
  onPasteEnroll,
  onRemoveEnrollment,
  onImportComplete,
  onClose,
}: ElectiveRosterModalProps) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div className="bg-surface-container-lowest rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-outline-variant">
      <div className="p-6 border-b border-outline-variant">
        <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
        <p className="text-sm text-on-surface-variant mt-1">{description}</p>
      </div>
      <div className="p-6 space-y-6">
        <ExcelImportCard
          title="Import roll numbers"
          description="One roll number per row. Students must already exist in the student roster."
          onDownloadTemplate={onDownloadTemplate}
          onImport={onImport}
          onImportComplete={onImportComplete}
        />
        <div>
          <h4 className="text-sm font-medium text-on-surface mb-2">Or paste roll numbers</h4>
          <textarea
            ref={rosterPasteRef}
            value={rosterPaste}
            onChange={(e) => onPasteChange(e.target.value)}
            rows={5}
            placeholder={'24ABC123\n24ABC124\n24ABC125'}
            className="w-full border border-outline-variant rounded-md px-3 py-2 text-sm font-mono"
            aria-label="Paste roll numbers for roster"
          />
          <button
            type="button"
            onClick={onPasteEnroll}
            disabled={rosterLoading || !rosterPaste.trim()}
            className="mt-2 bg-purple-600 text-white rounded px-4 py-2 text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            Add pasted students
          </button>
        </div>
        {rosterResult && (
          <p className="text-sm text-on-surface-variant">
            Enrolled {rosterResult.imported}, skipped {rosterResult.skipped}
            {rosterResult.errors.length > 0 && `, ${rosterResult.errors.length} error(s)`}
          </p>
        )}
        <div>
          <h4 className="text-sm font-medium text-on-surface mb-2">
            Enrolled students ({enrollments.length})
          </h4>
          {enrollments.length === 0 ? (
            <p className="text-sm text-on-surface-variant italic">No students enrolled yet.</p>
          ) : (
            <ul className="divide-y divide-outline-variant border border-outline-variant rounded-md max-h-48 overflow-y-auto">
              {enrollments.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span>
                    {row.student.rollNumber} — {row.student.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveEnrollment(row.studentId)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-outline-variant flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-on-surface-variant hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)

export default ElectiveRosterModal
