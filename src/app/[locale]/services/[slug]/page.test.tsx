import type { ReactElement } from "react";
import Page from "./page";
import GlassCrackRepair from "./GlassCrackRepairContent";
import RestorativePolish from "./RestorativePolishContent";
import { serviceCards } from "@/shared/config/data/serviceCards";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => `t:${key}`) as (key: string) => string,
}));

jest.mock("@/shared/config/data/serviceCards", () => ({
  serviceCards: [
    {
      titleKey: "glassCrackRepair",
      src: "/glass.avif",
      alt: "Glass repair",
    },
    {
      titleKey: "restorativePolish",
      src: "/polish.avif",
      alt: "Polish",
    },
    {
      titleKey: "bodyRepair",
      src: "/body.avif",
      alt: "Body repair",
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

describe("app/[locale]/services/[slug]/page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTranslations.mockResolvedValue(((key: string) => `t:${key}`) as (
      key: string,
    ) => string);
    mockNotFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });
  });

  it("returns GlassCrackRepair custom content for that slug", async () => {
    const element = (await Page({
      params: Promise.resolve({
        locale: "en",
        slug: "glassCrackRepair",
      }),
    })) as ReactElement;

    expect(mockGetTranslations).toHaveBeenCalledWith("CommonTemplateData");
    expect(element.props.sideMenuItems).toEqual(
      serviceCards.map((item) => ({
        href: `/en/services/${item.titleKey}`,
        label: `t:${item.titleKey}`,
      })),
    );

    const customContent = element.props.customContent as ReactElement;
    expect(customContent.type).toBe(GlassCrackRepair);
    expect(customContent.props.contentData).toEqual(
      expect.objectContaining({ titleKey: "glassCrackRepair" }),
    );
  });

  it("returns RestorativePolish custom content for that slug", async () => {
    const element = (await Page({
      params: Promise.resolve({
        locale: "fr",
        slug: "restorativePolish",
      }),
    })) as ReactElement;

    const customContent = element.props.customContent as ReactElement;
    expect(customContent.type).toBe(RestorativePolish);
    expect(customContent.props.contentData).toEqual(
      expect.objectContaining({ titleKey: "restorativePolish" }),
    );
  });

  it("omits custom content for other services", async () => {
    const element = (await Page({
      params: Promise.resolve({
        locale: "de",
        slug: "bodyRepair",
      }),
    })) as ReactElement;

    expect(element.props.customContent).toBeUndefined();
  });

  it("invokes notFound for unknown services", async () => {
    await expect(
      Page({
        params: Promise.resolve({
          locale: "en",
          slug: "unknown",
        }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
