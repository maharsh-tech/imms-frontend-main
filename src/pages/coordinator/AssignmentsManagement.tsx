import { Fragment, useState, useEffect, useMemo } from 'react';
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
  const [startRollNumber, setStartRollNumber] = useState('');
  const [endRollNumber, setEndRollNumber] = useState('');
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
      const [a, s, f] = await Promise.all([
        getAssignments(),
        getSubjects({ limit: 500 }),
        getFaculty({ limit: 500 }),
      ]);
      setAssignments(a);
      setSubjects(s.data);
      setFaculty(f.data);
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
      await createAssignment({
        subjectId,
        facultyId,
        semester,
        academicYear,
        startRollNumber: startRollNumber.trim() || undefined,
        endRollNumber: endRollNumber.trim() || undefined,
      });
      setMessage('Teacher assigned successfully');
      setSubjectId('');
      setFacultyId('');
      setStartRollNumber('');
      setEndRollNumber('');
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
      await load();
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

      <div className="bg-surface-container-lowest rounded-lg shadow p-6 border border-outline-variant">
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
            placeholder="Academic year (2025-2026)"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="border rounded px-3 py-2"
            aria-label="Academic year"
            required
          />
          <input
            placeholder="Start Roll Number (e.g. 24IT001)"
            value={startRollNumber}
            onChange={(e) => setStartRollNumber(e.target.value)}
            className="border rounded px-3 py-2"
            aria-label="Start Roll Number"
          />
          <input
            placeholder="End Roll Number (e.g. 24IT065)"
            value={endRollNumber}
            onChange={(e) => setEndRollNumber(e.target.value)}
            className="border rounded px-3 py-2"
            aria-label="End Roll Number"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white rounded px-4 py-2 hover:bg-primary-container disabled:opacity-50"
          >
            Assign
          </button>
        </form>
        <p className="mt-2 text-xs text-on-surface-variant">
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

      <div className="bg-surface-container-lowest rounded-lg shadow p-4 border border-outline-variant flex flex-wrap gap-3">
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

      <div className="bg-surface-container-lowest rounded-lg shadow border border-outline-variant overflow-x-auto">
        {loading && assignments.length === 0 ? (
          <p className="p-6 text-center text-on-surface-variant">Loading...</p>
        ) : (
          <table className="min-w-full divide-y divide-surface-variant">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Sem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Year</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Assessments (NE / Marks)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredAssignments.map((a) => (
                <Fragment key={a.id}>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">{a.subject.code} — {a.subject.name}</td>
                    <td className="px-4 py-3 text-sm">{a.faculty.name}</td>
                    <td className="px-4 py-3 text-sm">{a.semester}</td>
                    <td className="px-4 py-3 text-sm">{a.academicYear}</td>
                    <td className="px-4 py-3 text-sm">
                      {a.startRollNumber && a.endRollNumber ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                          {a.startRollNumber} - {a.endRollNumber}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-xs font-medium">All Students</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-on-surface hover:text-primary bg-background hover:bg-primary-fixed/30 px-2 py-1 rounded transition-colors"
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
                    <tr className="bg-surface-container-low/50">
                      <td colSpan={7} className="px-8 py-4">
                        {a.subject.assessments?.length === 0 ? (
                          <p className="text-sm text-on-surface-variant italic">No exams defined for this subject.</p>
                        ) : (
                          <div className="bg-surface-container-lowest border rounded-lg overflow-hidden shadow-[var(--shadow-card)]">
                            <table className="min-w-full divide-y divide-surface-variant">
                              <thead className="bg-surface-container-low">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-on-surface-variant">Exam</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-on-surface-variant">Status</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-on-surface-variant">Show Marks to NE Students</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-on-surface-variant">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {a.subject.assessments?.map((ass) => {
                                  const sub = a.assessmentSubmissions?.find((s) => s.assessmentId === ass.id);
                                  const canToggleNE =
                                    sub?.status === 'SUBMITTED' || sub?.status === 'PUBLISHED';
                                  return (
                                    <tr key={ass.id}>
                                      <td className="px-4 py-2 text-sm text-on-surface">{ass.name}</td>
                                      <td className="px-4 py-2">
                                        <SubmissionStatusBadge status={sub?.status || 'DRAFT'} />
                                      </td>
                                      <td className="px-4 py-2">
                                        {canToggleNE ? (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => handleToggleNE(a.id, ass.id, !!sub?.showNEToStudents)}
                                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                sub?.showNEToStudents ? 'bg-primary' : 'bg-gray-200'
                                              }`}
                                              aria-label={
                                                sub?.showNEToStudents
                                                  ? `Hide NE marks from NE students for ${ass.name}`
                                                  : `Show NE marks to NE students for ${ass.name}`
                                              }
                                            >
                                              <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ease-in-out ${
                                                  sub?.showNEToStudents ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                              />
                                            </button>
                                            <span className="text-[10px] uppercase font-semibold text-on-surface-variant/80 select-none">
                                              {sub?.showNEToStudents ? 'NE marks published' : 'NE shows'}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-outline">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        <Link
                                          to={`/coordinator/marks/${a.id}/${ass.id}`}
                                          className="text-sm text-primary hover:underline inline-flex items-center gap-1 shrink-0"
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
                </Fragment>
              ))}
              {!filteredAssignments.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-on-surface-variant">No assignments found</td>
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
