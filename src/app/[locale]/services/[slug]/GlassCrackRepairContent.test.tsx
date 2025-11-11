import { render, screen, within } from "@testing-library/react";
import GlassCrackRepair from "./GlassCrackRepairContent";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => `t:${key}`) as (key: string) => string,
}));

jest.mock("@/shared/Icons/arrow-down.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="arrow-icon" />,
}));

jest.mock("@/shared/Icons/check.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="check-icon" />,
}));

describe("GlassCrackRepairContent", () => {
  it("рендерит описание и шаги, пропуская отсутствующие элементы", () => {
    render(
      <GlassCrackRepair
        contentData={{
          fullDesc: "fullDesc",
          fullDescLi1: "step1",
          fullDescLi3: "step3",
          fullDescLi5: "step5",
        }}
      />,
    );

    expect(screen.getByText("t:fullDesc")).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    expect(
      within(items[0]).getByText("t:step1"),
    ).toBeInTheDocument();
    expect(
      within(items[1]).getByText("t:step3"),
    ).toBeInTheDocument();
    expect(
      within(items[2]).getByText("t:step5"),
    ).toBeInTheDocument();

    expect(within(items[2]).getByTestId("check-icon")).toBeInTheDocument();
  });

  it("не отображает описание если его нет", () => {
    render(<GlassCrackRepair contentData={{}} />);

    expect(screen.queryByText(/^t:/)).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
