import { render, screen } from "@testing-library/react";
import SideMenuList from "./SideMenuList";

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

describe("SideMenuList", () => {
  it("рендерит список ссылок с заголовком", () => {
    render(
      <SideMenuList
        titleText="Blog sections"
        items={[
          { href: "/blog/a", label: "Article A" },
          { href: "/blog/b", label: "Article B" },
        ]}
      />, 
    );

    const aside = screen.getByLabelText("Blog sections");
    expect(aside).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/blog/a");
  });
});
