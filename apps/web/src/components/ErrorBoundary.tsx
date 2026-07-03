import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

/** App-level error boundary so a render crash degrades to a recoverable panel. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Render error boundary caught:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center p-6">
            <div className="glass max-w-md rounded-2xl p-8 text-center">
              <h2 className="text-lg font-semibold text-white">Something broke</h2>
              <p className="mt-2 text-sm text-slate-400">{this.state.error.message}</p>
              <button
                className="btn-primary mt-6"
                onClick={() => this.setState({ error: null })}
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
