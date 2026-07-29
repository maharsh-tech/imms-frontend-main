import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthBootstrap from './components/AuthBootstrap';
import PrivateRoute from './routes/PrivateRoute';
import RoleRoute from './routes/RoleRoute';
import { Role } from './types';
import Login from './pages/Login';
import ActivateAccount from './pages/ActivateAccount';
import CoordinatorDashboard from './pages/coordinator/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import MarksGridPage from './pages/shared/MarksGridPage';
import StudentMarksheet from './pages/student/Marksheet';

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/activate" element={<ActivateAccount />} />

          <Route element={<PrivateRoute />}>
            <Route element={<RoleRoute allowedRoles={[Role.COORDINATOR]} />}>
              <Route path="/coordinator" element={<CoordinatorDashboard />} />
              <Route path="/coordinator/marks/:assignmentId/:assessmentId" element={<MarksGridPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={[Role.TEACHER]} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/marks/:assignmentId/:assessmentId" element={<MarksGridPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={[Role.STUDENT]} />}>
              <Route path="/student" element={<StudentMarksheet />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
