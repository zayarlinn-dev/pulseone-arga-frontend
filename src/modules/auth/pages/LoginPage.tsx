import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Cookies from 'js-cookie';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  Loader2,
  Lock,
  ShieldCheck,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/userStore';
import { CONFIG, COOKIE_NAMES, getCookieOptions } from '@/config/constants';

/**
 * The messages are catalogue keys rather than sentences: this schema is built
 * once at import time, so a translated string baked in here would keep the
 * language the tab loaded in even after the user switches. The field renderers
 * pass the key through `t()`.
 */
const loginSchema = z.object({
  username: z.string().min(1, 'auth.usernameRequired'),
  password: z.string().min(1, 'auth.passwordRequired')
});

type LoginForm = z.infer<typeof loginSchema>;

// The brand panel keeps the same deep tone in light and dark mode: it reads as
// product identity rather than as a surface that follows the theme.
const BRAND_BACKGROUND = 'linear-gradient(155deg, oklch(0.27 0.05 210), oklch(0.47 0.10 198))';

const HIGHLIGHT_KEYS = [
  'auth.highlights.records',
  'auth.highlights.connected',
  'auth.highlights.access'
] as const;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore(state => state.setAuth);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setSubmitError(null);

    try {
      const result = await authService.login(values);

      // The access token is short-lived; the refresh cookie outlives it so a
      // returning user is not forced to log in again.
      Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, result.token, getCookieOptions(1));
      Cookies.set(COOKIE_NAMES.REFRESH_TOKEN, result.refreshToken, getCookieOptions(7));

      setAuth(
        {
          userId: result.userId,
          username: result.username,
          role: result.role,
          isSuperUser: result.isSuperUser
        },
        result.permissions ?? []
      );

      // Send the user back to the page that bounced them here.
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/', { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('auth.loginFailed'));
    }
  };

  // Caps Lock is the most common cause of a "wrong password" that is not
  // actually wrong, so it is worth flagging before the attempt is spent.
  const trackCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLockOn(event.getModifierState('CapsLock'));

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside
        className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ background: BRAND_BACKGROUND }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, oklch(0.75 0.12 196), transparent)' }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">{CONFIG.appName}</span>

          <LanguageToggle tone="onBrand" className="ml-auto" />
        </div>

        <div className="relative max-w-md">
          {/* The headline breaks across two lines in both languages, but not
              at the same word, so the break travels with the translation as a
              newline rather than being hard-coded as a <br /> here. */}
          <h1 className="whitespace-pre-line text-4xl font-semibold leading-tight tracking-tight">
            {t('auth.headline')}
          </h1>
          <ul className="mt-8 space-y-3 text-sm text-white/75">
            {HIGHLIGHT_KEYS.map(key => (
              <li key={key} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* A quiet ECG trace: the product mark, drawn at ambient scale. */}
        <svg
          aria-hidden
          viewBox="0 0 600 80"
          preserveAspectRatio="none"
          className="relative h-16 w-full text-white/25"
        >
          <path
            d="M0 48 H120 l14 -30 l16 52 l14 -34 l18 12 H360 l14 -26 l16 44 l12 -30 l16 12 H600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </aside>

      <main className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: BRAND_BACKGROUND }}
            >
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="font-semibold tracking-tight">{CONFIG.appName}</span>

            <LanguageToggle className="ml-auto" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">{t('auth.welcome')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('auth.subtitle')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">{t('auth.username')}</Label>
              <div className="relative">
                <User
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="username"
                  autoComplete="username"
                  autoFocus
                  placeholder={t('auth.usernamePlaceholder')}
                  className="h-11 pl-9"
                  {...register('username')}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                />
              </div>
              {errors.username && (
                <p id="username-error" className="text-xs text-destructive">
                  {t(errors.username.message as 'auth.usernameRequired')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Lock
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  className="h-11 pl-9 pr-11"
                  onKeyUp={trackCapsLock}
                  onKeyDown={trackCapsLock}
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(visible => !visible)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {t(errors.password.message as 'auth.passwordRequired')}
                </p>
              )}
              {capsLockOn && !errors.password && (
                <p className="text-xs text-muted-foreground">{t('auth.capsLockOn')}</p>
              )}
            </div>

            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="group w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                <>
                  {t('auth.signIn')}
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
            {t('auth.lockoutNotice')}
          </p>
        </div>
      </main>
    </div>
  );
}
