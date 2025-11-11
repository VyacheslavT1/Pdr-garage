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
        ariaInvalid={false}
      />,
    );

    const input = screen.getByRole("radio", { name: "Mr" });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "gender-male");
    expect(input).toHaveAttribute("name", "gender");
    expect(input).toHaveAttribute("value", "male");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "false");

    const label = screen.getByText("Mr");
    expect(label).toHaveAttribute("for", "gender-male");
  });

  it("проставляет aria-invalid при ошибке", () => {
    render(
      <RadioButton
        id="gender-female"
        name="gender"
        value="female"
        label="Mme"
        checked={false}
        ariaInvalid
      />,
    );

    const input = screen.getByRole("radio", { name: "Mme" });
    expect(input).toHaveAttribute("aria-invalid", "true");
  });
});
