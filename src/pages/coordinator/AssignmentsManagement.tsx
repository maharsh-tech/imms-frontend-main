import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getAssignments,
  createAssignment,
  deleteAssignment,
  getSubjects,
  getFaculty,
} from '../../api/subjects';
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
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
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
                <tr key={a.id}>
                  <td className="px-4 py-3 text-sm font-medium">{a.subject.code} — {a.subject.name}</td>
                  <td className="px-4 py-3 text-sm">{a.faculty.name}</td>
                  <td className="px-4 py-3 text-sm">{a.semester}</td>
                  <td className="px-4 py-3 text-sm">{a.academicYear}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {a.subject.assessments?.map((ass) => {
                        const sub = a.assessmentSubmissions?.find((s) => s.assessmentId === ass.id);
                        return (
                          <Link
                            key={ass.id}
                            to={`/coordinator/marks/${a.id}/${ass.id}`}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                          >
                            {ass.name}
                            {sub && <SubmissionStatusBadge status={sub.status} />}
                          </Link>
                        );
                      })}
                    </div>
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
