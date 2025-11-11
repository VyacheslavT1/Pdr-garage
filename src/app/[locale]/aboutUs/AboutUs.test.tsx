import { render, screen } from "@testing-library/react";
import { AboutUs } from "./AboutUs";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => `t:${key}`) as (key: string) => string,
}));

describe("AboutUs", () => {
  it("renders only the paragraphs that are provided", () => {
    render(
      <AboutUs
        contentData={{
          aboutP1: "first",
          aboutP3: "third",
          aboutP5: "fifth",
        }}
      />,
    );

    expect(screen.getByText("t:first")).toBeInTheDocument();
    expect(screen.getByText("t:third")).toBeInTheDocument();
    expect(screen.getByText("t:fifth")).toBeInTheDocument();
    expect(screen.queryByText("t:second")).not.toBeInTheDocument();
  });

  it("renders an empty container when no content keys exist", () => {
    const { container } = render(<AboutUs contentData={{}} />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});
