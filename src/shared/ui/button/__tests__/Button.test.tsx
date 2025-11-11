import { render, screen } from "@testing-library/react";
import Button from "../Button";

describe("Button component", () => {
  it("добавляет классы для выбранного варианта", () => {
    render(<Button variant="primary">Submit</Button>);

    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toHaveClass("button");
    expect(button).toHaveClass("primary");
  });

  it("рендерит иконку, если она передана", () => {
    render(
      <Button variant="secondary" icon={<span data-testid="icon" />}>
        Export
      </Button>
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
