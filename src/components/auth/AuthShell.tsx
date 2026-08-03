import type { ReactNode } from 'react'
import { GraduationCap } from 'lucide-react'

type AuthShellProps = {
  children: ReactNode
}

/**
 * Shared auth page chrome: fixed header + centered form card.
 */
const AuthShell = ({ children }: AuthShellProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <header className="fixed top-0 z-50 h-16 w-full border-b border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="mx-auto flex h-full w-full max-w-[1200px] items-center px-md">
          <div className="flex items-center gap-sm">
            <GraduationCap className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-headline-md font-bold text-primary">Student Portal</span>
          </div>
        </div>
      </header>

      <main className="relative flex flex-grow items-center justify-center overflow-hidden px-md pb-12 pt-24">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-40" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-48 top-1/2 h-80 w-80 rounded-full bg-tertiary-container/10 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  )
}

export default AuthShell
