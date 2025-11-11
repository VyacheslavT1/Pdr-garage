import { render } from "@testing-library/react";
import { LanguageSwitcher } from "./LanguageSwitcher";

const pushMock = jest.fn();
const dropdownMock = jest.fn();

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/fr/services",
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    toString: () => "tab=pricing",
  }),
}));

jest.mock("next-intl", () => ({
  useLocale: () => "fr",
}));

jest.mock("@/shared/ui/dropdown/Dropdown", () => ({
  __esModule: true,
  default: (props: any) => {
    dropdownMock(props);
    return <div data-testid="dropdown">{JSON.stringify(props.options)}</div>;
  },
}));

jest.mock("@/shared/ui/button/Button", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

jest.mock("@/shared/Icons/globe.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="globe-icon" />,
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    pushMock.mockReset();
    dropdownMock.mockReset();
  });

  it("передает Dropdown список локалей и текущий язык", () => {
    render(<LanguageSwitcher />);

    expect(dropdownMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { value: "fr", label: "FR" },
          { value: "en", label: "EN" },
          { value: "ru", label: "RU" },
        ],
        value: "fr",
      }),
    );
  });

  it("при выборе языка вызывает router.push с исходным href и параметрами", () => {
    render(<LanguageSwitcher />);

    const dropdownProps = dropdownMock.mock.calls[0][0];
    dropdownProps.onSelect("en");

    expect(pushMock).toHaveBeenCalledWith("/fr/services?tab=pricing", {
      locale: "en",
    });
  });

  it("рендерит опции с активным классом для выбранного языка", () => {
    render(<LanguageSwitcher />);

    const dropdownProps = dropdownMock.mock.calls[0][0];
    const activeOption = dropdownProps.renderOption(
      { value: "fr", label: "FR" },
      true,
    );
    const inactiveOption = dropdownProps.renderOption(
      { value: "en", label: "EN" },
      false,
    );

    const { container: activeContainer } = render(activeOption);
    const { container: inactiveContainer } = render(inactiveOption);

    expect(activeContainer.firstChild).toHaveClass("dropdownOption", "active");
    expect(inactiveContainer.firstChild).toHaveClass("dropdownOption");
    expect(inactiveContainer.firstChild).not.toHaveClass("active");
  });
});
