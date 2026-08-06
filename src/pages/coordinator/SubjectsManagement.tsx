import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import {
  createSubject,
  createAssessment,
  updateSubject,
  deleteSubject,
  updateAssessment,
  deleteAssessment,
  getSubjects,
  getSubjectEnrollments,
  bulkEnrollStudents,
  importSubjectEnrollments,
  downloadEnrollmentTemplate,
  removeSubjectEnrollment,
} from '../../api/subjects';
import type { Assessment, Subject, SubjectEnrollment } from '../../api/subjects';
import type { ImportResult } from '../../types';
import ExcelImportCard from '../../components/shared/ExcelImportCard';
import { apiErrorMessage } from '../../utils/api-errors';

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
  const [isElective, setIsElective] = useState(false);

  const [rosterSubject, setRosterSubject] = useState<Subject | null>(null);
  const [enrollments, setEnrollments] = useState<SubjectEnrollment[]>([]);
  const [rosterPaste, setRosterPaste] = useState('');
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterResult, setRosterResult] = useState<ImportResult | null>(null);
  const rosterPasteRef = useRef<HTMLTextAreaElement>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [assessmentName, setAssessmentName] = useState('Internal 1');
  const [maxMarks, setMaxMarks] = useState<number | ''>(50);
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSemester, setEditSemester] = useState(5);

  const [editingAssessment, setEditingAssessment] = useState<{
    subjectId: string;
    assessment: Assessment;
  } | null>(null);
  const [editAssessmentName, setEditAssessmentName] = useState('');
  const [editMaxMarks, setEditMaxMarks] = useState<number | ''>(50);
  const [editExamDate, setEditExamDate] = useState('');
  const [editExamTime, setEditExamTime] = useState('');

  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddAssessment, setShowAddAssessment] = useState(false);

  const toggleRow = (subjectId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const handleRowClick = (e: React.MouseEvent, subjectId: string) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('a')
    ) {
      return;
    }
    if (editingSubjectId === subjectId) {
      return;
    }
    toggleRow(subjectId);
  };

  const load = async () => {
    setLoading(true);
    try {
      const result = await getSubjects({ limit: 500 });
      setSubjects(result.data);
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

  const loadEnrollments = async (subjectId: string) => {
    const rows = await getSubjectEnrollments(subjectId);
    setEnrollments(rows);
  };

  const handleOpenRoster = async (subject: Subject) => {
    setRosterSubject(subject);
    setRosterPaste('');
    setRosterResult(null);
    setRosterLoading(true);
    try {
      await loadEnrollments(subject.id);
    } catch {
      setError('Failed to load elective roster');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleCloseRoster = () => {
    setRosterSubject(null);
    setEnrollments([]);
    setRosterPaste('');
    setRosterResult(null);
    load();
  };

  const handlePasteEnroll = async () => {
    if (!rosterSubject) return;
    const rollNumbers = rosterPaste
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!rollNumbers.length) return;
    setRosterLoading(true);
    setRosterResult(null);
    try {
      const result = await bulkEnrollStudents(rosterSubject.id, rollNumbers);
      setRosterResult(result);
      setRosterPaste('');
      await loadEnrollments(rosterSubject.id);
      setMessage(`Enrolled ${result.imported} student(s) in ${rosterSubject.code}`);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to enroll students'));
    } finally {
      setRosterLoading(false);
    }
  };

  const handleRemoveEnrollment = async (studentId: string) => {
    if (!rosterSubject) return;
    setRosterLoading(true);
    try {
      await removeSubjectEnrollment(rosterSubject.id, studentId);
      await loadEnrollments(rosterSubject.id);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to remove student'));
    } finally {
      setRosterLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const created = await createSubject({
        code,
        name,
        department,
        semester,
        subjectType: isElective ? 'ELECTIVE' : 'CORE',
      });
      setCode('');
      setName('');
      setIsElective(false);
      setMessage(
        created.subjectType === 'ELECTIVE'
          ? `${created.code} created — import the elective roster next`
          : 'Subject created',
      );
      await load();
      if (created.subjectType === 'ELECTIVE') {
        await handleOpenRoster(created);
      }
      setShowAddSubject(false);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to create subject'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    if (!maxMarks || maxMarks <= 0) {
      setError('Max marks must be greater than zero');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await createAssessment(selectedSubjectId, {
        name: assessmentName,
        maxMarks: Number(maxMarks),
        ...(examDate ? { examDate } : {}),
        ...(examTime ? { examTime } : {}),
      });
      setMessage('Assessment added — go to Assignments tab, click the exam link, and set NE students before marks entry.');
      load();
      setShowAddAssessment(false);
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
    setEditMaxMarks(assessment.maxMarks ? Number(assessment.maxMarks) : '');
    setEditExamDate(formatExamDate(assessment.examDate));
    setEditExamTime(assessment.examTime ?? '');
  };

  const handleSaveAssessment = async () => {
    if (!editingAssessment) return;
    if (!editMaxMarks || editMaxMarks <= 0) {
      setError('Max marks must be greater than zero');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await updateAssessment(editingAssessment.subjectId, editingAssessment.assessment.id, {
        name: editAssessmentName,
        maxMarks: Number(editMaxMarks),
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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setShowAddSubject(!showAddSubject);
            setShowAddAssessment(false);
          }}
          className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md border border-outline-variant cursor-pointer transition-colors ${
            showAddSubject ? 'bg-primary text-white hover:bg-primary-container' : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          {showAddSubject ? 'Close Add Subject' : 'Add Subject'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowAddAssessment(!showAddAssessment);
            setShowAddSubject(false);
          }}
          className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md border border-outline-variant cursor-pointer transition-colors ${
            showAddAssessment ? 'bg-primary text-white hover:bg-primary-container' : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          {showAddAssessment ? 'Close Add Assessment' : 'Add Assessment'}
        </button>
      </div>

      {showAddSubject && (
        <div className="bg-surface-container-lowest rounded-lg shadow p-6 border border-outline-variant">
          <h3 className="text-lg font-semibold mb-4">Add Subject</h3>
          <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input required placeholder="Code (IT301)" value={code} onChange={(e) => setCode(e.target.value)} className="border rounded px-3 py-2" />
            <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="border rounded px-3 py-2" />
            <input required placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="border rounded px-3 py-2" />
            <input required type="number" placeholder="Semester" value={semester} onChange={(e) => setSemester(Number(e.target.value))} className="border rounded px-3 py-2" />
            <label className="flex items-center gap-2 text-sm text-on-surface border rounded px-3 py-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={isElective}
                onChange={(e) => setIsElective(e.target.checked)}
                className="rounded border-outline-variant"
              />
              Elective subject (import student roster after create)
            </label>
            <button type="submit" disabled={loading} className="bg-primary text-white rounded px-4 py-2 hover:bg-primary-container disabled:opacity-50 sm:col-span-2 lg:col-span-1 cursor-pointer">
              Add Subject
            </button>
          </form>
        </div>
      )}

      {showAddAssessment && (
        <div className="bg-surface-container-lowest rounded-lg shadow p-6 border border-outline-variant">
          <h3 className="text-lg font-semibold mb-4">Add Assessment</h3>
          <form onSubmit={handleAddAssessment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <select required value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="border rounded px-3 py-2 bg-surface-container-lowest">
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>
            <input required placeholder="Assessment name" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} className="border rounded px-3 py-2" />
            <input required type="number" placeholder="Max marks" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value === '' ? '' : Number(e.target.value))} className="border rounded px-3 py-2" />
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="border rounded px-3 py-2" aria-label="Exam date" />
            <input placeholder="Exam time (e.g. 10:00 AM)" value={examTime} onChange={(e) => setExamTime(e.target.value)} className="border rounded px-3 py-2" />
            <button type="submit" disabled={loading} className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50 cursor-pointer">
              Add Assessment
            </button>
          </form>
        </div>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Assessments</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredSubjects.map((s) => (
                <Fragment key={s.id}>
                  <tr
                    onClick={(e) => handleRowClick(e, s.id)}
                    className="cursor-pointer hover:bg-surface-container-low transition-colors"
                  >
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-medium text-sm text-on-surface">
                            <span className="inline-flex items-center justify-center bg-primary-fixed/20 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                              {s.assessments?.length ?? 0}
                            </span>
                            <span className={`text-[10px] text-on-surface-variant transition-transform duration-200 ${expandedSubjects[s.id] ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {editingSubjectId === s.id ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleSaveSubject(s.id)} disabled={loading} className="text-green-600 hover:underline">Save</button>
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
                  {expandedSubjects[s.id] && (
                    <tr className="bg-surface-container-low/40">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-primary">Assessments Details ({s.assessments?.length ?? 0})</h4>
                          {s.assessments?.length ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {s.assessments.map((a) => (
                                <div key={a.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="font-semibold text-on-surface text-sm">{a.name}</span>
                                      <span className="inline-flex items-center rounded-full bg-primary-fixed/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                        {Number(a.maxMarks)} Marks
                                      </span>
                                    </div>
                                    <div className="text-xs text-on-surface-variant space-y-1 mb-4">
                                      <div>
                                        <span className="font-medium text-on-surface-variant/80">Date: </span>
                                        {a.examDate ? formatExamDate(a.examDate) : 'Not scheduled'}
                                      </div>
                                      <div>
                                        <span className="font-medium text-on-surface-variant/80">Time: </span>
                                        {a.examTime || 'Not set'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant text-xs font-medium">
                                    <button
                                      type="button"
                                      onClick={() => startEditAssessment(s.id, a)}
                                      className="text-primary hover:text-primary-container inline-flex items-center gap-1 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAssessment(s.id, a)}
                                      className="text-red-600 hover:text-red-800 inline-flex items-center gap-1 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-on-surface-variant italic">No assessments conducted yet for this subject.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!filteredSubjects.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-on-surface-variant">No subjects found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {rosterSubject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-outline-variant">
            <div className="p-6 border-b border-outline-variant">
              <h3 className="text-lg font-semibold text-on-surface">
                Elective roster — {rosterSubject.code} ({rosterSubject.name})
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Only these students appear when a teacher is assigned to this elective.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <ExcelImportCard
                title="Import roll numbers"
                description="One roll number per row. Students must already exist in the student roster."
                onDownloadTemplate={() => downloadEnrollmentTemplate(rosterSubject.id, rosterSubject.code)}
                onImport={(file) => importSubjectEnrollments(rosterSubject.id, file)}
                onImportComplete={() => loadEnrollments(rosterSubject.id)}
              />
              <div>
                <h4 className="text-sm font-medium text-on-surface mb-2">Or paste roll numbers</h4>
                <textarea
                  ref={rosterPasteRef}
                  value={rosterPaste}
                  onChange={(e) => setRosterPaste(e.target.value)}
                  rows={5}
                  placeholder={'24ABC123\n24ABC124\n24ABC125'}
                  className="w-full border border-outline-variant rounded-md px-3 py-2 text-sm font-mono"
                  aria-label="Paste roll numbers for elective enrollment"
                />
                <button
                  type="button"
                  onClick={handlePasteEnroll}
                  disabled={rosterLoading || !rosterPaste.trim()}
                  className="mt-2 bg-purple-600 text-white rounded px-4 py-2 text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  Add pasted students
                </button>
              </div>
              {rosterResult && (
                <p className="text-sm text-on-surface-variant">
                  Enrolled {rosterResult.imported}, skipped {rosterResult.skipped}
                  {rosterResult.errors.length > 0 && `, ${rosterResult.errors.length} error(s)`}
                </p>
              )}
              <div>
                <h4 className="text-sm font-medium text-on-surface mb-2">
                  Enrolled students ({enrollments.length})
                </h4>
                {rosterLoading && enrollments.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Loading...</p>
                ) : enrollments.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                    No students enrolled yet. Import or paste roll numbers before assigning a teacher.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-outline-variant rounded-md max-h-48 overflow-y-auto">
                    {enrollments.map((row) => (
                      <li key={row.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>
                          <span className="font-mono text-on-surface">{row.student.rollNumber}</span>
                          <span className="text-on-surface-variant ml-2">{row.student.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEnrollment(row.studentId)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant flex justify-end">
              <button
                type="button"
                onClick={handleCloseRoster}
                className="px-4 py-2 text-on-surface hover:bg-surface-container-low rounded-md border border-outline-variant"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAssessment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-lg shadow-lg p-6 w-full max-w-md border border-outline-variant">
            <h3 className="text-lg font-semibold mb-4">Edit Assessment</h3>
            <div className="space-y-3">
              <input value={editAssessmentName} onChange={(e) => setEditAssessmentName(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="Name" />
              <input type="number" value={editMaxMarks} onChange={(e) => setEditMaxMarks(e.target.value === '' ? '' : Number(e.target.value))} className="border rounded px-3 py-2 w-full" placeholder="Max marks" />
              <input type="date" value={editExamDate} onChange={(e) => setEditExamDate(e.target.value)} className="border rounded px-3 py-2 w-full" aria-label="Exam date" />
              <input value={editExamTime} onChange={(e) => setEditExamTime(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="Exam time" />
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingAssessment(null)} className="px-4 py-2 text-on-surface-variant hover:underline">Cancel</button>
              <button type="button" onClick={handleSaveAssessment} disabled={loading} className="bg-primary text-white rounded px-4 py-2 hover:bg-primary-container disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsManagement;
