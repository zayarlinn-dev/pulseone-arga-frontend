import axios from 'axios';
import Cookies from 'js-cookie';
import { CONFIG, COOKIE_NAMES, API_ENDPOINTS, getCookieOptions } from '@/config/constants';
import { useAuthStore } from '@/stores/userStore';

/**
 * Axios instance for authenticated requests.
 *
 * It attaches the bearer token, transparently refreshes an expired one, and
 * sends the user back to login when the session can no longer be recovered.
 */
const privateApi = axios.create({
  baseURL: CONFIG.apiUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

/**
 * Clears the session and redirects to login. Uses a hard navigation rather than
 * the router so it works from interceptors, which live outside React.
 */
export function handleUnauthorized(): void {
  Cookies.remove(COOKIE_NAMES.ACCESS_TOKEN, { path: '/' });
  Cookies.remove(COOKIE_NAMES.REFRESH_TOKEN, { path: '/' });
  useAuthStore.getState().clearAuth();

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/**
 * Shared in-flight refresh. When several requests discover an expired token at
 * once they all await this single call, instead of firing a refresh each — and
 * each triggering its own logout when the refresh token is dead.
 */
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get(COOKIE_NAMES.REFRESH_TOKEN);

  if (!refreshToken) {
    handleUnauthorized();
    return null;
  }

  try {
    // A bare axios call, not privateApi — otherwise the request interceptor
    // would try to refresh the token needed to refresh the token.
    const response = await axios.post(
      `${CONFIG.apiUrl}${API_ENDPOINTS.AUTH_REFRESH}`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const payload = response.data?.data;
    if (!payload?.token) {
      handleUnauthorized();
      return null;
    }

    Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, payload.token, getCookieOptions(1));
    if (payload.refreshToken) {
      Cookies.set(COOKIE_NAMES.REFRESH_TOKEN, payload.refreshToken, getCookieOptions(7));
    }

    useAuthStore.getState().setAuth(
      {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
        isSuperUser: payload.isSuperUser ?? false
      },
      payload.permissions ?? []
    );

    return payload.token as string;
  } catch {
    handleUnauthorized();
    return null;
  }
}

/** Methods that create something new every time they run. */
const MUTATING = new Set(['post', 'put', 'patch']);

privateApi.interceptors.request.use(
  async config => {
    let token = Cookies.get(COOKIE_NAMES.ACCESS_TOKEN);

    // The access-token cookie expires with the token, so a missing cookie is
    // the signal to refresh before the request rather than after a 401.
    if (!token) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return Promise.reject(new Error('Session expired'));
      }
      token = refreshed;
    }

    config.headers.Authorization = `Bearer ${token}`;

    // A floor under every mutating request, so the 401 retry below cannot post
    // the same thing twice. Screens that move stock supply their own key — see
    // lib/idempotency.ts — which survives a user pressing the button again; the
    // generated one here only covers a retry this file makes itself.
    //
    // Set only when absent, and that is the whole point: the retry re-enters
    // this interceptor with the original config, whose header is already
    // filled in. Overwriting it would give the retry a new key and defeat it.
    if (MUTATING.has((config.method ?? '').toLowerCase()) && !config.headers['Idempotency-Key']) {
      config.headers['Idempotency-Key'] = newRequestKey();
    }

    return config;
  },
  error => Promise.reject(error)
);

/**
 * A key for one attempt at one request. Long enough to be unique, and made of
 * the characters the backend accepts.
 */
function newRequestKey(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `req-${Date.now().toString(36)}-${random}`.replace(/[^A-Za-z0-9_.-]/g, '');
}

privateApi.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Retry once with a fresh token. _retry guards against a refresh loop when
    // the new token is rejected too.
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();
      if (!newToken) {
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return privateApi(originalRequest);
    }

    // The account was deactivated mid-session: every request now fails, so end
    // the session rather than leaving the user in a permission-less shell.
    const code = error.response?.data?.code;
    if (status === 403 && (code === 'ACCOUNT_INACTIVE' || code === 'ACCOUNT_NOT_FOUND')) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default privateApi;
