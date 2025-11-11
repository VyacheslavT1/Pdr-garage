import { render, screen } from "@testing-library/react";
import CustomContent from "./CustomContent";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => `t:${key}`) as (key: string) => string,
}));

describe("Blog CustomContent", () => {
  it("renders all provided titles and paragraphs", () => {
    render(
      <CustomContent
        contentData={{
          fullDesc: "intro",
          fullDescTitle1: "title1",
          fullDesc1: "desc1",
          fullDescTitle2: "title2",
          fullDesc2: "desc2",
          fullDescTitle3: "title3",
          fullDesc3: "desc3",
          fullDescTitle4: "title4",
          fullDesc4: "desc4",
          fullDescTitle5: "title5",
          fullDesc5: "desc5",
          fullDesc6: "desc6",
        }}
      />,
    );

    expect(screen.getAllByRole("heading")).toHaveLength(5);
    expect(screen.getAllByText(/^t:/)).toHaveLength(12);
    expect(screen.getByText("t:intro")).toBeInTheDocument();
    expect(screen.getByText("t:desc6")).toBeInTheDocument();
  });

  it("renders nothing when content is empty", () => {
    const { container } = render(<CustomContent contentData={{}} />);
    expect(screen.queryByText(/^t:/)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
