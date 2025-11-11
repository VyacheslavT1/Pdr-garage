import { render, screen } from "@testing-library/react";
import BlogArticlesOverview from "./BlogArticlesOverview";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => `t(${key})`) as (key: string) => string,
  useLocale: () => "fr",
}));

jest.mock("@/shared/config/data/articleCards", () => ({
  article: [
    {
      src: "/images/blog/foo.jpg",
      alt: "Foo",
      titleKey: "articleFoo.title",
      descKey: "articleFoo.desc",
    },
    {
      src: "/images/blog/bar.jpg",
      alt: "Bar",
      titleKey: "articleBar.title",
      descKey: "articleBar.desc",
    },
  ],
}));

jest.mock("@/shared/ui/cards-overview/CardsOverview", () => ({
  __esModule: true,
  default: ({ renderCardAction }: any) => (
    <div data-testid="cards-overview">
      {renderCardAction({ titleKey: "articleFoo.title" }, 0)}
      {renderCardAction({ titleKey: "articleBar.title" }, 1)}
    </div>
  ),
}));

jest.mock("@/shared/ui/article-card/ArticleCard", () => ({
  __esModule: true,
  default: ({ titleKey }: { titleKey: string }) => (
    <div data-testid="article-card">article: {titleKey}</div>
  ),
}));

jest.mock("@/shared/ui/side-menu-list/SideMenuList", () => ({
  __esModule: true,
  default: ({ items }: { items: Array<{ href: string; label: string }> }) => (
    <ul data-testid="side-menu">
      {items.map((item) => (
        <li key={item.href}>
          {item.href} — {item.label}
        </li>
      ))}
    </ul>
  ),
}));

describe("BlogArticlesOverview", () => {
  it("рендерит карточки и боковое меню на основе конфигурации", () => {
    render(<BlogArticlesOverview />);

    expect(screen.getByText("t(mainTitle)")).toBeInTheDocument();
    const cards = screen.getAllByTestId("article-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("article: articleFoo.title");
    expect(cards[1]).toHaveTextContent("article: articleBar.title");

    expect(screen.getByTestId("side-menu")).toHaveTextContent(
      "/fr/blog/articleFoo.title — t(articleFoo.title)",
    );
  });
});
