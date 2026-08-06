/**
 * Extracts the human-readable error message from an axios error response.
 * Falls back to the Error message, then to the provided fallback string.
 */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } })
      .response?.data?.message
    if (Array.isArray(message)) return message[0] ?? fallback
    if (message) return message
  }
  return err instanceof Error ? err.message : fallback
}
