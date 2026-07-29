import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import AllowedUsersManagement from './AllowedUsers';
import ExcelImportCard from '../../components/shared/ExcelImportCard';
import {
  downloadStudentTemplate,
  downloadFacultyTemplate,
  importStudents,
  importFaculty,
} from '../../api/import';
import { LogOut, Users, GraduationCap, BookOpen, Layers, Link2 } from 'lucide-react';
import SubjectsManagement from './SubjectsManagement';
import AssignmentsManagement from './AssignmentsManagement';
import apiClient from '../../api/client';

type Tab = 'users' | 'students' | 'faculty' | 'subjects' | 'assignments';

export default function CoordinatorDashboard() {
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<Tab>('users');

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      logout();
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'users', label: 'Allowed Users', icon: Users },
    { id: 'students', label: 'Import Students', icon: GraduationCap },
    { id: 'faculty', label: 'Import Faculty', icon: BookOpen },
    { id: 'subjects', label: 'Subjects & Exams', icon: Layers },
    { id: 'assignments', label: 'Assignments', icon: Link2 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">IMMS Coordinator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 font-medium">
                {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                  tab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'users' && <AllowedUsersManagement />}
          {tab === 'students' && (
            <ExcelImportCard
              title="Student Import"
              description="Upload .xlsx with Roll Number, Full Name, Email (@charusat.edu.in), Department, Semester, Batch. Re-upload updates existing roll numbers."
              onDownloadTemplate={downloadStudentTemplate}
              onImport={importStudents}
            />
          )}
          {tab === 'faculty' && (
            <ExcelImportCard
              title="Faculty Import"
              description="Upload .xlsx with Faculty ID, Full Name, Email (@charusat.ac.in), Department."
              onDownloadTemplate={downloadFacultyTemplate}
              onImport={importFaculty}
            />
          )}
          {tab === 'subjects' && <SubjectsManagement />}
          {tab === 'assignments' && <AssignmentsManagement />}
        </div>
      </main>
    </div>
  );
}
