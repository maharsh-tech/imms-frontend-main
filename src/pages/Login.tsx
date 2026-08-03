import { useState, useEffect } from 'react'
import { Mail, Lock } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiClient from '../api/client'
import { AuthAlert, AuthCard, AuthShell, PasswordField } from '../components/auth'

const Login = () => {
  const [searchParams] = useSearchParams()
  const [loginId, setLoginId] = useState(searchParams.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { setUser, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (searchParams.get('activated') === '1') {
      setSuccess('Account activated. Sign in with your roll number (students) or email (staff) and password.')
    }
  }, [searchParams])

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
    setSuccess('')
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
      const status = response?.status
      const message = response?.data?.message
      if (status === 429) {
        setError('Too many login attempts. Wait a minute and try again.')
      } else {
        setError(message || 'Invalid credentials. Check your roll number or email and password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-xxl text-center">
          <h2 className="mb-base text-headline-lg-mobile font-semibold text-primary lg:text-headline-lg">
            Welcome Back
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Sign in to your Academic Core account
          </p>
        </div>

        {success && <AuthAlert variant="success">{success}</AuthAlert>}
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
                placeholder="24IT093 or dev@charusat.ac.in"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-body-md transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-label-sm text-on-surface-variant">
              Students: roll number only (e.g. 24IT093) · Staff: @charusat.ac.in email
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
          <p className="-mt-sm text-label-sm text-on-surface-variant">
            First time? Open the activation link from your welcome email to set your password.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-md w-full rounded-lg bg-primary py-4 text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}

export default Login
