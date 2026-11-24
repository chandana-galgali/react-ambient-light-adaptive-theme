import { defineConfig } from "tsup";

const shared = {
  format: ["esm", "cjs"] as ("esm" | "cjs")[],
  dts: true,
  sourcemap: true,
  target: "es2019",
  external: ["react"],
  tsconfig: "tsconfig.lib.json",
};

export default defineConfig([
  {
    // Hooks and the provider: marked as a client module for React Server Components.
    ...shared,
    entry: { index: "src/lib/index.ts" },
    banner: { js: '"use client";' },
  },
  {
    // The no-flash script: server-safe, no directive.
    ...shared,
    entry: { script: "src/lib/script.tsx" },
  },
]);
