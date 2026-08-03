import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, CalendarDays, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  to: string
  label: string
  end?: boolean
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: '/student', label: 'Marks', end: true, icon: BarChart3 },
  { to: '/student/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/student/profile', label: 'Profile', icon: User },
]

const navClassName = ({ isActive }: { isActive: boolean }): string => {
  if (isActive) {
    return 'flex flex-col items-center justify-center gap-1 rounded-full bg-primary-container px-4 py-1 text-on-primary-container transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:rounded-lg lg:px-4 lg:py-3'
  }
  return 'flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-on-secondary-container transition-colors hover:bg-surface-container lg:flex-row lg:justify-start lg:gap-3 lg:rounded-lg lg:px-4 lg:py-3'
}

/**
 * Student portal chrome: sticky header (no photo), desktop sidebar, mobile bottom nav.
 */
const StudentShell = () => {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-surface-variant bg-surface px-md shadow-sm">
        <span className="text-title-lg font-bold text-primary">Student Portal</span>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px]">
        <aside
          className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col gap-1 border-r border-surface-variant bg-background p-md lg:flex"
          aria-label="Student navigation"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navClassName}
                aria-label={item.label}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`text-label-sm ${isActive ? 'font-bold' : 'font-semibold'}`}>
                      {item.label === 'Marks' ? 'Marksheet' : item.label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </aside>

        <main className="min-w-0 flex-1 px-md pb-32 pt-6 lg:px-lg lg:pb-xl">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-surface-variant bg-surface-container-lowest px-2 pb-[env(safe-area-inset-bottom)] shadow-lg lg:hidden"
        aria-label="Student navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navClassName}
              aria-label={item.label}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-6 w-6"
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={`text-label-sm mt-1 ${isActive ? 'font-bold' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export default StudentShell
