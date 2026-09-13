export const CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  appName: import.meta.env.VITE_APP_NAME ?? 'PulseOne Hospital Management',
  /* Printed on the receipt letterhead under the name. Blank by default: a
     deployment that has not been told its own address is better off printing
     nothing there than a placeholder the patient would read as real. */
  appAddress: import.meta.env.VITE_APP_ADDRESS ?? '',
  appPhone: import.meta.env.VITE_APP_PHONE ?? ''
} as const;

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'pulseone_access_token',
  REFRESH_TOKEN: 'pulseone_refresh_token'
} as const;

/**
 * Cookie options. `secure` is off on localhost because the dev server is plain
 * HTTP and the browser would silently drop a secure cookie there.
 */
export const getCookieOptions = (expiresInDays: number) => ({
  expires: expiresInDays,
  sameSite: 'strict' as const,
  secure: window.location.protocol === 'https:',
  path: '/'
});

export const getCookieRemoveOptions = () => ({ path: '/' });

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_ME: '/auth/me',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_CHANGE_PASSWORD: '/auth/change-password',
  PERMISSIONS_ME: '/permissions/me'
} as const;

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  PATIENTS: '/registration/patients',
  VISITS: '/visits',
  ADMISSIONS: '/admissions',
  EMPLOYEES: '/administration/employees',
  DEPARTMENTS: '/administration/departments',
  SERVICE_CENTERS: '/administration/service-centers',
  SERVICES: '/administration/services',
  ROOMS: '/administration/rooms',
  VENDORS: '/administration/vendors',
  STORES: '/administration/stores',
  ITEMS: '/administration/items',
  USERS: '/administration/users',
  ROLES: '/administration/roles',
  STOCK_BALANCE: '/inventories/stock-balance',
  STOCK_LEDGER: '/inventories/stock-ledger'
} as const;
