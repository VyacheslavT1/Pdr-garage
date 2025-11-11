import { render, screen, fireEvent } from "@testing-library/react";
import Dropdown, { DropdownProps } from "../Dropdown";

jest.mock("next-intl", () => ({
  useLocale: jest.fn(() => "fr"),
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
      ({ children, ...rest }, ref) => (
        <a ref={ref} {...rest}>
          {children}
        </a>
      )
    ),
  };
});

const options: DropdownProps["options"] = [
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
];

describe("Dropdown", () => {
  it("передает корректное значение признака активности в renderOption", () => {
    const renderOption = jest.fn((option, isActive) => (
      <span data-testid={`opt-${option.value}`} data-active={isActive}>
        {option.label}
      </span>
    ));

    render(
      <Dropdown
        options={options}
        value="premium"
        renderOption={renderOption}
        onSelect={jest.fn()}
      />
    );

    expect(renderOption).toHaveBeenCalledTimes(2);
    expect(renderOption.mock.calls[0][1]).toBe(false);
    expect(renderOption.mock.calls[1][1]).toBe(true);
  });

  it("вызывает onSelect при выборе опции", () => {
    const onSelect = jest.fn();

    render(
      <Dropdown
        options={options}
        value="basic"
        renderOption={(option) => <span>{option.label}</span>}
        onSelect={onSelect}
      />
    );

    const premiumOption = screen.getByText("Premium");
    fireEvent.click(premiumOption.parentElement!);

    expect(onSelect).toHaveBeenCalledWith("premium");
  });
});
