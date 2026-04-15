export default {
  APP_NAME: "Cashus" as const,
  APP_VERSION: "0.1.0" as const,
  APP_ENV: import.meta.env.VITE_APP_ENV || ("development" as const),
  FARO_COLLECTOR_URL: import.meta.env.VITE_FARO_COLLECTOR_URL,
} as const;
