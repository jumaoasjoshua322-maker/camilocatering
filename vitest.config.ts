import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Test scope: pure functions only. We deliberately don't spin up Mongo,
    // mock NextAuth, or render React. Anything heavier belongs in an
    // integration test runner that's set up separately.
  },
});
