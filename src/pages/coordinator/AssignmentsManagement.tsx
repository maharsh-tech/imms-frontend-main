import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAssignments,
  createAssignment,
  deleteAssignment,
  getSubjects,
  getFaculty,
} from '../../api/subjects';
import type { SubjectAssignment, Subject, Faculty } from '../../api/subjects';

const CURRENT_YEAR = '2025-2026';

const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [semester, setSemester] = useState(5);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [a, s, f] = await Promise.all([getAssignments(), getSubjects(), getFaculty()]);
    setAssignments(a);
    setSubjects(s);
    setFaculty(f);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAssignment({ subjectId, facultyId, semester, academicYear: CURRENT_YEAR });
      load();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    await deleteAssignment(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Assign Teacher to Subject</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
          <select required value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="border rounded px-3 py-2 min-w-[180px]">
            <option value="">Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code}</option>
            ))}
          </select>
          <select required value={facultyId} onChange={(e) => setFacultyId(e.target.value)} className="border rounded px-3 py-2 min-w-[180px]">
            <option value="">Teacher</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <input type="number" min={1} value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="border rounded px-3 py-2 w-20" />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
            Assign
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 text-sm font-medium">{a.subject.code} — {a.subject.name}</td>
                <td className="px-4 py-3 text-sm">{a.faculty.name}</td>
                <td className="px-4 py-3 text-sm">{a.semester}</td>
                <td className="px-4 py-3 text-sm space-x-2">
                  {a.subject.assessments?.map((ass) => (
                    <Link
                      key={ass.id}
                      to={`/coordinator/marks/${a.id}/${ass.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {ass.name} (NE/Publish)
                    </Link>
                  ))}
                  <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:underline ml-2">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignmentsManagement;
