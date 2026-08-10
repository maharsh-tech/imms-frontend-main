import { memo, type CSSProperties } from 'react'

export type MarksGridRowState = {
  studentId: string
  rollNumber: string
  name: string
  marksObtained: string
  isAb: boolean
  isNe: boolean
}

export type MarksGridRowProps = {
  row: MarksGridRowState
  displayIndex: number
  isDraft: boolean
  isCoordinator: boolean
  isTeacher: boolean
  maxMarks: number
  onUpdateRow: (patch: Partial<MarksGridRowState>) => void
  style?: CSSProperties
}

export const MarksGridRow = memo(function MarksGridRow({
  row,
  displayIndex,
  isDraft,
  isCoordinator,
  isTeacher,
  maxMarks,
  onUpdateRow,
  style,
}: MarksGridRowProps) {
  // Client-side UX affordance only — the backend remains authoritative for maxMarks.
  const overMax = row.marksObtained !== '' && Number(row.marksObtained) > maxMarks
  const marksErrorId = `marks-error-${row.studentId}`

  return (
    <tr className={row.isNe ? 'bg-amber-50' : ''} style={style}>
      <td className="px-4 py-2 text-sm">{displayIndex + 1}</td>
      <td className="px-4 py-2 text-sm font-mono">{row.rollNumber}</td>
      <td className="px-4 py-2 text-sm">{row.name}</td>
      <td className="px-4 py-2">
        {(isTeacher || isCoordinator) && isDraft ? (
          <div className="flex flex-wrap items-center gap-3 whitespace-nowrap">
            <input
              type="number"
              min={0}
              max={maxMarks}
              value={row.isAb ? '' : row.marksObtained}
              disabled={row.isAb}
              onChange={(e) => {
                const val = e.target.value
                if (val !== '' && Number(val) < 0) return
                onUpdateRow({ marksObtained: val })
              }}
              className={`imms-input w-20 py-1 text-sm ${overMax ? 'border-error focus:border-error' : ''}`}
              aria-label={`Marks for ${row.name}`}
              aria-invalid={overMax}
              aria-describedby={overMax ? marksErrorId : undefined}
            />
            {isCoordinator && (
              <label className="flex cursor-pointer items-center gap-1.5 text-label-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={row.isNe}
                  disabled={!isDraft}
                  onChange={(e) => onUpdateRow({ isNe: e.target.checked })}
                  className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                  aria-label={`NE ${row.name}`}
                />
                <span>NE</span>
              </label>
            )}
            {isTeacher && row.isNe && (
              <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                NE
              </span>
            )}
            {(isTeacher || isCoordinator) && (
              <label className="flex cursor-pointer items-center gap-1.5 text-label-sm text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={row.isAb}
                  disabled={!isDraft}
                  onChange={(e) =>
                    onUpdateRow({
                      isAb: e.target.checked,
                      marksObtained: e.target.checked ? '' : row.marksObtained,
                    })
                  }
                  className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                  aria-label={`Mark ${row.name} absent (AB)`}
                />
                <span>AB</span>
              </label>
            )}
            {overMax && (
              <span id={marksErrorId} className="text-xs font-medium text-error">
                Max {maxMarks}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm">
            {row.isNe && row.isAb ? 'AB+NE' : row.isAb ? 'AB' : row.marksObtained || '—'}
            {row.isNe && isTeacher && (
              <span className="ml-1.5 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                NE
              </span>
            )}
            {row.isNe && row.marksObtained && isCoordinator && (
              <span className="text-on-surface-variant text-xs ml-1">(NE flagged)</span>
            )}
          </span>
        )}
      </td>
    </tr>
  )
})
