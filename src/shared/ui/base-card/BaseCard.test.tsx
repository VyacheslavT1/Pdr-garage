import { render, screen } from "@testing-library/react";
import BaseCard from "./BaseCard";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      const dict: Record<string, string> = {
        title: "Titre",
        desc: "Description",
        link: "Lire plus",
      };
      return dict[key] ?? key;
    }) as (key: string) => string,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src, fill, priority, ...rest }: any) => (
    <img
      alt={alt}
      data-src={typeof src === "string" ? src : "static"}
      data-fill={fill ? "true" : undefined}
      data-priority={priority ? "true" : undefined}
      {...rest}
    />
  ),
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
      ({ children, ...props }, ref) => (
        <a ref={ref} {...props}>
          {children}
        </a>
      ),
    ),
  };
});

const CustomLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a data-testid="custom-link" href={href}>
    {children}
  </a>
);

describe("BaseCard", () => {
  it("отображает изображение, текст и ссылку", () => {
    render(
      <BaseCard
        src="/img.jpg"
        alt="Sample"
        titleKey="title"
        descKey="desc"
        detailsUrl="/details"
        tNamespace="someNamespace"
        linkLabelKey="link"
      />,
    );

    expect(screen.getByAltText("Sample")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Titre" })).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lire plus" })).toHaveAttribute("href", "/details");
  });

  it("использует кастомный LinkWrapper, если передан", () => {
    render(
      <BaseCard
        src="/img.jpg"
        alt="Sample"
        titleKey="title"
        descKey="desc"
        detailsUrl="/details"
        tNamespace="someNamespace"
        linkLabelKey="link"
        LinkWrapper={CustomLink}
      />,
    );

    expect(screen.getByTestId("custom-link")).toHaveAttribute("href", "/details");
  });
});
