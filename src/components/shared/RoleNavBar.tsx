import type { ReactNode } from 'react'
import { StaffShell } from '../staff'

type RoleNavBarProps = {
  title: string
  userLabel?: string | null
  onLogout: () => void
  children?: ReactNode
}

/** @deprecated Use StaffShell directly */
const RoleNavBar = ({ title, userLabel, onLogout, children }: RoleNavBarProps) => (
  <StaffShell title={title} userLabel={userLabel} onLogout={onLogout}>
    {children}
  </StaffShell>
)

export default RoleNavBar
