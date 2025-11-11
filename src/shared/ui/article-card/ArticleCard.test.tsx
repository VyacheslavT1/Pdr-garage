const capturedProps: any[] = [];

jest.mock("@/shared/ui/base-card/BaseCard", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedProps.push(props);
    return <div data-testid="base-card" />;
  },
}));

import { render, screen } from "@testing-library/react";
import ArticleCard from "./ArticleCard";

describe("ArticleCard", () => {
  beforeEach(() => {
    capturedProps.length = 0;
  });

  it("проксирует параметры в BaseCard", () => {
    render(
      <ArticleCard
        src="/image.jpg"
        alt="Article"
        titleKey="title"
        descKey="desc"
        detailsUrl="/details"
        className="custom"
      />,
    );

    expect(screen.getByTestId("base-card")).toBeInTheDocument();
    expect(capturedProps[0]).toMatchObject({
      src: "/image.jpg",
      alt: "Article",
      titleKey: "title",
      descKey: "desc",
      detailsUrl: "/details",
      tNamespace: "Blog",
      linkLabelKey: "readMoreLink",
      linkClassName: expect.stringContaining("articleCardLink"),
      className: "custom",
      imagePriority: false,
    });
  });
});
