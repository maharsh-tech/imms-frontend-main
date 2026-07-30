import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getMyAssignments } from '../../api/subjects';
import type { SubjectAssignment } from '../../api/subjects';
import apiClient from '../../api/client';
import RoleNavBar from '../../components/shared/RoleNavBar';
import SubmissionStatusBadge from '../../components/shared/SubmissionStatusBadge';

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();
  const [assignments, setAssignments] = useState<SubjectAssignment[]>([]);

  useEffect(() => {
    getMyAssignments().then(setAssignments);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <RoleNavBar
        title="IMMS Teacher"
        userLabel={user?.name || user?.email}
        onLogout={handleLogout}
      />

      <main className="max-w-4xl mx-auto py-8 px-4">
        <h2 className="text-lg font-semibold mb-4">My Subjects</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-500">No subjects assigned yet. Contact the coordinator.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((a) => (
              <div key={a.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <h3 className="font-medium">{a.subject.code} — {a.subject.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Semester {a.semester} · {a.academicYear}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.subject.assessments?.map((ass) => {
                    const sub = a.assessmentSubmissions?.find((s) => s.assessmentId === ass.id);
                    return (
                      <Link
                        key={ass.id}
                        to={`/teacher/marks/${a.id}/${ass.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100"
                      >
                        {ass.name}
                        {sub && <SubmissionStatusBadge status={sub.status} />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
