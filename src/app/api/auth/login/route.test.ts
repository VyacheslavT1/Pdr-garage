import { POST } from "./route";
import { NextResponse } from "next/server";
import { readResponseJson } from "@/tests/utils/readResponseJson";

jest.mock("@/shared/api/next/securityHeaders", () => ({
  securityHeaders: { "x-test-header": "1" },
}));

const setAuthCookies = jest.fn();

jest.mock("@/modules/auth/lib/cookies", () => ({
  setAuthCookies: (response: NextResponse, payload: unknown) =>
    setAuthCookies(response, payload),
}));

describe("/api/auth/login POST", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD = "secret123";
    process.env.ADMIN_NAME = "Super Admin";
    setAuthCookies.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 400 when body is not valid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    await expect(readResponseJson(response)).resolves.toEqual({
      error: "ValidationError",
      details: { body: "Invalid JSON" },
    });
    expect(setAuthCookies).not.toHaveBeenCalled();
  });

  it("returns 401 when credentials do not match env variables", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "wrong@example.com",
          password: "secret123",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(readResponseJson(response)).resolves.toEqual({
      error: "InvalidCredentials",
    });
    expect(setAuthCookies).not.toHaveBeenCalled();
  });

  it("returns tokens and sets cookies for valid credentials", async () => {
    const randomSpy = jest
      .spyOn(global.crypto, "randomUUID")
      .mockReturnValueOnce("access-token")
      .mockReturnValueOnce("refresh-token");

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@example.com",
          password: "secret123",
          rememberMe: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const json = await readResponseJson(response);
    expect(json.user).toMatchObject({
      id: "admin-dev",
      name: "Super Admin",
      email: "admin@example.com",
      role: "admin",
    });
    expect(json.session.rememberMe).toBe(true);
    expect(setAuthCookies).toHaveBeenCalledWith(
      expect.any(NextResponse),
      expect.objectContaining({
        access: "access-token",
        refresh: "refresh-token",
      }),
    );

    randomSpy.mockRestore();
  });

  it("returns 400 when email or password are invalid", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "not-an-email",
          password: "short",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(readResponseJson(response)).resolves.toEqual({
      error: "ValidationError",
      details: {
        email: "Invalid email format",
        password: "Password must be at least 8 characters",
      },
    });
    expect(setAuthCookies).not.toHaveBeenCalled();
  });

  it("normalizes email casing, defaults rememberMe to false, and falls back to default admin name", async () => {
    delete process.env.ADMIN_NAME;
    const randomSpy = jest
      .spyOn(global.crypto, "randomUUID")
      .mockReturnValueOnce("access-token")
      .mockReturnValueOnce("refresh-token");
    const dateSpy = jest
      .spyOn(Date, "now")
      .mockReturnValue(new Date("2024-02-01T10:00:00Z").getTime());

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "  ADMIN@example.com  ",
          password: "secret123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const json = await readResponseJson(response);
    expect(json.user).toMatchObject({
      name: "Admin",
      email: "admin@example.com",
    });
    expect(json.session.rememberMe).toBe(false);
    expect(new Date(json.session.refreshTokenExpiresAt).toISOString()).toBe(
      new Date("2024-02-08T10:00:00.000Z").toISOString(),
    );
    expect(setAuthCookies).toHaveBeenCalledWith(
      expect.any(NextResponse),
      expect.objectContaining({
        accessTtlSeconds: 15 * 60,
        refreshTtlSeconds: 7 * 24 * 60 * 60,
      }),
    );

    randomSpy.mockRestore();
    dateSpy.mockRestore();
  });
});
