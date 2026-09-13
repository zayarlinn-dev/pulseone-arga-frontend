import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  /** Rendered instead of the default panel when provided. */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

interface FallbackPanelProps {
  error: Error;
  onReset: () => void;
}

/**
 * Split out of the boundary because `useTranslation` cannot be called from a
 * class, and the boundary has to remain one — `getDerivedStateFromError` has no
 * hook equivalent. Keeping the panel as a function component also means it
 * re-renders on a language switch like every other screen.
 */
function FallbackPanel({ error, onReset }: FallbackPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>{t('common.error.title')}</CardTitle>
          </div>
          <CardDescription>{t('common.error.body')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* The message helps during development and when a user reports a
              fault; it is a client-side error and leaks no server internals.
              It stays in English because it comes from the runtime, not from
              the catalogue. */}
          <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-words">
            {error.message || t('common.error.unknown')}
          </p>

          <div className="flex gap-2">
            <Button onClick={onReset}>{t('common.action.retry')}</Button>
            <Button variant="outline" onClick={() => window.location.assign('/')}>
              {t('common.error.backToDashboard')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Catches render-time exceptions so one broken screen does not blank the app.
 *
 * React unmounts the whole tree when a render throws and nothing catches it —
 * the user is left staring at a white page with no way back. This keeps the
 * shell alive and offers a route out.
 *
 * It does not catch errors thrown in event handlers or async callbacks; those
 * surface through React Query's error states and the toast handler instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Replace with a reporting service when one is available.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return <FallbackPanel error={error} onReset={this.handleReset} />;
  }
}
