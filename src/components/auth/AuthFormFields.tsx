import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  icon: LucideIcon
  placeholder?: string
  disabled?: boolean
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete']
}

/**
 * Password input with leading icon and visibility toggle.
 */
const PasswordField = ({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  placeholder = '••••••••',
  disabled = false,
  autoComplete = 'current-password',
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false)

  const handleToggle = () => {
    setVisible((prev) => !prev)
  }

  return (
    <div className="space-y-xs">
      <label htmlFor={id} className="block text-label-md text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline"
          aria-hidden="true"
        />
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-12 text-body-md transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface disabled:opacity-60"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
          ) : (
            <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}

type AuthAlertProps = {
  variant: 'error' | 'success'
  children: ReactNode
}

export const AuthAlert = ({ variant, children }: AuthAlertProps) => {
  const styles =
    variant === 'success'
      ? 'border-primary-container/30 bg-primary-fixed/40 text-on-primary-fixed'
      : 'border-error/30 bg-error-container text-on-error-container'

  return (
    <div className={`mb-lg rounded-lg border p-4 text-body-md ${styles}`} role="alert">
      {children}
    </div>
  )
}

export const AuthCard = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-xl shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]">
    {children}
  </div>
)

export default PasswordField
