import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

export const SESSION_SUPERSEDED_SNIPPET = 'Signed in on another device'

export const isSessionSupersededMessage = (message?: string): boolean =>
  Boolean(message?.includes(SESSION_SUPERSEDED_SNIPPET))

export const isPublicAuthPath = (pathname: string): boolean =>
  pathname.startsWith('/login')

let supersededRedirectStarted = false

/** Clear stale cookies once, then redirect — avoids /auth/me → redirect loops. */
export const handleSessionSuperseded = async (): Promise<void> => {
  if (supersededRedirectStarted) return
  supersededRedirectStarted = true
  useAuthStore.getState().logout()

  if (window.location.pathname.startsWith('/login')) {
    supersededRedirectStarted = false
    return
  }

  try {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/auth/logout`,
      {},
      { withCredentials: true },
    )
  } catch {
    // Server still clears cookies when possible; proceed to login.
  }

  window.location.replace('/login?error=session_superseded')
}
