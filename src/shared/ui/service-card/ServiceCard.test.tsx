const captured: any[] = [];

jest.mock("@/shared/ui/base-card/BaseCard", () => ({
  __esModule: true,
  default: (props: any) => {
    captured.push(props);
    return <div data-testid="service-base-card" />;
  },
}));

jest.mock("@/shared/ui/link-button/LinkButton", () => ({
  __esModule: true,
  default: (props: any) => <a data-testid="link-button" {...props} />,
}));

import { render, screen } from "@testing-library/react";
import ServiceCard from "./ServiceCard";

describe("ServiceCard", () => {
  beforeEach(() => {
    captured.length = 0;
  });

  it("проксирует параметры и LinkWrapper в BaseCard", () => {
    render(
      <ServiceCard
        src="/service.jpg"
        alt="Service"
        titleKey="service.title"
        descKey="service.desc"
        detailsUrl="/services/1"
      />,
    );

    expect(screen.getByTestId("service-base-card")).toBeInTheDocument();
    expect(captured[0]).toMatchObject({
      src: "/service.jpg",
      alt: "Service",
      titleKey: "service.title",
      descKey: "service.desc",
      detailsUrl: "/services/1",
      tNamespace: "CommonTemplateData",
      linkLabelKey: "detailsButton",
      LinkWrapper: expect.any(Function),
      imagePriority: false,
    });
  });
});
