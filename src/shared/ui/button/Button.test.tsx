import { render, screen } from "@testing-library/react";
import Button from "./Button";

jest.mock("./Button.module.scss", () => ({
  button: "btn",
  primary: "btn-primary",
  secondary: "btn-secondary",
  icon: "btn-icon",
}));

describe("Button", () => {
  it("добавляет классы по варианту и рендерит детей", () => {
    render(<Button variant="primary">Envoyer</Button>);

    const button = screen.getByRole("button", { name: "Envoyer" });
    expect(button).toHaveClass("btn", "btn-primary");
  });

  it("показывает иконку, когда она передана", () => {
    render(
      <Button variant="secondary" icon={<span data-testid="icon">★</span>}>
        Action
      </Button>,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /action/i })).toHaveClass("btn-secondary");
  });
});
