// next.config.js
const withPlugins = require("next-compose-plugins");
const withSvgr = require("next-plugin-svgr");
const createNextIntlPlugin = require("next-intl/plugin");

// плагин локализации
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const baseConfig: import("next").NextConfig = {
  devIndicators: false,
  images: {
    disableStaticImages: true,
    // разрешаем использовать изображения с внешних доменов, потом удалить
    domains: ["picsum.photos"],
  },
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

module.exports = withPlugins(
  [
    // 1) SVGR-плагин: удаляем width/height, добавляем currentColor
    [
      withSvgr,
      {
        svgrOptions: {
          // гарантированно убирает width/height из корневого <svg>
          dimensions: false, // :contentReference[oaicite:0]{index=0}
          svgo: true,
          svgoConfig: {
            plugins: [
              {
                name: "removeDimensions",
                active: true,
              },
            ],
          },
          // позволяет задавать цвет иконки через CSS (text-color)
          svgProps: {
            fill: "currentColor",
          },
        },
      },
    ],
    // 2) плагин интернационализации
    withNextIntl,
  ],
  baseConfig
);
