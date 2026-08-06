import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthBootstrap from './components/AuthBootstrap'
import PrivateRoute from './routes/PrivateRoute'
import RoleRoute from './routes/RoleRoute'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { Role } from './types'

// Auth pages — small, load eagerly (needed before JS finishes, on login screen)
import Login from './pages/Login'
import ActivateAccount from './pages/ActivateAccount'
import NotFound from './pages/NotFound'

// Role-specific bundles — lazy loaded, only downloaded when the user's role matches
const CoordinatorDashboard = lazy(() => import('./pages/coordinator/Dashboard'))
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'))
const MarksGridPage = lazy(() => import('./pages/shared/MarksGridPage'))
const StudentShell = lazy(() => import('./components/student/StudentShell'))
const StudentMarksheet = lazy(() => import('./pages/student/Marksheet'))
const StudentSchedule = lazy(() => import('./pages/student/Schedule'))
const StudentProfile = lazy(() => import('./pages/student/Profile'))

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
    <p className="animate-pulse text-body-md text-on-surface-variant">Loading...</p>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/activate" element={<ActivateAccount />} />

              <Route element={<PrivateRoute />}>
                <Route element={<RoleRoute allowedRoles={[Role.COORDINATOR]} />}>
                  <Route
                    path="/coordinator"
                    element={
                      <ErrorBoundary>
                        <CoordinatorDashboard />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/coordinator/marks/:assignmentId/:assessmentId"
                    element={
                      <ErrorBoundary>
                        <MarksGridPage />
                      </ErrorBoundary>
                    }
                  />
                </Route>
                <Route element={<RoleRoute allowedRoles={[Role.TEACHER]} />}>
                  <Route
                    path="/teacher"
                    element={
                      <ErrorBoundary>
                        <TeacherDashboard />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/teacher/marks/:assignmentId/:assessmentId"
                    element={
                      <ErrorBoundary>
                        <MarksGridPage />
                      </ErrorBoundary>
                    }
                  />
                </Route>
                <Route element={<RoleRoute allowedRoles={[Role.STUDENT]} />}>
                  <Route path="/student" element={<StudentShell />}>
                    <Route index element={<StudentMarksheet />} />
                    <Route path="schedule" element={<StudentSchedule />} />
                    <Route path="profile" element={<StudentProfile />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthBootstrap>
    </BrowserRouter>
  )
}
