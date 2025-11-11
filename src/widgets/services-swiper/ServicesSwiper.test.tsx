import { render, screen, act } from "@testing-library/react";
import ServicesSwiper from "./ServicesSwiper";

const onSwiperRef: { current?: (instance: any) => void } = {};

jest.mock("next-intl", () => ({
  useTranslations: () =>
    ((key: string) => {
      const dict: Record<string, string> = {
        weOffer: "Nous proposons",
        serviceTypes: "Types de services",
      };
      return dict[key] ?? key;
    }) as (key: string) => string,
}));

jest.mock("@/shared/config/data/serviceCards", () => ({
  serviceCards: [
    {
      src: "/images/services/a.jpg",
      alt: "Service A",
      titleKey: "serviceA.title",
      descKey: "serviceA.desc",
    },
    {
      src: "/images/services/b.jpg",
      alt: "Service B",
      titleKey: "serviceB.title",
      descKey: "serviceB.desc",
    },
  ],
}));

jest.mock("@/shared/ui/service-card/ServiceCard", () => ({
  __esModule: true,
  default: ({ titleKey }: { titleKey: string }) => (
    <div data-testid="service-card">{titleKey}</div>
  ),
}));

jest.mock("@/shared/ui/button/Button", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="nav-button">{children}</button>
  ),
}));

jest.mock("@/shared/Icons/chevron-left.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-left">←</span>,
}));

jest.mock("@/shared/Icons/chevron-right.svg", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-right">→</span>,
}));

jest.mock("swiper/css", () => ({}), { virtual: true });
jest.mock("swiper/css/navigation", () => ({}), { virtual: true });
jest.mock("swiper/css/pagination", () => ({}), { virtual: true });

jest.mock("swiper/react", () => ({
  Swiper: ({ children, onSwiper }: any) => {
    onSwiperRef.current = onSwiper;
    return <div data-testid="swiper">{children}</div>;
  },
  SwiperSlide: ({ children }: any) => (
    <div data-testid="swiper-slide">{children}</div>
  ),
}));

jest.mock("swiper/modules", () => ({
  Navigation: {},
  Pagination: {},
}));

describe("ServicesSwiper", () => {
  afterEach(() => {
    onSwiperRef.current = undefined;
  });

  it("рендерит заголовки, карточки и элементы управления каррусели", async () => {
    render(<ServicesSwiper />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Nous proposons" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Types de services" }),
    ).toBeInTheDocument();

    const slides = screen.getAllByTestId("swiper-slide");
    expect(slides).toHaveLength(2);
    expect(screen.getAllByTestId("service-card")[0]).toHaveTextContent(
      "serviceA.title",
    );

    const navigationButtons = screen.getAllByTestId("nav-button");
    expect(navigationButtons).toHaveLength(2);
    expect(screen.getAllByTestId("chevron-right")).toHaveLength(2);

    expect(screen.getByTestId("swiper")).toBeInTheDocument();

    const mockNavigation = {
      params: { navigation: {} },
      navigation: {
        destroy: jest.fn(),
        init: jest.fn(),
        update: jest.fn(),
      },
    };
    await act(async () => {
      onSwiperRef.current?.(mockNavigation);
    });
    expect(mockNavigation.navigation.init).toHaveBeenCalled();
  });
});
