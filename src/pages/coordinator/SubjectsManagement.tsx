import { useState, useEffect, useMemo } from 'react';
import {
  createSubject,
  createAssessment,
  updateSubject,
  deleteSubject,
  updateAssessment,
  deleteAssessment,
  getSubjects,
} from '../../api/subjects';
import type { Assessment, Subject } from '../../api/subjects';

const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (message) return message;
  }
  return err instanceof Error ? err.message : fallback;
};

const formatExamDate = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 10);
};

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('IT');
  const [semester, setSemester] = useState(5);
  const [creditHours, setCreditHours] = useState('');

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [assessmentName, setAssessmentName] = useState('Internal 1');
  const [maxMarks, setMaxMarks] = useState(50);
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSemester, setEditSemester] = useState(5);
  const [editCreditHours, setEditCreditHours] = useState('');

  const [editingAssessment, setEditingAssessment] = useState<{
    subjectId: string;
    assessment: Assessment;
  } | null>(null);
  const [editAssessmentName, setEditAssessmentName] = useState('');
  const [editMaxMarks, setEditMaxMarks] = useState(50);
  const [editExamDate, setEditExamDate] = useState('');
  const [editExamTime, setEditExamTime] = useState('');

  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const departments = useMemo(
    () => [...new Set(subjects.map((s) => s.department))].sort(),
    [subjects],
  );

  const semesters = useMemo(
    () => [...new Set(subjects.map((s) => s.semester))].sort((a, b) => a - b),
    [subjects],
  );

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subjects.filter((s) => {
      if (filterDepartment && s.department !== filterDepartment) return false;
      if (filterSemester && s.semester !== Number(filterSemester)) return false;
      if (!q) return true;
      return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    });
  }, [subjects, search, filterDepartment, filterSemester]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createSubject({
        code,
        name,
        department,
        semester,
        ...(creditHours ? { creditHours: Number(creditHours) } : {}),
      });
      setCode('');
      setName('');
      setCreditHours('');
      setMessage('Subject created');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to create subject'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createAssessment(selectedSubjectId, {
        name: assessmentName,
        maxMarks,
        ...(examDate ? { examDate } : {}),
        ...(examTime ? { examTime } : {}),
      });
      setMessage('Assessment added — go to Assignments tab, click the exam link, and set NE students before marks entry.');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to add assessment'));
    } finally {
      setLoading(false);
    }
  };

  const startEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditName(subject.name);
    setEditDepartment(subject.department);
    setEditSemester(subject.semester);
    setEditCreditHours(subject.creditHours != null ? String(subject.creditHours) : '');
  };

  const handleSaveSubject = async (subjectId: string) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await updateSubject(subjectId, {
        name: editName,
        department: editDepartment,
        semester: editSemester,
        ...(editCreditHours ? { creditHours: Number(editCreditHours) } : { creditHours: undefined }),
      });
      setEditingSubjectId(null);
      setMessage('Subject updated');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to update subject'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subject: Subject) => {
    if (!confirm(`Delete ${subject.code} — ${subject.name}? This cannot be undone.`)) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await deleteSubject(subject.id);
      setMessage('Subject deleted');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to delete subject'));
    } finally {
      setLoading(false);
    }
  };

  const startEditAssessment = (subjectId: string, assessment: Assessment) => {
    setEditingAssessment({ subjectId, assessment });
    setEditAssessmentName(assessment.name);
    setEditMaxMarks(Number(assessment.maxMarks));
    setEditExamDate(formatExamDate(assessment.examDate));
    setEditExamTime(assessment.examTime ?? '');
  };

  const handleSaveAssessment = async () => {
    if (!editingAssessment) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await updateAssessment(editingAssessment.subjectId, editingAssessment.assessment.id, {
        name: editAssessmentName,
        maxMarks: editMaxMarks,
        examDate: editExamDate || undefined,
        examTime: editExamTime || undefined,
      });
      setEditingAssessment(null);
      setMessage('Assessment updated');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to update assessment'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (subjectId: string, assessment: Assessment) => {
    if (!confirm(`Delete assessment "${assessment.name}"?`)) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await deleteAssessment(subjectId, assessment.id);
      setMessage('Assessment deleted');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to delete assessment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-700">{message}</div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Add Subject</h3>
        <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input required placeholder="Code (IT301)" value={code} onChange={(e) => setCode(e.target.value)} className="border rounded px-3 py-2" />
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2" />
          <input required placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="border rounded px-3 py-2" />
          <input required type="number" placeholder="Semester" value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="border rounded px-3 py-2" />
          <input type="number" placeholder="Credit hours (optional)" value={creditHours} onChange={(e) => setCreditHours(e.target.value)} className="border rounded px-3 py-2" />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50">
            Add Subject
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Add Assessment</h3>
        <form onSubmit={handleAddAssessment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <select required value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
          <input required placeholder="Assessment name" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} className="border rounded px-3 py-2" />
          <input required type="number" placeholder="Max marks" value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} className="border rounded px-3 py-2" />
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="border rounded px-3 py-2" aria-label="Exam date" />
          <input placeholder="Exam time (e.g. 10:00 AM)" value={examTime} onChange={(e) => setExamTime(e.target.value)} className="border rounded px-3 py-2" />
          <button type="submit" disabled={loading} className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50">
            Add Assessment
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200 flex flex-wrap gap-3">
        <input
          placeholder="Search code or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-[180px]"
        />
        <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All semesters</option>
          {semesters.map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        {loading && subjects.length === 0 ? (
          <p className="p-6 text-center text-gray-500">Loading...</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessments</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubjects.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-sm font-medium">{s.code}</td>
                  {editingSubjectId === s.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
                      </td>
                      <td className="px-4 py-3">
                        <input value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={editSemester} onChange={(e) => setEditSemester(Number(e.target.value))} className="border rounded px-2 py-1 text-sm w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={editCreditHours} onChange={(e) => setEditCreditHours(e.target.value)} className="border rounded px-2 py-1 text-sm w-20" placeholder="—" />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm">{s.name}</td>
                      <td className="px-4 py-3 text-sm">{s.department}</td>
                      <td className="px-4 py-3 text-sm">{s.semester}</td>
                      <td className="px-4 py-3 text-sm">{s.creditHours ?? '—'}</td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {s.assessments?.length ? (
                        s.assessments.map((a) => (
                          <span key={a.id} className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs">
                            {a.name} ({Number(a.maxMarks)})
                            {a.examDate && <span className="text-gray-500">· {formatExamDate(a.examDate)}</span>}
                            <button type="button" onClick={() => startEditAssessment(s.id, a)} className="text-blue-600 hover:underline" aria-label={`Edit ${a.name}`}>Edit</button>
                            <button type="button" onClick={() => handleDeleteAssessment(s.id, a)} className="text-red-600 hover:underline" aria-label={`Delete ${a.name}`}>Del</button>
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {editingSubjectId === s.id ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleSaveSubject(s.id)} disabled={loading} className="text-green-600 hover:underline">Save</button>
                        <button type="button" onClick={() => setEditingSubjectId(null)} className="text-gray-600 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEditSubject(s)} className="text-blue-600 hover:underline">Edit</button>
                        <button type="button" onClick={() => handleDeleteSubject(s)} className="text-red-600 hover:underline">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredSubjects.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">No subjects found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editingAssessment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Edit Assessment</h3>
            <div className="space-y-3">
              <input value={editAssessmentName} onChange={(e) => setEditAssessmentName(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="Name" />
              <input type="number" value={editMaxMarks} onChange={(e) => setEditMaxMarks(Number(e.target.value))} className="border rounded px-3 py-2 w-full" placeholder="Max marks" />
              <input type="date" value={editExamDate} onChange={(e) => setEditExamDate(e.target.value)} className="border rounded px-3 py-2 w-full" aria-label="Exam date" />
              <input value={editExamTime} onChange={(e) => setEditExamTime(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="Exam time" />
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingAssessment(null)} className="px-4 py-2 text-gray-600 hover:underline">Cancel</button>
              <button type="button" onClick={handleSaveAssessment} disabled={loading} className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsManagement;
