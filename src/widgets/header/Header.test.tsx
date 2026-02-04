import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import styles from "./Header.module.scss";
import Header from "./Header";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      const dict: Record<string, string> = {
        home: "Accueil",
        services: "Services",
        about: "À propos",
        blog: "Blog",
        contacts: "Contacts",
        requestQuoteButton: "Demander un devis",
      };
      return dict[key] ?? key;
    }) as (key: string) => string,
}));

jest.mock("@/shared/config/data/serviceOptions", () => ({
  useServiceOptions: () => [
    { value: "paintlessDentRemoval", label: "Débosselage" },
    { value: "polish", label: "Polish" },
  ],
}));

jest.mock("@/modules/i18n/feature/language-switcher/ui/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} data-testid={`link-${href}`} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/shared/ui/button/Button", () => ({
  __esModule: true,
  default: ({ children, ...rest }: any) => (
    <button {...rest}>{children}</button>
  ),
}));

jest.mock("@/shared/ui/link-button/LinkButton", () => ({
  __esModule: true,
  default: ({ href, children }: any) => (
    <a href={href} data-testid="cta-link">
      {children}
    </a>
  ),
}));

jest.mock("@/shared/ui/dropdown/Dropdown", () => ({
  __esModule: true,
  default: ({ options, className, onClose, onSelect }: any) => (
    <div
      data-testid="dropdown"
      className={className}
      onClick={() => {
        onSelect?.("paintlessDentRemoval");
        onClose?.();
      }}
    >
      {options.length} options
    </div>
  ),
}));

jest.mock("@/shared/Icons/logo.svg", () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="logo" {...props} />,
}));

jest.mock("@/shared/Icons/chevron-down.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-down" />,
}));

jest.mock("@/shared/Icons/chevron-up.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-up" />,
}));

jest.mock("@/shared/Icons/menu.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="menu-icon" />,
}));

jest.mock("@/shared/Icons/close.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="close-icon" />,
}));

describe("Header", () => {
  it("отображает навигацию и кнопку запроса", () => {
    render(<Header />);

    expect(screen.getAllByRole("link", { name: "Accueil" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Services" })).toHaveLength(2);
    const ctaLinks = screen.getAllByTestId("cta-link");
    expect(ctaLinks).toHaveLength(2);
    ctaLinks.forEach((link) =>
      expect(link).toHaveAttribute("href", "/contacts"),
    );
    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
  });

  it("открывает и закрывает мобильное меню", async () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText("Open menu"));
    const overlay = document.querySelector(
      `.${styles.mobileMenuOverlay}`,
    ) as HTMLElement;
    expect(overlay.className).toContain(styles["mobileMenuOverlay--open"]);

    fireEvent.click(screen.getByLabelText("Close menu"));
    await waitFor(() =>
      expect(overlay.className).toContain(
        styles["mobileMenuOverlay--closed"],
      ),
    );
  });

  it("тогглит выпадающий список услуг в мобильном меню", () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText("Open menu"));
    const overlay = document.querySelector(
      `.${styles.mobileMenuOverlay}`,
    ) as HTMLElement;
    expect(overlay.className).toContain(styles["mobileMenuOverlay--open"]);
    const serviceToggle = screen
      .getAllByTestId("link-/services")[1]
      .querySelector("span");
    expect(serviceToggle).not.toBeNull();
    fireEvent.click(serviceToggle!);

    expect(screen.getAllByTestId("dropdown")[1]).toHaveTextContent("2 options");
  });

  it("закрывает мобильное меню при выборе услуги в дропдауне", () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText("Open menu"));
    const overlay = document.querySelector(
      `.${styles.mobileMenuOverlay}`,
    ) as HTMLElement;
    expect(overlay.className).toContain(styles["mobileMenuOverlay--open"]);

    const serviceToggle = screen
      .getAllByTestId("link-/services")[1]
      .querySelector("span");
    fireEvent.click(serviceToggle!);

    fireEvent.click(screen.getAllByTestId("dropdown")[1]);
    expect(overlay.className).toContain(styles["mobileMenuOverlay--closed"]);
  });

  it("закрывает меню при переходе по ссылкам мобильной навигации", () => {
    render(<Header />);

    fireEvent.click(screen.getByLabelText("Open menu"));
    const overlay = document.querySelector(
      `.${styles.mobileMenuOverlay}`,
    ) as HTMLElement;
    expect(overlay.className).toContain(styles["mobileMenuOverlay--open"]);

    fireEvent.click(screen.getAllByTestId("link-/aboutUs")[1]);
    expect(overlay.className).toContain(styles["mobileMenuOverlay--closed"]);
  });
});
