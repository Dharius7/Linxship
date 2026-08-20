import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "legacy-php/**",
    "assets/**",
    "cdn-cgi/**",
    "controllers/**",
    "css/**",
    "database/**",
    "images/**",
    "img/**",
    "js/**",
    "newadmin/**",
    "uploads/**",
    "_/**",
  ]),
]);
