import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "ru"],
  defaultLocale: "fr",
  localePrefix: "always",
});
