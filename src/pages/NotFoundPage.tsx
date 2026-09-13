import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Compass, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-6 w-6" />
        </div>

        <p className="mt-4 text-3xl font-semibold tracking-tight">404</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('common.error.notFoundBody')}</p>

        {/* Showing the path makes a mistyped or stale link obvious at a glance. */}
        <p className="mt-3 truncate rounded-md bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          {location.pathname}
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft />
            {t('common.error.goBack')}
          </Button>
          <Button asChild>
            <Link to="/">
              <LayoutDashboard />
              {t('common.error.goHome')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
