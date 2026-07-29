import { useState, useEffect } from 'react';
import { createSubject, createAssessment, getSubjects } from '../../api/subjects';
import type { Subject } from '../../api/subjects';

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('IT');
  const [semester, setSemester] = useState(5);
  const [assessmentName, setAssessmentName] = useState('Internal 1');
  const [maxMarks, setMaxMarks] = useState(50);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const data = await getSubjects();
    setSubjects(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createSubject({ code, name, department, semester });
      setCode('');
      setName('');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      await createAssessment(selectedSubjectId, { name: assessmentName, maxMarks });
      load();
    } catch {
      setError('Failed to add assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Add Subject</h3>
        <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input required placeholder="Code (IT301)" value={code} onChange={(e) => setCode(e.target.value)} className="border rounded px-3 py-2" />
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2" />
          <input required placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="border rounded px-3 py-2" />
          <input required type="number" min={1} value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="border rounded px-3 py-2" />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
            Add Subject
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Add Assessment (Internal 1, 2…)</h3>
        <form onSubmit={handleAddAssessment} className="flex flex-wrap gap-4 items-end">
          <select required value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="border rounded px-3 py-2 min-w-[200px]">
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
          <input required placeholder="Assessment name" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} className="border rounded px-3 py-2" />
          <input required type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} className="border rounded px-3 py-2 w-24" />
          <button type="submit" disabled={loading} className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50">
            Add Assessment
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subjects.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-sm font-medium">{s.code}</td>
                <td className="px-4 py-3 text-sm">{s.name}</td>
                <td className="px-4 py-3 text-sm">{s.department}</td>
                <td className="px-4 py-3 text-sm">{s.semester}</td>
                <td className="px-4 py-3 text-sm">{s.assessments?.map((a) => a.name).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectsManagement;
