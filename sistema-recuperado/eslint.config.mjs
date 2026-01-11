import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// import tailwind from "eslint-plugin-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // ...tailwind.configs["recommended"],
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project specific
    "portal_engine_migration.sql",
    "supabase-migration.sql"
  ]),
  {
    rules: {
      // "tailwindcss/no-custom-classname": "off", // Disabled due to dynamic classes or external libs
    }
  }
]);

export default eslintConfig;

