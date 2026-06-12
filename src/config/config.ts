export default {
  APP_NAME: "Cashus" as const,
  APP_VERSION: "0.1.0" as const,
  APP_ENV: import.meta.env.VITE_APP_ENV || ("development" as const),
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  FARO_COLLECTOR_URL: import.meta.env.VITE_FARO_COLLECTOR_URL,
  FLAGSMITH_ENVIRONMENT_ID: import.meta.env.VITE_FLAGSMITH_ENVIRONMENT_ID,
  MIDTRANS_SNAP_JS_SRC:
    import.meta.env.VITE_MIDTRANS_SNAP_JS_SRC ||
    "https://app.sandbox.midtrans.com/snap/snap.js",
  MIDTRANS_CLIENT_KEY: import.meta.env.VITE_MIDTRANS_CLIENT_KEY,
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || "support@cashus.app",
  SUBSCRIPTION_PURCHASE_ENABLED:
    import.meta.env.VITE_SUBSCRIPTION_PURCHASE_ENABLED === "true",
  TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  USERJOT_PROJECT_ID: import.meta.env.VITE_USERJOT_PROJECT_ID,
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
} as const;
