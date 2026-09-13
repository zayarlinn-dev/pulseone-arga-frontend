import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { RouteProvider } from '@/providers/RouteProvider';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { queryClient } from '@/lib/queryClient';
import { useThemeStore, watchSystemTheme } from '@/stores/themeStore';
import { applyPrintFormat, usePrintFormatStore } from '@/stores/printFormatStore';
// Side-effect import: initialises i18next before the first component renders,
// so no screen mounts with raw translation keys on screen.
import '@/i18n';
import '@/index.css';

/* The receipt reads its paper size off <html>, so the stored choice has to be
   on the element before the first render — a Ctrl+P on a freshly opened tab
   must go to the same printer as the button does. */
applyPrintFormat(usePrintFormatStore.getState().format);

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root was not found in index.html');
}

/** Toasts follow the app theme instead of sonner's own OS lookup. */
function ThemedToaster() {
  const theme = useThemeStore(state => state.theme);

  useEffect(watchSystemTheme, []);

  return <Toaster position="top-right" theme={theme} richColors closeButton />;
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouteProvider />
        <ThemedToaster />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
