import type { ReactNode } from 'react'
import { GraduationCap, LogOut } from 'lucide-react'

type StaffShellProps = {
  title: string
  userLabel?: string | null
  onLogout?: () => void
  children: ReactNode
  /** Content max width — use full for wide tables */
  wide?: boolean
}

/**
 * Coordinator / teacher page chrome — matches Student Portal header styling.
 */
const StaffShell = ({ title, userLabel, onLogout, children, wide = false }: StaffShellProps) => {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="sticky top-0 z-50 border-b border-surface-variant bg-surface-container-lowest shadow-sm">
        <div
          className={`mx-auto flex h-16 items-center justify-between px-md ${
            wide ? 'max-w-[1400px]' : 'max-w-[1200px]'
          }`}
        >
          <div className="flex min-w-0 items-center gap-sm">
            <GraduationCap className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate text-title-lg font-bold text-primary">{title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-sm sm:gap-md">
            {userLabel && (
              <span className="hidden max-w-[200px] truncate text-label-md text-on-surface-variant sm:inline">
                {userLabel}
              </span>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center rounded-lg px-2 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface sm:px-3"
                aria-label="Log out"
              >
                <LogOut className="mr-0 h-4 w-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main
        className={`mx-auto px-md py-6 pb-xl sm:px-lg ${
          wide ? 'max-w-[1400px]' : 'max-w-[1200px]'
        }`}
      >
        {children}
      </main>
    </div>
  )
}

export default StaffShell
