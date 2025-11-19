// next.config.ts
const withPlugins = require("next-compose-plugins");
const withSvgr = require("next-plugin-svgr");
const createNextIntlPlugin = require("next-intl/plugin");
// const path = require("path");

// плагин локализации
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const baseConfig: import("next").NextConfig = {
  devIndicators: false,
  eslint: {
    // не блокируем prod-сборку линтом (ошибки останутся в dev)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // в этой миграции не блокируем сборку по TS-ошибкам
    ignoreBuildErrors: true,
  },
  images: {
    disableStaticImages: true,
    // разрешаем использовать изображения с внешнего домена
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // webpack/sassOptions alias были убраны по просьбе — используем только turbopack resolveAlias ниже
  turbopack: {
    // Turbopack всё ещё умеет импортировать SVG через @svgr/webpack
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
    resolveAlias: {
      "@": "./src",
    },
  },
};

module.exports = withPlugins([withSvgr, withNextIntl], baseConfig);
