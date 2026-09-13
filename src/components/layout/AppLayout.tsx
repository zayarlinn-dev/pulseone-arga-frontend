import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { handleUnauthorized } from '@/providers/privateAxios';
import { cn } from '@/lib/utils';

const COLLAPSED_STORAGE_KEY = 'pulseone-sidebar-collapsed';

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Navigating from a deep link or the browser back button would otherwise
  // leave the drawer covering the page it just opened.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setCollapsed(value => !value);
      }

      // Escape is what people already reach for to dismiss an overlay, and the
      // drawer covers the page it sits on. The sidebar's filter box stops the
      // event first when it has a query to clear, so one press never both
      // empties the filter and throws the drawer away.
      if (event.key === 'Escape') setMobileOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Stable so the sidebar's Ctrl+K listener is attached once rather than torn
   * down and rebuilt on every render of the shell.
   */
  const expandSidebar = useCallback(() => setCollapsed(false), []);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onExpand={expandSidebar}
      />

      {/* Backdrop closes the drawer on mobile. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/*
        The sidebar is fixed so a hover-peek can float over the page without
        reflowing it; this padding reserves the space the *collapsed* state
        occupies, which is why the peek never shifts the content.
      */}
      <div
        // Printing drops the sidebar, so the space reserved for it goes too.
        data-print-reset
        className={cn(
          'flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ease-out',
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <AppHeader
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(value => !value)}
          onOpenMobile={() => setMobileOpen(true)}
        />

        {/* Scoped to the content area so a page that throws leaves the sidebar
            and header usable, rather than taking down the whole shell. */}
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Exposed so the login page can clear a half-established session. */
export { handleUnauthorized };
