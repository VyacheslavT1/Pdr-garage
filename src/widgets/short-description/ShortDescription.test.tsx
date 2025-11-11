import { render, screen } from "@testing-library/react";
import ShortDescription from "./ShortDescription";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      const dictionary: Record<string, string> = {
        fewWords: "En quelques mots",
        aboutPdrStudio: "À propos de PDR Studio",
        about1: "Paragraphe 1",
        about2: "Paragraphe 2",
        about3: "Paragraphe 3",
        about4: "Paragraphe 4",
        detailsLink: "En savoir plus",
        beforeImageAlt: "Avant réparation",
        afterImageAlt: "Après réparation",
      };
      return dictionary[key] ?? key;
    }) as (key: string) => string,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  // преобразуем boolean fill в style для подавления warning
  default: ({ fill, style, ...rest }: any) => (
    <img
      style={fill ? { ...style, objectFit: "cover" } : style}
      data-fill={fill ? "true" : undefined}
      {...rest}
    />
  ),
}));

jest.mock("@/shared/ui/link-button/LinkButton", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a data-testid="link-button" href={href}>
      {children}
    </a>
  ),
}));

jest.mock("@/shared/Icons/arrow-right-long.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="arrow-icon">→</span>,
}));

describe("ShortDescription", () => {
  it("отображает заголовки, описания и ссылку на подробности", () => {
    render(<ShortDescription />);

    expect(screen.getByRole("heading", { level: 3, name: "En quelques mots" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "À propos de PDR Studio" })).toBeInTheDocument();

    expect(screen.getByText("Paragraphe 1")).toBeInTheDocument();
    expect(screen.getByText("Paragraphe 2")).toBeInTheDocument();
    expect(screen.getByText("Paragraphe 3")).toBeInTheDocument();
    expect(screen.getByText("Paragraphe 4")).toBeInTheDocument();

    const link = screen.getByTestId("link-button");
    expect(link).toHaveAttribute("href", "/about");
    expect(link).toHaveTextContent("En savoir plus");
    expect(screen.getByTestId("arrow-icon")).toBeInTheDocument();
  });

  it("рендерит изображения до и после с корректными alt-текстами", () => {
    render(<ShortDescription />);

    expect(screen.getByAltText("Avant réparation")).toBeInTheDocument();
    expect(screen.getByAltText("Après réparation")).toBeInTheDocument();
  });
});
