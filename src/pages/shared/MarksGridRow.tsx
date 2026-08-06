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
  return (
    <tr className={row.isNe ? 'bg-amber-50' : ''} style={style}>
      <td className="px-4 py-2 text-sm">{displayIndex + 1}</td>
      <td className="px-4 py-2 text-sm font-mono">{row.rollNumber}</td>
      <td className="px-4 py-2 text-sm">{row.name}</td>
      <td className="px-4 py-2">
        {(isTeacher || isCoordinator) && isDraft ? (
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
            className="imms-input w-20 py-1 text-sm"
            aria-label={`Marks for ${row.name}`}
          />
        ) : (
          <span className="text-sm">
            {row.isNe && row.isAb ? 'AB+NE' : row.isAb ? 'AB' : row.marksObtained || '—'}
            {row.isNe && row.marksObtained && isCoordinator && (
              <span className="text-on-surface-variant text-xs ml-1">(NE flagged)</span>
            )}
          </span>
        )}
      </td>
      {isCoordinator && (
        <td className="px-4 py-2 text-center">
          <input
            type="checkbox"
            checked={row.isNe}
            disabled={!isDraft}
            onChange={(e) => onUpdateRow({ isNe: e.target.checked })}
            aria-label={`NE ${row.name}`}
          />
        </td>
      )}
      {isTeacher && (
        <td className="px-4 py-2 text-center">
          {row.isNe ? (
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              NE
            </span>
          ) : (
            <span className="text-xs text-outline">—</span>
          )}
        </td>
      )}
      {(isTeacher || isCoordinator) && (
        <td className="relative z-[1] px-4 py-2 text-center">
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
        </td>
      )}
    </tr>
  )
})
