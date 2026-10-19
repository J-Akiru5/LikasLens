import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Pre-existing violations in admin-portal source. They are reported as warnings
    // instead of errors so `pnpm --filter admin-portal lint` is usable, but they are
    // NOT fixed: this block is technical debt to burn down incrementally.
    // Do not add new entries here.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
