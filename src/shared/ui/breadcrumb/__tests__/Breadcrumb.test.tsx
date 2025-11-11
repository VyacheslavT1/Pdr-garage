import { render, screen } from "@testing-library/react";
import Breadcrumb from "../Breadcrumb";

const useTranslationsMock = jest.fn();
const usePathnameMock = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
      ({ children, ...props }, ref) => (
        <a ref={ref} {...props}>
          {children}
        </a>
      )
    ),
  };
});

describe("Breadcrumb", () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue("/fr/store/category");
    useTranslationsMock.mockImplementation((key: string) => `t(${key})`);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("строит список хлебных крошек на основании пути", () => {
    render(<Breadcrumb />);

    expect(screen.getByRole("link", { name: "t(homePage)" })).toHaveAttribute(
      "href",
      "/fr"
    );
    expect(screen.getByRole("link", { name: "t(store)" })).toHaveAttribute(
      "href",
      "/fr/store"
    );
    expect(
      screen.getByText("t(category)")
    ).toHaveClass("disabled");
  });
});
