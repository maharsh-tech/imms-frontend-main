import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { AuthAlert, AuthCard, AuthShell } from '../components/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
const DEV_AUTH = import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH === 'true'

const OAUTH_ERRORS: Record<string, string> = {
  not_whitelisted: 'Your Google account is not registered. Contact your coordinator.',
  domain_mismatch: 'Your email domain does not match your role in IMMS.',
  inactive: 'This account is inactive.',
  session_superseded: 'You were signed in on another device. Please sign in again.',
  google_no_email: 'Google did not provide an email address.',
  coordinator_password_only: 'This account uses a different sign-in method.',
  auth_failed: 'Sign-in failed. Try again or contact your coordinator.',
}

const Login = () => {
  usePageTitle('Sign In')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuthStore()

  const oauthErrorKey = searchParams.get('error')
  const oauthError = oauthErrorKey ? OAUTH_ERRORS[oauthErrorKey] ?? 'Sign-in failed.' : ''

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'COORDINATOR') navigate('/coordinator')
      else if (user.role === 'TEACHER') navigate('/teacher')
      else navigate('/student')
    }
  }, [isAuthenticated, user, navigate])

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`
  }

  const handleDevLogin = (role: string) => {
    window.location.href = `${API_BASE}/auth/dev/login?role=${role}`
  }

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-xxl text-center">
          <h1 className="mb-base text-headline-lg-mobile font-semibold text-primary lg:text-headline-lg">
            Welcome Back
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Sign in with your Charusat Google account
          </p>
        </div>

        {oauthError && <AuthAlert variant="error">{oauthError}</AuthAlert>}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest py-4 text-label-md font-semibold text-on-surface shadow-sm transition-all hover:bg-surface-container-low active:scale-[0.98]"
          aria-label="Continue with Google"
        >
          Continue with Google
        </button>

        {DEV_AUTH && (
          <div className="mt-xl border-t border-outline-variant pt-lg">
            <p className="mb-md text-center text-label-sm font-medium text-on-surface-variant">
              Dev only — quick role switch
            </p>
            <div className="flex flex-col gap-2">
              {(['COORDINATOR', 'TEACHER', 'STUDENT'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleDevLogin(role)}
                  className="rounded-lg border border-dashed border-outline-variant px-3 py-2 text-label-sm text-on-surface-variant hover:bg-surface-container-low"
                >
                  Sign in as {role.charAt(0) + role.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  )
}

export default Login
