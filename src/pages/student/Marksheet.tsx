import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getMyMarksheet } from '../../api/marks';
import apiClient from '../../api/client';
import { LogOut } from 'lucide-react';

interface MarksheetData {
  semester: number | null;
  studentName: string;
  rollNumber: string;
  hasPublished: boolean;
  subjects: {
    code: string;
    name: string;
    assessments: { name: string; maxMarks: number; display: string }[];
  }[];
}

const StudentMarksheet = () => {
  const { logout } = useAuthStore();
  const [data, setData] = useState<MarksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentState, setStudentState] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await apiClient.get('/auth/me');
        setStudentState(me.data.studentState);
        if (me.data.studentState === 'PUBLISHED') {
          const sheet = await getMyMarksheet();
          setData(sheet as MarksheetData);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      logout();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (studentState === 'NO_RECORD') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="max-w-md bg-white rounded-lg shadow p-8 border border-amber-200">
          <h1 className="text-xl font-bold">Account not linked</h1>
          <p className="mt-3 text-gray-600">Contact the Exam Coordinator to have your student record imported.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">My Marksheet</h1>
          <button onClick={handleLogout} className="inline-flex items-center text-sm text-gray-500">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {studentState === 'UNPUBLISHED' && (
          <div className="mt-6 bg-white rounded-lg shadow p-6 border border-blue-200">
            <p className="text-gray-600">Results for your semester have not been published yet. Check back later.</p>
          </div>
        )}
        {data && (
          <>
            <p className="text-gray-700">
              {data.studentName} · {data.rollNumber} · Semester {data.semester}
            </p>

            <div className="mt-6 space-y-4">
                {data.subjects.map((s) => (
                  <div key={s.code} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b font-medium">{s.code} — {s.name}</div>
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 uppercase">
                          <th className="px-4 py-2">Exam</th>
                          <th className="px-4 py-2">Max</th>
                          <th className="px-4 py-2">Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.assessments.map((a) => (
                          <tr key={a.name} className="border-t">
                            <td className="px-4 py-2 text-sm">{a.name}</td>
                            <td className="px-4 py-2 text-sm">{a.maxMarks}</td>
                            <td className="px-4 py-2 text-sm font-medium">{a.display}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentMarksheet;
