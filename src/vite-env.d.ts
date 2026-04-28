/// <reference types="vite/client" />

declare module "bun:test" {
  export const describe: typeof import("vitest").describe;
  export const test: typeof import("vitest").test;
  export const expect: typeof import("vitest").expect;
  export const beforeEach: typeof import("vitest").beforeEach;
}
