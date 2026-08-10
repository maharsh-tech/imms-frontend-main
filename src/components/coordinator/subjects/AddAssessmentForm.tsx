import type { Subject, CieRound } from '../../../api/subjects'

type AddAssessmentFormProps = {
  subjects: Subject[]
  selectedSubjectId: string
  academicYear: string
  semester: number
  cieRoundName: string
  cieRounds: CieRound[]
  maxMarks: number | ''
  examDate: string
  examTime: string
  isPending: boolean
  onSubjectChange: (id: string) => void
  onAcademicYearChange: (value: string) => void
  onSemesterChange: (value: number) => void
  onCieRoundChange: (value: string) => void
  onMaxMarksChange: (value: number | '') => void
  onExamDateChange: (value: string) => void
  onExamTimeChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

const AddAssessmentForm = ({
  subjects,
  selectedSubjectId,
  academicYear,
  semester,
  cieRoundName,
  cieRounds,
  maxMarks,
  examDate,
  examTime,
  isPending,
  onSubjectChange,
  onAcademicYearChange,
  onSemesterChange,
  onCieRoundChange,
  onMaxMarksChange,
  onExamDateChange,
  onExamTimeChange,
  onSubmit,
}: AddAssessmentFormProps) => (
  <div className="bg-surface-container-lowest rounded-lg shadow p-6 border border-outline-variant">
    <h3 className="text-lg font-semibold mb-4">Add CIE Exam</h3>
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <select
        required
        value={selectedSubjectId}
        onChange={(e) => onSubjectChange(e.target.value)}
        className="border rounded px-3 py-2 bg-surface-container-lowest"
        aria-label="Subject"
      >
        <option value="">Select subject</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.code} — {s.name}
          </option>
        ))}
      </select>
      <input
        required
        placeholder="Academic year (2025-2026)"
        value={academicYear}
        onChange={(e) => onAcademicYearChange(e.target.value)}
        className="border rounded px-3 py-2"
        aria-label="Academic year"
      />
      <input
        type="number"
        required
        min={1}
        value={semester}
        onChange={(e) => onSemesterChange(Number(e.target.value))}
        className="border rounded px-3 py-2"
        aria-label="Semester"
      />
      <div className="relative">
        <input
          required
          list="cie-round-options"
          placeholder="CIE round (e.g. CIE-1)"
          value={cieRoundName}
          onChange={(e) => onCieRoundChange(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          aria-label="CIE round"
        />
        <datalist id="cie-round-options">
          {cieRounds.map((round) => (
            <option key={round.id} value={round.name} />
          ))}
        </datalist>
      </div>
      <input
        required
        type="number"
        placeholder="Max marks"
        value={maxMarks}
        onChange={(e) => onMaxMarksChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="border rounded px-3 py-2"
        aria-label="Max marks"
      />
      <input
        type="date"
        value={examDate}
        onChange={(e) => onExamDateChange(e.target.value)}
        className="border rounded px-3 py-2"
        aria-label="Exam date"
      />
      <input
        placeholder="Exam time (e.g. 10:00 AM)"
        value={examTime}
        onChange={(e) => onExamTimeChange(e.target.value)}
        className="border rounded px-3 py-2"
        aria-label="Exam time"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50 cursor-pointer"
      >
        Add CIE Exam
      </button>
    </form>
  </div>
)

export default AddAssessmentForm
