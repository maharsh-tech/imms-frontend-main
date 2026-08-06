type AddSubjectFormProps = {
  code: string
  name: string
  department: string
  semester: number
  isElective: boolean
  isPending: boolean
  onCodeChange: (value: string) => void
  onNameChange: (value: string) => void
  onDepartmentChange: (value: string) => void
  onSemesterChange: (value: number) => void
  onElectiveChange: (value: boolean) => void
  onSubmit: (e: React.FormEvent) => void
}

const AddSubjectForm = ({
  code,
  name,
  department,
  semester,
  isElective,
  isPending,
  onCodeChange,
  onNameChange,
  onDepartmentChange,
  onSemesterChange,
  onElectiveChange,
  onSubmit,
}: AddSubjectFormProps) => (
  <div className="bg-surface-container-lowest rounded-lg shadow p-6 border border-outline-variant">
    <h3 className="text-lg font-semibold mb-4">Add Subject</h3>
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <input
        required
        placeholder="Code (IT301)"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <input
        required
        placeholder="Name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <input
        required
        placeholder="Department"
        value={department}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <input
        required
        type="number"
        placeholder="Semester"
        value={semester}
        onChange={(e) => onSemesterChange(Number(e.target.value))}
        className="border rounded px-3 py-2"
      />
      <label className="flex items-center gap-2 text-sm text-on-surface border rounded px-3 py-2 sm:col-span-2">
        <input
          type="checkbox"
          checked={isElective}
          onChange={(e) => onElectiveChange(e.target.checked)}
          className="rounded border-outline-variant"
        />
        Elective subject (import student roster after create)
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-white rounded px-4 py-2 hover:bg-primary-container disabled:opacity-50 sm:col-span-2 lg:col-span-1 cursor-pointer"
      >
        Add Subject
      </button>
    </form>
  </div>
)

export default AddSubjectForm
