import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  turbopack: {
    rules: {
      "*.svg": ["@svgr/webpack"],
    },
    resolveAlias: {
      "@": "./",
    },
  },
  // i18n: {
  //   locales: ["en", "fr", "ru"],
  //   defaultLocale: "fr",
  // },
};

export default withNextIntl(nextConfig);
