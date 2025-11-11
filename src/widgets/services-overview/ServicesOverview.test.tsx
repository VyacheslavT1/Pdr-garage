import { render, screen } from "@testing-library/react";
import ServicesOverview from "./ServicesOverview";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      const dict: Record<string, string> = {
        mainTitle: "Nos services",
      };
      return dict[key] ?? key;
    }) as (key: string) => string,
}));

jest.mock("@/shared/config/data/serviceCards", () => ({
  serviceCards: [
    {
      src: "/images/services/dent-repair.jpg",
      alt: "Dent Repair",
      titleKey: "dentRepair.title",
      descKey: "dentRepair.desc",
    },
    {
      src: "/images/services/polish.jpg",
      alt: "Polish",
      titleKey: "polish.title",
      descKey: "polish.desc",
    },
  ],
}));

jest.mock("@/shared/ui/cards-overview/CardsOverview", () => ({
  __esModule: true,
  default: ({ renderCardAction }: any) => (
    <div data-testid="cards-overview">
      {renderCardAction({ titleKey: "dentRepair.title" }, 0)}
      {renderCardAction({ titleKey: "polish.title" }, 1)}
    </div>
  ),
}));

jest.mock("@/shared/ui/service-card/ServiceCard", () => ({
  __esModule: true,
  default: ({ titleKey, detailsUrl }: { titleKey: string; detailsUrl: string }) => (
    <div data-testid="service-card">
      {titleKey} — {detailsUrl}
    </div>
  ),
}));

describe("ServicesOverview", () => {
  it("показывает заголовок и перечень карточек услуг", () => {
    render(<ServicesOverview />);

    expect(screen.getByRole("heading", { level: 1, name: "Nos services" })).toBeInTheDocument();
    const cards = screen.getAllByTestId("service-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent("dentRepair.title — /services/dentRepair.title");
  });
});
