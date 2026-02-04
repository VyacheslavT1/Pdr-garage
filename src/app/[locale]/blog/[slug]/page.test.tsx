import type { ReactElement } from "react";
import Page from "./page";
import CustomContent from "./CustomContent";
import { article } from "@/shared/config/data/articleCards";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

jest.mock("@/i18n/routing", () => ({
  routing: { locales: ["fr", "en", "ru"], defaultLocale: "fr", localePrefix: "always" },
}));

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => `t:${key}`) as (key: string) => string,
}));

jest.mock("@/shared/config/data/articleCards", () => ({
  article: [
    {
      titleKey: "pdrMyths",
      src: "/pdr.avif",
      alt: "PDR myths",
    },
    {
      titleKey: "parkingDamage",
      src: "/parking.avif",
      alt: "Parking damage",
    },
    {
      titleKey: "hailPDR",
      src: "/hail.avif",
      alt: "Hail PDR",
    },
  ],
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

const mockGetTranslations = getTranslations as jest.MockedFunction<
  typeof getTranslations
>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

describe("app/[locale]/blog/[slug]/page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTranslations.mockResolvedValue(((key: string) => `t:${key}`) as (
      key: string,
    ) => string);
    mockNotFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });
  });

  it("adds CustomContent for slugs that require custom rendering", async () => {
    const element = (await Page({
      params: Promise.resolve({ locale: "fr", slug: "pdrMyths" }),
    })) as ReactElement;

    expect(mockGetTranslations).toHaveBeenCalledWith("Blog");
    expect(element.props.sideMenuItems).toEqual(
      article.map((item) => ({
        href: `/fr/blog/${item.titleKey}`,
        label: `t:${item.titleKey}`,
      })),
    );

    const customContent = element.props.customContent as ReactElement;
    expect(customContent.type).toBe(CustomContent);
    expect(customContent.props.contentData).toEqual(
      expect.objectContaining({ titleKey: "pdrMyths" }),
    );
  });

  it("omits custom content for standard articles", async () => {
    const element = (await Page({
      params: Promise.resolve({ locale: "en", slug: "hailPDR" }),
    })) as ReactElement;

    expect(element.props.customContent).toBeUndefined();
  });

  it("calls notFound for unknown slugs", async () => {
    await expect(
      Page({
        params: Promise.resolve({ locale: "en", slug: "missing" }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
