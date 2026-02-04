import { render, screen } from "@testing-library/react";
import RadioButton from "./RadioButton";

describe("RadioButton", () => {
  it("рендерит input и label c корректными атрибутами", () => {
    render(
      <RadioButton
        id="gender-male"
        name="gender"
        value="male"
        label="Mr"
        checked
        required
      />,
    );

    const input = screen.getByRole("radio", { name: "Mr" });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "gender-male");
    expect(input).toHaveAttribute("name", "gender");
    expect(input).toHaveAttribute("value", "male");
    expect(input).toBeRequired();

    const label = screen.getByText("Mr");
    expect(label).toHaveAttribute("for", "gender-male");
  });
});
