import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './routes/PrivateRoute';
import { RoleRoute } from './routes/RoleRoute';
import { Role } from './types';
import Login from './pages/Login';
import CoordinatorDashboard from './pages/coordinator/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentMarksheet from './pages/student/Marksheet';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated routes */}
        <Route element={<PrivateRoute />}>
          {/* Coordinator routes */}
          <Route element={<RoleRoute allowedRoles={[Role.COORDINATOR]} />}>
            <Route path="/coordinator" element={<CoordinatorDashboard />} />
          </Route>

          {/* Teacher routes */}
          <Route element={<RoleRoute allowedRoles={[Role.TEACHER]} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
          </Route>

          {/* Student routes */}
          <Route element={<RoleRoute allowedRoles={[Role.STUDENT]} />}>
            <Route path="/student" element={<StudentMarksheet />} />
          </Route>
        </Route>

        {/* Catch-all — redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
