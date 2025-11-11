import { render, screen, within } from "@testing-library/react";
import RestorativePolish from "./RestorativePolishContent";

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

describe("RestorativePolishContent", () => {
  it("рендерит все переданные шаги и финальный пункт с галочкой", () => {
    render(
      <RestorativePolish
        contentData={{
          fullDesc: "intro",
          fullDescLi1: "step1",
          fullDescLi2: "step2",
          fullDescLi3: "step3",
          fullDescLi4: "step4",
          fullDescLi5: "step5",
          fullDescLi6: "step6",
        }}
      />,
    );

    expect(screen.getByText("t:intro")).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(6);

    expect(
      within(items[5]).getByTestId("check-icon"),
    ).toBeInTheDocument();
    expect(
      within(items[5]).getByText("t:step6"),
    ).toBeInTheDocument();
  });

  it("не показывает шаги если они отсутствуют", () => {
    render(
      <RestorativePolish
        contentData={{
          fullDesc: "intro",
          fullDescLi2: "step2",
        }}
      />,
    );

    expect(screen.getByText("t:intro")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
    expect(
      within(items[0]).getByText("t:step2"),
    ).toBeInTheDocument();
  });
});
