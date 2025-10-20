import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginImport from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  {
    ignores: ["translations/**/*.json", "scripts/**.js"]
  },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      import: eslintPluginImport
    },
    rules: {
      "import/no-unused-modules": [
        "warn",
        {
          unusedExports: true,
          missingExports: false
        }
      ]
    }
  },

  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/**/global-error.tsx",
      "src/app/**/not-found.tsx",
      "src/app/**/route.ts",
      "src/**/**.d.ts",
      "src/i18n/**",
      "src/middleware.ts"
    ],
    rules: {
      "import/no-unused-modules": "off"
    }
  }
];

export default eslintConfig;
