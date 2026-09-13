import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { findActiveNav, getInitials } from '@/components/layout/navigation';
import { AppSettings } from '@/components/layout/AppSettings';
import { useAuthStore } from '@/stores/userStore';
import { authService } from '@/services/authService';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenMobile: () => void;
}

export function AppHeader({ collapsed, onToggleCollapsed, onOpenMobile }: AppHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { section, item } = findActiveNav(location.pathname);

  // The menu is a plain div rather than a Radix popover, so dismissal has to be
  // wired up by hand: clicking anywhere else or pressing Escape closes it.
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await authService.logout();
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <header
      data-print-hide
      className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:px-6"
    >
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label={t('shell.openNavigation')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')}
        title={collapsed ? t('shell.expandSidebarTitle') : t('shell.collapseSidebarTitle')}
        className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      {/* Breadcrumb keeps the current location visible once the rail is collapsed. */}
      <nav aria-label={t('shell.breadcrumb')} className="ml-1 min-w-0 truncate text-sm">
        {section && (
          <span className="hidden text-muted-foreground sm:inline">{t(section.labelKey)}</span>
        )}
        {section && item && <span className="hidden px-1.5 text-muted-foreground sm:inline">/</span>}
        <span className="font-medium">{item ? t(item.labelKey) : t('common.appName')}</span>
      </nav>

      {/* Theme used to sit out here as its own icon button. It moved into the
          menu below so that the two per-device preferences — appearance and the
          counter's density — are found in one place rather than one in the
          chrome and one buried in a page. */}
      <div className="ml-auto flex items-center gap-1">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            aria-haspopup="menu"
            aria-label={t('shell.userMenu')}
            aria-expanded={menuOpen}
            className={cn(
              'flex h-9 items-center gap-2 rounded-md px-1.5 text-sm transition-colors hover:bg-accent',
              menuOpen && 'bg-accent'
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(user?.username)}
            </span>
            <span className="hidden max-w-[10rem] truncate sm:inline">{user?.username}</span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              // Wider than the English layout needed: the Burmese preference labels
              // and their hints are longer, and a 16rem menu wrapped them into a
              // column of two-word lines.
              className="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border bg-popover p-1 shadow-lg"
            >
              <div className="border-b px-2 py-2">
                <p className="truncate text-sm font-medium">{user?.username}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.role}
                  {user?.isSuperUser && ` · ${t('shell.superUser')}`}
                </p>
              </div>

              <AppSettings />

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                {t('shell.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
