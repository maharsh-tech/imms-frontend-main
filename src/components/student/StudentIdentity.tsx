type StudentIdentityProps = {
  name: string
  rollNumber: string
  semester: number | null
}

/**
 * Marksheet identity row: name chip, roll number, semester.
 */
const StudentIdentity = ({ name, rollNumber, semester }: StudentIdentityProps) => {
  return (
    <section className="mb-xl">
      <h2 className="mb-1 text-headline-lg-mobile text-primary lg:text-headline-lg">
        My Marksheet
      </h2>
      <div className="flex flex-wrap items-center gap-2 text-on-surface-variant">
        <span className="rounded-full bg-secondary-container px-3 py-1 text-label-md text-on-secondary-container">
          {name.toUpperCase()}
        </span>
        <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden="true" />
        <span className="text-label-md">{rollNumber}</span>
        {semester != null && (
          <>
            <span className="h-1 w-1 rounded-full bg-outline-variant" aria-hidden="true" />
            <span className="text-label-md font-bold text-primary">Semester {semester}</span>
          </>
        )}
      </div>
    </section>
  )
}

export default StudentIdentity
