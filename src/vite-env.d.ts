/// <reference types="vite/client" />

/**
 * Typed environment variables. Declaring them here means a typo in
 * `import.meta.env.VITE_...` is a compile error rather than an undefined value
 * discovered at runtime.
 */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_ADDRESS?: string;
  readonly VITE_APP_PHONE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
