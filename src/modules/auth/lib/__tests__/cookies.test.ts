import { setAuthCookies, clearAuthCookies, hasAccessTokenCookie } from "../cookies";
import { AUTH_COOKIE } from "../../model/types";

describe("auth cookies helpers", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  function createResponseMock() {
    return {
      cookies: {
        set: jest.fn(),
      },
    } as unknown as Parameters<typeof setAuthCookies>[0];
  }

  it("устанавливает access и refresh cookie с корректными опциями", () => {
    process.env.NODE_ENV = "test";
    const response = createResponseMock();

    setAuthCookies(response, {
      access: "access-token",
      refresh: "refresh-token",
      accessTtlSeconds: 60,
      refreshTtlSeconds: 120,
    });

    expect(response.cookies.set).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: AUTH_COOKIE.access,
        value: "access-token",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 60,
      }),
    );
    expect(response.cookies.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: AUTH_COOKIE.refresh,
        value: "refresh-token",
        secure: false,
        maxAge: 120,
      }),
    );
  });

  it("использует secure=true в production", () => {
    process.env.NODE_ENV = "production";
    const response = createResponseMock();

    setAuthCookies(response, {
      access: "a",
      refresh: "r",
      accessTtlSeconds: 10,
      refreshTtlSeconds: 20,
    });

    const [{ secure: accessSecure }, { secure: refreshSecure }] = (
      response.cookies.set as jest.Mock
    ).mock.calls.map(([arg]: [any]) => arg);

    expect(accessSecure).toBe(true);
    expect(refreshSecure).toBe(true);
  });

  it("очищает куки, выставляя пустое значение и maxAge=0", () => {
    const response = createResponseMock();

    clearAuthCookies(response);

    expect(response.cookies.set).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: AUTH_COOKIE.access,
        value: "",
        maxAge: 0,
      }),
    );
    expect(response.cookies.set).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: AUTH_COOKIE.refresh,
        value: "",
        maxAge: 0,
      }),
    );
  });

  describe("hasAccessTokenCookie", () => {
    it.each([
      { source: "access_token=abc", expected: true },
      { source: `foo=1; ${AUTH_COOKIE.access}=42`, expected: true },
      { source: "foo=1;bar=2", expected: false },
      { source: null, expected: false },
      { source: "", expected: false },
    ])("определяет наличие access cookie (source=$source)", ({ source, expected }) => {
      expect(hasAccessTokenCookie(source as string | null | undefined)).toBe(expected);
    });
  });
});
