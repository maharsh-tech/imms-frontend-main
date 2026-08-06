/** Read activation token from URL hash, then strip it from the address bar. */
export const consumeActivationTokenFromUrl = (): string => {
  const hash = window.location.hash
  if (!hash.startsWith('#token=')) return ''
  const token = decodeURIComponent(hash.slice('#token='.length))
  window.history.replaceState(null, '', '/activate')
  return token
}
