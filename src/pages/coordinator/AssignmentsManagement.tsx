import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getAssignments,
  createAssignment,
  deleteAssignment,
  getSubjects,
  getFaculty,
} from '../../api/subjects';
import { setNEVisibility } from '../../api/marks';
import type { SubjectAssignment, Subject, Faculty } from '../../api/subjects';
import SubmissionStatusBadge from '../../components/shared/SubmissionStatusBadge';

const defaultAcademicYear = () => {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (message) return message;
  }
  return err instanceof Error ? err.message : fallback;
};

const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [semester, setSemester] = useState(5);
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, s, f] = await Promise.all([getAssignments(), getSubjects(), getFaculty()]);
      setAssignments(a);
      setSubjects(s);
      setFaculty(f);
    } catch {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const academicYears = useMemo(
    () => [...new Set(assignments.map((a) => a.academicYear))].sort(),
    [assignments],
  );

  const semesters = useMemo(
    () => [...new Set(assignments.map((a) => a.semester))].sort((a, b) => a - b),
    [assignments],
  );

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId),
    [subjects, subjectId],
  );

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => {
      if (filterYear && a.academicYear !== filterYear) return false;
      if (filterSemester && a.semester !== Number(filterSemester)) return false;
      if (!q) return true;
      const haystack = `${a.subject.code} ${a.subject.name} ${a.faculty.name}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [assignments, search, filterYear, filterSemester]);

  const handleSubjectChange = (id: string) => {
    setSubjectId(id);
    const subject = subjects.find((s) => s.id === id);
    if (subject) setSemester(subject.semester);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createAssignment({ subjectId, facultyId, semester, academicYear });
      setMessage('Teacher assigned successfully');
      setSubjectId('');
      setFacultyId('');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to create assignment'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignment: SubjectAssignment) => {
    if (!confirm(`Delete assignment for ${assignment.subject.code} — ${assignment.faculty.name}?`)) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await deleteAssignment(assignment.id);
      setMessage('Assignment deleted');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to delete assignment'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNE = async (assignmentId: string, assessmentId: string, current: boolean) => {
    try {
      await setNEVisibility({
        subjectAssignmentId: assignmentId,
        assessmentId,
        showNEToStudents: !current,
      });
      // Optimistically update the UI
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.id !== assignmentId) return a;
          const updatedSubmissions = a.assessmentSubmissions?.map((s) =>
            s.assessmentId === assessmentId ? { ...s, showNEToStudents: !current } : s
          );
          return { ...a, assessmentSubmissions: updatedSubmissions };
        })
      );
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to toggle NE visibility'));
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
        <h3 className="text-lg font-semibold mb-4">Assign Teacher to Subject</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            required
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
                {s.subjectType === 'ELECTIVE' ? ` (Elective · ${s.enrollmentCount ?? 0})` : ''}
              </option>
            ))}
          </select>
          <select
            required
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Select teacher</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <input
            type="number"
            required
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="border rounded px-3 py-2"
            aria-label="Semester"
          />
          <input
            required
            placeholder="Academic year (2025-2026)"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="border rounded px-3 py-2"
            aria-label="Academic year"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            Assign
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500">
          Semester defaults to the subject&apos;s semester — change only for backlog/repeat batches.
        </p>
        {selectedSubject?.subjectType === 'ELECTIVE' && (selectedSubject.enrollmentCount ?? 0) === 0 && (
          <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            This elective has no enrolled students yet. Import the roster in Subjects before the teacher enters marks.
          </p>
        )}
        <p className="mt-1 text-xs text-amber-700">
          To flag NE students: click an exam link below → tick NE column → Save NE Flags (once per exam, no Excel re-upload).
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200 flex flex-wrap gap-3">
        <input
          placeholder="Search subject or teacher"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-[180px]"
        />
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All years</option>
          {academicYears.map((y) => (
            <option key={y} value={y}>{y}</option>
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
        {loading && assignments.length === 0 ? (
          <p className="p-6 text-center text-gray-500">Loading...</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessments (NE / Marks)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssignments.map((a) => (
                <React.Fragment key={a.id}>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">{a.subject.code} — {a.subject.name}</td>
                    <td className="px-4 py-3 text-sm">{a.faculty.name}</td>
                    <td className="px-4 py-3 text-sm">{a.semester}</td>
                    <td className="px-4 py-3 text-sm">{a.academicYear}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        <span className="text-xs">{expandedId === a.id ? '▴' : '▾'}</span>
                        {a.subject.assessments?.length ?? 0} exams
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => handleDelete(a)}
                        disabled={loading}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedId === a.id && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={6} className="px-8 py-4">
                        {a.subject.assessments?.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No exams defined for this subject.</p>
                        ) : (
                          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Exam</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">NE Visible to Students</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {a.subject.assessments?.map((ass) => {
                                  const sub = a.assessmentSubmissions?.find((s) => s.assessmentId === ass.id);
                                  const isPublished = sub?.status === 'PUBLISHED';
                                  return (
                                    <tr key={ass.id}>
                                      <td className="px-4 py-2 text-sm text-gray-900">{ass.name}</td>
                                      <td className="px-4 py-2">
                                        <SubmissionStatusBadge status={sub?.status || 'DRAFT'} />
                                      </td>
                                      <td className="px-4 py-2">
                                        {isPublished ? (
                                          <button
                                            onClick={() => handleToggleNE(a.id, ass.id, !!sub?.showNEToStudents)}
                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                              sub?.showNEToStudents ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                          >
                                            <span
                                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                sub?.showNEToStudents ? 'translate-x-4' : 'translate-x-0'
                                              }`}
                                            />
                                          </button>
                                        ) : (
                                          <span className="text-xs text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        <Link
                                          to={`/coordinator/marks/${a.id}/${ass.id}`}
                                          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                                        >
                                          Open Marks ↗
                                        </Link>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {!filteredAssignments.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No assignments found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AssignmentsManagement;
