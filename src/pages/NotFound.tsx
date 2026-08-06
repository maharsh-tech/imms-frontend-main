import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { usePageTitle } from '../hooks/usePageTitle'

const NotFound = () => {
  usePageTitle('Page Not Found')
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  const handleGoHome = () => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.role === 'COORDINATOR') navigate('/coordinator', { replace: true })
    else if (user.role === 'TEACHER') navigate('/teacher', { replace: true })
    else navigate('/student', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="text-[6rem] font-bold leading-none text-primary opacity-20 select-none">404</p>
      <div className="space-y-2">
        <h1 className="text-headline-lg font-semibold text-on-surface">Page not found</h1>
        <p className="text-body-md text-on-surface-variant">
          The page you're looking for doesn't exist or you don't have access.
        </p>
      </div>
      <button
        type="button"
        onClick={handleGoHome}
        className="rounded-lg bg-primary px-6 py-3 text-label-md font-semibold text-on-primary hover:bg-primary-container transition-colors"
      >
        Go to dashboard
      </button>
    </div>
  )
}

export default NotFound
