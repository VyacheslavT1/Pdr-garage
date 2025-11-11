import { render, screen } from "@testing-library/react";

describe("testing environment", () => {
  it("renders a basic React element", () => {
    render(<button type="button">Click me</button>);

    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });
});
