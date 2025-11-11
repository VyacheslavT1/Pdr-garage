import { render, screen, waitFor } from "@testing-library/react";
import ContactSection from "./ContactSection";

const fetchSpy = jest.spyOn(global, "fetch");

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
  default: (props: any) => <img {...props} />,
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
  afterEach(() => {
    fetchSpy.mockReset();
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  it("загружает отзывы и отображает их", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "rev-1",
            clientName: "jean dupont",
            rating: 5,
            comment: "Service au top",
            date: "2024-11-01T10:00:00.000Z",
          },
        ],
      }),
    } as Response);

    render(<ContactSection />);

    expect(screen.getByText("Chargement des avis…")).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole("img", { name: /note 5 sur 5/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.queryByText("Chargement des avis…")).not.toBeInTheDocument();
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("Service au top")).toBeInTheDocument();
    expect(screen.getByTestId("estimate-form")).toBeInTheDocument();
    expect(screen.getByTestId("review-form")).toBeInTheDocument();
  });

  it("показывает сообщение об ошибке, если запрос завершается неудачей", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<ContactSection />);

    await waitFor(() =>
      expect(
        screen.getByText("Impossible de charger les avis publiés."),
      ).toBeInTheDocument(),
    );
  });

  it("отображает заглушку при отсутствии отзывов", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response);

    render(<ContactSection />);

    await waitFor(() =>
      expect(
        screen.getByText("Aucun avis publié pour le moment."),
      ).toBeInTheDocument(),
    );
  });
});
