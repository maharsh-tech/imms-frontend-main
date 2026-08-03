import type { LucideIcon } from 'lucide-react'

export type StaffTab<T extends string> = {
  id: T
  label: string
  icon: LucideIcon
  /** Shorter label for narrow screens */
  shortLabel?: string
}

type StaffTabBarProps<T extends string> = {
  tabs: StaffTab<T>[]
  active: T
  onChange: (id: T) => void
  ariaLabel?: string
}

/**
 * Horizontal scrollable tab bar — mobile-friendly coordinator navigation.
 */
const StaffTabBar = <T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel = 'Section navigation',
}: StaffTabBarProps<T>) => {
  return (
    <nav
      className="-mx-md mb-lg overflow-x-auto border-b border-surface-variant px-md sm:mx-0 sm:px-0"
      aria-label={ariaLabel}
    >
      <div className="flex min-w-max gap-1 pb-px sm:flex-wrap sm:gap-2">
        {tabs.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-3 py-2.5 text-label-md transition-colors sm:px-4 ${
                isActive
                  ? 'border-primary bg-surface-container-lowest font-semibold text-primary'
                  : 'border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap sm:hidden">{shortLabel ?? label}</span>
              <span className="hidden whitespace-nowrap sm:inline">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default StaffTabBar
