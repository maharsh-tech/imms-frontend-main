import type { Subject } from '../../../api/subjects'

type AddAssessmentFormProps = {
  subjects: Subject[]
  selectedSubjectId: string
  assessmentName: string
  maxMarks: number | ''
  examDate: string
  examTime: string
  isPending: boolean
  onSubjectChange: (id: string) => void
  onNameChange: (value: string) => void
  onMaxMarksChange: (value: number | '') => void
  onExamDateChange: (value: string) => void
  onExamTimeChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

const AddAssessmentForm = ({
  subjects,
  selectedSubjectId,
  assessmentName,
  maxMarks,
  examDate,
  examTime,
  isPending,
  onSubjectChange,
  onNameChange,
  onMaxMarksChange,
  onExamDateChange,
  onExamTimeChange,
  onSubmit,
}: AddAssessmentFormProps) => (
  <div className="bg-surface-container-lowest rounded-lg shadow p-6 border border-outline-variant">
    <h3 className="text-lg font-semibold mb-4">Add Assessment</h3>
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <select
        required
        value={selectedSubjectId}
        onChange={(e) => onSubjectChange(e.target.value)}
        className="border rounded px-3 py-2 bg-surface-container-lowest"
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
        placeholder="Assessment name"
        value={assessmentName}
        onChange={(e) => onNameChange(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <input
        required
        type="number"
        placeholder="Max marks"
        value={maxMarks}
        onChange={(e) => onMaxMarksChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="border rounded px-3 py-2"
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
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50 cursor-pointer"
      >
        Add Assessment
      </button>
    </form>
  </div>
)

export default AddAssessmentForm
