import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean; message: string }

/**
 * Catches render errors in the component tree below.
 * Prevents a single panel crash from white-screening the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }

  handleReset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          role="alert"
          className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-8 text-center"
        >
          <p className="text-label-md font-semibold text-error">Something went wrong</p>
          <p className="max-w-sm text-body-md text-on-surface-variant">{this.state.message}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-lg border border-outline-variant px-4 py-2 text-label-md hover:bg-surface-container"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
