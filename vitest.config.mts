import { defineConfig } from "vitest/config";
import path from "node:path";
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/unit/server-only-stub.ts") } },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node", setupFiles: ["tests/unit/setup.ts"], fileParallelism: false },
});
