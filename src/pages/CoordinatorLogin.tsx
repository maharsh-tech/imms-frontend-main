import { useState, useEffect } from 'react'
import { Mail, Lock } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { usePageTitle } from '../hooks/usePageTitle'
import { AuthAlert, AuthCard, AuthShell, PasswordField } from '../components/auth'

const CoordinatorLogin = () => {
  usePageTitle('Sign In')
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, isAuthenticated, user } = useAuthStore()

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
        setError(response?.data?.message || 'Invalid credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-xxl text-center">
          <h1 className="mb-base text-headline-lg-mobile font-semibold text-primary lg:text-headline-lg">
            Sign in
          </h1>
        </div>

        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <form className="space-y-lg" onSubmit={handleLogin}>
          <div className="space-y-xs">
            <label htmlFor="loginId" className="block text-label-md text-on-surface-variant">
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline"
                aria-hidden="true"
              />
              <input
                id="loginId"
                name="loginId"
                type="email"
                autoComplete="username"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-body-md transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
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
      </AuthCard>
    </AuthShell>
  )
}

export default CoordinatorLogin
