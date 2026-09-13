/** Login screen. */
export const auth = {
  headline: 'Care coordination,\nwithout the paperwork.',
  highlights: {
    records: 'Patients, visits and admissions in one record',
    connected: 'Pharmacy, billing and procurement connected end to end',
    access: 'Role-based access, so staff only see what they need'
  },

  welcome: 'Welcome back',
  subtitle: 'Sign in with your staff account to continue.',
  username: 'Username',
  usernamePlaceholder: 'Your staff username',
  usernameRequired: 'Username is required',
  password: 'Password',
  passwordPlaceholder: 'Your password',
  passwordRequired: 'Password is required',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  capsLockOn: 'Caps Lock is on.',
  signIn: 'Sign in',
  signingIn: 'Signing in',
  loginFailed: 'Login failed',
  lockoutNotice:
    'Five failed attempts within five minutes will disable the account. Contact your system administrator if you are locked out.'
} as const;
