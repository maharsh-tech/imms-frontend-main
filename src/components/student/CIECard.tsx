type SubjectRow = {
  code: string
  name: string
  maxMarks: number
  display: string
}

type CIECardProps = {
  name: string
  sequence: number
  subjects: SubjectRow[]
}

const isStatusFlag = (display: string): boolean => {
  const value = display.trim().toUpperCase()
  return value === 'NE' || value === 'AB' || value === '—' || value === '-'
}

/** CIE round card — subjects listed with marks for one exam round. */
const CIECard = ({ name, sequence, subjects }: CIECardProps) => {
  const subjectCount = subjects.length
  const subjectLabel = subjectCount === 1 ? '1 subject' : `${subjectCount} subjects`

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-start justify-between gap-3 border-b border-surface-variant p-4">
        <div className="min-w-0">
          <h2 className="text-title-lg leading-tight text-primary">{name}</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">CIE round {sequence}</p>
        </div>
        <span className="shrink-0 rounded bg-primary-container px-2 py-1 text-label-sm text-on-primary-container">
          {subjectLabel}
        </span>
      </div>

      {subjectCount === 0 ? (
        <div className="flex flex-grow flex-col items-center justify-center px-4 py-xl">
          <p className="text-label-md text-on-surface-variant">Results Awaited</p>
        </div>
      ) : (
        <div className="flex-grow p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-variant text-left">
                <th className="pb-2 text-label-sm uppercase text-on-surface-variant">Subject</th>
                <th className="pb-2 text-center text-label-sm uppercase text-on-surface-variant">
                  Max
                </th>
                <th className="pb-2 text-right text-label-sm uppercase text-on-surface-variant">
                  Marks
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => {
                const isFlag = isStatusFlag(subject.display)
                return (
                  <tr
                    key={subject.code}
                    className="min-h-12 transition-colors hover:bg-surface-container-low"
                  >
                    <td className="py-4 text-body-md text-on-surface">
                      {subject.code} — {subject.name}
                    </td>
                    <td className="py-4 text-center text-body-md text-on-surface">
                      {subject.maxMarks}
                    </td>
                    <td
                      className={`py-4 text-right text-body-md font-bold ${
                        isFlag ? 'text-error' : 'text-primary'
                      }`}
                    >
                      {subject.display}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

export default CIECard
