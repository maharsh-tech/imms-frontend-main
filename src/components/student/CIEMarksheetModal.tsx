import { useEffect, useRef } from 'react'
import { X, Download } from 'lucide-react'
import { downloadMarksheetPdf } from '../../utils/marksheet-pdf'

export type CieRoundSubject = {
  code: string
  name: string
  maxMarks: number
  display: string
}

export type CieRound = {
  name: string
  sequence: number
  academicYear: string
  semester: number
  subjects: CieRoundSubject[]
}

type CIEMarksheetModalProps = {
  round: CieRound
  rollNumber: string
  onClose: () => void
}

const isStatusFlag = (display: string): boolean => {
  const value = display.trim().toUpperCase()
  return value === 'NE' || value === 'AB' || value === '—' || value === '-'
}

/** Marksheet modal for one exam round — exact table Subject / Marks Obtained / Total Marks. */
const CIEMarksheetModal = ({ round, rollNumber, onClose }: CIEMarksheetModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    return () => previousFocus?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleDownload = () => {
    downloadMarksheetPdf({
      examName: round.name,
      rollNumber,
      rows: round.subjects.map((subject) => ({
        subject: `${subject.code} — ${subject.name}`,
        marksObtained: subject.display,
        totalMarks: subject.maxMarks,
      })),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg focus-visible:outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Marksheet for ${round.name}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-surface-variant p-4">
          <h3 className="text-title-lg font-semibold text-primary">{round.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Close marksheet"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {round.subjects.length === 0 ? (
            <p className="py-xl text-center text-label-md text-on-surface-variant">
              Results Awaited
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-variant text-left">
                  <th className="pb-2 text-label-sm uppercase text-on-surface-variant">Subject</th>
                  <th className="pb-2 text-center text-label-sm uppercase text-on-surface-variant">
                    Marks Obtained
                  </th>
                  <th className="pb-2 text-right text-label-sm uppercase text-on-surface-variant">
                    Total Marks
                  </th>
                </tr>
              </thead>
              <tbody>
                {round.subjects.map((subject) => {
                  const isFlag = isStatusFlag(subject.display)
                  return (
                    <tr
                      key={subject.code}
                      className="min-h-12 transition-colors hover:bg-surface-container-low"
                    >
                      <td className="py-4 text-body-md text-on-surface">
                        {subject.code} — {subject.name}
                      </td>
                      <td
                        className={`py-4 text-center text-body-md font-bold ${
                          isFlag ? 'text-error' : 'text-primary'
                        }`}
                      >
                        {subject.display}
                      </td>
                      <td className="py-4 text-right text-body-md text-on-surface">
                        {subject.maxMarks}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-variant p-4">
          <button
            type="button"
            onClick={onClose}
            className="imms-btn-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-label-md font-semibold"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="imms-btn-primary inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-label-md font-semibold"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default CIEMarksheetModal
