import { useState, useEffect } from 'react'
import { Mail, Lock } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiClient from '../api/client'
import { usePageTitle } from '../hooks/usePageTitle'
import { AuthAlert, AuthCard, AuthShell, PasswordField } from '../components/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
const DEV_AUTH = import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH === 'true'
const GOOGLE_AUTH = import.meta.env.VITE_GOOGLE_AUTH === 'true'

const OAUTH_ERRORS: Record<string, string> = {
  not_whitelisted: 'Your Google account is not registered. Contact your coordinator.',
  domain_mismatch: 'Your email domain does not match your role in IMMS.',
  inactive: 'This account is inactive.',
  session_superseded: 'You were signed in on another device. Please sign in again.',
  google_no_email: 'Google did not provide an email address.',
  auth_failed: 'Sign-in failed. Try again or contact your coordinator.',
}

const Login = () => {
  usePageTitle('Sign In')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loginId, setLoginId] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, isAuthenticated, user } = useAuthStore()

  const oauthErrorKey = searchParams.get('error')
  const oauthError = oauthErrorKey ? OAUTH_ERRORS[oauthErrorKey] ?? 'Sign-in failed.' : ''

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'COORDINATOR') navigate('/coordinator')
      else if (user.role === 'TEACHER') navigate('/teacher')
      else navigate('/student')
    }
  }, [isAuthenticated, user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await apiClient.post('/auth/login', { loginId, password })
      setUser(response.data.user)
      const role = response.data.user.role
      if (role === 'COORDINATOR') navigate('/coordinator')
      else if (role === 'TEACHER') navigate('/teacher')
      else navigate('/student')
    } catch (err: unknown) {
      const response =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number; data?: { message?: string } } }).response
          : undefined
      if (response?.status === 429) {
        setError('Too many login attempts. Wait a minute and try again.')
      } else {
        setError(response?.data?.message || 'Invalid credentials. Check your roll number or email and password.')
      }
    } finally {
      setLoading(false)
    }
  }

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
            Sign in to your IMMS account
          </p>
        </div>

        {oauthError && <AuthAlert variant="error">{oauthError}</AuthAlert>}
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <form className="space-y-lg" onSubmit={handleLogin}>
          <div className="space-y-xs">
            <label htmlFor="loginId" className="block text-label-md text-on-surface-variant">
              Roll number or email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline"
                aria-hidden="true"
              />
              <input
                id="loginId"
                name="loginId"
                type="text"
                autoComplete="username"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Roll number or email"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-body-md transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-label-sm text-on-surface-variant">
              Students: roll number · Staff: institutional email
            </p>
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            icon={Lock}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-md w-full rounded-lg bg-primary py-4 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {GOOGLE_AUTH && (
          <>
            <div className="my-lg flex items-center gap-3">
              <div className="h-px flex-1 bg-outline-variant" />
              <span className="text-label-sm text-on-surface-variant">or</span>
              <div className="h-px flex-1 bg-outline-variant" />
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest py-4 text-label-md font-semibold text-on-surface shadow-sm transition-all hover:bg-surface-container-low active:scale-[0.98]"
              aria-label="Continue with Google"
            >
              Continue with Google
            </button>
          </>
        )}

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
