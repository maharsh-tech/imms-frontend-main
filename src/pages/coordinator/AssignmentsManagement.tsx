import { Fragment, useState, useMemo, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { setNEVisibility } from '../../api/marks';
import type { SubjectOfferingRow } from '../../api/subjects';
import {
  importAssignmentRoster,
  downloadAssignmentRosterTemplate,
} from '../../api/subject-assignment-roster';
import type { ImportResult } from '../../types';
import SubmissionStatusBadge from '../../components/shared/SubmissionStatusBadge';
import AddAssessmentForm from '../../components/coordinator/subjects/AddAssessmentForm';
import BacklogStudentForm from '../../components/coordinator/subjects/BacklogStudentForm';
import ElectiveRosterModal from '../../components/coordinator/subjects/ElectiveRosterModal';
import { apiErrorMessage } from '../../utils/api-errors';
import {
  useAssignmentYears,
  useAssignmentSemesters,
  useAssignmentOfferings,
  useAssignmentFormCatalog,
  useAssignmentsInvalidator,
  assignmentMutations,
} from '../../hooks/useAssignments';
import { useSubjectMutations } from '../../hooks/useSubjects';
import { useCieRounds } from '../../hooks/useCieRounds';
import { useAssignmentRoster, useAssignmentRosterMutations } from '../../hooks/useAssignmentRoster';

const defaultAcademicYear = () => {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return m >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

type OfferingAssignment = SubjectOfferingRow['assignments'][number];

const formatTeachers = (assignments: OfferingAssignment[]) => {
  if (assignments.length === 0) return 'Not assigned';
  return assignments.map((a) => a.faculty.name).join(', ');
};

const formatRange = (assignment: OfferingAssignment) => {
  if (assignment.rosterCount && assignment.rosterCount > 0) {
    return `Custom roster (${assignment.rosterCount} students)`;
  }
  if (assignment.startRollNumber && assignment.endRollNumber) {
    return `${assignment.startRollNumber} - ${assignment.endRollNumber}`;
  }
  return 'All Students';
};

const actionBtnBase =
  'inline-flex w-fit items-center justify-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const openMarksBtn = `${actionBtnBase} border-primary bg-primary text-white hover:bg-primary-container`;
const backlogBtn = `${actionBtnBase} border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100`;
const rosterBtn = `${actionBtnBase} border-outline-variant bg-surface-container-low text-primary hover:bg-surface-container`;
const deleteBtn = `${actionBtnBase} border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50`;

const AssignmentsManagement = () => {
  const [subjectId, setSubjectId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [semester, setSemester] = useState(5);
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [startRollNumber, setStartRollNumber] = useState('');
  const [endRollNumber, setEndRollNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [listAcademicYear, setListAcademicYear] = useState('');
  const [listSemester, setListSemester] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [assessmentAcademicYear, setAssessmentAcademicYear] = useState(defaultAcademicYear);
  const [assessmentSemester, setAssessmentSemester] = useState(5);
  const [cieRoundName, setCieRoundName] = useState('CIE-1');
  const [maxMarks, setMaxMarks] = useState<number | ''>(50);
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');

  const [backlogOffering, setBacklogOffering] = useState<SubjectOfferingRow | null>(null);

  const [rosterAssignment, setRosterAssignment] = useState<OfferingAssignment | null>(null);
  const [rosterLabel, setRosterLabel] = useState('');
  const [rosterPaste, setRosterPaste] = useState('');
  const [rosterResult, setRosterResult] = useState<ImportResult | null>(null);
  const rosterPasteRef = useRef<HTMLTextAreaElement>(null);

  const invalidateAssignments = useAssignmentsInvalidator();
  const { createAssessment } = useSubjectMutations();
  const { data: rosterRows = [] } = useAssignmentRoster(rosterAssignment?.id);
  const { bulkAdd: bulkAddRoster, remove: removeFromRoster, invalidateRoster } = useAssignmentRosterMutations();

  const formOpen = showAssignTeacher || showAddAssessment;
  const { data: formCatalog } = useAssignmentFormCatalog(formOpen);
  const subjects = formCatalog?.subjects ?? [];
  const faculty = formCatalog?.faculty ?? [];

  const {
    data: yearOptions = [],
    isLoading: yearsLoading,
    isFetching: yearsFetching,
  } = useAssignmentYears();
  const {
    data: semesterOptions = [],
    isLoading: semestersLoading,
    isFetching: semestersFetching,
  } = useAssignmentSemesters(listAcademicYear);
  const {
    data: offerings = [],
    isLoading: offeringsLoading,
    isFetching: offeringsFetching,
    error: queryError,
  } = useAssignmentOfferings(listAcademicYear, listSemester);

  const loadingYears = yearsLoading || yearsFetching;
  const loadingSemesters = semestersLoading || semestersFetching;
  const loadingOfferings = offeringsLoading || offeringsFetching;
  const listReady = Boolean(listAcademicYear.trim() && listSemester);

  const createMutation = useMutation({
    mutationFn: assignmentMutations.create,
    onSuccess: () => {
      setMessage('Teacher assigned successfully');
      setSubjectId('');
      setFacultyId('');
      setStartRollNumber('');
      setEndRollNumber('');
      invalidateAssignments();
    },
    onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to create assignment')),
  });

  const deleteMutation = useMutation({
    mutationFn: assignmentMutations.delete,
    onSuccess: () => {
      setMessage('Assignment deleted');
      invalidateAssignments();
    },
    onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to delete assignment')),
  });

  const actionLoading =
    loadingOfferings || createMutation.isPending || deleteMutation.isPending || createAssessment.isPending;

  const selectedAssessmentSubject = useMemo(
    () => subjects.find((s) => s.id === selectedSubjectId),
    [subjects, selectedSubjectId],
  );

  const { data: cieRounds = [] } = useCieRounds(
    assessmentAcademicYear,
    assessmentSemester,
    selectedAssessmentSubject?.department ?? '',
  );

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId),
    [subjects, subjectId],
  );

  const handleAssessmentSubjectChange = (id: string) => {
    setSelectedSubjectId(id);
    const subject = subjects.find((s) => s.id === id);
    if (subject) {
      setAssessmentSemester(subject.semester);
    }
  };

  const filteredOfferings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offerings.filter((o) => {
      if (!q) return true;
      const teachers = o.assignments.map((a) => a.faculty.name).join(' ');
      const haystack = `${o.subject.code} ${o.subject.name} ${teachers}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [offerings, search]);

  const handleListYearChange = (value: string) => {
    setListAcademicYear(value);
    setListSemester('');
    setExpandedId(null);
  };

  const handleListSemesterChange = (value: string) => {
    setListSemester(value);
    setExpandedId(null);
  };

  const selectClass =
    'border border-outline-variant rounded-md px-3 py-2 text-sm bg-surface-container-lowest disabled:opacity-50';

  const handleSubjectChange = (id: string) => {
    setSubjectId(id);
    const subject = subjects.find((s) => s.id === id);
    if (subject) setSemester(subject.semester);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    createMutation.mutate({
      subjectId,
      facultyId,
      semester,
      academicYear,
      startRollNumber: startRollNumber.trim() || undefined,
      endRollNumber: endRollNumber.trim() || undefined,
    });
  };

  const handleDelete = async (assignment: OfferingAssignment, subjectCode: string) => {
    if (!confirm(`Delete assignment for ${subjectCode} — ${assignment.faculty.name}?`)) return;
    setError('');
    setMessage('');
    deleteMutation.mutate(assignment.id);
  };

  const handleOpenRoster = (assignment: OfferingAssignment, subjectCode: string) => {
    setRosterAssignment(assignment);
    setRosterLabel(`${subjectCode} — ${assignment.faculty.name}`);
    setRosterPaste('');
    setRosterResult(null);
    setError('');
  };

  const handleCloseRoster = () => {
    setRosterAssignment(null);
    setRosterPaste('');
    setRosterResult(null);
  };

  const handleRosterPasteAdd = () => {
    if (!rosterAssignment) return;
    const rollNumbers = rosterPaste
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!rollNumbers.length) return;
    setRosterResult(null);
    bulkAddRoster.mutate(
      { subjectAssignmentId: rosterAssignment.id, rollNumbers },
      {
        onSuccess: (result) => {
          setRosterResult(result);
          setRosterPaste('');
          setMessage(`Added ${result.imported} student(s) to ${rosterLabel}'s roster`);
        },
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to add students to roster')),
      },
    );
  };

  const handleRosterRemove = (studentId: string) => {
    if (!rosterAssignment) return;
    removeFromRoster.mutate(
      { subjectAssignmentId: rosterAssignment.id, studentId },
      {
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to remove student from roster')),
      },
    );
  };

  const sortedAssessments = (assessments: SubjectOfferingRow['subject']['assessments']) =>
    [...(assessments ?? [])].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0) || a.name.localeCompare(b.name),
    );

  const handleAddAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    if (!cieRoundName.trim()) {
      setError('CIE round is required');
      return;
    }
    if (!maxMarks || maxMarks <= 0) {
      setError('Max marks must be greater than zero');
      return;
    }
    setError('');
    setMessage('');
    createAssessment.mutate(
      {
        subjectId: selectedSubjectId,
        data: {
          academicYear: assessmentAcademicYear,
          semester: assessmentSemester,
          cieRoundName: cieRoundName.trim(),
          maxMarks: Number(maxMarks),
          ...(examDate ? { examDate } : {}),
          ...(examTime ? { examTime } : {}),
        },
      },
      {
        onSuccess: () => {
          setMessage('CIE exam added. It appears in the table below — assign a teacher to open marks.');
          setShowAddAssessment(false);
          invalidateAssignments();
        },
        onError: (err: unknown) => setError(apiErrorMessage(err, 'Failed to add CIE exam')),
      },
    );
  };

  const handleToggleNE = async (assignmentId: string, assessmentId: string, current: boolean) => {
    try {
      await setNEVisibility({
        subjectAssignmentId: assignmentId,
        assessmentId,
        showNEToStudents: !current,
      });
      invalidateAssignments();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Failed to toggle NE visibility'));
    }
  };

  const renderMarksAction = (assignments: OfferingAssignment[], assessmentId: string) => {
    if (assignments.length === 0) {
      return (
        <span className="text-xs text-on-surface-variant" title="Assign a teacher first">
          Assign teacher to open marks
        </span>
      );
    }
    if (assignments.length === 1) {
      return (
        <Link
          to={`/coordinator/marks/${assignments[0].id}/${assessmentId}`}
          className={openMarksBtn}
        >
          Open Marks ↗
        </Link>
      );
    }
    return (
      <div className="flex flex-col gap-1.5">
        {assignments.map((assignment) => (
          <Link
            key={assignment.id}
            to={`/coordinator/marks/${assignment.id}/${assessmentId}`}
            className={openMarksBtn}
          >
            Open Marks ({assignment.faculty.name}) ↗
          </Link>
        ))}
      </div>
    );
  };

  const renderSubmissionStatus = (assignments: OfferingAssignment[], assessmentId: string) => {
    if (assignments.length === 0) {
      return <SubmissionStatusBadge status="DRAFT" />;
    }
    if (assignments.length === 1) {
      const sub = assignments[0].assessmentSubmissions?.find((s) => s.assessmentId === assessmentId);
      return <SubmissionStatusBadge status={sub?.status || 'DRAFT'} />;
    }
    return (
      <div className="flex flex-col gap-1">
        {assignments.map((assignment) => {
          const sub = assignment.assessmentSubmissions?.find((s) => s.assessmentId === assessmentId);
          return (
            <div key={assignment.id} className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">{assignment.faculty.name}:</span>
              <SubmissionStatusBadge status={sub?.status || 'DRAFT'} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderNEVisibility = (assignments: OfferingAssignment[], assessmentId: string, assessmentName: string) => {
    if (assignments.length === 0) {
      return <span className="text-xs text-outline">—</span>;
    }

    const renderToggle = (assignment: OfferingAssignment) => {
      const sub = assignment.assessmentSubmissions?.find((s) => s.assessmentId === assessmentId);
      const canToggleNE = sub?.status === 'SUBMITTED' || sub?.status === 'PUBLISHED';
      if (!canToggleNE) return <span className="text-xs text-outline">—</span>;

      return (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleToggleNE(assignment.id, assessmentId, !!sub?.showNEToStudents)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              sub?.showNEToStudents ? 'bg-primary' : 'bg-gray-200'
            }`}
            aria-label={
              sub?.showNEToStudents
                ? `Hide NE marks from NE students for ${assessmentName}`
                : `Show NE marks to NE students for ${assessmentName}`
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
      );
    };

    if (assignments.length === 1) {
      return renderToggle(assignments[0]);
    }

    return (
      <div className="flex flex-col gap-2">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant w-24 truncate">{assignment.faculty.name}</span>
            {renderToggle(assignment)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-700">{message}</div>
      )}
      {error || queryError ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">{error || 'Failed to load assignments'}</div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setShowAssignTeacher(!showAssignTeacher);
            setShowAddAssessment(false);
          }}
          className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md border border-outline-variant cursor-pointer transition-colors ${
            showAssignTeacher
              ? 'bg-primary text-white hover:bg-primary-container'
              : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          {showAssignTeacher ? 'Close Assign Teacher' : 'Assign Teacher to Subject'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowAddAssessment(!showAddAssessment);
            setShowAssignTeacher(false);
          }}
          className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-md border border-outline-variant cursor-pointer transition-colors ${
            showAddAssessment
              ? 'bg-primary text-white hover:bg-primary-container'
              : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          {showAddAssessment ? 'Close Add CIE Exam' : 'Add CIE Exam'}
        </button>
      </div>

      <p className="text-sm text-on-surface-variant">
        Each row is a subject offering (subject, academic year, semester). CIE exams appear even before a
        teacher is assigned — assign a teacher to open marks and set NE flags.
      </p>

      {showAssignTeacher && (
      <div className="bg-surface-container-lowest rounded-lg shadow p-6 border border-outline-variant">
        <h3 className="text-lg font-semibold mb-4">Assign Teacher to Subject</h3>
        {!formCatalog && (
          <p className="mb-4 text-sm text-on-surface-variant">Loading subjects and faculty…</p>
        )}
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
            disabled={actionLoading}
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
          To flag NE students: click a CIE exam link below → tick NE column → Save NE Flags (once per CIE exam, no Excel re-upload).
        </p>
      </div>
      )}

      {showAddAssessment && (
        <AddAssessmentForm
          subjects={subjects}
          selectedSubjectId={selectedSubjectId}
          academicYear={assessmentAcademicYear}
          semester={assessmentSemester}
          cieRoundName={cieRoundName}
          cieRounds={cieRounds}
          maxMarks={maxMarks}
          examDate={examDate}
          examTime={examTime}
          isPending={actionLoading || (formOpen && !formCatalog)}
          onSubjectChange={handleAssessmentSubjectChange}
          onAcademicYearChange={setAssessmentAcademicYear}
          onSemesterChange={setAssessmentSemester}
          onCieRoundChange={setCieRoundName}
          onMaxMarksChange={setMaxMarks}
          onExamDateChange={setExamDate}
          onExamTimeChange={setExamTime}
          onSubmit={handleAddAssessment}
        />
      )}

      <div className="bg-surface-container-lowest rounded-lg shadow p-4 border border-outline-variant flex flex-wrap gap-3">
        <label className="block min-w-[160px] flex-1">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Academic year</span>
          <select
            value={listAcademicYear}
            onChange={(e) => handleListYearChange(e.target.value)}
            disabled={loadingYears || yearOptions.length === 0}
            className={selectClass}
            aria-label="Select academic year"
          >
            <option value="">
              {loadingYears
                ? 'Loading…'
                : yearOptions.length === 0
                  ? 'No years in system'
                  : 'Select year'}
            </option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="block min-w-[140px] flex-1">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Semester</span>
          <select
            value={listSemester}
            onChange={(e) => handleListSemesterChange(e.target.value)}
            disabled={!listAcademicYear || loadingSemesters}
            className={selectClass}
            aria-label="Select semester"
          >
            <option value="">
              {!listAcademicYear
                ? 'Select year first'
                : loadingSemesters
                  ? 'Loading…'
                  : semesterOptions.length === 0
                    ? 'No semesters'
                    : 'Select semester'}
            </option>
            {semesterOptions.map((s) => (
              <option key={s} value={String(s)}>Semester {s}</option>
            ))}
          </select>
        </label>
        <label className="block min-w-[180px] flex-[2]">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Search</span>
          <input
            placeholder="Subject or teacher"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!listReady}
            className={selectClass}
          />
        </label>
      </div>

      <div className="bg-surface-container-lowest rounded-lg shadow border border-outline-variant overflow-x-auto">
        {!listReady ? (
          <p className="p-6 text-center text-on-surface-variant">
            Select academic year and semester to load offerings.
          </p>
        ) : loadingOfferings && offerings.length === 0 ? (
          <p className="p-6 text-center text-on-surface-variant">Loading offerings…</p>
        ) : (
          <table className="min-w-full divide-y divide-surface-variant">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Sem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Year</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">CIE Exams (NE / Marks)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredOfferings.map((offering) => (
                <Fragment key={offering.id}>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">{offering.subject.code} — {offering.subject.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={offering.assignments.length === 0 ? 'text-on-surface-variant italic' : ''}>
                        {formatTeachers(offering.assignments)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{offering.semester}</td>
                    <td className="px-4 py-3 text-sm">{offering.academicYear}</td>
                    <td className="px-4 py-3 text-sm">
                      {offering.assignments.length === 0 ? (
                        <span className="text-on-surface-variant text-xs">—</span>
                      ) : offering.assignments.length === 1 ? (
                        formatRange(offering.assignments[0]).startsWith('All') ? (
                          <span className="text-on-surface-variant text-xs font-medium">{formatRange(offering.assignments[0])}</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                            {formatRange(offering.assignments[0])}
                          </span>
                        )
                      ) : (
                        <div className="flex flex-col gap-1">
                          {offering.assignments.map((assignment) => (
                            <span
                              key={assignment.id}
                              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 w-fit"
                            >
                              {assignment.faculty.name}: {formatRange(assignment)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === offering.id ? null : offering.id)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-on-surface hover:text-primary bg-background hover:bg-primary-fixed/30 px-2 py-1 rounded transition-colors"
                      >
                        <span className="text-xs">{expandedId === offering.id ? '▴' : '▾'}</span>
                        {offering.subject.assessments?.length ?? 0} CIE exams
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBacklogOffering(offering)}
                          className={backlogBtn}
                        >
                          Backlog students
                        </button>
                        {offering.assignments.map((assignment) => (
                          <div key={assignment.id} className="flex flex-col gap-1.5 border-t border-outline-variant/60 pt-1.5 first:border-t-0 first:pt-0">
                            <button
                              type="button"
                              onClick={() => handleOpenRoster(assignment, offering.subject.code)}
                              className={rosterBtn}
                            >
                              Manage roster {offering.assignments.length > 1 ? `(${assignment.faculty.name})` : ''}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(assignment, offering.subject.code)}
                              disabled={actionLoading}
                              className={deleteBtn}
                            >
                              Delete {offering.assignments.length > 1 ? `(${assignment.faculty.name})` : ''}
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {expandedId === offering.id && (
                    <tr className="bg-surface-container-low/50">
                      <td colSpan={7} className="px-8 py-4">
                        {offering.subject.assessments?.length === 0 ? (
                          <p className="text-sm text-on-surface-variant italic">No CIE exams defined for this offering.</p>
                        ) : (
                          <div className="bg-surface-container-lowest border rounded-lg overflow-hidden shadow-[var(--shadow-card)]">
                            <table className="min-w-full divide-y divide-surface-variant">
                              <thead className="bg-surface-container-low">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-on-surface-variant">CIE Exam</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-on-surface-variant">Status</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-on-surface-variant">Show Marks to NE Students</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-on-surface-variant">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {sortedAssessments(offering.subject.assessments).map((ass) => (
                                  <tr key={ass.id}>
                                    <td className="px-4 py-2 text-sm text-on-surface">{ass.name}</td>
                                    <td className="px-4 py-2">
                                      {renderSubmissionStatus(offering.assignments, ass.id)}
                                    </td>
                                    <td className="px-4 py-2">
                                      {renderNEVisibility(offering.assignments, ass.id, ass.name)}
                                    </td>
                                    <td className="px-4 py-2">
                                      {renderMarksAction(offering.assignments, ass.id)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!filteredOfferings.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-on-surface-variant">
                    {offerings.length === 0 ? (
                      <>
                        No subject offerings yet. Use <strong>Add CIE Exam</strong> or{' '}
                        <strong>Assign Teacher to Subject</strong> to get started — CIE exams show up as soon as
                        they are created, even before a teacher is assigned.
                      </>
                    ) : (
                      'No offerings match your search.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {backlogOffering && (
        <BacklogStudentForm
          subject={backlogOffering.subject}
          enrollmentScope={{ academicYear: backlogOffering.academicYear, semester: backlogOffering.semester }}
          onClose={() => setBacklogOffering(null)}
        />
      )}

      {rosterAssignment && (
        <ElectiveRosterModal
          title={`Manage roster — ${rosterLabel}`}
          description="Explicit roll-number roster for this teacher's assignment. Adding a student here also enrolls them for this offering, so backlog students bypass the usual semester/year match."
          enrollments={rosterRows}
          rosterPaste={rosterPaste}
          rosterResult={rosterResult}
          rosterLoading={bulkAddRoster.isPending || removeFromRoster.isPending}
          rosterPasteRef={rosterPasteRef}
          onDownloadTemplate={() => downloadAssignmentRosterTemplate(rosterAssignment.id)}
          onImport={(file) => importAssignmentRoster(rosterAssignment.id, file)}
          onPasteChange={setRosterPaste}
          onPasteEnroll={handleRosterPasteAdd}
          onRemoveEnrollment={handleRosterRemove}
          onImportComplete={() => invalidateRoster(rosterAssignment.id)}
          onClose={handleCloseRoster}
        />
      )}
    </div>
  );
};

export default AssignmentsManagement;
