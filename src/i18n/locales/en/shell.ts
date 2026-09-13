/** The chrome around every page: header, sidebar, preferences menu. */
export const shell = {
  mainNavigation: 'Main navigation',
  openNavigation: 'Open navigation',
  closeNavigation: 'Close navigation',
  expandSidebar: 'Expand sidebar',
  collapseSidebar: 'Collapse sidebar',
  expandSidebarTitle: 'Expand sidebar (Ctrl+B)',
  collapseSidebarTitle: 'Collapse sidebar (Ctrl+B)',
  breadcrumb: 'Breadcrumb',
  userMenu: 'Account menu',
  superUser: 'super user',
  logout: 'Log out',

  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    appearanceHint: 'System follows your operating system.',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    counterLayout: 'Counter layout',
    counterHint: 'Auto picks touch on a tablet and mouse everywhere else.',
    counterAuto: 'Auto',
    counterTouch: 'Touch',
    counterDesktop: 'Mouse',
    language: 'Language',
    languageHint: 'Applies to this device only.'
  }
} as const;
