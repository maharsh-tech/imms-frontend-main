import { GraduationCap, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Represents a single navigation tab within the staff portal.
 */
export type StaffTab<T extends string> = {
  id: T
  label: string
  icon: LucideIcon
  /** Shorter label representation, preserved for backward compatibility */
  shortLabel?: string
}

/**
 * Prop contracts for the StaffSidebar component.
 * Supports generic string literals to enforce type-safety for active tab identifiers.
 */
type StaffSidebarProps<T extends string> = {
  /** The portal portal branding header text (e.g. 'Coordinator Portal') */
  title: string
  /** The current logged in user display label */
  userLabel?: string | null
  /** Callback fired when logging out */
  onLogout?: () => void
  /** List of tabs to render vertically */
  tabs?: StaffTab<T>[]
  /** Current active tab id */
  active?: T
  /** Callback fired when a tab is clicked */
  onChange?: (id: T) => void
  /** Optional callback to close the mobile drawer overlay on selection */
  onCloseDrawer?: () => void
}

/**
 * StaffSidebar - Presentational navigation shell component.
 * Features:
 * - Top portal branding with a unified graduation cap icon.
 * - Vertical nav button list with active states mapping to Academic Core tokens.
 * - Bottom-pinned section displaying user info block and Logout action.
 *
 * Designed to be reusable in both the desktop sticky sidebar and the mobile slide-out drawer.
 */
const StaffSidebar = <T extends string>({
  title,
  userLabel,
  onLogout,
  tabs = [],
  active,
  onChange,
  onCloseDrawer,
}: StaffSidebarProps<T>) => {
  return (
    <div className="flex h-full flex-col justify-between" aria-label="Staff Navigation Sidebar">
      {/* Top Section: Logo Branding and Nav Tabs */}
      <div className="flex flex-col gap-lg">
        {/* Portal Branding Header */}
        <div className="flex items-center gap-sm px-2 py-1">
          <GraduationCap className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-title-lg font-bold text-primary truncate" title={title}>
            {title}
          </span>
        </div>

        {/* Vertical Tab Navigation list */}
        {tabs.length > 0 && (
          <nav className="flex flex-col gap-1" aria-label="Portal sections">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = active === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange?.(id)
                    onCloseDrawer?.() // Closes mobile drawer if active
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-label-md font-semibold transition-colors border-l-4 cursor-pointer ${
                    isActive
                      ? 'border-primary bg-surface-container-low text-primary'
                      : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
          </nav>
        )}
      </div>

      {/* Bottom Section: User Identity Profile and Logout Control */}
      <div className="border-t border-surface-variant/50 pt-md">
        {userLabel && (
          <div
            className="mb-sm px-4 text-label-md font-semibold text-on-surface-variant truncate"
            title={userLabel}
          >
            {userLabel}
          </div>
        )}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-label-md font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default StaffSidebar
