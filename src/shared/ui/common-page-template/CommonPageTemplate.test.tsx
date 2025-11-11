import { render, screen } from "@testing-library/react";
import { CommonPageTemplate } from "./CommonPageTemplate";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      const dict: Record<string, string> = {
        title: "Titre",
        desc1: "Paragraph 1",
        desc2: "Paragraph 2",
      };
      return dict[key] ?? key;
    }) as (key: string) => string,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src, fill, priority, ...rest }: any) => (
    <img
      alt={alt}
      data-src={src}
      data-fill={fill ? "true" : undefined}
      data-priority={priority ? "true" : undefined}
      {...rest}
    />
  ),
}));

jest.mock("@/shared/ui/side-menu-list/SideMenuList", () => ({
  __esModule: true,
  default: ({ items }: { items: Array<{ href: string; label: string }> }) => (
    <ul data-testid="side-menu">
      {items.map((item) => (
        <li key={item.href}>{item.label}</li>
      ))}
    </ul>
  ),
}));

const contentData = {
  titleKey: "title",
  src: "/img.jpg",
  alt: "service",
  fullDesc1: "desc1",
  fullDesc2: "desc2",
} as const;

const sideMenu = [
  { href: "/a", label: "Item A" },
  { href: "/b", label: "Item B" },
];

describe("CommonPageTemplate", () => {
  it("рендерит стандартный набор параграфов", () => {
    render(<CommonPageTemplate contentData={contentData} sideMenuItems={sideMenu} />);

    expect(screen.getByRole("heading", { level: 1, name: "Titre" })).toBeInTheDocument();
    expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
    expect(screen.getByText("Paragraph 2")).toBeInTheDocument();
    expect(screen.getByTestId("side-menu")).toHaveTextContent("Item A");
  });

  it("использует customContent, если он передан", () => {
    render(
      <CommonPageTemplate
        contentData={contentData}
        sideMenuItems={sideMenu}
        customContent={<div data-testid="custom">Custom</div>}
      />,
    );

    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(screen.queryByText("Paragraph 1")).not.toBeInTheDocument();
  });
});
