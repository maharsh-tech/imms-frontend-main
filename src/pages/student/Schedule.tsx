import { CalendarDays } from 'lucide-react'

/**
 * Schedule placeholder — nav destination from design; no schedule API yet.
 */
const StudentSchedule = () => {
  return (
    <section>
      <h1 className="mb-1 text-headline-lg-mobile text-primary lg:text-headline-lg">
        Schedule
      </h1>
      <p className="mb-xl text-body-md text-on-surface-variant">
        Upcoming exams and academic dates
      </p>
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center py-xl text-center">
          <CalendarDays className="mb-2 h-10 w-10 text-on-surface-variant" aria-hidden="true" />
          <p className="text-label-md text-on-surface-variant">No schedule available</p>
        </div>
      </div>
    </section>
  )
}

export default StudentSchedule
