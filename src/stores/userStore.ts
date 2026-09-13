import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearAllDrafts } from '@/lib/form-drafts';

export interface AuthUser {
  userId: number;
  username: string;
  role: string;
  isSuperUser: boolean;
}

interface AuthState {
  user: AuthUser | null;
  /**
   * Module privilege slugs granted to this user ("get-patient", "create-item").
   * A super user receives every privilege from the backend, so `can()` needs no
   * special case beyond the flag check.
   */
  permissions: string[];
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, permissions: string[]) => void;
  setPermissions: (permissions: string[]) => void;
  clearAuth: () => void;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      isAuthenticated: false,

      setAuth: (user, permissions) => set({ user, permissions, isAuthenticated: true }),

      setPermissions: permissions => set({ permissions }),

      clearAuth: () => {
        // Both logout paths land here — the header menu and an expired token —
        // and neither should leave one user's half-finished form on a shared
        // machine for the next person to be offered.
        clearAllDrafts();
        set({ user: null, permissions: [], isAuthenticated: false });
      },

      can: permission => {
        const { user, permissions } = get();
        if (user?.isSuperUser) return true;
        return permissions.includes(permission);
      },

      canAny: required => {
        const { user, permissions } = get();
        if (user?.isSuperUser) return true;
        return required.some(p => permissions.includes(p));
      }
    }),
    {
      name: 'pulseone-auth',
      // Tokens live in cookies, not here — persisting them in localStorage
      // would widen the XSS blast radius for no benefit.
      partialize: state => ({
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
