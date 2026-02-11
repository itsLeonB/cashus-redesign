import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    mode === "development" &&
      visualizer({
        filename: "dist/stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // build: {
  //   rollupOptions: {
  //     output: {
  //       manualChunks: {
  //         // Group vendor libraries
  //         "react-vendor": ["react", "react-dom", "react-router-dom"],
  //         "ui-vendor": [
  //           "@radix-ui/react-accordion",
  //           "@radix-ui/react-alert-dialog",
  //           "@radix-ui/react-avatar",
  //           "@radix-ui/react-checkbox",
  //           "@radix-ui/react-dialog",
  //           "@radix-ui/react-dropdown-menu",
  //           "@radix-ui/react-label",
  //           "@radix-ui/react-popover",
  //           "@radix-ui/react-select",
  //           "@radix-ui/react-slider",
  //           "@radix-ui/react-switch",
  //           "@radix-ui/react-tabs",
  //           "@radix-ui/react-toast",
  //           "@radix-ui/react-tooltip",
  //         ],
  //         "form-vendor": ["react-hook-form", "zod", "@tanstack/react-query"],
  //         "utils-vendor": [
  //           "clsx",
  //           "tailwind-merge",
  //           "class-variance-authority",
  //         ],
  //         "icons-vendor": ["lucide-react"],
  //       },
  //     },
  //   },
  //   chunkSizeWarningLimit: 1000, // Increase limit to avoid warnings
  // },
}));
