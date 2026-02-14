import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  { 
    ignores: ["**/build/**", "**/node_modules/", "**/dist/"],
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], 
    plugins: { js, pluginReact,  }, 
    languageOptions: { 
      globals: {...globals.browser, ...globals.node},
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: "latest",
        sourcetype: "module",
        ecmaFeatures: {
          jsx: true,
          impliedStrict: true,
        }
      }
    },
    settings: {
      react: {
        version: "detect",
      }
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-floating-promises": "error",
    }
  },
]);
