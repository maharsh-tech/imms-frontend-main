import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle, KeyRound, Lock } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import apiClient from '../api/client'
import { AuthAlert, AuthCard, AuthShell, PasswordField } from '../components/auth'
import { consumeActivationTokenFromUrl } from '../utils/activation-token'

const getStrengthLevel = (password: string): number => {
  if (password.length === 0) return 0
  if (password.length <= 4) return 1
  if (password.length <= 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 2
  if (password.length < 12 || !/[^A-Za-z0-9]/.test(password)) return 3
  return 4
}

const ActivateAccount = () => {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strengthLevel = useMemo(() => getStrengthLevel(newPassword), [newPassword])

  useEffect(() => {
    const parsed = consumeActivationTokenFromUrl()
    if (parsed) {
      setToken(parsed)
      return
    }
    setError('Invalid activation link. Ask your coordinator for a new one.')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) return
    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters long.')
      return
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one letter and one digit.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await apiClient.post('/auth/activate', { token, newPassword })
      navigate('/login?activated=1', { replace: true })
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message || 'Failed to activate account. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="mb-xl text-center">
        <div className="mb-md inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
          <KeyRound className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="mb-sm text-headline-md font-semibold text-on-surface">Secure Your Account</h1>
        <p className="text-body-md text-on-surface-variant">
          Please choose a strong password that you haven&apos;t used before.
        </p>
      </div>

      <AuthCard>
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <form className="space-y-lg" onSubmit={handleSubmit}>
          <div className="space-y-xs">
            <PasswordField
              id="newPassword"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              icon={Lock}
              disabled={!token || loading}
              autoComplete="new-password"
            />
            <div className="mt-2 flex gap-1 px-1" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => {
                let barColor = 'bg-outline-variant'
                if (strengthLevel > index) {
                  if (strengthLevel >= 4) barColor = 'bg-green-500'
                  else if (strengthLevel >= 3) barColor = 'bg-yellow-500'
                  else if (strengthLevel >= 2) barColor = 'bg-orange-500'
                  else barColor = 'bg-error'
                }
                return (
                  <div key={index} className={`h-1 flex-1 rounded-full transition-colors ${barColor}`} />
                )
              })}
            </div>
          </div>

          <PasswordField
            id="confirmPassword"
            label="Re-enter Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            icon={CheckCircle}
            disabled={!token || loading}
            autoComplete="new-password"
          />

          <div className="flex items-start gap-sm rounded-lg bg-surface-container-low p-md">
            <p className="text-label-sm text-on-surface-variant">
              Password must be at least 10 characters and include at least one letter and one digit.
            </p>
          </div>

          <button
            type="submit"
            disabled={!token || loading}
            className="flex w-full items-center justify-center gap-sm rounded-lg bg-primary px-xl py-3 text-label-md font-bold text-on-primary shadow-sm transition-all hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Activating...' : 'Activate Account'}
            {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>

        <div className="mt-lg text-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-xs text-label-md text-primary transition-colors hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Login
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  )
}

export default ActivateAccount
