import { render, screen } from "@testing-library/react";
import CardsOverview from "./CardsOverview";

describe("CardsOverview", () => {
  it("рендерит элементы с помощью renderCardAction и применяет className", () => {
    const items = ["a", "b", "c"];
    render(
      <CardsOverview
        items={items}
        className="grid"
        renderCardAction={(item, index) => (
          <div key={item} data-testid="card">
            {index}:{item}
          </div>
        )}
      />,
    );

    const cards = screen.getAllByTestId("card");
    expect(cards).toHaveLength(3);
    expect(cards[0].parentElement).toHaveClass("grid");
  });
});
