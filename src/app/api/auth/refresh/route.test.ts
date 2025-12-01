import { POST } from "./route";
import { NextResponse } from "next/server";
import { readResponseJson } from "@/tests/utils/readResponseJson";
import { AUTH_COOKIE } from "@/modules/auth/model/types";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_LONG_SECONDS,
  REFRESH_TOKEN_TTL_SHORT_SECONDS,
} from "@/modules/auth/lib/tokenConfig";

jest.mock("@/shared/api/next/securityHeaders", () => ({
  securityHeaders: { "x-test-header": "refresh" },
}));

const cookiesMock = {
  get: jest.fn(),
};

jest.mock("next/headers", () => ({
  cookies: () => cookiesMock,
}));

const setAuthCookies = jest.fn();

jest.mock("@/modules/auth/lib/cookies", () => ({
  setAuthCookies: (response: NextResponse, payload: unknown) =>
    setAuthCookies(response, payload),
}));

describe("/api/auth/refresh POST", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ADMIN_EMAIL: "admin@example.com", ADMIN_NAME: "Admin" };
    cookiesMock.get.mockReset();
    setAuthCookies.mockClear();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 401 when refresh cookie is missing", async () => {
    cookiesMock.get.mockReturnValue(undefined);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(readResponseJson(response)).resolves.toEqual({
      error: "RefreshTokenMissing",
    });
    expect(setAuthCookies).not.toHaveBeenCalled();
  });

  it("issues new tokens when refresh cookie is present (rememberMe=false by default)", async () => {
    cookiesMock.get.mockImplementation((name: string) => {
      if (name === AUTH_COOKIE.refresh) return { value: "refresh-token" };
      return undefined;
    });

    jest.spyOn(Date, "now").mockReturnValue(new Date("2024-02-01T10:00:00Z").getTime());
    jest
      .spyOn(global.crypto, "randomUUID")
      .mockReturnValueOnce("new-access")
      .mockReturnValueOnce("new-refresh");

    const response = await POST();

    expect(response.status).toBe(200);
    const json = await readResponseJson(response);
    expect(json.session.rememberMe).toBe(false);
    expect(new Date(json.session.accessTokenExpiresAt).toISOString()).toBe(
      new Date("2024-02-01T11:00:00.000Z").toISOString(),
    );
    expect(new Date(json.session.refreshTokenExpiresAt).toISOString()).toBe(
      new Date("2024-02-08T10:00:00.000Z").toISOString(),
    );
    expect(setAuthCookies).toHaveBeenCalledWith(
      expect.any(NextResponse),
      expect.objectContaining({
        access: "new-access",
        refresh: "new-refresh",
        accessTtlSeconds: ACCESS_TOKEN_TTL_SECONDS,
        refreshTtlSeconds: REFRESH_TOKEN_TTL_SHORT_SECONDS,
        rememberMe: false,
      }),
    );
  });

  it("respects rememberMe cookie and uses long refresh TTL", async () => {
    cookiesMock.get.mockImplementation((name: string) => {
      if (name === AUTH_COOKIE.refresh) return { value: "refresh-token" };
      if (name === AUTH_COOKIE.remember) return { value: "1" };
      return undefined;
    });

    jest
      .spyOn(global.crypto, "randomUUID")
      .mockReturnValueOnce("access-token")
      .mockReturnValueOnce("refresh-token");

    const response = await POST();

    expect(response.status).toBe(200);
    const json = await readResponseJson(response);
    expect(json.session.rememberMe).toBe(true);
    expect(setAuthCookies).toHaveBeenCalledWith(
      expect.any(NextResponse),
      expect.objectContaining({
        refreshTtlSeconds: REFRESH_TOKEN_TTL_LONG_SECONDS,
        rememberMe: true,
      }),
    );
  });
});
