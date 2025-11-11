import { render, screen } from "@testing-library/react";
import Checkbox from "./Checkbox";

const checkboxIconMock = jest.fn();
const checkboxCheckedIconMock = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => ((key: string) => `t:${key}`) as (key: string) => string,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/shared/ui/fonts", () => ({
  inter: { className: "inter-font" },
}));

jest.mock("@/shared/Icons/checkbox-line.svg", () => ({
  __esModule: true,
  default: () => {
    checkboxIconMock();
    return <span data-testid="icon-unchecked" />;
  },
}));

jest.mock("@/shared/Icons/checkbox-fill.svg", () => ({
  __esModule: true,
  default: () => {
    checkboxCheckedIconMock();
    return <span data-testid="icon-checked" />;
  },
}));

describe("Checkbox", () => {
  beforeEach(() => {
    checkboxIconMock.mockClear();
    checkboxCheckedIconMock.mockClear();
  });

  it("отображает подписанный вариант с ссылкой на политику", () => {
    render(
      <Checkbox
        id="consent"
        name="consent"
        variant="labeled"
        label="Accept terms"
        checked
        color="#0f0"
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /Accept terms/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Accept terms")).toHaveClass("inter-font");
    expect(screen.getByRole("link", { name: "t:consentPrivacyLink" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByTestId("icon-checked")).toBeInTheDocument();
  });

  it("применяет базовые пропсы к input", () => {
    render(
      <Checkbox
        id="terms"
        name="terms"
        value="agree"
        required
        disabled
      />,
    );

    const input = screen.getByRole("checkbox");

    expect(input).toHaveAttribute("name", "terms");
    expect(input).toHaveAttribute("value", "agree");
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });

  it("показывает сообщение об ошибке и связывает aria-describedby", () => {
    render(
      <Checkbox
        id="consent"
        name="consent"
        hasError
        errorMessage="Please accept"
      />,
    );

    const input = screen.getByRole("checkbox");
    const error = screen.getByText("Please accept");

    expect(error).toHaveAttribute("role", "alert");
    expect(input).toHaveAttribute("aria-describedby", `${input.id}-error`);
  });
});
