import { useState, useMemo, useRef } from 'react';
import type { Subject } from '../../api/subjects';
import type { ImportResult } from '../../types';
import { apiErrorMessage } from '../../utils/api-errors';
import {
  useSubjects,
  useSubjectEnrollments,
  useSubjectMutations,
} from '../../hooks/useSubjects';
import AddSubjectForm from '../../components/coordinator/subjects/AddSubjectForm';
import ElectiveRosterModal from '../../components/coordinator/subjects/ElectiveRosterModal';

const defaultAcademicYear = () => {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const SubjectsManagement = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const {
    createSubject,
    updateSubject,
    deleteSubject,
    bulkEnroll,
    removeEnrollment,
    invalidateEnrollments,
  } = useSubjectMutations();
  const { data: subjectsResult, isLoading, isFetching, error: queryError } = useSubjects({ limit: 500 });
  const subjects = subjectsResult?.data ?? [];
  const loading = isLoading || isFetching;
  const saving =
    createSubject.isPending ||
    updateSubject.isPending ||
    deleteSubject.isPending;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('IT');
  const [semester, setSemester] = useState(5);
  const [isElective, setIsElective] = useState(false);

  const [rosterSubject, setRosterSubject] = useState<Subject | null>(null);
  const [rosterAcademicYear, setRosterAcademicYear] = useState(defaultAcademicYear);
  const rosterScope = useMemo(
    () =>
      rosterSubject
        ? { academicYear: rosterAcademicYear, semester: rosterSubject.semester }
        : undefined,
    [rosterSubject, rosterAcademicYear],
  );
  const { data: enrollments = [] } = useSubjectEnrollments(rosterSubject?.id, rosterScope);
  const [rosterPaste, setRosterPaste] = useState('');
  const [rosterResult, setRosterResult] = useState<ImportResult | null>(null);
  const rosterPasteRef = useRef<HTMLTextAreaElement>(null);

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSemester, setEditSemester] = useState(5);

  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);

  const handleOpenRoster = (subject: Subject) => {
    setRosterSubject(subject);
    setRosterPaste('');
    setRosterResult(null);
    setError('');
  };

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

  const handleCloseRoster = () => {
    setRosterSubject(null);
    setRosterPaste('');
    setRosterResult(null);
  };

  const handlePasteEnroll = () => {
    if (!rosterSubject || !rosterScope) return;
    const rollNumbers = rosterPaste
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!rollNumbers.length) return;
    setRosterResult(null);
    bulkEnroll.mutate(
      { subjectId: rosterSubject.id, scope: rosterScope, rollNumbers },
      {
        onSuccess: (result) => {
          setRosterResult(result);
          setRosterPaste('');
          setMessage(`Enrolled ${result.imported} student(s) in ${rosterSubject.code}`);
        },
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to enroll students')),
      },
    );
  };

  const handleRemoveEnrollment = (studentId: string) => {
    if (!rosterSubject || !rosterScope) return;
    removeEnrollment.mutate(
      { subjectId: rosterSubject.id, scope: rosterScope, studentId },
      {
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to remove student')),
      },
    );
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    createSubject.mutate(
      {
        code,
        name,
        department,
        semester,
        subjectType: isElective ? 'ELECTIVE' : 'CORE',
      },
      {
        onSuccess: (created) => {
          setCode('');
          setName('');
          setIsElective(false);
          setMessage(
            created.subjectType === 'ELECTIVE'
              ? `${created.code} created — import the elective roster next`
              : 'Subject created',
          );
          if (created.subjectType === 'ELECTIVE') {
            handleOpenRoster(created);
          }
          setShowAddSubject(false);
        },
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to create subject')),
      },
    );
  };

  const startEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditName(subject.name);
    setEditDepartment(subject.department);
    setEditSemester(subject.semester);
  };

  const handleSaveSubject = (subjectId: string) => {
    setError('');
    setMessage('');
    updateSubject.mutate(
      {
        id: subjectId,
        data: { name: editName, department: editDepartment, semester: editSemester },
      },
      {
        onSuccess: () => {
          setEditingSubjectId(null);
          setMessage('Subject updated');
        },
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to update subject')),
      },
    );
  };

  const handleDeleteSubject = (subject: Subject) => {
    if (!confirm(`Delete ${subject.code} — ${subject.name}? This cannot be undone.`)) return;
    setError('');
    setMessage('');
    deleteSubject.mutate(subject.id, {
      onSuccess: () => setMessage('Subject deleted'),
      onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to delete subject')),
    });
  };

  const actionLoading = loading || saving || bulkEnroll.isPending || removeEnrollment.isPending;
  const rosterBusy = bulkEnroll.isPending || removeEnrollment.isPending;

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-700">{message}</div>
      )}
      {(error || queryError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">{error || 'Failed to load subjects'}</div>
      )}

      <p className="text-sm text-on-surface-variant">
        Subject catalog is year-agnostic. Add CIE exams and assign teachers in{' '}
        <strong>Exam &amp; Assignments</strong>.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAddSubject(!showAddSubject)}
          className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md border border-outline-variant cursor-pointer transition-colors ${
            showAddSubject ? 'bg-primary text-white hover:bg-primary-container' : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          {showAddSubject ? 'Close Add Subject' : 'Add Subject'}
        </button>
      </div>

      {showAddSubject && (
        <AddSubjectForm
          code={code}
          name={name}
          department={department}
          semester={semester}
          isElective={isElective}
          isPending={actionLoading}
          onCodeChange={setCode}
          onNameChange={setName}
          onDepartmentChange={setDepartment}
          onSemesterChange={setSemester}
          onElectiveChange={setIsElective}
          onSubmit={handleCreateSubject}
        />
      )}

      <div className="bg-surface-container-lowest rounded-lg shadow p-4 border border-outline-variant flex flex-wrap gap-3">
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

      <div className="bg-surface-container-lowest rounded-lg shadow border border-outline-variant overflow-x-auto">
        {loading && subjects.length === 0 ? (
          <p className="p-6 text-center text-on-surface-variant">Loading...</p>
        ) : (
          <table className="min-w-full divide-y divide-surface-variant">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Dept</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Sem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredSubjects.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
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
                      <td className="px-4 py-3 text-sm text-outline">—</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm">{s.name}</td>
                      <td className="px-4 py-3 text-sm">{s.department}</td>
                      <td className="px-4 py-3 text-sm">{s.semester}</td>
                      <td className="px-4 py-3 text-sm">
                        {s.subjectType === 'ELECTIVE' ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                            Elective
                          </span>
                        ) : (
                          <span className="text-on-surface-variant text-xs">Core</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {editingSubjectId === s.id ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleSaveSubject(s.id)} disabled={actionLoading} className="text-green-600 hover:underline">Save</button>
                        <button type="button" onClick={() => setEditingSubjectId(null)} className="text-on-surface-variant hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {s.subjectType === 'ELECTIVE' && (
                          <button type="button" onClick={() => handleOpenRoster(s)} className="text-purple-700 hover:underline">
                            Roster
                          </button>
                        )}
                        <button type="button" onClick={() => startEditSubject(s)} className="text-primary hover:underline">Edit</button>
                        <button type="button" onClick={() => handleDeleteSubject(s)} className="text-red-600 hover:underline">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredSubjects.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-on-surface-variant">No subjects found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {rosterSubject && rosterScope && (
        <>
          <div className="bg-surface-container-lowest rounded-lg shadow p-4 border border-outline-variant flex flex-wrap gap-3 items-end">
            <label className="text-sm text-on-surface-variant">
              Roster academic year
              <input
                value={rosterAcademicYear}
                onChange={(e) => setRosterAcademicYear(e.target.value)}
                className="mt-1 block border rounded px-3 py-2"
                aria-label="Roster academic year"
              />
            </label>
          </div>
          <ElectiveRosterModal
            subject={rosterSubject}
            enrollmentScope={rosterScope}
            enrollments={enrollments}
            rosterPaste={rosterPaste}
            rosterResult={rosterResult}
            rosterLoading={rosterBusy}
            rosterPasteRef={rosterPasteRef}
            onPasteChange={setRosterPaste}
            onPasteEnroll={handlePasteEnroll}
            onRemoveEnrollment={handleRemoveEnrollment}
            onImportComplete={() => invalidateEnrollments(rosterSubject.id, rosterScope)}
            onClose={handleCloseRoster}
          />
        </>
      )}
    </div>
  );
};

export default SubjectsManagement;
