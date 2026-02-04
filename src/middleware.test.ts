import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const i18nHandlerMock = jest.fn();

jest.mock("next-intl/middleware", () => ({
  __esModule: true,
  default: () => i18nHandlerMock,
}));

jest.mock("@/i18n/routing", () => ({
  routing: { locales: ["fr", "en"], defaultLocale: "fr" },
}));

jest.mock("@/modules/auth/model/types", () => ({
  AUTH_COOKIE: { access: "access_token" },
}));

describe("combined middleware", () => {
  const redirectSpy = jest.spyOn(NextResponse, "redirect");
  const nextSpy = jest.spyOn(NextResponse, "next");
  const { default: middleware } = require("./middleware") as {
    default: (req: NextRequest) => ReturnType<typeof NextResponse.next>;
  };

  beforeEach(() => {
    i18nHandlerMock.mockReset();
    redirectSpy.mockReset();
    nextSpy.mockReset();
  });

  const createRequest = ({
    pathname,
    search = "",
    cookieValue,
  }: {
    pathname: string;
    search?: string;
    cookieValue?: string | null;
  }) =>
    ({
      nextUrl: new URL(`https://example.com${pathname}${search}`),
      cookies: {
        get: (name: string) =>
          name === "access_token" && cookieValue
            ? { name, value: cookieValue }
            : undefined,
      },
    }) as unknown as NextRequest;

  it("перенаправляет на логин, если id админ-запроса без токена", () => {
    const request = createRequest({
      pathname: "/admin/requests",
      search: "?page=1",
    });

    middleware(request);

    expect(redirectSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://example.com/admin/login?from=%2Fadmin%2Frequests%3Fpage%3D1",
      }),
    );
    expect(i18nHandlerMock).not.toHaveBeenCalled();
  });

  it("пропускает админский маршрут при наличии токена", () => {
    const request = createRequest({
      pathname: "/admin/reviews",
      cookieValue: "token123",
    });

    middleware(request);

    expect(nextSpy).toHaveBeenCalled();
    expect(i18nHandlerMock).not.toHaveBeenCalled();
  });

  it("позволяет странице логина выполняться без токена", () => {
    const request = createRequest({
      pathname: "/admin/login",
    });

    middleware(request);

    expect(nextSpy).toHaveBeenCalled();
    expect(redirectSpy).not.toHaveBeenCalled();
  });

  it("делегирует неадминские маршруты next-intl middleware", () => {
    const request = createRequest({
      pathname: "/fr/services",
    });

    middleware(request);

    expect(i18nHandlerMock).toHaveBeenCalledWith(request);
  });
});
