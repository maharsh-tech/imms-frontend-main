import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, CalendarDays, User, GraduationCap, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import apiClient from '../../api/client'

type NavItem = {
  to: string
  label: string
  end?: boolean
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { to: '/student', label: 'Marksheet', end: true, icon: BarChart3 },
  { to: '/student/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/student/profile', label: 'Profile', icon: User },
]

const desktopNavClassName = ({ isActive }: { isActive: boolean }): string =>
  `flex w-full items-center gap-3 rounded-lg px-4 py-3 text-label-md font-semibold transition-colors border-l-4 cursor-pointer ${
    isActive
      ? 'border-primary bg-surface-container-low text-primary'
      : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
  }`

const mobileNavClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive
    ? 'flex flex-col items-center justify-center gap-1 rounded-full bg-primary-container px-4 py-1 text-on-primary-container transition-colors'
    : 'flex flex-col items-center justify-center gap-1 rounded-xl p-2 text-on-secondary-container transition-colors hover:bg-surface-container'

const StudentShell = () => {
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      logout()
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background lg:flex">
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-surface-variant bg-surface-container-lowest p-md lg:flex lg:flex-col"
        aria-label="Student navigation"
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-lg">
            <div className="flex items-center gap-sm px-2 py-1">
              <GraduationCap className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate text-title-lg font-bold text-primary">Student Portal</span>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Student sections">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={desktopNavClassName}
                    aria-label={item.label}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-surface-variant/50 pt-md">
            {user && (
              <div
                className="mb-sm truncate px-4 text-label-md font-semibold text-on-surface-variant"
                title={user.name || user.email}
              >
                {user.name || user.email}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-label-md font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center border-b border-surface-variant bg-surface-container-lowest px-md shadow-sm lg:hidden">
          <GraduationCap className="mr-2 h-6 w-6 text-primary" aria-hidden="true" />
          <span className="text-title-lg font-bold text-primary">Student Portal</span>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-md pb-32 pt-6 lg:px-lg lg:pb-xl">
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
              className={mobileNavClassName}
              aria-label={item.label}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-6 w-6"
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={`mt-1 text-label-sm ${isActive ? 'font-bold' : ''}`}>
                    {item.label === 'Marksheet' ? 'Marks' : item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl p-2 text-on-secondary-container transition-colors hover:bg-surface-container"
          aria-label="Log out"
        >
          <LogOut className="h-6 w-6" aria-hidden="true" />
          <span className="mt-1 text-label-sm">Logout</span>
        </button>
      </nav>
    </div>
  )
}

export default StudentShell
