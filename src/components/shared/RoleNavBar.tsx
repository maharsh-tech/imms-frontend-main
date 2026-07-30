import { LogOut } from 'lucide-react'

type RoleNavBarProps = {
  title: string
  userLabel?: string | null
  onLogout: () => void
}

const RoleNavBar = ({ title, userLabel, onLogout }: RoleNavBarProps) => (
  <nav className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <h1 className="text-xl font-bold text-blue-600">{title}</h1>
        <div className="flex items-center gap-4">
          {userLabel && (
            <span className="text-sm text-gray-700 font-medium hidden sm:inline">{userLabel}</span>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
)

export default RoleNavBar
