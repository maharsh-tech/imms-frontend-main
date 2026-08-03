type AssessmentRow = {
  name: string
  maxMarks: number
  display: string
}

type SubjectCardProps = {
  code: string
  name: string
  assessments: AssessmentRow[]
}

const isStatusFlag = (display: string): boolean => {
  const value = display.trim().toUpperCase()
  return value === 'NE' || value === 'AB' || value === '—' || value === '-'
}

/**
 * Subject result card — table of exams or "Results Awaited" empty state.
 */
const SubjectCard = ({ code, name, assessments }: SubjectCardProps) => {
  const examCount = assessments.length
  const examLabel = examCount === 1 ? '1 exam' : `${examCount} exams`

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-start justify-between gap-3 border-b border-surface-variant p-4">
        <div className="min-w-0">
          <h2 className="text-title-lg leading-tight text-primary">
            {code} - {name.toUpperCase()}
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">{name}</p>
        </div>
        <span className="shrink-0 rounded bg-primary-container px-2 py-1 text-label-sm text-on-primary-container">
          {examLabel}
        </span>
      </div>

      {examCount === 0 ? (
        <div className="flex flex-grow flex-col items-center justify-center px-4 py-xl">
          <svg
            className="mb-2 h-10 w-10 text-on-surface-variant"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <circle cx="12" cy="14" r="3" />
            <path d="M12 13v1l.5.5" />
          </svg>
          <p className="text-label-md text-on-surface-variant">Results Awaited</p>
        </div>
      ) : (
        <div className="flex-grow p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-variant text-left">
                <th className="pb-2 text-label-sm uppercase text-on-surface-variant">Exam</th>
                <th className="pb-2 text-center text-label-sm uppercase text-on-surface-variant">
                  Max
                </th>
                <th className="pb-2 text-right text-label-sm uppercase text-on-surface-variant">
                  Marks
                </th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => {
                const isFlag = isStatusFlag(assessment.display)
                return (
                  <tr
                    key={assessment.name}
                    className="min-h-12 transition-colors hover:bg-surface-container-low"
                  >
                    <td className="py-4 text-body-md text-on-surface">{assessment.name}</td>
                    <td className="py-4 text-center text-body-md text-on-surface">
                      {assessment.maxMarks}
                    </td>
                    <td
                      className={`py-4 text-right text-body-md font-bold ${
                        isFlag ? 'text-error' : 'text-primary'
                      }`}
                    >
                      {assessment.display}
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

export default SubjectCard
