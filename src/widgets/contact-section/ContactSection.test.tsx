import { render, screen } from "@testing-library/react";
import ContactSection from "./local";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string, values?: Record<string, unknown>) => {
      if (key === "adminReply.by" && values?.author) {
        return `Réponse par ${values.author as string}`;
      }
      return key;
    }) as (key: string, values?: Record<string, unknown>) => string,
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
      ({ children, ...props }, ref) => (
        <a ref={ref} {...props}>
          {children}
        </a>
      )
    ),
  };
});

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: any) => {
    const {
      priority,
      fill,
      sizes,
      quality,
      placeholder,
      blurDataURL,
      ...imgProps
    } = rest;
    const resolvedSrc = typeof src === "string" ? src : src?.src ?? "";
    return <img src={resolvedSrc} alt={alt ?? ""} {...imgProps} />;
  },
}));

jest.mock(
  "@/modules/requests/feature/estimate-request/ui/EstimateRequestForm/EstimateRequestForm",
  () => ({
    __esModule: true,
    default: () => <div data-testid="estimate-form" />,
  }),
);

jest.mock(
  "@/modules/reviews/feature/review-create/ui/ReviewCreateForm/ReviewCreateForm",
  () => ({
    __esModule: true,
    default: () => <div data-testid="review-form" />,
  }),
);

describe("ContactSection", () => {
  it("отображает отзывы", () => {
    render(
      <ContactSection
        publishedReviews={[
          {
            id: "rev-1",
            clientName: "jean dupont",
            rating: 5,
            comment: "Service au top",
            date: "2024-11-01T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("img", { name: /note 5 sur 5/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("Service au top")).toBeInTheDocument();
    expect(screen.getByTestId("estimate-form")).toBeInTheDocument();
    expect(screen.getByTestId("review-form")).toBeInTheDocument();
  });

  it("показывает сообщение об ошибке, если запрос завершается неудачей", () => {
    render(
      <ContactSection
        publishedReviews={[]}
        reviewsErrorMessage="Impossible de charger les avis publiés."
      />,
    );

    expect(
      screen.getByText("Impossible de charger les avis publiés."),
    ).toBeInTheDocument();
  });

  it("отображает заглушку при отсутствии отзывов", () => {
    render(<ContactSection publishedReviews={[]} />);

    expect(
      screen.getByText("Aucun avis publié pour le moment."),
    ).toBeInTheDocument();
  });
});
