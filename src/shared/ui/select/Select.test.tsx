import { fireEvent, render, screen } from "@testing-library/react";
import Select from "./Select";

jest.mock("./Select.module.scss", () => ({
  selectField: "selectField",
  inputContainer: "inputContainer",
  hasValue: "hasValue",
  input: "input",
  menu: "menu",
  option: "option",
}));

describe("Select", () => {
  const baseProps = {
    label: "Rating",
    options: ["1 ★", "2 ★★"],
  };

  it("opens menu and selects an option", () => {
    const handleChange = jest.fn();
    render(<Select {...baseProps} onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "2 ★★" }));
    expect(handleChange).toHaveBeenCalledWith("2 ★★");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes when clicking outside", () => {
    render(<Select {...baseProps} onChange={jest.fn()} value="" />);

    const input = screen.getByRole("textbox");
    fireEvent.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("toggles menu with keyboard controls", () => {
    render(<Select {...baseProps} onChange={jest.fn()} value="" />);

    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
