import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Next page-routing rules don't apply to test markup, and tests cast
    // parsed JSON-LD to `any` to assert on its shape — idiomatic there,
    // still forbidden in src/.
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      ".claude/**",
      ".superpowers/**",
      "node_modules/**",
    ],
  },
];

export default eslintConfig;
