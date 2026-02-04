import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { serviceCards } from "@/shared/config/data/serviceCards";
import { article } from "@/shared/config/data/articleCards";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://example.com";

const baseUrl = siteUrl.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "services",
    "blog",
    "aboutUs",
    "contacts",
    "privacy",
  ];

  const items: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      const url = path ? `/${locale}/${path}` : `/${locale}`;
      items.push({ url: `${baseUrl}${url}`, lastModified: new Date() });
    }

    for (const service of serviceCards) {
      items.push({
        url: `${baseUrl}/${locale}/services/${service.titleKey}`,
        lastModified: new Date(),
      });
    }

    for (const post of article) {
      items.push({
        url: `${baseUrl}/${locale}/blog/${post.titleKey}`,
        lastModified: new Date(),
      });
    }
  }

  return items;
}
