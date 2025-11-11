import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      const dict: Record<string, string> = {
        motto: "Votre carrosserie, notre expertise",
        services: "Services",
        usefulLinks: "Liens utiles",
        about: "À propos",
        contactUs: "Contact",
        contactsInfo: "Infos de contact",
        businessHours: "9h-18h",
        socialTitle: "Suivez-nous",
        copyright: "Tous droits réservés",
      };
      return dict[key] ?? key;
    }) as (key: string) => string,
}));

jest.mock("@/shared/config/data/serviceOptions", () => ({
  useServiceOptions: () => [
    { value: "dentRepair", label: "Débosselage" },
    { value: "polish", label: "Polish" },
  ],
}));

jest.mock("@/shared/ui/fonts", () => ({
  ebGaramond: { className: "eb-garamond" },
}));

jest.mock("@/shared/Icons/logo.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="footer-logo" />, // eslint-disable-line
}));

jest.mock("@/shared/Icons/screwdriver-wrench.svg", () => ({
  __esModule: true,
  default: () => <span className="icon" />, // eslint-disable-line
}));
jest.mock("@/shared/Icons/info.svg", () => ({
  __esModule: true,
  default: () => <span className="icon" />, // eslint-disable-line
}));
jest.mock("@/shared/Icons/contact-form.svg", () => ({
  __esModule: true,
  default: () => <span className="icon" />, // eslint-disable-line
}));
jest.mock("@/shared/Icons/phone.svg", () => ({
  __esModule: true,
  default: () => <span className="icon" />, // eslint-disable-line
}));
jest.mock("@/shared/Icons/mail.svg", () => ({
  __esModule: true,
  default: () => <span className="icon" />, // eslint-disable-line
}));
jest.mock("@/shared/Icons/map-pin.svg", () => ({
  __esModule: true,
  default: () => <span className="icon" />, // eslint-disable-line
}));
jest.mock("@/shared/Icons/clock.svg", () => ({
  __esModule: true,
  default: () => <span className="icon" />, // eslint-disable-line
}));

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} data-href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("react-icons/fa", () => ({
  FaFacebookF: () => <span data-testid="facebook-icon" />, // eslint-disable-line
  FaInstagram: () => <span data-testid="instagram-icon" />, // eslint-disable-line
  FaTelegram: () => <span data-testid="telegram-icon" />, // eslint-disable-line
}));

describe("Footer", () => {
  it("рендерит основные секции и ссылки", () => {
    render(<Footer />);

    expect(screen.getByText(/Votre carrosserie/)).toHaveClass("eb-garamond");

    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Débosselage")).toBeInTheDocument();
    expect(screen.getByText("Polish")).toBeInTheDocument();

    expect(screen.getByText("Liens utiles")).toBeInTheDocument();
    expect(screen.getByText("À propos")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();

    expect(screen.getByText("Infos de contact")).toBeInTheDocument();
    expect(screen.getByText("9h-18h")).toBeInTheDocument();

    expect(screen.getByTestId("facebook-icon")).toBeInTheDocument();
    expect(screen.getByTestId("instagram-icon")).toBeInTheDocument();
    expect(screen.getByTestId("telegram-icon")).toBeInTheDocument();
  });
});
