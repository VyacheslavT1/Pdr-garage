import { render, screen } from "@testing-library/react";
import HeroSection from "./HeroSection";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      const dict: Record<string, string> = {
        title: "Réparation sans peinture",
        subtitle: "Experts en débosselage",
        allServicesLink: "Voir tous les services",
        detailsLink: "En savoir plus",
      };
      return dict[key] ?? key;
    }) as (key: string) => string,
}));

jest.mock("@/shared/ui/link-button/LinkButton", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a data-testid={`link-${href}`} href={href}>
      {children}
    </a>
  ),
}));

describe("HeroSection", () => {
  it("отображает заголовок, подзаголовок и действия", () => {
    render(<HeroSection />);

    expect(screen.getByRole("heading", { level: 1, name: "Réparation sans peinture" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Experts en débosselage" })).toBeInTheDocument();

    const allServicesLink = screen.getByTestId("link-/services");
    expect(allServicesLink).toHaveAttribute("href", "/services");
    expect(allServicesLink).toHaveTextContent("Voir tous les services");

    const detailsLink = screen.getByTestId("link-/services/paintlessDentRemoval");
    expect(detailsLink).toHaveAttribute("href", "/services/paintlessDentRemoval");
    expect(detailsLink).toHaveTextContent("En savoir plus");
  });
});
