import { useState } from 'react'
import type { ReactNode } from 'react'
import { Menu, X, GraduationCap } from 'lucide-react'
import StaffSidebar from './StaffSidebar'
import type { StaffTab } from './StaffSidebar'

/**
 * Prop contracts for the StaffShell layout wrapper.
 * Extends supporting optional tabs navigation for coordinator dashboards.
 */
type StaffShellProps<T extends string> = {
  /** Page/Portal title (e.g. 'Coordinator Portal' or 'Teacher Portal') */
  title: string
  /** Logged-in user's display name or email */
  userLabel?: string | null
  /** Logout function passed down to the sidebar/drawer */
  onLogout?: () => void
  /** Main page body contents */
  children: ReactNode
  /** If true, expands the desktop container width from max-w-1200px to max-w-1400px (useful for tables) */
  wide?: boolean
  /** Navigation tabs configuration */
  tabs?: StaffTab<T>[]
  /** Currently active tab value matching generic string types */
  activeTab?: T
  /** Triggered on tab change navigation */
  onTabChange?: (id: T) => void
}

/**
 * StaffShell - Unified page layout structure for Coordinator and Teacher roles.
 * Layout architecture:
 * - Desktop Viewport (>= 1024px): Renders a sticky left-hand vertical sidebar (260px wide) and a flex-grow main page panel.
 * - Mobile Viewport (< 1024px): Collapses the sidebar into an overlay slide-in drawer. Renders a slim top header bar
 *   containing the hamburger button trigger, branding logo, and portal title.
 */
const StaffShell = <T extends string>({
  title,
  userLabel,
  onLogout,
  children,
  wide = false,
  tabs = [],
  activeTab,
  onTabChange,
}: StaffShellProps<T>) => {
  // Local state managing the toggle/open state of the slide-out mobile drawer
  const [isDrawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-on-background lg:flex">
      {/* Desktop Sticky Sidebar - fixed on left, full height, visible on large screens */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-surface-variant bg-surface-container-lowest p-md lg:flex">
        <StaffSidebar
          title={title}
          userLabel={userLabel}
          onLogout={onLogout}
          tabs={tabs}
          active={activeTab}
          onChange={onTabChange}
        />
      </aside>

      {/* Mobile Drawer Overlay Panel - visible only on medium/narrow viewports when triggered */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Dark backdrop overlay clickable to close drawer */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer body structure */}
          <aside className="relative flex h-full w-64 flex-col border-r border-surface-variant bg-surface-container-lowest p-md shadow-xl">
            {/* Close button inside mobile drawer */}
            <div className="absolute right-4 top-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <StaffSidebar
              title={title}
              userLabel={userLabel}
              onLogout={onLogout}
              tabs={tabs}
              active={activeTab}
              onChange={onTabChange}
              onCloseDrawer={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Page Layout Wrapper */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Slim Header Bar - fixed top, visible on small/medium viewports */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-surface-variant bg-surface-container-lowest px-md shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface cursor-pointer mr-sm"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-xs">
            <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="truncate text-title-lg font-bold text-primary">{title}</span>
          </div>
        </header>

        {/* Scrollable Children Body Area */}
        <main
          className={`w-full px-md py-6 pb-xl sm:px-lg mx-auto ${
            wide ? 'max-w-[1400px]' : 'max-w-[1200px]'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default StaffShell
