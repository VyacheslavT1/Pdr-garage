import type { ReactElement } from "react";
import Page from "./page";
import { AboutUs } from "./AboutUs";
import { serviceCards } from "@/shared/config/data/serviceCards";
import { getTranslations } from "next-intl/server";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => `t:${key}`) as (key: string) => string,
}));

jest.mock("@/shared/config/data/serviceCards", () => ({
  serviceCards: [
    {
      titleKey: "bodyRepair",
      src: "/bodyRepair.avif",
      alt: "Body repair",
    },
    {
      titleKey: "paintlessDentRemoval",
      src: "/pdr.avif",
      alt: "Dent removal",
    },
  ],
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(),
}));

const mockGetTranslations = getTranslations as jest.MockedFunction<
  typeof getTranslations
>;

describe("app/[locale]/aboutUs/page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTranslations.mockResolvedValue(((key: string) => `t:${key}`) as (
      key: string,
    ) => string);
  });

  it("builds the correct template props for the About Us page", async () => {
    const element = (await Page({
      params: Promise.resolve({ locale: "ru" }),
    })) as ReactElement;

    expect(mockGetTranslations).toHaveBeenCalledWith("CommonTemplateData");
    expect(element.props.sideMenuItems).toEqual(
      serviceCards.map((item) => ({
        href: `/ru/services/${item.titleKey}`,
        label: `t:${item.titleKey}`,
      })),
    );

    const customContent = element.props.customContent as ReactElement;
    expect(customContent.type).toBe(AboutUs);
    expect(customContent.props.contentData).toEqual(
      expect.objectContaining({ titleKey: "aboutUs" }),
    );
  });
});
