import { render, screen } from "@testing-library/react";
import LinkButton from "./LinkButton";

jest.mock("next-intl", () => ({
  useLocale: () => "fr",
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
      ),
    ),
  };
});

describe("LinkButton", () => {
  it("префиксует локаль к относительным ссылкам", () => {
    render(<LinkButton href="/contacts">Contact</LinkButton>);

    const link = screen.getByRole("link", { name: "Contact" });
    expect(link).toHaveAttribute("href", "/fr/contacts");
  });

  it("отображает иконку, если она передана", () => {
    render(
      <LinkButton href="/services" icon={<span data-testid="icon">★</span>}>
        Services
      </LinkButton>,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /services/i })).toHaveAttribute(
      "href",
      "/fr/services",
    );
  });
});
