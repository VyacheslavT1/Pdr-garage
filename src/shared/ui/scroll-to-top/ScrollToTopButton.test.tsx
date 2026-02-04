import { act, render, screen } from "@testing-library/react";
import ScrollToTopButton from "./ScrollToTopButton";

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
      ({ children, ...props }, ref) => (
        <a ref={ref} {...props}>
          {children}
        </a>
      ),
    ),
  };
});

jest.mock("@/shared/Icons/up-arrow.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="up-arrow" />,
}));

describe("ScrollToTopButton", () => {
  it("отображает кнопку после прокрутки", () => {
    render(<ScrollToTopButton />);

    const container = screen.getByRole("link", { name: "Back to top" }).parentElement!;
    expect(container.className).not.toContain("visible");

    act(() => {
      Object.defineProperty(window, "scrollY", { value: window.innerHeight, configurable: true });
      window.dispatchEvent(new Event("scroll"));
    });

    expect(container.className).toContain("visible");
  });
});
