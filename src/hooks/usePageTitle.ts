import { useEffect } from 'react'

/**
 * Sets document.title for the current page, reset on unmount to the app default.
 */
export const usePageTitle = (title: string) => {
  useEffect(() => {
    const prev = document.title
    document.title = `${title} — IMMS`
    return () => { document.title = prev }
  }, [title])
}
