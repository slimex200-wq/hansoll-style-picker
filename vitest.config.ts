import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/**/__tests__/**",
        "src/app/layout.tsx",
        "src/app/api/**",
        "src/app/admin/upload/**",
        "src/components/admin/**",
        "src/lib/types.ts",
        "src/lib/mock-data.ts",
        "src/lib/supabase.ts",
        "src/lib/storage.ts",
        "src/lib/parsers/types.ts",
        "src/lib/parsers/pdf-parser.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
