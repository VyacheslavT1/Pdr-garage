import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.test.*", "**/__tests__/**", "src/tests/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-assign-module-variable": "off",
      "@next/next/no-img-element": "off",
      "eslint-comments/no-unused-disable": "off",
      "jsx-a11y/alt-text": "off",
      "react/display-name": "off",
    },
  },
];

export default eslintConfig;
