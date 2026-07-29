import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  getMarksGrid,
  saveMarksBulk,
  flagNe,
  submitMarks,
  unlockMarks,
  publishMarks,
} from '../../api/marks';
import type { MarksGrid } from '../../api/marks';
import { FlagType } from '../../types';

type RowState = {
  studentId: string;
  rollNumber: string;
  name: string;
  marksObtained: string;
  isAb: boolean;
  isNe: boolean;
};

const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (message) return message;
  }
  return err instanceof Error ? err.message : fallback;
};

const MarksGridPage = () => {
  const { assignmentId, assessmentId } = useParams<{ assignmentId: string; assessmentId: string }>();
  const { user } = useAuthStore();
  const isCoordinator = user?.role === 'COORDINATOR';
  const isTeacher = user?.role === 'TEACHER';

  const [grid, setGrid] = useState<MarksGrid | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!assignmentId || !assessmentId) return;
    setLoading(true);
    try {
      const data = await getMarksGrid(assignmentId, assessmentId);
      setGrid(data);
      setRows(
        data.students.map((s) => ({
          studentId: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          marksObtained: s.mark?.marksObtained != null ? String(s.mark.marksObtained) : '',
          isAb: s.mark?.flag === FlagType.AB,
          isNe: s.mark?.flag === FlagType.NE,
        })),
      );
    } catch {
      setError('Failed to load marks grid');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [assignmentId, assessmentId]);

  const isDraft = grid?.submission.status === 'DRAFT';
  const isSubmitted = grid?.submission.status === 'SUBMITTED';
  const maxMarks = grid?.assessment.maxMarks ?? 0;

  const handleSaveMarks = async () => {
    if (!assignmentId || !assessmentId) return;
    setSaving(true);
    setError('');
    try {
      await saveMarksBulk({
        subjectAssignmentId: assignmentId,
        assessmentId,
        marks: rows.map((r) => ({
          studentId: r.studentId,
          marksObtained: r.isAb ? null : r.marksObtained === '' ? null : Number(r.marksObtained),
          flag: r.isAb ? FlagType.AB : FlagType.NONE,
        })),
      });
      setMessage('Marks saved');
      load();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNe = async () => {
    if (!assignmentId || !assessmentId) return;
    setSaving(true);
    try {
      await flagNe({
        subjectAssignmentId: assignmentId,
        assessmentId,
        neStudentIds: rows.filter((r) => r.isNe).map((r) => r.studentId),
      });
      setMessage('NE flags saved');
      load();
    } catch {
      setError('Failed to save NE flags');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignmentId || !assessmentId || !confirm('Submit marks to coordinator? You cannot edit after this.')) return;
    await submitMarks(assignmentId, assessmentId);
    setMessage('Submitted');
    load();
  };

  const handleUnlock = async () => {
    if (!assignmentId || !assessmentId) return;
    await unlockMarks(assignmentId, assessmentId);
    setMessage('Unlocked');
    load();
  };

  const handlePublish = async () => {
    if (!assignmentId || !assessmentId) return;
    await publishMarks(assignmentId, assessmentId);
    setMessage('Published — students can now see results');
    load();
  };

  const updateRow = (index: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!grid) return <div className="p-8 text-center text-red-500">{error || 'Not found'}</div>;

  const backLink = isCoordinator ? '/coordinator' : '/teacher';

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link to={backLink} className="text-blue-600 text-sm hover:underline">← Back</Link>
        <h1 className="text-2xl font-bold mt-2">
          {grid.assignment.subject.code} — {grid.assessment.name}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {grid.assignment.faculty.name} · Max {maxMarks} marks ·{' '}
          <span className={`font-medium ${isSubmitted ? 'text-amber-600' : isDraft ? 'text-green-600' : 'text-blue-600'}`}>
            {grid.submission.status}
          </span>
        </p>

        {message && <div className="mt-4 bg-green-50 text-green-700 p-3 rounded text-sm">{message}</div>}
        {error && <div className="mt-4 bg-red-50 text-red-700 p-3 rounded text-sm">{error}</div>}

        <div className="mt-4 bg-white rounded-lg shadow border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sr</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Enter Marks</th>
                {isCoordinator && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">NE</th>}
                {isTeacher && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">AB</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, i) => (
                <tr key={row.studentId} className={row.isNe ? 'bg-amber-50' : ''}>
                  <td className="px-4 py-2 text-sm">{i + 1}</td>
                  <td className="px-4 py-2 text-sm font-mono">{row.rollNumber}</td>
                  <td className="px-4 py-2 text-sm">{row.name}</td>
                  <td className="px-4 py-2">
                    {isTeacher && isDraft ? (
                      <input
                        type="number"
                        value={row.isAb ? '' : row.marksObtained}
                        disabled={row.isAb || !isDraft}
                        onChange={(e) => updateRow(i, { marksObtained: e.target.value })}
                        className="w-20 border rounded px-2 py-1 text-sm"
                        aria-label={`Marks for ${row.name}`}
                      />
                    ) : (
                      <span className="text-sm">{row.isAb ? '—' : row.marksObtained || '—'}</span>
                    )}
                  </td>
                  {isCoordinator && (
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.isNe}
                        disabled={!isDraft}
                        onChange={(e) => updateRow(i, { isNe: e.target.checked })}
                        aria-label={`NE ${row.name}`}
                      />
                    </td>
                  )}
                  {isTeacher && (
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.isAb}
                        disabled={!isDraft}
                        onChange={(e) => updateRow(i, { isAb: e.target.checked, marksObtained: e.target.checked ? '' : row.marksObtained })}
                        aria-label={`AB ${row.name}`}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {isCoordinator && isDraft && (
            <button onClick={handleSaveNe} disabled={saving} className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50">
              Save NE Flags
            </button>
          )}
          {isTeacher && isDraft && (
            <>
              <button onClick={handleSaveMarks} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                Save Draft
              </button>
              <button onClick={handleSubmit} disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
                Submit to Coordinator
              </button>
            </>
          )}
          {isCoordinator && isSubmitted && (
            <>
              <button onClick={handleUnlock} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                Unlock for Teacher
              </button>
              <button onClick={handlePublish} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Publish Results
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksGridPage;
